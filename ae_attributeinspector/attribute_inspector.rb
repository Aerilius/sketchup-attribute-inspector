module AE


  module AttributeInspector


    require(File.join(PATH, 'inspector_dialog.rb'))
    require(File.join(PATH, 'observable.rb'))
    require(File.join(PATH, 'observing.rb'))


    class AttributeInspector

      include AttributeInspectorDialog

      include Observable

      MAX_ENTITIES_LIMIT = 100 unless defined?(self::MAX_ENTITIES_LIMIT) # The maximum amount of entities in the selection set that will be processed by this plugin, for performance reasons.


      public ### PUBLIC INSTANCE METHODS ###


      def open
        # Add app observer.
        Observing.add_observer(Sketchup, Observers::NewModelObserver, self)
        super
      end


      def close
        # Remove app observer and all other observers.
        Observing.unwatch_all
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
        entities = entities.grep(Sketchup::Entity).concat(entities.grep(Sketchup::Model))
        if entities.empty?
          model = Sketchup.active_model
          entities_to_select = (@mode == :DRAWING_ELEMENTS) ? [model] : []
          return self if entities_to_select == @selected_entities # No need to update dialog if selection did not change.
          switch_to_model(model)
          @selected_entities = entities_to_select
        elsif entities.length == 1 && entities.first.is_a?(Sketchup::Model)
          entities_to_select = [entities.first]
          return self if entities_to_select == @selected_entities
          @selected_entities = entities_to_select
          switch_to_model(entities.first)
        else
          model = entities.first.model
          entities_to_select = entities.select {|e| e.model == model}
          return self if entities_to_select == @selected_entities
          switch_to_model(model)
          @selected_entities = entities_to_select
        end
        # Refresh the dialog # TODO: remove comment (refresh_dialog)
        #trigger(:selected, @selected_entities)
        refresh_dialog
        return self
      end


      # Preselects entities according to the current mode.
      def select_current
        entities = case @mode
        when :DRAWING_ELEMENTS then
          (@model.selection.empty?) ? @model : @model.selection.to_a
        when :DEFINITIONS then
          @model.selection.to_a.select {|e| e.respond_to?(:definition)}.map {|e| e.definition}
        when :MATERIALS then
          @model.materials.current
        when :LAYERS then
          @model.active_layer
        when :PAGES then
          @model.pages.selected_page
        when :STYLES then
          @model.styles.selected_style # TODO
        end
        select(entities)
        return self
      end


      # Sets the mode from which entity types to take the current selected item(s)
      # and selects the current entities for this mode.
      # @param [Symbol] mode - one of [:DRAWING_ELEMENTS, :DEFINITIONS, :MATERIALS, :LAYERS, :PAGES, :STYLES]
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
        return if model == @model
        raise ArgumentError unless model.is_a?(Sketchup::Model) && model.valid?
        # Switch the model.
        switch_to_model(model)
        # Set the selection according to the newly selected model.
        select_current
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
        @dialog_entities   = []
        #
        model = Sketchup.active_model if model.nil?
        raise unless model.is_a?(Sketchup::Model)
        @model = nil
        # The mode, which type of entities are observed (selection, materials, layers, pages, styles)
        @mode = settings.get('mode', :DRAWING_ELEMENTS).to_sym

        # The newest selected entities whose dictionaries will be send to the dialog.
        @selected_entities = []
        # Initially, select the current model.
        self.model=(model)
        # Then the current selection in the current model.
        select_current() # TODO: redundant because done in model=
      end


      # Sets the mode from which entity types to take the current selected item(s).
      # @param [Symbol] mode - one of [:DRAWING_ELEMENTS, :DEFINITIONS, :MATERIALS, :LAYERS, :PAGES, :STYLES]
      def switch_to_mode(mode)
        return if mode == @mode
        # Stop observing the previous mode on the currently selected model.
        Observing.unwatch(@model, @mode)
        # Switch the mode variable.
        @mode             = mode
        @settings['mode'] = mode
        # Start observing the new mode on the currently selected model.
        Observing.watch(@model, mode, self)
      end


      # Sets the currently active model.
      # @param [Sketchup::Model] model
      def switch_to_model(model)
        return if model == @model
        # Remove the model observer from the previously selected model.
        Observing.remove_observer(@model)
        # Stop observing the current mode on the previously selected model.
        Observing.unwatch(@model, @mode)
        # Switch the model variable.
        @model = model
        # Add a model observer to the newly selected model.
        Observing.add_observer(model, Observers::ModelObserver, self)
        # Start observing the current mode on the newly selected model.
        Observing.watch(model, @mode, self)
      end


    end


  end


end
