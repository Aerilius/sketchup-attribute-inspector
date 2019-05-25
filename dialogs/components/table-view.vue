<template>
  <table class="table-view">
    <tr>
      <th ref="left">
        <DividerVertical
          ref="divider"
          :initial="40"
          :first="this.$refs.left"
          :second="this.$refs.right"
          class="divider-vertical"
        />
      </th>
      <th ref="right" />
    </tr>
    <AttributeView
      v-for="attribute in attributes"
      :id="attribute.key"
      :key="attribute.key"
      :ref="attribute.key"
      :attribute="attribute"
      :non-common-dictionary="nonCommonDictionary"
      :non-common-editable="nonCommonEditable"
      :class="{ selected: selectedAttributes.indexOf(attribute.key) > -1 }"
      @attributeChanged="attributeChanged"
      @attributeRenamed="attributeRenamed"
      @selected="setSelected"
    />
  </table>
</template>

<script>
import Vue from 'vue'
import AttributeView from './attribute-view.vue'
import DividerVertical from './divider-vertical.vue'

export default {
  components: { DividerVertical, AttributeView },
  props: {
    attributes: {
      type: Array,
      default: function() {
        return []
      },
    },
    selectedAttributes: {
      type: Array,
      default: function() {
        return []
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
    return {}
  },
  mounted: function() {
    this.$refs.divider.setElements(this.$refs.left, this.$refs.right)
  },
  methods: {
    toggleSelected: function(selectedKey) {
      let index = this.selectedAttributes.indexOf(selectedKey)
      if (index == -1) {
        // TODO: For now, support only selection of single attributes.
        this.selectedAttributes.length = 0
        this.selectedAttributes.push(selectedKey)
      } else {
        this.selectedAttributes.splice(index, 1)
      }
      this.$emit('selected', this.selectedAttributes)
    },
    setSelected: function(selectedKey) {
      this.selectedAttributes.length = 0
      this.selectedAttributes.push(selectedKey)
      this.$emit('selected', this.selectedAttributes)
    },
    attributeChanged: function(newKey, newValue, newType, oldValue, oldType) {
      this.$emit(
        'attributeChanged',
        newKey,
        newValue,
        newType,
        oldValue,
        oldType
      )
    },
    attributeRenamed: function(oldKey, newKey) {
      this.$emit('attributeRenamed', oldKey, newKey)
    },
    focus: function(attributeNameOrIndex, focusKey) {
      // FIXME: This is hacky
      let attributeView
      if (typeof attributeNameOrIndex === 'string') {
        attributeView = this.$refs[attributeNameOrIndex]
        if (attributeView && attributeView.length > 0) {
          attributeView = attributeView[0]
        }
      } else {
        let attributeViews = this.$children.slice(1)
        attributeView =
          attributeViews[
            (attributeNameOrIndex + attributeViews.length) %
              attributeViews.length
          ]
      }
      if (attributeView && attributeView.$refs) {
        if (focusKey) {
          Vue.nextTick(function() {
            attributeView.$refs.keyElement.focus()
          })
        } else {
          Vue.nextTick(function() {
            attributeView.$refs.valueElement.focus()
          })
        }
      }
    },
    _findAttributeWithKey: function(key) {
      return (
        !this.attributes.find ||
        this.attributes.find(function(attribute) {
          return attribute.key === key
        })
      )
    },
  },
}
</script>

<style lang="scss">
table.table-view {
  background: white;
  border-collapse: collapse;
  overflow: hidden;
}
.table-view > tr > th:first-child,
.table-view th:first-child + th {
  position: relative;
  width: 50%;
}
.table-view > tr .divider-vertical {
  height: 100em;
}
</style>
