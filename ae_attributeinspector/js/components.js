Translate = {
  get: function (s) { return '[' + s + ']'; }
};

Vue.component('entity-description', {
  props: {
    entity: {
      default: function () {
        return {
          title: null,
          related: null
        }
      }
    }
  },
  data: function () {
    return {
      Translate: Translate,
      defaultEntityTitle: 'No entities selected' // TODO: use props: { propName: { type:, default: } }
    }
  },
  methods: {
    selectRelatedEntity: function () {
      Bridge.call('select', this.entity.related.id);
    }
  },
  template:
'<span style="line-height: 0.9em">\n\
  <h2 style="display: inline; font: caption; font-size: 1.125em !important; font-weight: bold !important;">\n\
    {{ (entity && entity.title) ? entity.title : Translate.get(defaultEntityTitle) }}\n\
  </h2>\n\
  <span>{{ (entity && entity.related) ? Translate.get("see also: ") : ""}}\n\
    <a v-if="entity && entity.related" \n\
       @click="selectRelatedEntity"> \n\
       {{ entity.related.title }}</a>\n\
  </span>\n\
</span>'
});

Vue.component('entity-type-selector', {
  props: ['selectedEntityType'],
  data: function () {
    return {
      Translate: Translate,
      entityTypes: [
        'DrawingElement',
        'ComponentDefinition',
        'Material',
        'Layer',
        'Page',
        'Style'
      ]
    }
  },
  template:
'<label title="How to select other entity types">\n\
  <select :value="selectedEntityType">\n\
    <option v-for="entityType in entityTypes" \n\
            :value="entityType" \n\
            :key="entityType">\n\
      {{ Translate.get(entityType) }}\n\
    </option>\n\
  </select>\n\
</label>'
});

Vue.component('tree-view-overlay-buttons', { // TODO: remove, explode
  template:
'<div class="overlay-toolbar right">\n\
  <button id="button-expand-all" \n\
          @click="$emit(\'expandAll\')" \n\
          title="Expand all">\n\
    <img src="../images/expand-all.svg" />\n\
  </button>\n\
  <button id="button-collapse-all" \n\
          @click="$emit(\'collapseAll\')" \n\
          title="Collapse all" >\n\
    <img src="../images/collapse-all.svg" />\n\
  </button>\n\
</div>'
});

function shallowArrayEqual (array1, array2) {
  if (!(array1 instanceof Array)) return false;
  if (!(array2 instanceof Array)) return false;
  if (array1.length != array2.length) return false;
  for (var i = 0; i < array1.length; i++) {
    if (array1[i] != array2[i]) return false;
  }
  return true;
}


Vue.component('dictionary-list', {
  props: ['dictionaries', 'selectedPath'],
  data: function () {
    return {
      Translate: Translate
    };
  },
  computed: {
    dictionaryNodesTree: function () {
      return this.expandKeysToObjectNodesRecursive(this.dictionaries, []);
    }
  },
  methods: {
    onSelected: function (path) {
      this.$emit('selected', path);
    },
    collapseAll: function () {
      this.$refs.treeView.collapseAll();
      // Since the selected tree item might not be visible anymore, select its top-level parent.
      this.$emit('selected', [this.selectedPath[0]]);
    },
    expandAll: function () {
      this.$refs.treeView.expandAll();
    },
    expandKeysToObjectNodesRecursive: function (currentDictionaries, parentPath) {
      var result = {};
      for (key in currentDictionaries) {
        if (currentDictionaries.hasOwnProperty(key)) {
          var currentPath = parentPath.concat([key]);
          result[key] = {
            name: key,
            selected: shallowArrayEqual(currentPath, this.selectedPath),
            children: currentDictionaries[key] ? this.expandKeysToObjectNodesRecursive(currentDictionaries[key], currentPath) : null
          };
        }
      }
      return result;
    },
    _objectHasKeys: function (obj) {
      return obj instanceof Object && Object.keys(obj).length !== 0;
    }
  },
  template:
'<div id="dictionary-list" class="a11ytree">\n\
  <tree-view v-if="_objectHasKeys(dictionaries)" \n\
             ref="treeView" \n\
             :children="dictionaryNodesTree" \n\
             @selected="onSelected" />\n\
  <div v-else class="message-no-dictionaries">{{Translate.get("No attribute dictionaries")}}</div>\n\
</div>'
});


Vue.component('dictionary-pane', {
  props: {},
  data: function () {
    return {
      Bridge: Bridge, // TODO: needed?
      dictionaries: null,
      nonCommonDictionaries: null,
      selectedPath: null,
      recentPaths: []
    };
  },
  methods: {
    refresh: function () {
      Bridge.get('get_dictionaries').then(function (dictionaries) {
        this.dictionaries = dictionaries;
        // Initially select a dictionary. Try to match to a recently viewed dictionary, or default to the first.
        this.$emit('selectedDictionary', findRecentPath(dictionaries, this.recentPaths) || [firstKeyInObject(dictionaries)] || []);
      }.bind(this));
    },
    onAddDictionary: function (event) {
      var name = window.prompt('Choose a new dictionary name');// TODO
      if (name != null) {
        var newPath = this.selectedPath.slice(0, -1).concat(name);
        Bridge.get('add_dictionary', newPath).then(function () {
          // Insert the new path in the dictionaries data object
          var parentOfSelectedDictionary = this.selectedPath.slice(0, -1).reduce(function (dictionary, name) {
            return dictionary[name];
          }, this.dictionaries);
          // Only if it does not exist, set it to null (= dictionary with no nested dictionaries)
          if (parentOfSelectedDictionary[name] == null) {
            parentOfSelectedDictionary[name] = null;
          }
          // Select the new path
          this.$emit('selectedDictionary', newPath); // TODO: this.selectDictionary(newPath);
        }.bind(this));
      }
    },
    onAddNestedDictionary: function (event) {
      var name = window.prompt('Choose a new dictionary name');// TODO
      if (name != null) {
        var newPath = this.selectedPath.concat(name);
        Bridge.get('add_dictionary', newPath).then(function () {
          // Insert the new path in the dictionaries data object
          var parentOfSelectedDictionary = this.selectedPath.slice(0, -1).reduce(function (dictionary, name) {
            return dictionary[name];
          }, this.dictionaries);
          var nameOfParentDictionary = this.selectedPath.slice(-1)[0];
          if (parentOfSelectedDictionary[nameOfParentDictionary] == null) {
            parentOfSelectedDictionary[nameOfParentDictionary] = {};
          }
          // Only if it does not exist, set it to null (= dictionary with no nested dictionaries)
          if (parentOfSelectedDictionary[nameOfParentDictionary][name] == null) {
            parentOfSelectedDictionary[nameOfParentDictionary][name] = null;
          }
          // Select the new path
          this.$emit('selectedDictionary', newPath); // TODO: this.selectDictionary(newPath);
        }.bind(this));
      }
    },
    onRenameDictionary: function (event) {
      var newName = window.prompt('Choose a new dictionary name');// TODO
      var newPath = this.selectedPath.slice(0, -1).concat([newName]);
      Bridge.get('rename_dictionary', this.selectedPath, newPath).then(function () {
        this.selectedPath = newPath;
      }.bind(this)).catch(function (error) {
        // TODO: notification to show error to user (mention which dictionary/attribute was not changed?)
      });
    },
    onRemoveDictionary: function (event) { // TODO: this is not reflected in tree-view
      Bridge.get('remove_dictionary', this.selectedPath).then(function () {
        var parentPath = this.selectedPath.slice(0, -1);
        var parentOfdictionaryToDelete = parentPath.reduce(function (dictionary, name) {
          return dictionary[name];
        }, this.dictionaries);
        var nameOfDictionaryToDelete = this.selectedPath.slice(-1)[0];
        delete parentOfdictionaryToDelete[nameOfDictionaryToDelete];
        this.selectedPath = parentPath;
      }.bind(this));
    },
    selectedDictionary: function (newPath) {
      console.log('selectedDictionary', newPath, this.selectedPath);
      this.$emit('selectedDictionary', newPath);
    }
  },
  template:
'<div>\n\
  <!-- TODO: flatten overlay toolbar and dictionaries list-->\n\
  <tree-view-overlay-buttons @expandAll="$refs.dictionaryList.expandAll()" @collapseAll="$refs.dictionaryList.collapseAll()" />\n\
  <dictionary-list ref="dictionaryList" \n\
                   :dictionaries="dictionaries" :selectedPath="selectedPath" \n\
                   @selected="selectedDictionary" />\n\
  <bottom-toolbar>\n\
    <toolbar-button title="Add a new dictionary" image="../images/plus.svg" \n\
                    @click.native="onAddDictionary" :disabled="!dictionaries" />\n\
    <toolbar-button title="Add a nested dictionary" image="../images/plus-nested.svg" \n\
                    @click.native="onAddNestedDictionary" :disabled="!dictionaries || !selectedPath" />\n\
    <toolbar-button title="Rename the selected dictionary" image="../images/rename.svg" \n\
                    @click.native="onRenameDictionary" :disabled="!dictionaries || !selectedPath" />\n\
    <toolbar-button title="Remove the selected dictionary" image="../images/minus.svg" \n\
                    @click.native="onRemoveDictionary" :disabled="!dictionaries || !selectedPath" />\n\
  </bottom-toolbar>\n\
</div>'
});


Vue.component('attributes-list', {
  props: ['attributes', 'selectedAttributes'],
  data: function () {
    return {
      Translate: Translate
    };
  },
  methods: {
    onSelected: function (selectedKey) {
      this.$emit('selected', this.selectedAttributes);
    },
    attributeChanged: function (newKey, newValue, newType) {
      this.$emit('attributeChanged', newKey, newValue, newType);
    },
    attributeRenamed: function (oldKey, newKey) {
      this.$emit('attributeRenamed', oldKey, newKey);
    },
    _objectHasKeys: function (obj) {
      return obj instanceof Object && Object.keys(obj).length !== 0;
    }
  },
  template:
'<div>\n\
  <table-view v-if="_objectHasKeys(attributes)" \n\
              ref="tableView" \n\
              :attributes="attributes" \n\
              :selectedAttributes="selectedAttributes" \n\
              @attributeChanged="attributeChanged" \n\
              @attributeRenamed="attributeRenamed" \n\
              @selected="onSelected" \n\
              class="attribute-table" />\n\
  <div v-else class="message-no-attributes">{{Translate.get("No attributes")}}</div>\n\
</div>'
});






Vue.component('top-toolbar', {
  template:
'<div class="top-toolbar horizontal-flex-parent">\n\
  <clip-box style="width: 100%">\n\
    <slot name="left"/>\n\
  </clip-box>\n\
  <clip-box>\n\
    <slot name="right"/>\n\
  </clip-box>\n\
</div>'
});

Vue.component('clip-box', {
  template:
'<div class="clip-box">\n\
  <div class="toolbar vertical-centered-parent">\n\
    <slot/>\n\
  </div>\n\
</div>',
});

Vue.component('bottom-toolbar', {
  template:
'<div class="bottom-toolbar toolbar left vertical-centered-parent">\n\
  <slot/>\n\
</div>'
});

Vue.component('toolbar-button', {
  props: {
    image: {
      type: String
    },
    title: {
      type: String
    },
    disabled: {
      default: ''
    }
  },
  template: 
'<div class="vertical-centered">\n\
  <button :title="title" \n\
          :disabled="disabled">\n\
    <img :src="image" />\n\
  </button>\n\
</div>'
});

Vue.component('split-pane-vertical', {
  props: {
    initial: {
      type: Number,
      default: 50
    }
  },
  mounted: function () {
    var $left = jQuery(this.$refs.leftPane);
    var $right = jQuery(this.$refs.rightPane);
    jQuery(this.$refs.divider).divider($left, $right, {horizontal: true, percent: true, initial: this.initial});
  },
  template:
'<div>\n\
  <div ref="leftPane" style="position: absolute; left: 0; width: 50%; height: 100%;">\n\
    <slot name="left" /> \n\
    <button ref="divider" class="divider-vertical" />\n\
  </div>\n\
  <div ref="rightPane" style="position: absolute; right: 0; width: 50%; height: 100%;">\n\
    <slot name="right" />\n\
  </div>\n\
</div>'
});

Vue.component('divider-vertical', {
  props: {
    initial: {
      type: Number,
      default: 50
    },
    percent: {
      type: Boolean,
      default: true
    }
  },
  data: function () {
    return {
      first: null,
      second: null,
      dim1: 0,
      dim2: 0,
      start: 0
    }
  },
  created: function () {
    window.console.log('created divider', this.first);
  },
  mounted: function () {
    window.console.log('mounted divider', this.first, this.second);
  },
  methods: {
    mousedown: function (event) {
      // Register the status at the time of start.
      this.init(event);
      var move = this.move;
      function removeEventListeners (event) {
        window.document.removeEventListener('mousemove', move);
        window.document.removeEventListener('mouseup', removeEventListeners);
      }
      // Move the divider while the cursor moves.
      window.document.addEventListener('mousemove', this.move);
      // Until the mouse button is released.
      window.document.addEventListener('mouseup', removeEventListeners);
    },
    init: function (event) {
      this.dim1  = this.first.offsetWidth;
      this.dim2  = this.second.offsetWidth;
      this.start = event.clientX;
    },
    move: function (event) {
      var current = event.clientX;
      var delta   = current - this.start;
      this.moveBy(delta);
    },
    moveBy: function (delta) {
      var newDim1 = this.dim1 + delta,
          newDim2 = this.dim2 - delta;
      if (this.percent) {
        newDim1 = ( 100 * newDim1 / (this.dim1 + this.dim2) );
        newDim2 = ( 100 * newDim2 / (this.dim1 + this.dim2) );
      }
      this.moveTo(newDim1, newDim2);
    },
    moveTo: function (newDim1, newDim2) {
      if (this.percent) {
        newDim1 += '%';
        newDim2 += '%';
      }
      this.first.style.width = newDim1;
      this.second.style.width = newDim2;
    },
  },
  template:
'<button ref="divider" \n\
         @mousedown="mousedown" \n\
         style="position: absolute; z-index: 1; top: 0; right: 0; cursor: col-resize; width: 0.5em; min-width: 0.5em; height: 100%; margin-right: -0.25em; background: transparent; border: none; user-select: none;"/>'
});


