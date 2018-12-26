=begin

Copyright 2013-2015, Andreas Eisenbarth
All Rights Reserved

Permission to use, copy, modify, and distribute this software for
any purpose and without fee is hereby granted, provided that the above
copyright notice appear in all copies.

THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT ANY EXPRESS OR
IMPLIED WARRANTIES, INCLUDING, WITHOUT LIMITATION, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

Name:         AttributeInspector.rb
Author:       Andreas Eisenbarth
Description:
Usage:        menu Window → AttributeInspector
Version:      1.2.0
Date:         15.03.2015

Bugs
* ✓ default "no dictionaries" message does not hide
* ✓ typedvalueparser.rb syntax error messages
* refactor key/value changed handlers into tableview; add name to tableview, in app: on node in treeview renamed, setName() on tableview
* ✓typed value parser may raise syntax error, catch it
* ?input validation shows red for string of type string
  ✓onchange on value: validate new value and current type; if invalid then highlight value in red
  !onchange on type: validate current value and new type; if invalid then highlight type in red
* ✓better arrow glyph for tree structure
* ✓deleting dictionaries does not really remove them
* ✓selection of model when clicking into empty space (instead of no entities)
* ✓when switching to entity with selected nested dictionary, tree is not expanded up to that dictionary
* ✓reduce left margin/padding in tree structure
* ✓Missing translations: "Add attribute diction..." for de
* ✓svg icons
* ✓improve layout in header
* ✓images in css like console.css; consistent button sizes
* ✓buttons to expand/collapse tree
* avoid accumulating notifications
* disable orthography checking

Required features
* ✓persistency/settings/recentPaths
* graying; TODO: ungray when modifying
  when adding nested dictionary to all, but parent is grayed (does not exist for all), the parent must be created on demand
* shortcuts: entf/del
* selecting multiple entities that do not have the same attributes should not show attributes of a subset of these entities

Nice-to-have features
* copy/paste of multiple attributes between dictionaries, of dictionaries between entities
* Selection tool for vertices / other objects
* How to select individual edges of a polyline?

* API bug: changing GSU_ContributorsInfo with accessor method []= does not raise runtime error, set_attribute does.
* set_attribute also doesn't raise for misfitting input (only GSU_ContributorsInfo)
→ find all attribute-related exceptions
→ document in github API docs

* When selected entities become grouped, does it refresh the dialog?
  Yes, it is triggered with empty selection;
  Report API bug that grouped entity is selected, but onSelectionBulkChange([]) is triggered before, and no selection event afterwards.
* grayed attributes

* Indentation: 2!
* cleanup: search and remove TODO, ///, ###, puts, window.xxx=
=end

require 'sketchup.rb'


module AE


  module AttributeInspector


    # Constants
    self::PATH = File.expand_path('..', __FILE__) unless defined?(self::PATH)


    # Requirements
    %w(translate.rb
       settings.rb
       attribute_inspector.rb
       inspector_dialog.rb
       observers.rb
       version.rb
    ).each{ |file| require(File.join(PATH, file)) }

    # Constants
    self::TRANSLATE = Translate.new('attribute_inspector.strings') unless defined?(self::TRANSLATE)

    # extend Observable # TODO: not needed


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
    # TODO: deprecate in favor of inspect
    def self.select(*entities)
      @@instance.select(*entities) unless @@instance.nil?
    end


    def self.inspect(*entities)
      self.open # TODO: if not already open
      self.select(*entities)
    end


    ### Plugin


    module Mode
      DRAWING_ELEMENTS = :DRAWING_ELEMENTS # 0
      DEFINTIONS       = :DEFINITIONS # 1
      MATERIALS        = :MATERIALS # 2
      LAYERS           = :LAYERS # 3
      PAGES            = :PAGES # 4
      STYLES           = :STYLES # 5
    end
    private_constant(:Mode) if methods.include?(:private_constant)

    
    def self.initialize_plugin
      # Load settings
      @@settings ||= Settings.new('AE/AttributeInspector').load({
        :mode => :DRAWING_ELEMENTS, # TODO: check symbol/string conversion
        :recent_paths => []
      })
      # Reference to singleton instance
      @@instance ||= nil
      # References to registered observers
      @@app_observer ||= nil # TODO: remove if not needed, since using observing.rb
      # { <#Sketchup::Model> => <#ModelObserver>, <#Sketchup::Selection> => <#SelectionObserver>... }
      @@observers ||= {} # TODO: remove if not needed, since using observing.rb
    end
    private_class_method :initialize_plugin

    ### User interface

    def self.create_command()
      # Command
      command = UI::Command.new(TRANSLATE['Attribute Inspector']){
        begin
          AE::AttributeInspector.open
        rescue Exception => error
          if defined?(AE::Console)
            AE::Console.error(error)
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
