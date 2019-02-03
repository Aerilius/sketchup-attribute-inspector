require 'sketchup.rb'


module AE


  module AttributeInspector


    module Mode

      Drawingelement      = :Drawingelement
      ComponentDefinition = :ComponentDefinition
      Material            = :Material
      Layer               = :Layer
      Page                = :Page
      Style               = :Style
      Other               = :Other

      def self.from_entity(entity)
        case entity
        when Sketchup::ComponentDefinition
          return self::ComponentDefinition
        # This is below, because Drawingelement matches also ComponentDefinition
        when Sketchup::Drawingelement, Sketchup::Curve, Sketchup::Axes, Sketchup::Model
          return self::Drawingelement
        when Sketchup::Material
          return self::Material
        when Sketchup::Layer
          return self::Layer
        when Sketchup::Page
          return self::Page
        when Sketchup::Style
          return self::Style
        when Sketchup::Entity
          # Other entities that are supported (have attributes), but no dedicated 
          # mode for selection through the UI. They can be selected through the API.
          self::Other
        else
          raise(ArgumentError, "Object #{entity.class} is not a supported mode of AttributeInspector")
        end
      end

    end


  end


end
