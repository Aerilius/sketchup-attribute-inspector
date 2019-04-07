module AE


  module AttributeInspector


    module AttributeInspectorDialog # mixin


      require(File.join(PATH, 'bridge.rb'))
      require(File.join(PATH, 'attribute_manipulation.rb'))


      ATTRIBUTE_INSPECTOR_HTML = File.join(PATH, 'html', 'app.html') unless defined?(self::ATTRIBUTE_INSPECTOR_HTML)

      attr_reader :dialog, :bridge

      ### Inspector instance methods

      def open
        @dialog = create_dialog() if @dialog.nil?
        @dialog.show
        nil
      end


      def close
        @dialog.close
        @dialog = nil
        nil
      end


      ### Private methods


      private


      def refresh
        if @dialog && @dialog.visible?
          @dialog.get('refresh').then{
            @dialog_entities = @selected_entities
          }
        end
      end


      def create_dialog
        properties = {
          :dialog_title    => TRANSLATE['Attribute Inspector'],
          :preferences_key => 'com.aerilius.attributeinspector',
          :scrollable      => false,
          :resizable       => true,
          :width           => 400,
          :height          => 300,
          :left            => 200,
          :top             => 200,
        }
        if defined?(UI::HtmlDialog)
          properties[:style] = UI::HtmlDialog::STYLE_DIALOG
          dialog             = UI::HtmlDialog.new(properties)
        else
          dialog = UI::WebDialog.new(properties)
        end
        dialog.set_file(ATTRIBUTE_INSPECTOR_HTML)

        # Add a Bridge to handle JavaScript-Ruby communication.
        Bridge.decorate(dialog)

        dialog.on('get_translations') {|action_context|
          action_context.resolve(TRANSLATE.to_hash)
        }

        # Callbacks
        # Get settings.
        dialog.on('get_settings') {|action_context|
          action_context.resolve @settings.to_hash
        }
        dialog.on('update_property') {|action_context, key, value|
          @settings[key] = value
        }

        # Transfer the title.
        dialog.on('get_entity') {|action_context|
          action_context.resolve({
            :title => get_title(*@selected_entities),
            :id => (!@selected_entities.empty?) ? @selected_entities.map(&:object_id).join('.') : nil,
            :related => get_related(*@selected_entities)
          })
        }

        # Select an entity by id.
        dialog.on('select') {|action_context, identifier|
          select(ObjectSpace._id2ref(identifier))
        }

        # Transfer the tree of available dictionaries.
        dialog.on('get_dictionaries') {|action_context|
          unless @selected_entities.empty?
            action_context.resolve AttributeManipulation.get_all_dictionaries(@selected_entities)
          else
            action_context.resolve nil
          end
        }

        dialog.on('is_non_common_dictionary') {|action_context, path|
          action_context.resolve AttributeManipulation.is_non_common_dictionary(@selected_entities, path)
        }

        # Transfer attributes of a specific dictionary.
        dialog.on('get_attributes') {|action_context, path|
          action_context.resolve AttributeManipulation.get_all_attributes(@selected_entities, path)
        }

        dialog.on('get_entity_type') {|action_context|
          action_context.resolve self.mode
        }

        dialog.on('set_entity_type') {|action_context, type|
          self.mode = type.to_sym
        }

        # Add a dictionary.
        dialog.on('add_dictionary') {|action_context, path|
          path ||= []
          if @dialog_entities.any? {|entity| AttributeManipulation.find_dictionary(entity, path)}
            raise(ArgumentError, 'The dictionary name must be unique and not existing for the current selection set.')
          end
          begin
            @model.start_operation(TRANSLATE['Add attribute dictionary "%0"', path.join('/')])
            AttributeManipulation.add_dictionary(@dialog_entities, path, {})
            @model.commit_operation
            action_context.resolve
          rescue Exception => error
            @model.abort_operation
            Utils.log_error(error)
            action_context.reject(error)
          end
        }

        # Rename dictionary.
        dialog.on('rename_dictionary') {|action_context, old_path, new_name|
          begin
            @model.start_operation(TRANSLATE['Rename attribute dictionary "%0" to "%1"', (old_path).join('/'), new_name])
            AttributeManipulation.rename_dictionary(@dialog_entities, old_path, new_name)
            @model.commit_operation
            action_context.resolve
          rescue Exception => error
            @model.abort_operation
            Utils.log_error(error)
            action_context.reject(error)
          end
        }

        # Remove dictionary.
        dialog.on('remove_dictionary') {|action_context, path|
          begin
            @model.start_operation(TRANSLATE['Remove attribute dictionary "%0"', path.join('/')])
            AttributeManipulation.remove_dictionary(@selected_entities, path)
            @model.commit_operation
            action_context.resolve
          rescue Exception => error
            @model.abort_operation
            Utils.log_error(error)
            action_context.reject(error)
          end
        }

        # Create/edit attribute.
        dialog.on('set_attribute') {|action_context, path, attribute, value_string, type_string|
          begin
            @model.start_operation(TRANSLATE['Set attribute "%0" to "%1"', attribute, value_string])
            # Convert SketchUp types back from JSON-compatible types
            value = TypedValueParser.parse(value_string, type_string) # TODO: Need to rescue SyntaxError
            AttributeManipulation.set_attribute(@dialog_entities, path, attribute, value)
            @model.commit_operation
            action_context.resolve
          rescue Exception => error
            @model.abort_operation
            action_context.reject(error)
          end
        }

        # Rename attribute.
        dialog.on('rename_attribute') {|action_context, path, old_attribute, new_attribute|
          begin
            @model.start_operation(TRANSLATE['Rename attribute "%0" to "%1"', old_attribute, new_attribute])
            AttributeManipulation.rename_attribute(@dialog_entities, path, old_attribute, new_attribute)
            @model.commit_operation
            action_context.resolve
          rescue Exception => error
            @model.abort_operation
            Utils.log_error(error)
            action_context.reject(error)
          end
        }

        # Remove attribute.
        dialog.on('remove_attribute') {|action_context, path, attribute|
          begin
            @model.start_operation(TRANSLATE['Remove attribute "%0"', attribute])
            AttributeManipulation.remove_attribute(@dialog_entities, path, attribute)
            @model.commit_operation
            action_context.resolve
          rescue Exception => error
            @model.abort_operation
            Utils.log_error(error)
            action_context.reject(error)
          end
        }

        if dialog.respond_to?(:set_on_closed) # UI::HtmlDialog
          dialog.set_on_closed {
            self.close
          }
        elsif dialog.respond_to?(:set_on_close) # UI::WebDialog
          dialog.set_on_close {
            self.close
          }
        end
        return dialog
      end


      # Determines a title for the given entity or entities.
      # @param [Array<Sketchup::Entity>] entities
      # @return [String] title
      def get_title(*entities)
        entities.flatten!
        if entities.empty?
          return TRANSLATE['No entity selected']
        elsif entities.length == 1
          # Get a localized typename.
          entity = entities.first
          type   = (entity.respond_to?(:typename)) ? entity.typename : entity.class.name[/[^:]+$/]
          title  = TRANSLATE[type]
          # Add a name if the entity is individually named.
          if entity.respond_to?(:display_name) && !entity.display_name.empty?
            title += ' ' + TRANSLATE['"%0"', entity.display_name]
          elsif entity.respond_to?(:name) && !entity.name.empty?
            title += ' ' + TRANSLATE['"%0"', entity.name]
          end
          return title
          # Multiple entities
        elsif entities.length > 1
          entity = entities.first
          # If no entity has a different type, use the typename as plural form.
          if not entities.find {|e| !e.is_a?(entity.class)}
            type = (entity.respond_to?(:typename)) ? entity.typename : entity.class.name[/[^:]+$/]
            return entities.length.to_s + ' ' + TRANSLATE[type + 's']
            # Otherwise use a generic title.
          else
            return entities.length.to_s + ' ' + TRANSLATE['entities']
          end
        end
      end


      # Determines a related entity that the user could be interested in.
      # @param [Array<Sketchup::Entity>] entities
      # @return [String, Fixnum] title, identifier # TODO identifier could be garbage collected
      def get_related(*entities)
        entities.flatten!
        # If entities have no dictionaries, check if a related selected entity in a
        # different mode has dictionaries.
        if entities.all? {|e| e.attribute_dictionaries.nil?}
          model       = (entities.empty? || entities.first.is_a?(Sketchup::Model)) ? Sketchup.active_model : entities.first.model
          alternative = nil
          # Selection
          alternative = model.selection.find {|e| e.attribute_dictionaries}
          # Definitions
          alternative = model.selection.to_a.select {|e| e.respond_to?(:definition)}.map {|e| e.definition}.find {|e| e.attribute_dictionaries} unless alternative
          # Materials
          alternative = model.materials.current if model.materials.current && model.materials.current.attribute_dictionaries unless alternative
          # Layers
          alternative = model.active_layer if model.active_layer.attribute_dictionaries unless alternative
          # Pages
          alternative = model.pages.selected_page if model.pages.selected_page && model.pages.selected_page.attribute_dictionaries unless alternative
          # Styles
          alternative = model.styles.selected_style if model.styles.selected_style && model.styles.selected_style.attribute_dictionaries unless alternative
          if alternative
            type  = alternative.typename
            return {
              :title => TRANSLATE['currently selected %0', type],
              :id    => alternative.object_id
            }
          end
        end
        # If all entities are edges and part of same curve.
        if entities_of_curve?(*entities)
          curve = entities.first.curve
          type  = curve.typename
          type  = 'Circle' if curve.end_angle.to_l == 360.degrees
          return {
            :title => TRANSLATE[type],
            :id    => curve.object_id
          }
        end
        # If entities are component instances of same definition.
        if entities_of_same_component_definition?(*entities)
          definition = entities.first.definition
          type  = definition.typename
          return {
            :title => TRANSLATE[type],
            :id    => definition.object_id
          }
        end
      end


      # Checks whether given entities consist of one or more edges of a (the same) curve.
      def entities_of_curve?(*entities)
        if entities.first.is_a?(Sketchup::Edge) # First is an edge...
          curve = entities.first.curve
          if curve && (# ...and has part of a curve...
          entities.length == 1 ||
          entities.all? {|e| e.is_a?(Sketchup::Edge) && e.curve == curve}) # ...and all the others too.
            return true
          end
        end
        return false
      end


      # Checks whether all given entities are instances of the same component definition.
      def entities_of_same_component_definition?(*entities)
        if entities.first.respond_to?(:definition)
          definition = entities.first.definition
          if entities.length == 1 ||
          entities.all? {|e| e.respond_to?(:definition) && e.definition == definition}
            return true
          end
        end
        return false
      end


    end


  end


end
