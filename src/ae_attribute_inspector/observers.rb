require 'sketchup.rb'

# TODO: rename select into update, also in attribute_inspector.rb
# TODO: inverse dependency, use observer pattern?
# These observers currently have an reference to an attribute_inspector and call inspect on it.
# Instead, create a common observer interface on which attribute_inspector registers on(:selected){ |*selected| inspect(*selected) }
module AE


  module AttributeInspector


    module Observers


      class SelectionObserver < Sketchup::SelectionObserver

        def initialize(instance)
          @instance = instance
          @is_selection_cleared = false
        end

        # When an entity was selected and another entity is selected instead, 
        # onSelectionCleared triggers followed by onSelectionBulkChange. 
        # onSelectionCleared propagates a wrong information that is immediately not
        # up-to-date anymore. Because of this, we filter out double triggers by waiting
        # in onSelectionCleared and checking whether it is followed by onSelectionBulkChange.
        def onSelectionBulkChange(selection)
          Utils.catch_errors{
            @is_selection_cleared = false unless selection.empty?
            @instance.select(*selection.to_a)
          }
        end

        def onSelectionCleared(selection)
          @is_selection_cleared = true
          UI.start_timer(0, false) {
            Utils.catch_errors{
              @instance.select(*selection.to_a) if @is_selection_cleared
            }
          }
        end

      end


      class DefinitionsSelectionObserver < Sketchup::SelectionObserver

        def initialize(instance)
          @instance = instance
          @is_selection_cleared = false
        end

        # Since active/selected definition in DefinitionsList can not be observed, 
        # we workaround it and use the definition of the selected DrawingElement.
        def onSelectionBulkChange(selection)
          Utils.catch_errors{
            @is_selection_cleared = false unless selection.empty?
            definitions = selection.to_a.select{ |e| e.respond_to?(:definition) }.map{ |e| e.definition }
            @instance.select(*definitions)
          }
        end

        def onSelectionCleared(selection)
          @is_selection_cleared = true
          UI.start_timer(0, false) {
            Utils.catch_errors{
              if @is_selection_cleared
                definitions = selection.to_a.select{ |e| e.respond_to?(:definition) }.map{ |e| e.definition }
                @instance.select(*definitions)
              end
            }
          }
        end

      end


      class MaterialsObserver < Sketchup::MaterialsObserver

        def initialize(instance)
          @instance = instance
        end

        def onMaterialSetCurrent(materials, material)
          # TODO: This should trigger when Materials#current changes.
          Utils.catch_errors{
            @instance.select(material)
          }
        end

      end


      class LayersObserver < Sketchup::LayersObserver

        def initialize(instance)
          @instance = instance
        end

        def onCurrentLayerChanged(layers, layer)
          Utils.catch_errors{
            @instance.select(layer)
          }
        end

      end


      class PagesObserver < Sketchup::PagesObserver

        def initialize(instance)
          @instance = instance
        end

        # TODO: This does not trigger when Pages#selected_page changes, only when a page is modified.
        def onContentsModified(pages)
          Utils.catch_errors{
            @instance.select(pages.selected_page)
          }
        end

      end


      class RenderingOptionsStylesObserver < Sketchup::RenderingOptionsObserver

        def initialize(instance)
          @instance = instance
          @selected_style = nil
        end

        # Since there is no StylesObserver and EntityObserver (Styles is an Entity)
        # is not triggered for changed active/selected style,
        # we workaround it and observe the rendering options.
        def onRenderingOptionsChanged(rendering_options, type)
          Utils.catch_errors{
            styles = rendering_options.model.styles
            if styles.selected_style != @selected_style
              @active_style = styles.selected_style
              @instance.select(styles.selected_style)
            end
          }
        end

      end

      class ModelObserver < Sketchup::ModelObserver

        def initialize(instance)
          @instance = instance
        end

        def onTransactionUndo(model)
          Utils.catch_errors{
            @instance.refresh
          }
        end

        def onTransactionRedo(model)
          Utils.catch_errors{
            @instance.refresh
          }
        end

      end


      class NewModelObserver < Sketchup::AppObserver

        def initialize(instance)
          @instance = instance
        end

        def expectsStartupModelNotifications
          return true
        end

        def onNewModel(model)
          Utils.catch_errors{
            @instance.model = model
          }
        end

        def onOpenModel(model)
          Utils.catch_errors{
            @instance.model = model
          }
        end

        def onActivateModel(model)  
          Utils.catch_errors{
            @instance.model = model
          }
        end

      end


    end # module Observers


  end # class AttributeInspector


end # module AE
