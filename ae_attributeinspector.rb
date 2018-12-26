# Load the normal support files.
require 'sketchup.rb'
require 'extensions.rb'
require File.join('ae_attributeinspector', 'version.rb')

# Create the extension.
ext = SketchupExtension.new('AttributeInspector', File.join('ae_attributeinspector', 'core.rb'))

# Attach some nice info.
ext.creator     = 'Aerilius'
ext.version     = AE::AttributeInspector::VERSION
ext.copyright   = '2014-2018, Andreas Eisenbarth'
ext.description = 'A viewer for entity and model attributes'

# Register and load the extension on startup.
Sketchup.register_extension(ext, true)
