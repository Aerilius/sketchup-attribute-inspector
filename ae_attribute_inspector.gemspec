# coding: utf-8
lib = File.expand_path('../src', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'ae_attribute_inspector/version'

Gem::Specification.new do |spec|
  spec.name          = 'ae_attribute_inspector'
  spec.version       = AE::AttributeInspector::VERSION
  spec.authors       = ['Andreas Eisenbarth']
  spec.email         = ['aerilius@gmail.com']

  spec.summary       = %q{A viewer and editor for SketchUp entity and model attributes.}
  spec.description   = %q{This is a viewer for entity and model attributes. Attributes in SketchUp are additional pieces of information that can be stored with entities like groups, components, scenes. For example one can store a part number, unit price, weight or other annotations with an entity and read or modify that information later. All attributes are included in SketchUp's report feature.}
  spec.homepage      = 'https://github.com/Aerilius/sketchup-attribute-inspector/.'
  spec.license       = 'MIT'

  # Prevent pushing this gem to RubyGems.org. To allow pushes either set the 'allowed_push_host'
  # to allow pushing to a single host or delete this section to allow pushing to any host.
  if spec.respond_to?(:metadata)
    spec.metadata['allowed_push_host'] = "TODO: Set to 'http://mygemserver.com'"
  else
    raise 'RubyGems 2.0 or newer is required to protect against public gem pushes.'
  end

  spec.files         = `git ls-files -z`.split("\x0").reject{ |f|
    f.match(%r{^(test|spec|features)/}) || !File.exist?(f)
  }
  spec.bindir        = 'exe'
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ['src']

  spec.add_development_dependency 'bundler', '~> 1.13'
  spec.add_development_dependency 'rake', '~> 10.0'
  spec.add_development_dependency 'minitest', '~> 5.0'
  spec.add_development_dependency 'sketchup-api-stubs', '~> 0'
  spec.add_development_dependency 'rubyzip', '>= 1.0.0'
end
