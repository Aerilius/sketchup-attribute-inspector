const COMMA = /^\s*,\s*/
const NIL = /^nil|^null/i
const BOOLEAN = /^true|^false/i
const TIME = /^(\d{4})-(\d{2})-(\d{2})T([012]\d):([012345]\d):([012345]\d(?:.(\d{3}\d{3}?))?)Z/
const LENGTH = /^[-]?\d+(?:\.\d+)?\s*?(mm|cm|m|"|')/
const FLOAT = /^[-+]?\d+[.,](?:\d+(?:e[+-]\d+)?)?/
const INTEGER = /^[-]?\d+/
// const STRING = /^\"((?:[^\"]|\\\")*)\"/
const STRING = /^"((?:[^"]|\\")*)"|'((?:[^']|\\')*)'/
// const COLOR = /^Color\((\d+),\s?(\d+),\s?(\d+)(?:,\s?(\d+))\)/
const COLOR = /^(?:Color|rgb|rgba)\((\d+),\s*?(\d+),\s*?(\d+)(?:,\s*?(\d+))?\)|^#((?:[0-9a-f]{2}){3,4})/
const FLOAT_3TUPLE = /^\s*?[([]?[-+]?\d+(?:\.\d+(?:e[+-]\d+))?,\s*?[-+]?\d+(?:\.\d+(?:e[+-]\d+))?,\s*?[-+]?\d+(?:\.\d+(?:e[+-]\d+))?[)\]]?\s*?$/
const COLOR_34TUPLE = /^\s*?[([]?(\d+),\s*?(\d+),\s*?(\d+)(?:,\s*?(\d+))?[)\]]?\s*?$/
const POINT3D = /^(?:Geom::)?Point3d\(([-]?\d+(?:\.\d+)?),\s?([-]?\d+(?:\.\d+)?),\s?([-]?\d+(?:\.\d+)?)\)/
const VECTOR3D = /^(?:Geom::)?Vector3d\(([-]?\d+(?:\.\d+)?),\s?([-]?\d+(?:\.\d+)?),\s?([-]?\d+(?:\.\d+)?)\)/
const SQUARE_BRACKET_START = /^\[/
const SQUARE_BRACKET_END = /^]/
const NONCOMMA = /^[^,]+/

/**
 * @module TypedValueParser
 * Attributes can have values of different types (and nested). This module helps
 * validating, parsing and encoding values unambiguously for transmission between
 * SketchUp and the WebDialog.
 */
const TypedValueParser = {
  TYPES: [
    'String',
    'JSON',
    'Integer',
    'Float',
    'Length',
    'Array',
    'Boolean',
    'NilClass',
    'Geom::Point3d',
    'Geom::Vector3d',
    'Sketchup::Color',
    'Time',
  ],

  getDisplayName(type) {
    if (/^(Geom|Sketchup)::/.test(type)) {
      return type.split('::')[1]
    } else {
      return type
    }
  },

  /**
   * Validate a value against the given type. Since a type is specified, it
   * tolerates more loose syntax in the input string (ie. Vectors in array syntax).
   * @param {string} string
   * @param {string} type
   * @returns {boolean}
   */
  validate(string, type) {
    string = strip(string)
    switch (type) {
      case 'Boolean':
        return BOOLEAN.test(string) && RegExp['$\''] == ''
      case 'NilClass':
        return NIL.test(string) && RegExp['$\''] == ''
      case 'Time':
        return (
          !isNaN(new Date(string).getTime()) ||
          (TIME.test(string) && RegExp['$\''] == '')
        )
      case 'Length':
        return LENGTH.test(string) && RegExp['$\''] == ''
      case 'Float':
        return FLOAT.test(string) && RegExp['$\''] == ''
      case 'Integer':
        return INTEGER.test(string) && RegExp['$\''] == ''
      case 'String':
        return true // STRING.test(string) && RegExp["$'"] == '';
      case 'JSON':
        try {
          JSON.parse(string)
          return true
        } catch (e) {
          // SyntaxError
          if (e instanceof SyntaxError) {
            return false
          } else {
            throw e
          }
        }
      case 'Sketchup::Color':
        return (
          (COLOR.test(string) || COLOR_34TUPLE.test(string)) &&
          RegExp['$\''] == ''
        )
      case 'Geom::Point3d':
        return (
          (POINT3D.test(string) || FLOAT_3TUPLE.test(string)) &&
          RegExp['$\''] == ''
        )
      case 'Geom::Vector3d':
        return (
          (VECTOR3D.test(string) || FLOAT_3TUPLE.test(string)) &&
          RegExp['$\''] == ''
        )
      case 'Array':
        if (SQUARE_BRACKET_START.test(string)) {
          //while (RegExp["$'"] != '' && !SQUARE_BRACKET_END.test(RegExp["$'"])) {
          while (
            !SQUARE_BRACKET_END.test(RegExp['$\'']) &&
            !(RegExp['$\''] == '')
          ) {
            COMMA.test(RegExp['$\''])
            if (!validateStrict(RegExp['$\''])) {
              return false
            }
          }
          return RegExp['$\''] == ''
        } else {
          return false
        }
      default:
        return false
    }
  },

  /**
   * Parses and transforms a string into a more a consistent format.
   * @param {string} string
   * @param {string} type
   * @returns {string}
   */
  canonicalizeString(string, type) {
    if (type == 'String') {
      return '"' + string.replace(/\\/, '\\\\').replace(/"/, '\\"') + '"'
    }
    string = strip(string)
    switch (type) {
      case 'Sketchup::Color':
        if (COLOR.test(string) || COLOR_34TUPLE.test(string)) {
          if (RegExp.$5 != '') {
            // A match for a hexadecimal code has been found, convert it into rgba.
            let result = []
            for (let i = 0; i < RegExp.$5.length; i += 2) {
              result.push(parseInt(RegExp.$5.slice(i, i + 2), 16))
            }
            return 'Color(' + result.join(',') + ')'
          } else if (RegExp.$3 != '') {
            let result = []
            for (let i = 1; i <= 3; i++) {
              result.push(parseInt(RegExp['$' + i]))
            }
            if (RegExp.$4 != '') {
              result.push(parseInt(RegExp.$4, 16))
            }
            return 'Color(' + result.join(',') + ')'
          } else {
            throw new Error(
              'Function canonicalizeString attempted to exit with null when parsing: ' +
                string
            )
          }
        }
        break
      case 'Geom::Point3d':
        if (POINT3D.test(string) || FLOAT_3TUPLE.test(string)) {
          return (
            'Point3d(' +
            parseFloat(RegExp.$1) +
            ',' +
            parseFloat(RegExp.$2) +
            ',' +
            parseFloat(RegExp.$3) +
            ')'
          )
        }
        break
      case 'Geom::Vector3d':
        if (VECTOR3D.test(string) || FLOAT_3TUPLE.test(string)) {
          return (
            'Vector3d(' +
            parseFloat(RegExp.$1) +
            ',' +
            parseFloat(RegExp.$2) +
            ',' +
            parseFloat(RegExp.$3) +
            ')'
          )
        }
        break
      default:
        return canonicalizeStringStrict(string)
    }
  },

  /**
   * Helper method to convert a JavaScript Date object into a ISO8601 date string.
   * @param {Date} date
   * @returns {string}
   */
  dateToISO8601(date) {
    // TODO: use date.toJSON();
    return (
      ljust(date.getUTCFullYear(), 4) +
      '-' +
      ljust(date.getUTCMonth() + 1, 2) +
      '-' +
      ljust(date.getUTCDate(), 2) +
      'T' +
      ljust(date.getUTCHours(), 2) +
      ':' +
      ljust(date.getUTCMinutes(), 2) +
      ':' +
      ljust(date.getUTCSeconds(), 2) +
      'Z'
    )
  },
}

/**
 * Validate a value.
 * @param {string} string
 * @private
 * @returns {boolean}
 */
function validateStrict(string) {
  if (
    BOOLEAN.test(string) ||
    NIL.test(string) ||
    LENGTH.test(string) ||
    FLOAT.test(string) ||
    INTEGER.test(string) ||
    STRING.test(string) ||
    COLOR.test(string) ||
    POINT3D.test(string) ||
    VECTOR3D.test(string)
  ) {
    return true
  } else if (!isNaN(new Date(string).getTime()) || TIME.test(string)) {
    return true
  } else if (SQUARE_BRACKET_START.test(string)) {
    //while (RegExp["$'"] != '' && !SQUARE_BRACKET_END.test(RegExp["$'"])) {
    while (!SQUARE_BRACKET_END.test(RegExp['$\'']) && !RegExp['$\''] == '') {
      COMMA.test(RegExp['$\''])
      if (!validateStrict(RegExp['$\''])) {
        return false
      }
    }
    return true
  } else {
    return false
  }
}

/**
 * Transform a string into a consistent form.
 * @param {string} string
 * @private
 * @returns {string}
 */
function canonicalizeStringStrict(string) {
  if (BOOLEAN.test(string)) {
    return /true/i.test(RegExp['$&']) ? 'true' : 'false'
  } else if (NIL.test(string)) {
    return 'nil'
  } else if (LENGTH.test(string)) {
    return RegExp.$1 + RegExp.$2
  } else if (TIME.test(string)) {
    return RegExp['$&']
  } else if (FLOAT.test(string)) {
    let float = parseFloat(RegExp['$&'].replace(/,/, '.'))
    return String(float).replace(/^[^.]+$/, '$&.')
  } else if (INTEGER.test(string)) {
    return RegExp['$&']
  } else if (STRING.test(string)) {
    return RegExp['$&']
  } else if (COLOR.test(string)) {
    if (RegExp.$5 != '') {
      // Convert hex code into rgb 255 color
      let result = []
      for (let i = 0; i < RegExp.$5.length; i += 2) {
        result.push(parseInt(RegExp.$5.slice(i, i + 2), 16))
      }
      return 'Color(' + result.join(',') + ')'
    } else if (RegExp.$3 != '') {
      let result = []
      for (let i = 1; i <= 3; i++) {
        result.push(parseInt(RegExp['$' + i], 16))
      }
      if (RegExp.$4 != '') {
        result.push(parseInt(RegExp.$4, 16))
      }
      return 'Color(' + result.join(',') + ')'
    }
    throw new Error(
      'Function canonicalizeString attempted to exit with null when parsing: ' +
        string
    )
  } else if (POINT3D.test(string)) {
    return (
      'Point3d(' +
      parseFloat(RegExp.$1) +
      ',' +
      parseFloat(RegExp.$2) +
      ',' +
      parseFloat(RegExp.$3) +
      ')'
    )
  } else if (VECTOR3D.test(string)) {
    return (
      'Vector3d(' +
      parseFloat(RegExp.$1) +
      ',' +
      parseFloat(RegExp.$2) +
      ',' +
      parseFloat(RegExp.$3) +
      ')'
    )
  } else if (NONCOMMA.test(string)) {
    let d = new Date(RegExp['$&'])
    if (!isNaN(d.getTime())) {
      return self.dateToISO8601(d)
    } else if (SQUARE_BRACKET_START.test(string)) {
      let array = []
      //while (RegExp["$'"] != '' && !SQUARE_BRACKET_END.test(RegExp["$'"])) {
      while (!SQUARE_BRACKET_END.test(RegExp['$\'']) && !RegExp['$\''] == '') {
        COMMA.test(RegExp['$\''])
        let arrayElement = canonicalizeStringStrict(RegExp['$\''])
        if (typeof arrayElement == 'string') {
          array.push(arrayElement)
        }
      }
      return '[' + array.join(',') + ']'
    }
    throw new Error(
      'Function canonicalizeString attempted to exit with null when parsing: ' +
        string
    )
  }
}

export default TypedValueParser

/**
 * Helper method to prepend a number with zeros.
 * @param {Object} o - object or number
 * @oaram {Number} n - The desired total length of the resulting string.
 * @returns {string}
 */
function ljust(o, n) {
  let result = String(o)
  for (let i = result.length; i < n; i++) {
    result = '0' + result
  }
  return result
}

/**
 * Helper method to remove whitespace from beginning and end.
 * @param {string} string
 * @returns {string}
 */
function strip(string) {
  return string.replace(/^\s+/, '').replace(/\s+$/, '')
}
