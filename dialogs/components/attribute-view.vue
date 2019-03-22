<template>
  <tr
    class="attribute-view"
    @click="onSelected"
  >
    <td
      class="key"
    >
      <input
        ref="keyElement"
        :value="attribute.key"
        :class="[{ invalid: !isKeyValid, grayed: isNonCommonKey }, 'editable']"
        :disabled="isNonCommonKey && !nonCommonEditable"
        type="text"
        class="editable"
        spellcheck="false"
        @change="onKeyChanged"
        @keyup.esc="blur"
      />
    </td>
    <td
      class="value"
    >
      <textarea
        v-if="attribute.type === 'JSON'"
        ref="valueElement"
        v-model="attribute.value"
        :class="[
          { invalid: !isValueValid, grayed: isNonCommonValue },
          'editable',
        ]"
        :disabled="isNonCommonValue && !nonCommonEditable"
        spellcheck="false"
        @click="openJsonViewer"
        @change="onValueChanged"
        @keyup="onValueChanging"
        @keyup.esc="blur"
      />
      <textarea
        v-else
        ref="valueElement"
        v-model="attribute.value"
        :class="[
          { invalid: !isValueValid, grayed: isNonCommonValue },
          'editable',
        ]"
        :disabled="isNonCommonValue && !nonCommonEditable"
        spellcheck="false"
        @change="onValueChanged"
        @keyup="onValueChanging"
        @input="adjustTextareaHeight"
      />
    </td>
    <td class="type">
      <TypeSelector
        ref="typeSelectorElement"
        :attribute="attribute"
        :class="{ invalid: !isTypeValid, grayed: isNonCommonValue }"
        @change.native="onTypeChanged"
      />
    </td>
  </tr>
</template>

<script>
import debounce from 'debounce'
import TypedValueParser from '../typedvalueparser.js'
import TypeSelector from './type-selector.vue'

export default {
  components: { TypeSelector },
  props: {
    attribute: {
      type: Object,
      default: function() {
        return {
          key: '',
          value: '',
          type: 'String',
          nonCommonKey: false,
          nonCommonValue: false,
        }
      },
    },
    nonCommonDictionary: {
      type: Boolean,
      default: false,
    },
    nonCommonEditable: {
      type: Boolean,
      default: false,
    },
  },
  data: function() {
    return {
      previousKey: this.attribute.key,
      previousValue: this.attribute.value,
      previousType: this.attribute.type,
      isKeyValid: true,
      isValueValid: true,
      isTypeValid: true,
    }
  },
  computed: {
    isNonCommonKey: function() {
      return this.nonCommonDictionary || this.attribute.nonCommonKey
    },
    isNonCommonValue: function() {
      return (
        this.nonCommonDictionary ||
        this.attribute.nonCommonKey ||
        this.attribute.nonCommonValue
      )
    },
  },
  mounted: function() {
    // Set initial height of value element to match its content.
    this.adjustTextareaHeight(this.$refs.valueElement)
  },
  methods: {
    onSelected: function(event) {
      this.$emit('selected', this.attribute.key)
    },
    onKeyChanged: function(event) {
      let newKey = event.target.value
      // Validation
      if (!this.$parent._findAttributeWithKey(newKey)) {
        // Emit event
        if (newKey != this.previousKey)
          this.$emit('attributeRenamed', this.previousKey, newKey)
        // Update state
        this.attribute.key = newKey // Not using v-model:key because it triggers immediate rerendering and unfocussing.
        this.previousKey = newKey
        this.attribute.nonCommonKey = false
        this.isKeyValid = true
      } else {
        // Reset the key
        event.target.value = this.attribute.key
      }
    },
    onValueChanging: debounce(function(event) {
      // Just validate in real-time
      let newValue = event.target.value
      // Validation
      if (TypedValueParser.validate(newValue, this.attribute.type)) {
        // Update state
        this.isValueValid = true
        this.isTypeValid = true
      } else {
        this.isValueValid = false
      }
    }, 500),
    onValueChanged: function(event) {
      let newValue = event.target.value
      // Validation
      if (TypedValueParser.validate(newValue, this.attribute.type)) {
        // Emit event
        if (newValue != this.previousValue) {
          this.$emit(
            'attributeChanged',
            this.attribute.key,
            newValue,
            this.attribute.type,
            this.previousValue,
            this.previousType
          )
        }
        // Update state
        this.previousValue = newValue
        this.isValueValid = true
        this.isTypeValid = true
        // TODO: don't bind the key/value elements hard to the data, update the data only in the-attribute-pane.
        this.attribute.nonCommonKey = false
        this.attribute.nonCommonValue = false
      } else {
        this.isValueValid = false
      }
    },
    onTypeChanged: function(event) {
      let newType = event.target.value
      // No validation if the value is not set
      if (this.attribute.value == '') {
        this.attribute.value = getDefaultValueForType(newType)
      } else {
        // Validation
        if (TypedValueParser.validate(this.attribute.value, newType)) {
          // Emit event
          if (newType != this.previousType) {
            this.$emit(
              'attributeChanged',
              this.attribute.key,
              this.attribute.value,
              newType,
              this.previousValue,
              this.previousType
            )
          }
          // Update state
          this.isValueValid = true
          this.isTypeValid = true
          this.previousType = newType
        } else {
          this.isTypeValid = false
        }
      }
    },
    adjustTextareaHeight: function(eventOrElement) {
      let textarea = eventOrElement.target
        ? eventOrElement.target
        : eventOrElement
      textarea.style.height = null
      let scrollHeight = textarea.scrollHeight
      let computedStyle = window.getComputedStyle(textarea, null)
      let minHeight =
        parseFloat(computedStyle.getPropertyValue('min-height'), 10) || 0
      let maxHeight =
        parseFloat(computedStyle.getPropertyValue('max-height'), 10) ||
        Number.MAX_VALUE
      let newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight))
      textarea.style.height = newHeight + 'px'
    },
    openJsonViewer: function() {
      let self = this
      this.$jsonviewerpopup(this.attribute.value).then(
        function(newValue) {
          // Emit event
          if (newValue != self.previousValue) {
            self.attribute.value = newValue
            self.$emit(
              'attributeChanged',
              self.attribute.key,
              newValue,
              self.attribute.type,
              self.previousValue,
              self.previousType
            )
          }
          // Update state
          self.previousValue = newValue
          self.isValueValid = true
          self.isTypeValid = true
        },
        function(error) {
          self.$notify('alert', error.message, 'error', 10000)
        }
      )
    },
    blur: function(event) {
      event.target.blur()
    },
  },
}

function getDefaultValueForType(type) {
  switch (type) {
    case 'String':
      return ''
    case 'JSON':
      return '{}'
    case 'NilClass':
      return 'nil'
    case 'Time':
      return TypedValueParser.dateToISO8601(new Date())
    case 'Color':
      return 'Color(255,255,255)'
    case 'Point3d':
      return 'Point3d(0,0,0)'
    case 'Vector3d':
      return 'Vector3d(1,0,0)'
    case 'Array':
      return '[]'
  }
  return ''
}
</script>

<style lang="scss">
/* Add an invisible border to allow highlighting */
/* Align cell content on top */
.attribute-view {
  border: 3px transparent none;
  vertical-align: top;
}
.attribute-view > td {
  border: 1px #eeeeee /*ThreeDShadow*/ solid !important;
  line-height: 0.5em; /* hack to make element expand not further than height of contained .editable */
}
.attribute-view > td .editable {
  background: transparent;
  color: initial;
  border: none;
  text-overflow: ellipsis;
}
.attribute-view > td.value textarea {
  resize: none;
  max-height: 10em;
}
.attribute-view.selected {
  /*outline: 3px Highlight solid;*/
  background: Highlight;
  color: HighlightText;
}
.attribute-view .invalid {
  color: red !important;
}
.attribute-view .grayed {
  color: #aaaaaa !important;
}
.attribute-view .grayed.editable:focus {
  color: initial !important;
}
</style>
