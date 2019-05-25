module AE


  module AttributeInspector


    require(File.join(PATH, 'inspector_dialog.rb'))
    require(File.join(PATH, 'observing.rb'))
    require(File.join(PATH, 'utils.rb'))


    class AttributeInspector

      include AttributeInspectorDialog

      MAX_ENTITIES_LIMIT = 100 unless defined?(self::MAX_ENTITIES_LIMIT) # The maximum amount of entities in the selection set that will be processed by this plugin, for performance reasons.


      public ### PUBLIC INSTANCE METHODS ###


      attr_reader :mode


      def open
        # Add app observer.
        @observing.add_observer(Sketchup, Observers::NewModelObserver)
        super
      end


      def close
        # Remove app observer and all other observers.
        @observing.unwatch_all
        super
      end


      # Selects entities in the AttributeInspector dialog.
      # - determines a title for the dialog
      # - reads the attributes
      # - refreshes the dialog
      # These entities are only ready for attribute operations after the dialog has
      # been refreshed. Otherwise when a dialog element is blurred because new entities
      # are selected in the model, the dialog would send "change" requests to the wrong
      # entities.
      # @param [Array<Sketchup::Drawingelement>] entities
      # @return [AE::AttributeInspector] self
      def select(*entities)
        entities.flatten!
        entities = filter_supported_entities(entities)
        if entities.empty?
          model = Sketchup.active_model
          entities_to_select = (@mode == Mode::Drawingelement) ? [model] : []
          # No need to update dialog if selection did not change.
          return self if entities_to_select == @selected_entities
          switch_to_model(model) if model != @model
          @selected_entities = entities_to_select
        elsif entities.length == 1 && entities.first.is_a?(Sketchup::Model)
          model = entities.first
          entities_to_select = [model]
          # No need to update dialog if selection did not change.
          return self if entities_to_select == @selected_entities
          switch_to_model(model) if model != @model
          switch_to_mode(Mode.from_entity(entities.first))
          @selected_entities = entities_to_select
        else
          model = entities.first.model
          entities_to_select = entities.select {|e| e.model == model}
          # No need to update dialog if selection did not change.
          return self if entities_to_select == @selected_entities
          switch_to_model(model) if model != @model
          switch_to_mode(Mode.from_entity(entities.first))
          @selected_entities = entities_to_select
        end
        # Refresh the UI
        refresh
        return self
      end


      # Preselects entities according to the current mode.
      def select_current
        entities = case @mode
        when Mode::Drawingelement then
          (@model.selection.empty?) ? @model : @model.selection.to_a
        when Mode::ComponentDefinition then
          @model.selection.to_a.select {|e| e.respond_to?(:definition)}.map {|e| e.definition}
        when Mode::Material then
          @model.materials.current
        when Mode::Layer then
          @model.active_layer
        when Mode::Page then
          @model.pages.selected_page
        when Mode::Style then
          @model.styles.selected_style
        end
        select(entities)
        return self
      end


      # Sets the mode from which entity types to take the current selected item(s)
      # and selects the current entities for this mode.
      # @param [Symbol] mode - one of [:Drawingelement, :ComponentDefinition, :Material, :Layer, :Page, :Style]
      def mode=(mode)
        raise ArgumentError unless Mode.constants.include?(mode)
        return if mode == @mode
        # Switch the mode.
        switch_to_mode(mode)
        # Set the selection according to the newly selected mode.
        select_current
      end


      # Sets the currently active model and selects the current entities for this model.
      # @param [Sketchup::Model] model
      def model=(model)
        # SketchUp recycles model instances, so when opening a new model the instance might still be equal to the previous.
        #return if model == @model && model.guid == @model.guid
        raise ArgumentError unless model.is_a?(Sketchup::Model) && model.valid?
        # Switch the model.
        switch_to_model(model)
        # Set the selection according to the newly selected model.
        select_current
      end


      def refresh
        super
        return self
      end


      # Redefine the inspect method to give shorter output.
      # @overload
      # @return [String]
      def inspect
        return "#<#{self.class}:0x#{(self.object_id << 1).to_s(16)}>"
      end


      private ### PRIVATE INSTANCE METHODS ###


      def initialize(settings, model=nil)
        # Session storage of settings of the dialog.
        @settings = settings
        @dialog            = create_dialog()
        # The entities currently displayed in the dialog.
        # This ensures that actions on attributes in the dialog will only 
        # affect the entities that are actually reflected in the dialog even if
        # the dialog is out of sync with the selection in the viewport.
        @dialog_entities   = []
        #
        model = Sketchup.active_model if model.nil?
        raise unless model.is_a?(Sketchup::Model)
        @model = nil
        # The mode, which type of entities are observed (selection, materials, layers, pages, styles)
        @mode = settings.get('mode', Mode::Drawingelement).to_sym
        # The observer manager
        @observing = Observing.new(self)
        # The newest selected entities whose dictionaries will be send to the dialog.
        @selected_entities = []
        # Initially, select the current model.
        self.model=(model)
        # Then the current selection in the current model.
        select_current() # TODO: redundant because done in model=
      end


      def filter_supported_entities(entities)
        return entities.grep(Sketchup::Entity).concat(entities.grep(Sketchup::Model))
      end


      # Sets the mode from which entity types to take the current selected item(s).
      # @param [Symbol] mode - one of [:Drawingelement, :ComponentDefinition, :Material, :Layer, :Page, :Style]
      def switch_to_mode(mode)
        return if mode == @mode || mode == Mode::Other
        # Stop observing the previous mode on the currently selected model.
        @observing.unwatch(@model, @mode)
        # Switch the mode variable.
        @mode             = mode
        @settings['mode'] = mode
        # Start observing the new mode on the currently selected model.
        @observing.watch(@model, mode)
      end


      # Sets the currently active model.
      # @param [Sketchup::Model] model
      def switch_to_model(model)
        # SketchUp recycles model instances, so when opening a new model the instance might still be equal to the previous.
        #return if model == @model && model.guid == @model.guid
        # Remove the model observer from the previously selected model.
        @observing.remove_observer(@model)
        # Stop observing the current mode on the previously selected model.
        @observing.unwatch(@model, @mode)
        # Switch the model variable.
        @model = model
        # Add a model observer to the newly selected model.
        @observing.add_observer(model, Observers::ModelObserver, self)
        # Start observing the current mode on the newly selected model.
        @observing.watch(model, @mode)
      end


    end


  end


end
