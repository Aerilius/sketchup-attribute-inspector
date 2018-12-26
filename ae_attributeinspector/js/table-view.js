Vue.component('type-selector', {
  props: ['attribute'],
  data: function () {
    return {
      attributetypes: ['String', 'Integer', 'Float', 'Boolean']
    };
  },
  template:
'<select v-model:value="attribute.type">\n\
  <option v-for="attributetype in attributetypes" \n\
          :key="attributetype" \n\
          :value="attributetype">{{attributetype}}</option>\n\
</select>'
});

Vue.component('attribute-view', {
  props: ['attribute'],
  data: function () {
    return {
      previousKey: this.attribute.key,
      previousValue: this.attribute.value,
      previousType: this.attribute.type,
      isValueValid: true,
      isTypeValid: true
    };
  },
  methods: {
    onSelected: function (event) {
      this.$emit('selected', this.attribute.key);
    },
    onKeyChanged: function (event) {
      var newKey = event.target.value;
        // Emit event
      if (newKey != this.previousKey) this.$emit('attributeRenamed', this.previousKey, newKey);
        // Update state
      this.previousKey = newKey;
    },
    onValueChanging: debounce(function (event) {
      // Just validate in real-time
      var newValue = event.target.value;
      // Validation
      if (validateAttributeValue(newValue, this.attribute.type)) {
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
      if (validateAttributeValue(newValue, this.attribute.type)) {
        // Emit event
        if (newValue != this.previousValue) this.$emit('attributeChanged', this.attribute.key, newValue, this.attribute.type);
        // Update state
        this.previousValue = newValue;
        this.isValueValid = true;
        this.isTypeValid = true;
      } else {
        this.isValueValid = false;
        // Reset the value to the previous, correct value
        //this.$refs.valueElement.value = this.previousValue;
      }
    },
    onTypeChanged: function (event) {
      var newType = event.target.value;
      // No validation if the value is not set
      if (this.attribute.value == '') {
        this.attribute.value = getDefaultValueForType(newType);
      } else {
        // Validation
        if (validateAttributeValue(this.attribute.value, newType)) {
          // Emit event
          if (newType != this.previousType) this.$emit('attributeChanged', this.attribute.key, this.attribute.value, newType);
          // Update state
          this.isValueValid = true;
          this.isTypeValid = true;
          this.previousType = newType;
        } else {
          this.isTypeValid = false;
          // Reset the value to the previous, correct value
          //this.$refs.typeSelectorElement.$el.value = this.previousType;
        }
      }
    },
    adjustTextareaHeight: function (event) {
      var textarea = event.target;
      textarea.style.height = null;
      var scrollHeight = textarea.scrollHeight;
      var computedStyle = window.getComputedStyle(textarea, null);
      var minHeight = parseFloat(computedStyle.getPropertyValue('min-height'), 10) || 0;
      var maxHeight = parseFloat(computedStyle.getPropertyValue('max-height'), 10) || Number.MAX_VALUE;
      var newHeight = Math.max(minHeight, Math.min(scrollHeight, maxHeight));
      textarea.style.height = newHeight + 'px';
    },
  },
  /*mounted: function () {
    this.$refs.keyElement.focus();
  },*/
  template:
'<tr @click="onSelected">\n\
  <td class="key">\n\
    <input ref="keyElement" \n\
           v-model="attribute.key" \n\
           @change="onKeyChanged" \n\
           type="text" \n\
           class="editable" />\n\
  </td>\n\
  <td class="value">\n\
    <textarea ref="valueElement" \n\
              v-model:value="attribute.value" \n\
             :class="[{ invalid: !isValueValid }, \'editable\']" \n\
             @change="onValueChanged" \n\
             @keyup="onValueChanging" \n\
             @input="adjustTextareaHeight" \n\
             style="resize: none; max-height: 10em;" />\n\
  </td>\n\
  <td class="type">\n\
    <type-selector ref="typeSelectorElement" \n\
                   :attribute="attribute" \n\
                   :class="{ invalid: !isTypeValid }" \n\
                   @change.native="onTypeChanged"></type-selector>\n\
  </td>\n\
</tr>'
});

Vue.component('table-view', {
  props: ['attributes', 'selectedAttributes'],
  /*data: function () {
    return {
      selectedAttributes: []
    }
  },*/
  data: function () {
    return {
      window: window
    }
  },
  methods: {
    onSelected: function (selectedKey) {
      var index = this.selectedAttributes.indexOf(selectedKey);
      if (index == -1) {
        this.selectedAttributes.push(selectedKey);
      } else {
        this.selectedAttributes.splice(index, 1);
      }
      this.$emit('selected', this.selectedAttributes);
    },
    onAttributeChanged: function (newKey, newValue, newType) {
      this.$emit('attributeChanged', newKey, newValue, newType); //this.$emit('attributeChanged', this.dictionaryPath, newKey, newValue, newType); // TODO: move one level up
    },
    onAttributeRenamed: function (oldKey, newKey) {
      this.$emit('attributeRenamed', oldKey, newKey); // this.$emit('attributeRenamed', this.dictionaryPath, oldKey, newKey);
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
      if (attributeView) {
        if (focusKey) {
          attributeView.$refs.keyElement.focus();
        } else {
          attributeView.$refs.valueElement.focus();
        }
      }
    }
  },
  mounted: function () {
    this.$refs.divider.first = this.$refs.left;
    this.$refs.divider.second = this.$refs.right;
  },
  template:
'<table>\n\
  <tr>\n\
    <th ref="left" style="position: relative; width: 50%;">\n\
      <divider-vertical ref="divider" :first="this.$refs.left" :second="this.$refs.right" style="height: 20em"/>\n\
    </th>\n\
    <th ref="right" style="position: relative; width: 50%;"/>\n\
  </tr>\n\
  <attribute-view v-for="attribute in attributes" \n\
                  :key="attribute.key" \n\
                  :ref="attribute.key" \n\
                  :id="attribute.key" \n\
                  :attribute="attribute" \n\
                  :class="{selected: selectedAttributes.indexOf(attribute.key) > -1}" \n\
                  @attributeChanged="onAttributeChanged" \n\
                  @attributeRenamed="onAttributeRenamed" \n\
                  @selected="onSelected"></attribute-view>\n\
</table>'
});

function validateAttributeValue (value, type) {// TODO: use parser to support nested elements
  // Parse value string as expected type, return boolean whether it is valid
  switch (type) {
    case 'Integer':
      return /^-?\d+(e-?\d+)?$/.test(value);
    case 'Float':
      return /^-?\d+(e-?\d+)?$/.test(value);
    case 'Boolean':
      return /^true|false$/.test(value);
    case 'String':
      return true;
    default:
      throw 'Cannot validate unsupported attribute type ' + type;
  }
}

function getDefaultValueForType(type) {
    switch (type) {
        case 'String':
            return '';
        case 'NilClass':
            return 'nil';
        case 'Time':
            return typedvalueparser.dateToISO8601(new Date());
        case 'Sketchup::Color':
            return 'Color(255,255,255)';
        case 'Geom::Point3d':
            return 'Point3d(0,0,0)';
        case 'Geom::Vector3d':
            return 'Vector3d(1,0,0)';
        case 'Array':
            return '[]';
    }
    return '';
}
