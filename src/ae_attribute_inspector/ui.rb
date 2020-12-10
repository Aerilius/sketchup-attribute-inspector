module AE


  module AttributeInspector


    def self.get_resource_path(basename)
      if Sketchup.version.to_i >= 16
        if RUBY_PLATFORM =~ /darwin/
          return File.join(PATH, 'images', "#{basename}.pdf")
        else
          return File.join(PATH, 'images', "#{basename}.svg")
        end
      else
        return File.join(PATH, 'images', "#{basename}.png")
      end
    end
    private_class_method :get_resource_path


    def self.create_command()
      # Command
      command = UI::Command.new(TRANSLATE['Attribute Inspector']) {
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
      # Icons
      command.large_icon = command.small_icon = get_resource_path('icon')
      # Metadata
      command.tooltip = TRANSLATE['A viewer for entity and model attributes']
      command.status_bar_text = TRANSLATE['Select an entity to view and edit its attribute dictionaries.']
      return command
    end
    private_class_method :create_command


    def self.register_menu(command)
      menu = UI.menu('Window')
      # Prefer adding a separator before your extension's menu entry when using any other menu than Extensions.
      menu.add_separator
      menu.add_item(command)
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


  end


end
