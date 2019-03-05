require 'sketchup.rb'
require 'json'


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
            dictionaries = []
            dicts = entity.attribute_dictionaries
            if dicts
              dicts.each{ |dict|
                dictionaries << {
                  :name => dict.name,
                  :children => (dict.attribute_dictionaries) ? get_dictionaries(dict) : []
                }
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
            result = []
            dictionary = find_dictionary(entity, path)
            return warn("AttributeInspector: dictionary `#{path.inspect}` not found for entity #{entity}") unless dictionary
            dictionary.each_pair{ |key, value|
              result << {
                :key => key,
                :value => TypedValueParser.stringify(value),
                :type => TypedValueParser.determine_type_string(value)
              }
            }
            return result
          end


          ### Methods for handling selections of multiple entities ###


          # Reads all nested dictionary names of multiple entities into a nested hash.
          # @param [Array<Sketchup::Entity>] entities
          # @return [Array<Hash>] Array of dictionaries in the form of:
          #  [
          #    {
          #      :name => 'dictionary_name',
          #      :children => [...],
          #      :nonCommonDictionary => Boolean
          #    },
          #    ...
          #  ]
          def get_all_dictionaries(*entities)
            entities.flatten!
            attribute_dictionaries_list = entities.map{ |e| e.attribute_dictionaries }
            return merge_dictionaries(attribute_dictionaries_list)
          end


          # Reads all attributes of the requested dictionary of all entities and indicates
          # whether they are contained in all entities and whether the value is identical.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] path - The path of the dictionary.
          # @returns [Hash] Hash of attributes in the form of:
          #  [
          #    {
          #      :key => 'attribute_name',
          #      :value => String,
          #      :type => "#{value.class.name}",
          #      :nonCommonAttribute => Boolean,
          #      :nonCommonValue => Boolean
          #    },
          #    ...
          #  ]
          def get_all_attributes(entities, path)
            count = 0
            # Collect all attributes and values of all entities.
            values = {}
            entities.each{ |entity|
              dictionary = find_dictionary(entity, path)
              next unless dictionary
              count += 1 # FIXME: one line above, because if an entity does not have this dictionary, this attribute is nonCommonKey?
              # Merge the attributes.
              dictionary.each{ |key, value|
                values[key] ||= []
                values[key] << value
              }
            }
            # Merge all values for the same attribute.
            result = values.map{ |key, values|
              value = nil
              non_common_value = false
              non_common_key = false
              # Determine the value.
              # Shared attribute, contained in every dictionary/entity.
              if values.length == count
                # Same values
                if values.uniq.length == 1
                  value = values.first
                # Different values: Decide for most common value.
                else
                  value = most_common(values)
                  non_common_value = true
                end
              # Non-shared attribute, contained in only some dictionaries/entities.
              else
                value = most_common(values)
                non_common_key = true
              end
              {
                :key => key,
                :value => TypedValueParser.stringify(value),
                :type => TypedValueParser.determine_type_string(value),
                :nonCommonKey => non_common_key,
                :nonCommonValue => non_common_value
              }
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


          ### Helper methods for comparing dictionary trees ###


          # For several trees of nested attribute dictionaries, get the united tree.
          # @param [Array<Sketchup::AttributeDictionaries>] attribute_dictionaries_list
          # @return [Hash<String,Hash>]
          def merge_dictionaries(attribute_dictionaries_list)
            union = []
            # Get all node names.
            names = attribute_dictionaries_list.compact.map{ |attribute_dictionaries|
              attribute_dictionaries.map{ |attribute_dictionary| attribute_dictionary.name }
            }.flatten.uniq
            # For each, collect the union of all subtrees.
            names.each{ |name|
              union << {
                :name => name,
                :children => merge_dictionaries(attribute_dictionaries_list.map{ |attribute_dictionaries|
                  # If the attribute_dictionary of the given name contains further nested attribute_dictionaries, collect them.
                  attribute_dictionaries && attribute_dictionaries[name] && attribute_dictionaries[name].attribute_dictionaries
                }),
                :nonCommonDictionary => !all_have_dictionary_with_name(attribute_dictionaries_list, name)
              }
            }
            return union
          end
          private :merge_dictionaries


          def all_have_dictionary_with_name(attribute_dictionaries_list, name)
            return attribute_dictionaries_list.find{ |attribute_dictionaries|
              !attribute_dictionaries || !attribute_dictionaries[name]
            }.nil?
          end
          private :all_have_dictionary_with_name


          def is_non_common_dictionary(entities, path)
            return entities.any?{ |entity|
              !find_dictionary(entity, path, false)
            }
          end


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
                if old_dict
                  old_dict.each{ |key, value|
                    e.set_attribute(new_name, key, value)
                  }
                end
                new_dict = e.attribute_dictionary(new_name, true)
                # Preserve nested dictionaries
                copy_dictionaries(old_dict, new_dict, recursive=true)
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
            entities.each{ |entity|
              dict = find_dictionary(entity, path, true)
              # TODO: raise?
              next warn("AttributeInspector: dictionary `#{path.inspect}` not found for entity #{entity}") unless dict # TODO: can this happen?
              ent = dict.parent.parent # attribute_dictionary -> attribute_dictionaries -> entity
              ent.set_attribute(dictionary_name, attribute, value)
            }
          end


          # Renames an attribute in the dictionary in all selected entities.
          # @param [Array<Sketchup::Entity>] entities
          # @param [Array<String>] path - The path of the dictionary.
          # @param [String] old_attribute - The old name of the attribute.
          # @param [String] new_attribute - The new name of the attribute.
          # @note If an entity did not have this attribute, then only the new attribute
          #   is created, but the correct value is not added.
          def rename_attribute(entities, path, old_attribute, new_attribute)
            unless old_attribute.empty?
              value = most_common(entities.map{ |entity|
                dict = find_dictionary(entity, path, true)
                dict && dict[old_attribute]
              })
            end
            unless old_attribute.empty?
              entities.each{ |entity|
                dict = find_dictionary(entity, path, true)
                next warn("AttributeInspector: dictionary `#{path.inspect}` not found for entity #{entity}") unless dict
                dict[new_attribute] = value
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


          def copy_dictionaries(source_entity, target_entity, recursive=false)
            if source_entity.attribute_dictionaries
              source_entity.attribute_dictionaries.each{ |source_dict|
                name = source_dict.name
                source_dict.each{ |key, value|
                  target_entity.set_attribute(name, key, value)
                }
                if recursive
                  target_dict = target_entity.attribute_dictionary(name)
                  if target_dict
                    copy_dictionaries(source_dict, target_dict, recursive=recursive)
                  end
                end
              }
            end
          end


      end # class << self


    end # module AttributeManipulation


  end # module AttributeInspector


end # module AE
