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

    private_constant(:Mode) if methods.include?(:private_constant)

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

    ### User interface

    def self.create_command()
      # Command
      command = UI::Command.new(TRANSLATE['Attribute Inspector']){
        begin
          AE::AttributeInspector.open
        rescue Exception => error
          if defined?(AE::ConsolePlugin)
            AE::ConsolePlugin.error(error)
          else
            $stderr.write(error.message + $/)
            $stderr.write(error.backtrace.join($/) + $/)
          end
        end
      }
      command.set_validation_proc{
        (@@instance.nil?) ? MF_UNCHECKED : MF_CHECKED
      }
      # Icons
      if Sketchup.version.to_i >= 16
        if RUBY_PLATFORM =~ /darwin/
          command.small_icon = command.large_icon = File.join(PATH, 'images', 'icon.pdf')
        else
          command.small_icon = command.large_icon = File.join(PATH, 'images', 'icon.svg')
        end
      else
        command.small_icon   = File.join(PATH, 'images', 'icon_32.png')
        command.large_icon   = File.join(PATH, 'images', 'icon_48.png')
      end
      # Metadata
      command.tooltip = TRANSLATE['A viewer for entity and model attributes']
      command.status_bar_text = TRANSLATE['Select an entity to view and edit its attribute dictionaries.']
      return command
    end
    private_class_method :create_command

    def self.register_menu(command)
      UI.menu('Window').add_item(command)
    end
    private_class_method :register_menu

    def self.create_toolbar(command)
      toolbar = UI::Toolbar.new(TRANSLATE['Attribute Inspector'])
      toolbar.add_item(command)
      # Show toolbar if it was open when we shutdown.
      toolbar.restore
      # Per bug 2902434, adding a timer call to restore the toolbar. This
      # fixes a toolbar resizing regression on PC as the restore() call
      # does not seem to work as the script is first loading.
      UI.start_timer(0.1, false){
        toolbar.restore
      }
    end
    private_class_method :create_toolbar

    def self.initialize_ui
      command = create_command()
      register_menu(command)
      create_toolbar(command)
    end
    private_class_method :initialize_ui

    ### Initialization

    unless file_loaded?(__FILE__)
      initialize_plugin
      initialize_ui
      file_loaded(__FILE__)
    end


  end # class AttributeInspector


end # module AE
