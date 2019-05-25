<template>
  <div class="the-attribute-pane">
    <div class="attribute-table">
      <TableView
        v-show="_objectHasKeys(attributes)"
        ref="tableView"
        :attributes="attributes"
        :selected-attributes="selectedAttributes"
        :non-common-dictionary="selectedDictionary && selectedDictionary.nonCommonDictionary"
        :non-common-editable="nonCommonEditable"
        @attributeChanged="setAttribute"
        @attributeRenamed="renameAttribute"
        @selected="selectAttributes"
      />
      <div
        v-show="!_objectHasKeys(attributes)"
        class="message-no-attributes"
      >
        {{ tr('No attributes') }}
      </div>
    </div>
    <Toolbar class="bottom-toolbar">
      <ToolbarButton
        :title="tr('Add a new attribute')"
        image="../images/plus.svg"
        :disabled="!attributes"
        @click.native="onAddAttribute"
      />
      <ToolbarButton
        :title="tr('Remove the selected attribute')"
        image="../images/minus.svg"
        :disabled="!attributes || selectedAttributes.length == 0"
        @click.native="onRemoveAttribute"
      />
      <label
        v-if="hasNonCommon"
        class="vertical-centered"
        :title="
          tr(
            'When you change a grayed out value that is not shared by all selected entities, it will be added to all selected entities.'
          )
        "
      >
        <input
          v-model="nonCommonEditable"
          type="checkbox"
        />
        {{ tr('Allow editing grayed values') }}
      </label>
    </Toolbar>
  </div>
</template>

<script>
import Vue from 'vue'
import Bridge from '../bridge.js'
import TRANSLATE from '../translate.js'
import TableView from './table-view.vue'
import Toolbar from './toolbar.vue'
import ToolbarButton from './toolbar-button.vue'

export default {
  components: { TableView, Toolbar, ToolbarButton },
  props: {
    selectedPath: {
      type: Array,
      default: () => [],
    },
    selectedDictionary: {
      type: Object,
      default: () => null,
    },
  },
  data: function() {
    return {
      tr: TRANSLATE.get,
      attributes: null,
      selectedAttributes: [],
      nonCommonEditable: false,
    }
  },
  computed: {
    hasNonCommon: function() {
      return (
        this.selectedDictionary && this.selectedDictionary.nonCommonDictionary ||
        (this.attributes &&
          this.attributes.find(function(a) {
            return a.nonCommonKey || a.nonCommonValue
          }))
      )
    },
  },
  methods: {
    refresh: function() {
      let self = this
      if (self.selectedPath.length === 0) {
        self.attributes = null
      } else {
        Bridge.get('get_attributes', self.selectedPath).then(
          function(attributes) {
            self.attributes = attributes
          },
          function(error) {
            self.attributes = null
            self.$notify('alert', error.message, 'error')
          }
        )
      }
    },
    selectAttributes: function(selectedAttributes) {
      this.selectedAttributes = selectedAttributes
    },
    onAddAttribute: function(event) {
      if (
        this.selectedPath !== null &&
        this.attributes !== null &&
        !this._findAttributeWithKey('')
      ) {
        this.attributes.push({ key: '', value: '', type: 'String' })
        this.selectedAttributes = ['']
        // Focus the new attribute.
        Vue.nextTick(function() {
          this.$refs.tableView.focus('', true)
        }, this)
      }
    },
    onRemoveAttribute: function(event) {
      let self = this
      if (self.selectedPath !== null && self.attributes !== null) {
        self.selectedAttributes.forEach(function(key) {
          Bridge.get('remove_attribute', self.selectedPath, key).then(
            function() {
              let index = self.attributes.findIndex(function(attribute) {
                return attribute.key == key
              })
              self.attributes.splice(index, 1)
            },
            function(error) {
              self.$notify('alert', error.message, 'error')
            }
          )
        })
        self.selectedAttributes = []
        // Focus the last attribute.
        self.$refs.tableView.focus(-1)
      }
    },
    setAttribute: function(newKey, newValue, newType, oldValue, oldType) {
      let self = this
      Bridge.get(
        'set_attribute',
        self.selectedPath,
        newKey,
        newValue,
        newType
      ).then(
        function(success) {
          // Set is applied to the same attribute in all entities, so it will be created for all
          // entities that didn't have it, and all will receive the same value. Ungray the row and value.
          // TODO: don't bind the key/value elements hard to the data, update the data only here.
          self.$emit('attributeChanged', newKey, newValue, newType, oldValue, oldType)
        },
        function(error) {
          self.$notify('alert', error.message, 'error')
          // Reset the attribute in the data model
          let attribute = self._findAttributeWithKey(newKey)
          if (attribute) {
            attribute.value = oldValue
            attribute.type = oldType
          }
        }
      )
    },
    renameAttribute: function(oldKey, newKey) {
      let self = this
      Bridge.get(
        'rename_attribute',
        self.selectedPath,
        oldKey,
        newKey
      ).then(
        function(success) {
          self.selectedAttributes = [newKey]
          self.$refs.tableView.focus(newKey)
          // TODO: don't bind the key/value elements hard to the data, update the data only here.
          self.$emit('attributeChanged', newKey, newValue, newType, oldValue, oldType)
        },
        function(error) {
          self.$notify('alert', error.message, 'error')
          // Reset the attribute in the data model
          let attribute = self._findAttributeWithKey(newKey)
          if (attribute) {
            attribute.key = oldKey
          }
        }
      )
    },
    _objectHasKeys: function(obj) {
      return obj instanceof Object && Object.keys(obj).length !== 0
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
.the-attribute-pane .attribute-table {
  position: absolute;
  top: 0;
  bottom: 2.5em; /* bottom toolbar */
  left: 0;
  right: 0;
  border: 1px ThreeDShadow solid;
}
.the-attribute-pane .attribute-table {
  border-right: none;
  overflow-x: hidden;
  overflow-y: auto;
}
.the-attribute-pane .bottom-toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2.5em;
}
.the-attribute-pane .message-no-attributes {
  color: silver;
  font-size: 1.5em;
  text-align: center;
  padding: 2em 0.5em;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
</style>
