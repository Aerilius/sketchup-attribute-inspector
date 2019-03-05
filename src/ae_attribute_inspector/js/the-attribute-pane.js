define(['vue', './table-view', './vs-notify', './bridge', './translate', './style'], function (Vue, _, _, Bridge, Translate, Style) {

  Style.addCSS(
'.the-attribute-pane .attribute-table {\n\
    position: absolute;\n\
    top: 0;\n\
    bottom: 2.5em; /* bottom toolbar */\n\
    left: 0;\n\
    right: 0;\n\
    border: 1px ThreeDShadow solid;\n\
}\n\
.the-attribute-pane .attribute-table {\n\
    border-right: none;\n\
    overflow-x: hidden;\n\
    overflow-y: auto;\n\
}\n\
.the-attribute-pane .bottom-toolbar {\n\
    position: absolute;\n\
    bottom: 0;\n\
    left: 0;\n\
    height: 2.5em;\n\
}\n\
.the-attribute-pane .message-no-attributes {\n\
    color: silver;\n\
    font-size: 1.5em;\n\
    text-align: center;\n\
    padding: 2em 0.5em;\n\
    overflow: hidden;\n\
    text-overflow: ellipsis;\n\
    word-break: break-word;\n\
}');

  Vue.component('the-attribute-pane', {
    props: ['selectedDictionary'],
    data: function () {
      return {
        tr: Translate.get,
        attributes: null,
        selectedAttributes: [],
        nonCommonDictionary: false,
        nonCommonEditable: false
      };
    },
    computed: {
      hasNonCommon: function () {
        return this.nonCommonDictionary || this.attributes && this.attributes.find(function (a) { return a.nonCommonKey || a.nonCommonValue; });
      }
    },
    methods: {
      refresh: function () {
        var self = this;
        if (self.selectedDictionary.length === 0) {
          self.attributes = null;
        } else {
          Bridge.get('get_attributes', self.selectedDictionary).then(function (attributes) {
            self.attributes = attributes;
            Bridge.get('is_non_common_dictionary', self.selectedDictionary).then(function (isNonCommonDictionary) {
              self.nonCommonDictionary = isNonCommonDictionary;
            });
          }, function (error) {
            self.attributes = null;
            self.$notify('alert', error.message, 'error');
          });
        }
      },
      selectAttributes: function (selectedAttributes) {
        this.selectedAttributes = selectedAttributes;
      },
      onAddAttribute: function (event) {
        if (this.selectedDictionary !== null && this.attributes !== null && !this._findAttributeWithKey('')) {
          this.attributes.push({ key: '', value: '', type: 'String' });
          this.selectedAttributes = [''];
          // Focus the new attribute.
          Vue.nextTick(function () { this.$refs.tableView.focus('', focusKey = true); }, this);
        }
      },
      onRemoveAttribute: function (event) {
        var self = this;
        if (self.selectedDictionary !== null && self.attributes !== null) {
          self.selectedAttributes.forEach(function (key) {
            Bridge.get('remove_attribute', self.selectedDictionary, key).then(function () {
              var index = self.attributes.findIndex(function (attribute) {
                return attribute.key == key;
              });
              self.attributes.splice(index, 1);
            }, function (error) {
              self.$notify('alert', error.message, 'error');
            });
          });
          self.selectedAttributes = [];
          // Focus the last attribute.
          self.$refs.tableView.focus(-1);
        }
      },
      setAttribute: function (newKey, newValue, newType, oldValue, oldType) {
        var self = this;
        Bridge.get('set_attribute', self.selectedDictionary, newKey, newValue, newType)
        .then(function (success) {
          // Set is applied to the same attribute in all entities, so it will be created for all
          // entities that didn't have it, and all will receive the same value. Ungray the row and value.
          // TODO: don't bind the key/value elements hard to the data, update the data only here.
          self._updateIsNonCommonDictionary();
        }, function (error) {
          self.$notify('alert', error.message, 'error');
          // Reset the attribute in the data model
          var attribute = self._findAttributeWithKey(newKey);
          if (attribute) {
            attribute.value = oldValue;
            attribute.type = oldType;
          };
        });
      },
      renameAttribute: function (oldKey, newKey) {
        var self = this;
        Bridge.get('rename_attribute', self.selectedDictionary, oldKey, newKey)
        .then(function (success) {
          self.selectedAttributes = [newKey];
          self.$refs.tableView.focus(newKey);
          // TODO: don't bind the key/value elements hard to the data, update the data only here.
          self._updateIsNonCommonDictionary();
        }, function (error) {
          self.$notify('alert', error.message, 'error');
          // Reset the attribute in the data model
          var attribute = self._findAttributeWithKey(newKey);
          if (attribute) {
            attribute.key = oldKey;
          }
        });
      },
      _objectHasKeys: function (obj) {
        return obj instanceof Object && Object.keys(obj).length !== 0;
      },
      _findAttributeWithKey: function (key) {
        return !this.attributes.find ||
        this.attributes.find(function (attribute) {
          return attribute.key === key;
        });
      },
      _updateIsNonCommonDictionary: function () {
        var self = this;
        Bridge.get('is_non_common_dictionary', self.selectedDictionary).then(function (isNonCommonDictionary) {
          self.nonCommonDictionary = isNonCommonDictionary;
        });
      }
    },
    template:
'<div class="the-attribute-pane">\n\
  <div class="attribute-table">\n\
    <table-view v-show="_objectHasKeys(attributes)" \n\
                ref="tableView" \n\
                :attributes="attributes" \n\
                :selectedAttributes="selectedAttributes" \n\
                :nonCommonDictionary="nonCommonDictionary" \n\
                :nonCommonEditable="nonCommonEditable" \n\
                @attributeChanged="setAttribute" \n\
                @attributeRenamed="renameAttribute" \n\
                @selected="selectAttributes" \n\
 />\n\
    <div v-show="!_objectHasKeys(attributes)" \n\
         class="message-no-attributes">{{tr("No attributes")}}</div>\n\
  </div>\n\
  <toolbar class="bottom-toolbar">\n\
    <toolbar-button :title="tr(\'Add a new attribute\')" image="../images/plus.svg" \n\
                    @click.native="onAddAttribute" :disabled="!attributes" />\n\
    <toolbar-button :title="tr(\'Remove the selected attribute\')" image="../images/minus.svg" \n\
                    @click.native="onRemoveAttribute" :disabled="!attributes || selectedAttributes.length == 0" />\n\
    <label v-if="hasNonCommon" \n\
           class="vertical-centered" \n\
           :title="tr(\'When you change a grayed out value that is not shared by all selected entities, it will be added to all selected entities.\')">\n\
      <input v-model:value="nonCommonEditable" \n\
             type="checkbox" />\n\
      {{ tr("Allow editing grayed values") }}\n\
    </label>\n\
  </toolbar>\n\
</div>'
  });

});
