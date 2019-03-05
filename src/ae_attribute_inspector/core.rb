require 'sketchup.rb'


module AE


  module AttributeInspector


    # Constants
    self::PATH = File.expand_path('..', __FILE__) unless defined?(self::PATH)


    # Requirements
    %w(
       attribute_inspector.rb
       inspector_dialog.rb
       mode.rb
       observers.rb
       settings.rb
       translate.rb
       ui.rb
       version.rb
    ).each{ |file| require(File.join(PATH, file)) }

    # Constants
    self::TRANSLATE = Translate.new('attribute_inspector.strings') unless defined?(self::TRANSLATE)


    # API

    # Opens the AttributeInspector.
    def self.open
      #if @@instance.nil?
        @@instance = self::AttributeInspector.new(@@settings)
      #end
      @@instance.open
    end


    # Closes the AttributeInspector.
    def self.close
      @@instance.close unless @@instance.nil?
      @@instance = nil
    end


    # Selects entities in the AttributeInspector dialog.
    # @param [Array<Sketchup::Drawingelement>] entities
    def self.select(*entities)
      @@instance.select(*entities) unless @@instance.nil?
    end


    ### Plugin

    def self.initialize_plugin
      # Load settings
      @@settings ||= Settings.new('AE/AttributeInspector').load({
        :mode => Mode::Drawingelement,
        :recent_paths => []
      })
      # Reference to singleton instance
      @@instance ||= nil
    end
    private_class_method :initialize_plugin


    ### Initialization

    unless file_loaded?(__FILE__)
      initialize_plugin
      initialize_ui
      file_loaded(__FILE__)
    end


  end # class AttributeInspector


end # module AE
