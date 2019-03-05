module AE


module AttributeInspector


require(File.join(PATH, 'typed_value_parser.rb'))


# Attributes can have values of different types (and nested). This module helps
#validating, parsing and encoding values unambiguously for transmission between
# SketchUp and the WebDialog.
module TypedValueParser


unless defined?(self::COMMA)
  self::Integer = (defined?(::Integer)) ? ::Integer : ::Fixnum
  comma     = /,\s*/
  #float     = /[+-]?\d+\.(?:\d+(?:e[+-]\d+)?)?/
  float     = /[-+]?\d+(?:\.\d+(?:e[+-]\d+)?)?/
  #integer    = /[-]?\d+(?=[^\.])/
  integer    = /[-]?\d+/
  posinteger = /\d+/
  length    = /#{float}(?:mm|cm|m|\"|\')/ # TODO: support length in Vector3d and Point3d
  COMMA     = /^,?\s*/
  NIL       = /^nil/
  BOOLEAN   = /^true|false/
  TIME      = /^(\d{4})-(\d{2})-(\d{2})T([012]\d):([012345]\d):([012345]\d(?:.\d{3}\d{3}?)?)Z/
  #LENGTH    = /^[-]?\d+\.(?:\d+(?:e[+-]\d+)?)?(?:mm|cm|m|\"|\')/
  LENGTH    = /^#{float}(?:mm|cm|m|\"|\')/
  #FLOAT     = /^[-]?\d+\.(?:\d+(?:e[+-]\d+)?)?/
  FLOAT     = /^#{float}/
  #INTEGER    = /^[-]?\d+(?=[^\.])/
  INTEGER    = /^#{integer}/
  STRING    = /^"((?:[^"]|\\")*)"/
  COLOR     = /^Color\((#{posinteger})#{comma}(#{posinteger})#{comma}(#{posinteger})(?:#{comma}(#{posinteger}))?\)/
  POINT3D   = /^Point3d\((#{float})#{comma}(#{float})#{comma}(#{float})\)/
  #VECTOR3D  = /^Vector3d\((#{float})#{comma}(#{float})#{comma}(#{float})\)/
  VECTOR3D  = /^Vector3d\((?:(#{float})#{comma}){2}(#{float})\)/
  FLOAT_3TUPLE  = /^\s*?[\(\[]?(#{float})#{comma}(#{float})#{comma}(#{float})[\)\]]?\s*?$/
  COLOR_34TUPLE = /^\s*?[\(\[]?(#{posinteger})#{comma}(#{posinteger})#{comma}(#{posinteger})(?:#{comma}(#{posinteger}))?[\)\]]?\s*?$/
  #TIME     = /^Time\((#{float})\)/
  SQUARE_BRACKET_START = /^\[/
  SQUARE_BRACKET_END   = /^\]?/
end


def self.determine_type_string(value)
  if value.is_a?(String) && value[/^[\{\[]/]
    begin
      JSON.parse(value)
      return 'String'
    rescue JSON::ParserError
      return value.class.to_s
    end
  elsif value.is_a?(TrueClass) || value.is_a?(FalseClass)
    return 'Boolean'
  elsif value.is_a?(self::Integer)
    return 'Integer'
  else
    return value.class.to_s
  end
end


# Parses a string of this plugin's internal representation of typed values into Ruby objects.
# @param [String] string
# @param [Class,String] type
# @return [String,Boolean,NilClass,Float,Integer,Length,Sketchup::Color,Geom::Point3d,Geom::Vector3d,Time,Array]
# @raises [SyntaxError]
def self.parse(string, type=nil)
  klass = get_class(type) if type.is_a?(String) rescue nil # otherwise type will be determined by parser_implementation
  result = case
  # Some type-specific switches:
  # Strings without escaping or quotes; 
  #    when nested in an array, escaping and quotes are required.
  # Integers, Floats:
  #   when nested in an array, floats must always have a decimal point to 
  #   distinguish them from integers.
  # Colors, points, vectors:
  #   can be written as comma-separated numbers; 
  #   when nested in an array, they must always be wrapped in 
  #     Color(128,128,128,255), Point3d(1,0,0), Vector3d(1,0,0) etc.
  when klass == String then string
  when klass == JSON
    begin
      JSON.parse(string)
    rescue JSON::ParserError => error
      raise(SyntaxError, error)
    end
  when klass == self::Integer
    # Match against a regular expression, if not match then raise syntax error.
    string[INTEGER] || raiseSyntaxError(string, type)
    $&.to_i
  when klass == Float
    string[FLOAT] || raiseSyntaxError(string, type)
    $&.sub(',', '.').to_f
  when klass == Sketchup::Color
    string[COLOR] || string[COLOR_34TUPLE] || raise(SyntaxError)
    if $4.nil?
      Sketchup::Color.new($1.to_i, $2.to_i, $3.to_i)
    else
      Sketchup::Color.new($1.to_i, $2.to_i, $3.to_i, $4.to_i)
    end
  when klass == Geom::Point3d
    string[POINT3D] || string[FLOAT_3TUPLE] || raiseSyntaxError(string, type)
    Geom::Point3d.new($1.to_f, $2.to_f, $3.to_f)
  when klass == Geom::Vector3d
    string[VECTOR3D] || string[FLOAT_3TUPLE] || raiseSyntaxError(string, type)
    Geom::Vector3d.new($1.to_f, $2.to_f, $3.to_f)
  when klass == Length then string.to_l
  else # Boolean, Time, nested types like Array, Hash etc.
    parse_implementation(string, type)
  end
  # After parsing, the remaining string should be empty.
  raise(SyntaxError, "String `#{string}` does not match type #{type}") unless ($'.nil? || $'.empty?)
  return result
end


# Converts typed attribute values into a string of this plugin's internal representation of typed values.
# @param [String,Boolean,NilClass,Float,Integer,Length,Sketchup::Color,Geom::Point3d,Geom::Vector3d,Time,Array] object
# @return [String]
def self.stringify(object)
  return (object.is_a?(String)) ? object : stringify_implementation(object)
end


class << self


  private


  def get_class(class_name_string)
    class_name_string.split('::').reduce(Kernel){ |m, s| m.const_get(s) }
  end


  def raiseSyntaxError(string, type)
    raise SyntaxError.new("String `#{string}` does not match type #{type}")
  end


  # Parses a string of this plugin's internal representation of typed values into Ruby objects.
  # @param [String] string
  # @return [String,Boolean,NilClass,Float,Integer,Length,Sketchup::Color,Geom::Point3d,Geom::Vector3d,Time,Array]
  # @private
  # @raises [SyntaxError]
  def parse_implementation(string, type=nil)
    case string
    when BOOLEAN
      raiseSyntaxError(string, type) if type && type != 'Boolean' && type != 'TrueClass' && type != 'FalseClass'
      return $& == 'true'
    when NIL
      raiseSyntaxError(string, type) if type && type != 'NilClass'
      return nil
    when TIME
      raiseSyntaxError(string, type) if type && type != 'Time'
      usec = ($7.nil?) ? 0 : ($7.length == 3) ? 1000*$7.to_i : ($7.length == 6) ? $7.to_i : 0
      return Time.utc($1.to_i, $2.to_i, $3.to_i,  $4.to_i, $5.to_i, $6.to_i, usec)
      #return Time.at($1.to_f)
    when LENGTH
      raiseSyntaxError(string, type) if type && type != 'Length'
      return $&.to_l
    when FLOAT
      raiseSyntaxError(string, type) if type && type != 'Float'
      return $&.to_f
    when INTEGER
      raiseSyntaxError(string, type) if type && type != 'Integer'
      return $&.to_i
    when STRING
      raiseSyntaxError(string, type) if type && type != 'String'
      return $1.gsub(/\\"/, '"').gsub(/\\\\/, '\\')
    when COLOR
      raiseSyntaxError(string, type) if type && type != 'Sketchup::Color'
      return ($4.nil?) ?
        Sketchup::Color.new($1.to_i, $2.to_i, $3.to_i) : 
        Sketchup::Color.new($1.to_i, $2.to_i, $3.to_i, $4.to_i)
    when POINT3D
      raiseSyntaxError(string, type) if type && type != 'Geom::Point3d'
      return Geom::Point3d.new($1.to_f, $2.to_f, $3.to_f)
    when VECTOR3D
      raiseSyntaxError(string, type) if type && type != 'Geom::Vector3d'
      return Geom::Vector3d.new($1.to_f, $2.to_f, $3.to_f)
    when SQUARE_BRACKET_START
      raiseSyntaxError(string, type) if type && type != 'Array'
      array = []
      until $'[SQUARE_BRACKET_END]
        $'[COMMA]
        array << parse_implementation($')
      end
      return array
    else # nil
      raise(SyntaxError, "TypedValueParser: invalid string `#{string}`")
    end
  end


  # Converts typed attribute values into a string of this plugin's internal representation of typed values.
  # @param [String,Boolean,NilClass,Float,Integer,Length,Sketchup::Color,Geom::Point3d,Geom::Vector3d,Time,Array] object
  # @return [String]
  # @private
  def stringify_implementation(object)
    return case object
      when Time
        (RUBY_VERSION.to_f > 2) ? object.strftime("%Y-%m-%dT%H:%M:%S.%LZ") : object.strftime("%Y-%m-%dT%H:%M:%SZ")
        #"Time(#{value.to_f})"
      when String
        "\"#{object.gsub(/\\/, "\\\\").gsub(/\\"/, '\\"')}\""
      when Sketchup::Color
        "Color(#{object.to_a.map{ |c| c.to_i }.join(", ")})"
      when Geom::Point3d
        "Point3d(#{object.to_a.map{ |c| c.to_f }.join(", ")})"
      when Geom::Vector3d
        "Vector3d(#{object.to_a.map{ |c| c.to_f }.join(", ")})"
      when Array
        "[#{object.map{ |a| stringify_implementation(a) }.join(", ")}]"
      # Boolean, Nil, Length, Float, Integer
      else object.to_s
      end
  end


end # class << self


end # module TypedValueParser


end # module AttributeInspector


end # module AE
