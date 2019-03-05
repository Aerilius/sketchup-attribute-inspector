module AE


  module AttributeInspector


    class Observing


      def initialize(object_to_notify)
        @observers = {}
        @object_to_notify = object_to_notify
      end


      def add_observer(object, observer_class, object_to_notify=@object_to_notify)
        unless @observers.include?(object)
          observer = observer_class.new(object_to_notify)
          object.add_observer(observer)
          @observers[object] = observer
        end
      end


      def remove_observer(object)
        if @observers.include?(object)
          object.remove_observer(@observers[object])
          @observers.delete(object)
        end
      end


      # Starts observations in a model.
      # @param [Sketchup::Model] model
      # @param [Symbol] mode - one of [:DrawingElement, :Material, :Layer, :Page, :Style]
      # @param [#select] object_to_notify - an object to notify which has a select method
      def watch(model, mode, object_to_notify=@object_to_notify)
        return unless Mode.constants.include?(mode) && model.is_a?(Sketchup::Model) && model.valid?
        case mode
        when Mode::Drawingelement then
          remove_observer(model.selection)
          add_observer(model.selection, Observers::SelectionObserver, object_to_notify)
        when Mode::ComponentDefinition
          remove_observer(model.selection)
          add_observer(model.selection, Observers::DefinitionsSelectionObserver, object_to_notify)
        when Mode::Material
          remove_observer(model.materials)
          add_observer(model.materials, Observers::MaterialsObserver, object_to_notify)
        when Mode::Layer
          remove_observer(model.layers)
          add_observer(model.layers, Observers::LayersObserver, object_to_notify)
        when Mode::Page
          remove_observer(model.pages)
          add_observer(model.pages, Observers::PagesObserver, object_to_notify)
        when Mode::Style
          #remove_observer(model.styles)
          #add_observer(model.styles, Observers::StylesObserver, object_to_notify)
          remove_observer(model.rendering_options)
          add_observer(model.rendering_options, Observers::RenderingOptionsStylesObserver, object_to_notify)
        end
      end


      # Stops observations in a model.
      # @param [Sketchup::Model] model
      # @param [Symbol] mode - one of [:DrawingElement, :Material, :Layer, :Page, :Style]
      def unwatch(model, mode)
        return unless model.is_a?(Sketchup::Model) && model.valid?
        case mode
        when Mode::Drawingelement then
          remove_observer(model.selection)
        when Mode::ComponentDefinition
          remove_observer(model.selection)
        when Mode::Material
          remove_observer(model.materials)
        when Mode::Layer
          remove_observer(model.layers)
        when Mode::Page
          remove_observer(model.pages)
        when Mode::Style
          remove_observer(model.styles)
        end
      end


      # Stops all observers in all models.
      def unwatch_all
        # Remove observers for all entity types.
        @observers.each{ |observed, observer|
          observed.remove_observer(observer)
        }
        @observers.clear
      end


    end


  end


end
