require 'sketchup.rb'


module AE


  module AttributeInspector


    module AttributeManipulation

      require(File.join(PATH, 'typed_value_parser.rb'))

      class << self


          ### Methods for handling selections of a single entity ###


          # Reads all nested dictionary names of a single entity into a nested hash.
          # @param [Sketchup::Entity] entity
          # @return [Hash] Hash of dictionaries in the form of:
          #  { 'dictionary_name' => { 'nested_dictionary_name' => nil } }
          def get_dictionaries(entity)
            dictionaries = {}
            dicts = entity.attribute_dictionaries
            if dicts
              dicts.each{ |dict|
                dictionaries[dict.name] = (dict.attribute_dictionaries) ? get_dictionaries(dict) : nil
              }
              # TODO: Not only is AttributeDictionary an Entity and can have attribute dictionaries,
              # but also the AttributeDictionaries collection is an entity. This adds a second dimension for the hierarchy.
              # How to visualize that? It appears it is never used in practice.
              #if dicts.attribute_dictionaries
              #  dictionaries.merge!(dicts.attribute_dictionaries) # TODO: It would overwrite dictionaries with same name. Better solution needed.
              #end
            end
            return dictionaries
          end


          # Reads all attributes of a nested dictionary of a single entity into a nested hash.
          # @param [Sketchup::Entity] entity
          # @param [Array<String>] path - The path of the dictionary.
          # @return [Hash] Hash of attributes in the form of:
          #  {
          #    'attribute_name' => {
          #      :value => value,
          #      :type  => "#{value.class.name}"
          #    }
          #  }
          def get_attributes(entity, path)
            result = {}
            dictionary = find_dictionary(entity, path)
            return warn("AttributeInspector: dictionary `#{path.inspect}` not found for entity #{entity}") unless dictionary
            dictionary.each_pair{ |key, value|
              type = (value.is_a?(TrueClass) || value.is_a?(FalseClass)) ? 'Boolean' : value.class.to_s
              result[key] = {
                # :grayed => false,
                # :grayed_value => false,
                :value => TypedValueParser.stringify(value),
                :type => type
              }
            }
            return result
          end


          ### Methods for handling selections of multiple entities ###


          # Reads all nested dictionary names of multiple entities into a nested hash.
          # @param [Array<Sketchup::Entity>] entities
          # @return [Hash] Hash of dictionaries in the form of:
          #  { 'dictionary_name' => { 'nested_dictionary_name' => nil } }
          def get_all_dictionaries(*entities)
            entities.flatten!
            attribute_dictionarieses = entities.map{ |e| e.attribute_dictionaries}
            return tree_union(attribute_dictionarieses)
          end


          # Reads those attributes of the requested dictionary that are not contained in all entities.
          # @param [Array<Sketchup::Entity>] entities
          # @return [Hash] Hash of attributes in the form of:
          #  {
          #    'attribute_name' => {
          #      :value => value,
          #      :type  => "#{value.class.name}"
          #    }
          #  }
          def get_not_common_dictionaries(*entities)
            entities.flatten!
            attribute_dictionarieses = entities.map{ |e| e.attribute_dictionaries}
            return tree_exclusion(attribute_dictionarieses)
          end


          # Reads all attributes of the requested dictionary of all entities and indicates
          # whether they are contained in all entities and whether the value is identical.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] path - The path of the dictionary.
          # @returns [Hash] Hash of attributes in the form of:
          #  {
          #    'attribute_name' => {
          #      :value => String,
          #      :type => "#{value.class.name}",
          #      :non_common_attribute => true|false,
          #      :non_common_value => true|false
          #    }
          # }
          def get_all_attributes(entities, path)
            result = {}
            count = 0
            # Collect all attributes and values of all entities.
            entities.each{ |entity|
              dictionary = find_dictionary(entity, path)
              next unless dictionary
              count += 1
              # Merge the attributes.
              dictionary.each{ |key, value|
                result[key] ||= { :value => [] }
                result[key][:value] << value
              }
            }
            # Merge all values for the same attribute.
            result.each_value{ |metadata|
              # The collected values in an array.
              values = metadata[:value]
              value = nil
              # Determine the value.
              # Shared attribute, contained in every dictionary/entity.
              if values.length == count
                # Same values
                if values.uniq.length == 1
                  value = values.first
                # Different values: Decide for most common value.
                else
                  value = most_common(values)
                  metadata[:non_common_value] = true
                end
              # Non-shared attribute, contained in only some dictionaries/entities.
              else
                value = most_common(values)
                metadata[:non_common_attribute] = true
              end
              metadata[:value] = TypedValueParser.stringify(value)
              metadata[:type] = (value.is_a?(TrueClass) || value.is_a?(FalseClass)) ? 'Boolean' : value.class.to_s
            }
            return result
          end


          # Helper method to get the most common element of an array.
          # @param [Array<Object>] array
          # @returns [Object]
          def most_common(array)
            counts = Hash.new(0)
            array.each{ |e| counts[e] += 1 }
            return counts.keys.sort_by{ |e| counts[e] }.last
          end
          private :most_common


=begin
          def get_all_attributes(entities, path)
            result = {}
            # Collect all attributes of all entities.
            entities.each{ |entity|
              dictionary = find_dictionary(entity, path)
              next unless dictionary
              dictionary.each_pair{ |key, value|
                result[key] ||= { :value => [] }
                result[key][:value] << value
              }
            }
            # Merge all values for the same attributes.
            result.each{ |key, data|
              # The collected values in an array.
              values = data[:value]
              # Merge.
              value = most_common(values)
              data[:value] = TypedValueParser.stringify(value)
              data[:type] = (value.is_a?(TrueClass) || value.is_a?(FalseClass)) ? 'Boolean' : value.class.to_s
            }
            return result
          end


          # Distinguish attributes into those used by all entities (common), and those used only by some.
          def get_not_common_attributes(entities, path)
            result = {}
            dictionaries = entities.map{ |entity| find_dictionary(entity, path) }.compact
            keys = dictionaries.map{ |dictionary| dictionary.keys }.flatten.uniq
            # Collect all dictionaries of all entities.
            keys.each{ |key|
              # Add keys if they are not shared by all trees.
              if dictionarieses.find{ |dictionary| not (dictionary.include?(key)) }
                result[key] = true # TODO: missing check whether key is (not) shared or values are (not) shared (different values)
              end
            }
            return result
          end
=end


          ### Helper methods for comparing dictionary trees ###


          # For several trees of nested attribute dictionaries, get the united tree.
          # @param [Array<Sketchup::AttributeDictionaries>] attribute_dictionarieses
          # @return [Hash<String,Hash>]
          def tree_union(attribute_dictionarieses)
            # Empty attribute_dictionaries are nil, so we should not try to iterate over them.
            attribute_dictionarieses.compact!
            union = {}
            # Get all node names.
            names = attribute_dictionarieses.map{ |attribute_dictionaries|
              attribute_dictionaries.map{ |attribute_dictionary| attribute_dictionary.name }
            }.flatten.uniq
            # For each, collect the union of all subtrees.
            names.each{ |name|
              union[name] = tree_union(attribute_dictionarieses.map{ |attribute_dictionaries|
                # If the attribute_dictionary of the given name contains further nested attribute_dictionaries, collect them.
                attribute_dictionaries[name] && attribute_dictionaries[name].attribute_dictionaries
              }.compact)
            }
            return union
          end
          private :tree_union


          # For several trees of nested attribute dictionaries, get only those nodes that
          # are not common by all trees.
          # Only leaf nodes of the resulting data structure are member of the exclusion (value: true).
          # @param [Array<Sketchup::AttributeDictionaries>] attribute_dictionarieses
          # @return [Hash<String,TrueClass>]
          def tree_exclusion(attribute_dictionarieses)
            # If there are empty attribute_dictionaries = nil, all other attribute_dictionaries are part of the exclusion.
            contains_nil = attribute_dictionarieses.include?(nil)
            attribute_dictionarieses.compact!
            exclusion = {}
            # Get all node names.
            names = attribute_dictionarieses.map{ |attribute_dictionaries|
              attribute_dictionaries.map{ |attribute_dictionary| attribute_dictionary.name }
            }.flatten.uniq
            #
            return Hash[names.map{|n| [n, true] }] if contains_nil
            # For each, collect the exclusion of all subtrees.
            names.each{ |name|
              # Add names as leaves if they are not shared by all trees.
              if attribute_dictionarieses.find{ |attribute_dictionaries| not (attribute_dictionaries.include?(name)) }
                exclusion[name] = true
              else
                nested_attribute_dictionarieses = attribute_dictionarieses.map{ |attribute_dictionaries|
                  attribute_dictionaries[name].attribute_dictionaries
                }
                # Only if subtrees contain names that are not shared by all trees:
                # Add names as navigation nodes.
                unless nested_attribute_dictionarieses.all?{ |attribute_dictionaries| attribute_dictionaries.nil? }
                  exclusion[name] = tree_exclusion(nested_attribute_dictionarieses)
                end
              end
            }
            return exclusion
          end
          private :tree_exclusion


          ### Methods for modifying attributes ###


          # Adds a dictionary to all selected entities.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] path - The path for the new dictionary.
          # @param [Hash<String,Object>] data - Optional data for the new dictionary.
          def add_dictionary(entities, path, data=nil)
            entities.each{ |entity|
              dict = find_dictionary(entity, path, true)
              next warn("AttributeInspector: dictionary `#{path.inspect}` not found for entity #{entity}") unless dict
              if data.is_a?(Hash)
                data.each{ |key, value|
                  next unless key.is_a?(String) && !key.empty?
                  dict[key] = value
                }
              end
            }
          end


          # Renames a dictionary in all selected entities.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] old_path - The path of the dictionary.
          # @param [String] new_name - The new name for the dictionary.
          # @note If an entity did not have this dictionary, then only the new dictionary
          #   name is created, but attributes are not added.
          def rename_dictionary(entities, old_path, new_name)
            parent_path = old_path[0...-1]
            old_name = old_path.last
            entities.each{ |entity|
              e = (parent_path.empty?) ? entity : find_dictionary(entity, parent_path, true)
              unless old_name == new_name
                old_dict = e.attribute_dictionary(old_name)
                old_dict.each{ |key, value|
                  e.set_attribute(new_name, key, value)
                }
                e.attribute_dictionaries.delete(old_name)
              end
            }
          end


          # Removes a dictionary in all selected entities.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] path - The path of the dictionary to be removed.
          def remove_dictionary(entities, path)
            parent_path = path[0...-1]
            entities.each{ |entity|
              e = (parent_path.empty?) ? entity : find_dictionary(entity, parent_path)
              e.attribute_dictionaries.delete(path.last) if e
            }
          end


          # Sets an attribute to a dictionary in all selected entities.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] path - The path of the dictionary.
          # @param [String] attribute - The attribute to be added.
          # @param [Object] value - The value to be added.
          def set_attribute(entities, path, attribute, value)
            dictionary_name = path.last
            unless attribute.empty?
              entities.each{ |entity|
                dict = find_dictionary(entity, path, true)
                # TODO: raise?
                next warn("AttributeInspector: dictionary `#{path.inspect}` not found for entity #{entity}") unless dict # TODO: can this happen?
                ent = dict.parent.parent # attribute_dictionary -> attribute_dictionaries -> entity
                ent.set_attribute(dictionary_name, attribute, value)
              }
            end
          end


          # Renames an attribute in the dictionary in all selected entities.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] path - The path of the dictionary.
          # @param [String] old_attribute - The old name of the attribute.
          # @param [String] new_attribute - The new name of the attribute.
          # @note If an entity did not have this attribute, then only the new attribute
          #   is created, but the correct value is not added.
          def rename_attribute(entities, path, old_attribute, new_attribute)
            #if old_attribute.is_a?(String) && new_attribute.is_a?(String)
            unless old_attribute.empty? || new_attribute.empty?
              entities.each{ |entity|
                dict = find_dictionary(entity, path, true)
                next warn("AttributeInspector: dictionary `#{path.inspect}` not found for entity #{entity}") unless dict # TODO: can this happen?
                dict[new_attribute] = dict[old_attribute]
                dict.delete_key(old_attribute) unless new_attribute == old_attribute
              }
            end
          end


          # Removes an attribute from a dictionary.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] path - The path of the dictionary.
          # @param [String] attribute - The attribute to be removed.
          def remove_attribute(entities, path, attribute)
            entities.each{ |entity|
              dict = find_dictionary(entity, path)
              next warn("AttributeInspector: dictionary `#{path.inspect}` not found for entity #{entity}") unless dict
              dict.delete_key(attribute)
            }
          end


          ### Helper methods ###


          # Find a nested dictionary of an entity by its path.
          # @param [Sketchup::Entity] entity
          # @param [Array] path - nesting path of dictionary names.
          # @param [Boolean] create - Whether to create missing dictionaries when not found.
          # @return [Sketchup::AttributeDictionary,nil]
          def find_dictionary(entity, path, create=false)
            dict = path.inject(entity){ |e, name|
              break nil if e.nil?
              e.attribute_dictionary(name, create)
            }
            return (dict.is_a?(Sketchup::AttributeDictionary)) ? dict : nil
          end


      end # class << self


    end # module AttributeManipulation


  end # module AttributeInspector


end # module AE


=begin
# Tree Algorithms

def tree_union(trees)
  union = {}
  keys = trees.map{ |tree| tree.keys }.flatten.uniq
  keys.each{ |key|
    union[key] = tree_union(trees.select{ |tree| tree[key].is_a?(Hash) })
  }
  return union
end

def tree_intersection(trees)
  intersection = {}
  keys = trees.map{ |tree| tree.keys }.flatten.uniq
  keys.each{ |key|
    unless trees.find{ |tree| not tree.include?(key) }
      intersection[key] = tree_intersection(trees.map{ |tree| tree[key] })
    end
  }
  return intersection
end

# Only leaf nodes of the resulting data structure are member of the exclusion.
# Exclusion = Union - Intersection
def tree_exclusion(trees)
  contains_nil = trees.include?(nil)
  trees.compact!
  exclusion = {}
  keys = trees.map{ |tree| tree.keys }.flatten.uniq
  return Hash[keys.map{|n| [n, true] }] if contains_nil
  # For each, collect the exclusion of all subtrees.
  keys.each{ |key|
    # Add keys as leaves if they are not shared by all trees.
    if trees.find{ |tree| not tree.include?(key) }
      exclusion[key] = true
    else
      nested_trees = trees.map{ |tree| tree[key] }
      # Only if subtrees contain keys that are not shared by all trees:
      # Add keys as navigation nodes.
      unless nested_trees.all?{ |tree| not (tree.nil? || tree.empty?) }
        exclusion[key] = tree_exclusion(nested_trees)
      end
    end
  }
  return exclusion
end
=end
