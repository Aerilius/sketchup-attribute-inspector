define(['vue', 'debounce', 'vs-notify', './the-json-viewer', './typedvalueparser', './style'], function (Vue, debounce, _, _, TypedValueParser, Style) {

  Vue.component('type-selector', {
    props: {
      attribute: {
        type: Object,
        default: function () { return { type: 'String' }; }
      }
    },
    data: function () {
      return {
        getDisplayName: TypedValueParser.getDisplayName,
        attributetypes: TypedValueParser.TYPES
      };
    },
    template:
'<select v-model:value="attribute.type">\n\
  <option v-for="attributetype in attributetypes" \n\
          :key="attributetype" \n\
          :value="attributetype">{{getDisplayName(attributetype)}}</option>\n\
</select>'
  });

  Style.addCSS(
'/* Add an invisible border to allow highlighting */\n\
/* Align cell content on top */\n\
.attribute-view {\n\
    border: 3px transparent none;\n\
    vertical-align: top;\n\
}\n\
.attribute-view > td {\n\
    border: 1px #eeeeee /*ThreeDShadow*/ solid!important;\n\
    line-height: 0.5em; /* hack to make element expand not further than height of contained .editable */\n\
}\n\
.attribute-view > td .editable {\n\
    background: transparent;\n\
    color: initial;\n\
    border: none;\n\
    text-overflow: ellipsis;\n\
}\n\
.attribute-view > td.value textarea {\n\
  resize: none;\n\
  max-height: 10em;\n\
}\n\
.attribute-view.selected {\n\
    /*outline: 3px Highlight solid;*/\n\
    background: Highlight;\n\
    color: HighlightText;\n\
}\n\
.attribute-view .invalid {\n\
    color: red !important;\n\
}\n\
.attribute-view .grayed {\n\
    color: #aaaaaa !important;\n\
}\n\
.attribute-view .grayed.editable:focus {\n\
    color: initial !important;\n\
}');

  Vue.component('attribute-view', {
    props: {
      attribute: {
        type: Object,
        default: function () {
          return {
            key: '',
            value: '',
            type: 'String',
            nonCommonKey: false,
            nonCommonValue: false
          };
        }
      },
      nonCommonDictionary: {
        type: Boolean,
        default: false
      },
      nonCommonEditable: {
        type: Boolean,
        default: false
      }
    },
    data: function () {
      return {
        previousKey: this.attribute.key,
        previousValue: this.attribute.value,
        previousType: this.attribute.type,
        isKeyValid: true,
        isValueValid: true,
        isTypeValid: true
      };
    },
    computed: {
      isNonCommonKey: function () {
        return this.nonCommonDictionary || this.attribute.nonCommonKey;
      },
      isNonCommonValue: function () {
        return this.nonCommonDictionary || this.attribute.nonCommonKey || this.attribute.nonCommonValue;
      }
    },
    mounted: function () {
      // Set initial height of value element to match its content.
      this.adjustTextareaHeight(this.$refs.valueElement);
    },
    methods: {
      onSelected: function (event) {
        this.$emit('selected', this.attribute.key);
      },
      onKeyChanged: function (event) {
        var newKey = event.target.value;
        // Validation
        if (!this.$parent._findAttributeWithKey(newKey)) {
          // Emit event
          if (newKey != this.previousKey) this.$emit('attributeRenamed', this.previousKey, newKey);
          // Update state
          this.attribute.key = newKey; // Not using v-model:key because it triggers immediate rerendering and unfocussing.
          this.previousKey = newKey;
          this.attribute.nonCommonKey = false;
          this.isKeyValid = true;
        } else {
          // Reset the key
          event.target.value = this.attribute.key;
        }
      },
      onValueChanging: debounce(function (event) {
        // Just validate in real-time
        var newValue = event.target.value;
        // Validation
        if (TypedValueParser.validate(newValue, this.attribute.type)) {
          // Update state
          this.isValueValid = true;
          this.isTypeValid = true;
        } else {
          this.isValueValid = false;
        }
      }, 500),
      onValueChanged: function (event) {
        var newValue = event.target.value;
        // Validation
        if (TypedValueParser.validate(newValue, this.attribute.type)) {
          // Emit event
          if (newValue != this.previousValue) {
            this.$emit('attributeChanged', this.attribute.key, newValue, this.attribute.type, this.previousValue, this.previousType);
          }
          // Update state
          this.previousValue = newValue;
          this.isValueValid = true;
          this.isTypeValid = true;
          // TODO: don't bind the key/value elements hard to the data, update the data only in the-attribute-pane.
          this.attribute.nonCommonKey = false;
          this.attribute.nonCommonValue = false;
        } else {
          this.isValueValid = false;
        }
      },
      onTypeChanged: function (event) {
        var newType = event.target.value;
        // No validation if the value is not set
        if (this.attribute.value == '') {
          this.attribute.value = getDefaultValueForType(newType);
        } else {
          // Validation
          if (TypedValueParser.validate(this.attribute.value, newType)) {
            // Emit event
            if (newType != this.previousType) {
              this.$emit('attributeChanged', this.attribute.key, this.attribute.value, newType, this.previousValue, this.previousType);
            }
            // Update state
            this.isValueValid = true;
            this.isTypeValid = true;
            this.previousType = newType;
          } else {
            this.isTypeValid = false;
          }
        }
      },
      adjustTextareaHeight: function (eventOrElement) {
        var textarea = (eventOrElement.target) ? eventOrElement.target : eventOrElement;
        textarea.style.height = null;
        var scrollHeight = textarea.scrollHeight;
        var computedStyle = window.getComputedStyle(textarea, null);
        var minHeight = parseFloat(computedStyle.getPropertyValue('min-height'), 10) || 0;
        var maxHeight = parseFloat(computedStyle.getPropertyValue('max-height'), 10) || Number.MAX_VALUE;
        var newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
        textarea.style.height = newHeight + 'px';
      },
      openJsonViewer: function () {
        var self = this;
        this.$jsonviewerpopup(this.attribute.value).then(function (newValue) {
          // Emit event
          if (newValue != self.previousValue) {
            self.attribute.value = newValue;
            self.$emit('attributeChanged', self.attribute.key, newValue, self.attribute.type, self.previousValue, self.previousType);
          }
          // Update state
          self.previousValue = newValue;
          self.isValueValid = true;
          self.isTypeValid = true;
        }, function (error) {
          self.$notify('alert', error.message, 'error', 10000);
        });
      },
      blur: function (event) {
        event.target.blur();
      }
    },
    template:
'<tr @click="onSelected" \n\
     class="attribute-view" >\n\
  <td class="key">\n\
    <input ref="keyElement" \n\
           :value="attribute.key" \n\
           :class="[{ invalid: !isKeyValid, grayed: isNonCommonKey }, \'editable\']" \n\
           :disabled="isNonCommonKey && !nonCommonEditable" \n\
           @change="onKeyChanged" \n\
           @keyup.esc="blur" \n\
           type="text" \n\
           class="editable" \n\
           spellcheck="false" />\n\
  </td>\n\
  <td class="value">\n\
    <textarea v-if="attribute.type === \'JSON\'" \n\
              ref="valueElement" \n\
              v-model:value="attribute.value" \n\
              :class="[{ invalid: !isValueValid, grayed: isNonCommonValue }, \'editable\']" \n\
              :disabled="isNonCommonValue && !nonCommonEditable" \n\
              @click="openJsonViewer" \n\
              @change="onValueChanged" \n\
              @keyup="onValueChanging" \n\
              @keyup.esc="blur" \n\
              spellcheck="false" />\n\
    <textarea v-else \n\
              ref="valueElement" \n\
              v-model:value="attribute.value" \n\
              :class="[{ invalid: !isValueValid, grayed: isNonCommonValue }, \'editable\']" \n\
              :disabled="isNonCommonValue && !nonCommonEditable" \n\
              @change="onValueChanged" \n\
              @keyup="onValueChanging" \n\
              @input="adjustTextareaHeight" \n\
              spellcheck="false" />\n\
  </td>\n\
  <td class="type">\n\
    <type-selector ref="typeSelectorElement" \n\
                   :attribute="attribute" \n\
                   :class="{ invalid: !isTypeValid, grayed: isNonCommonValue }" \n\
                   @change.native="onTypeChanged" />\n\
  </td>\n\
</tr>'
  });

  Style.addCSS(
'table.table-view {\n\
    background: white;\n\
    border-collapse: collapse;\n\
    overflow: hidden;\n\
}\n\
.table-view > tr > th:first-child,\n\
.table-view th:first-child + th {\n\
    position: relative;\n\
    width: 50%;\n\
}\n\
.table-view > tr .divider-vertical {\n\
    height: 100em;\n\
}');

  Vue.component('table-view', {
    props: {
      attributes: {
        type: Array,
        default: function () { return []; }
      },
      selectedAttributes: {
        type: Array,
        default: function () { return []; }
      },
      nonCommonDictionary: {
        type: Boolean,
        default: false
      },
      nonCommonEditable: {
        type: Boolean,
        default: false
      }
    },
    data: function () {
      return {
      }
    },
    methods: {
      toggleSelected: function (selectedKey) {
        var index = this.selectedAttributes.indexOf(selectedKey);
        if (index == -1) {
          // TODO: For now, support only selection of single attributes.
          this.selectedAttributes.length = 0;
          this.selectedAttributes.push(selectedKey);
        } else {
          this.selectedAttributes.splice(index, 1);
        }
        this.$emit('selected', this.selectedAttributes);
      },
      setSelected: function (selectedKey) {
        this.selectedAttributes.length = 0;
        this.selectedAttributes.push(selectedKey);
        this.$emit('selected', this.selectedAttributes);
      },
      attributeChanged: function (newKey, newValue, newType, oldValue, oldType) {
        this.$emit('attributeChanged', newKey, newValue, newType, oldValue, oldType);
      },
      attributeRenamed: function (oldKey, newKey) {
        this.$emit('attributeRenamed', oldKey, newKey);
      },
      focus: function (attributeNameOrIndex, focusKey) { // FIXME: This is hacky
        var attributeView;
        if (typeof(attributeNameOrIndex) === 'string') {
          attributeView = this.$refs[attributeNameOrIndex];
          if (attributeView && attributeView.length > 0) {
            attributeView = attributeView[0];
          }
        } else {
          var attributeViews = this.$children.slice(1);
          attributeView = attributeViews[(attributeNameOrIndex + attributeViews.length) % attributeViews.length];
        }
        if (attributeView && attributeView.$refs) {
          if (focusKey) {
            Vue.nextTick(function () {
              attributeView.$refs.keyElement.focus();
            });
          } else {
            Vue.nextTick(function () {
              attributeView.$refs.valueElement.focus();
            });
          }
        }
      },
      _findAttributeWithKey: function (key) {
        return !this.attributes.find ||
        this.attributes.find(function (attribute) {
          return attribute.key === key;
        });
      }
    },
    mounted: function () {
      this.$refs.divider.setElements(this.$refs.left, this.$refs.right);
    },
    template:
'<table class="table-view">\n\
  <tr>\n\
    <th ref="left">\n\
      <divider-vertical ref="divider" \n\
                        :initial="40" \n\
                        :first="this.$refs.left" \n\
                        :second="this.$refs.right" \n\
                        class="divider-vertical" />\n\
    </th>\n\
    <th ref="right" />\n\
  </tr>\n\
  <attribute-view v-for="attribute in attributes" \n\
                  :key="attribute.key" \n\
                  :ref="attribute.key" \n\
                  :id="attribute.key" \n\
                  :attribute="attribute" \n\
                  :nonCommonDictionary="nonCommonDictionary" \n\
                  :nonCommonEditable="nonCommonEditable" \n\
                  :class="{selected: selectedAttributes.indexOf(attribute.key) > -1}" \n\
                  @attributeChanged="attributeChanged" \n\
                  @attributeRenamed="attributeRenamed" \n\
                  @selected="setSelected" />\n\
</table>'
  });

  function getDefaultValueForType(type) {
      switch (type) {
          case 'String':
              return '';
          case 'JSON':
              return '{}';
          case 'NilClass':
              return 'nil';
          case 'Time':
              return TypedValueParser.dateToISO8601(new Date());
          case 'Color':
              return 'Color(255,255,255)';
          case 'Point3d':
              return 'Point3d(0,0,0)';
          case 'Vector3d':
              return 'Vector3d(1,0,0)';
          case 'Array':
              return '[]';
      }
      return '';
  }

});
