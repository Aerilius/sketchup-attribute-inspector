module AE


  module AttributeInspector


    module Observing


      @@observers = {}


      class << self


        def add_observer(object, observer_class, object_to_notify)
          unless @@observers.include?(object)
            observer = observer_class.new(object_to_notify)
            object.add_observer(observer)
            @@observers[object] = observer
          end
        end


        def remove_observer(object)
          if @@observers.include?(object)
            object.remove_observer(@@observers[object])
            @@observers.delete(object)
          end
        end


        # Starts observations in a model.
        # @param [Sketchup::Model] model
        # @param [Symbol] mode - one of [:DRAWING_ELEMENTS, :MATERIALS, :LAYERS, :PAGES, :STYLES]
        def watch(model, mode, object_to_notify)
          return unless Mode.constants.include?(mode) && model.is_a?(Sketchup::Model) && model.valid?
          case mode
          when :DRAWING_ELEMENTS then
            remove_observer(model.selection)
            add_observer(model.selection, Observers::SelectionObserver, object_to_notify)
          when :DEFINITIONS
            remove_observer(model.selection)
            add_observer(model.selection, Observers::DefinitionsSelectionObserver, object_to_notify)
          when :MATERIALS
            remove_observer(model.materials)
            add_observer(model.materials, Observers::MaterialsObserver, object_to_notify)
          when :LAYERS
            remove_observer(model.layers)
            add_observer(model.layers, Observers::LayersObserver, object_to_notify)
          when :PAGES
            remove_observer(model.pages)
            add_observer(model.pages, Observers::PagesObserver, object_to_notify)
          when :STYLES
            remove_observer(model.styles)
            add_observer(model.styles, Observers::StylesObserver, object_to_notify)
          end
        end


        # Stops observations in a model.
        # @param [Sketchup::Model] model
        # @param [Symbol] mode - one of [:DRAWING_ELEMENTS, :MATERIALS, :LAYERS, :PAGES, :STYLES]
        def unwatch(model, mode)
          return unless model.is_a?(Sketchup::Model) && model.valid?
          case mode
          when :DRAWING_ELEMENTS then
            remove_observer(model.selection)
          when :DEFINITIONS
            remove_observer(model.selection)
          when :MATERIALS
            remove_observer(model.materials)
          when :LAYERS
            remove_observer(model.layers)
          when :PAGES
            remove_observer(model.pages)
          when :styles
            remove_observer(model.styles)
          end
        end


        # Stops all observers in all models.
        def unwatch_all
          # Remove observers for all entity types.
          @@observers.each{ |observed, observer|
            observed.remove_observer(observer)
          }
          @@observers.clear
        end


      end


    end


  end


end
