/*
TODO:
- missing features:
  - separate entities, dictionaries and atttribute panes into components (the-...)
  - promts using vue
  - error notifications using vue
  - JSON viewer overlay
  - multiple selection for deleting (selection mode whn deleting)
  - refactor / cleanup components: get rid of jQuery
  - Ruby error handling and revert
  - rename: Allow editing non-common values, only show when there is multiple selection and there are non-common values/atttrs/dicts
  - proper Translate integration
  - undo support (Ruby triggers update of view)
  - add multiselection column: multiselection mode background highlight, single selection outline highlight

components
  *table-view
  attribute-view
  type-selector
  *tree-view
  tree-view-node
  tree-view-subtree
  *entity-description
  entity-type-selector
  *tree-view-overlay-buttons
  *dictionary-list
  *attributes-list
  *top-toolbar
  clip-box
  *bottom-toolbar
  *toolbar-button
  *split-pane-vertical
  
  

props
  camelCase
  
component options order:
  el
  props
  data, computed
  events, mounted
  methods
  template
  renderError

element attribute order:
  v-for, v-if, v-else
  id
  ref, key, slot
  v-model
  :
  @
  native?

*/

Translate = {
  get: function (s) { return '[' + s + ']'; }
};

function firstKeyInObject(object) {
    for (var key in object) {
        return key;
    }
}

function findCommonPathInTree(path, tree) {
  if (path[0] in tree) {
    var j = 0;
    while (tree != null && j < path.length && path[j] in tree) {
        tree = tree[path[j]];
        j++;
    }
    return path.slice(0, j + 1);
  } else {
    return null; // TODO: shouldn't it rather return an empty array?
  }
}

/**
 * Given a path of node labels and a tree, it descends the nodes from the 
 * tree's root and returns the common path.
 * @param {Array<string>} path
 * @param {Object<string,Object>} tree represented as nested dictionaries whose keys are the node labels.
 * @returns {Array<string>} the part of the given path that is also a path of the tree.
 */
function findCommonPathInTree(path, tree) {
  if (path[0] in tree) {
    var j = 0;
    while (tree != null && j < path.length && path[j] in tree) {
        tree = tree[path[j]];
        j++;
    }
    return path.slice(0, j + 1);
  } else {
    return null; // TODO: shouldn't it rather return an empty array?
  }
}

/**
 *
 */
function findRecentPath(tree, recentPaths) {
  var longest = null;
  // If there are recently viewed paths, try to choose the longest that is available in the current tree.
  for (var i = recentPaths.length - 1; i >= 0; i--) {
    var common = findCommonPathInTree(recentPaths[i], tree);
    if (!longest || common && common.length > longest.length) {
      longest = common;
    }
  }
  return longest;
}


Vue.config.errorHandler = function (error, node, info) {
  console.log('errorHandler', error, node, info);
}

var app = new Vue({
  el: '#app',
  data: {
    entity: {
      title: '',
      id: null,
      related: {
        title: '',
        id: ''
      }
    },
    entityType: 'DrawingElement',
    /*dictionaries: null,
    selectedPath: null,
    recentPaths: [],*/
    nonCommonDictionaries: null,
    currentAttributes: null,
    nonCommonAttributes: null,
    selectedAttributes: []
  },
  mounted: function () {
    this.refresh();
  },
  methods: {
    refresh: function () {
      Bridge.get('get_entity').then(function (entity) {
        if (entity && (!this.entityid || !entity.id || this.entity.id != entity.id)) {
          this.entity = entity;
          /*Bridge.get('get_dictionaries').then(function (dictionaries) {
            this.dictionaries = dictionaries;
            // Initially select a dictionary. Try to match to a recently viewed dictionary, or default to the first.
            this.selectDictionary(findRecentPath(dictionaries, this.recentPaths) || [firstKeyInObject(dictionaries)] || []);
          }.bind(this));*/
          this.$refs.dictionaryPane.refresh();
        } else {
          this.entity = null;
          /*this.dictionaries = null;
          this.selectedPath = null;*/
          this.currentAttributes = null;
          this.selectedAttributes = [];
        }
      }.bind(this));
    },
    /*selectDictionary: function (path) {
      if (this.selectedPath === null || this.currentAttributes === null || path !== this.selectedPath) {
        Bridge.get('get_attributes', path).then(function (attributes) {
          this.selectedPath = path;
          this.recentPaths.push(path);
          this.currentAttributes = attributes;
        }.bind(this));
      };
    },*/
    selectDictionary: function (path) {
      Bridge.get('get_attributes', path).then(function (attributes) {
        /*this.selectedPath = path;
        this.recentPaths.push(path);*/
        this.currentAttributes = attributes;
      }.bind(this));
    },
    selectAttributes: function (selectedAttributes) {
      this.selectedAttributes = selectedAttributes;
    },
    /*onAddDictionary: function (event) {
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
          this.selectDictionary(newPath);
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
          this.selectDictionary(newPath);
        }.bind(this));
      }
    },
    onRenameDictionary: function (event) {
      Bridge.get('remove_dictionary', this.selectedPath).then(function () {
        var parentPath = this.selectedPath.slice(0, -1);
        var parentOfdictionaryToDelete = parentPath.reduce(function (dictionary, name) {
          return dictionary[name];
        }, this.dictionaries);
        var nameOfDictionaryToDelete = this.selectedPath.slice(-1)[0];
        delete parentOfdictionaryToDelete[nameOfDictionaryToDelete];
        this.selectedPath = parentPath;
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
    },*/
    onAddAttribute: function (event) {
      if (this.selectedPath !== null && this.currentAttributes !== null && (!this.currentAttributes.find || !this.currentAttributes.find(function (a) { return a.key.length === 0; }))) {
        this.currentAttributes.push({ key: '', value: '', type: 'String' });
        this.selectedAttributes = [''];
        // Focus the new attribute.
        window.setTimeout(function () {
          this.$refs.attributesList.$refs.tableView.focus('', focusKey = true);
        }.bind(this), 0);
      }
    },
    onRemoveAttribute: function (event) {
      if (this.selectedPath != null) {
        this.selectedAttributes.forEach(function (key) {
          Bridge.get('remove_attribute', this.selectedPath, key).then(function () {
            var index = this.currentAttributes.findIndex(function (attribute) {
              return attribute.key == key;
            });
            this.currentAttributes.splice(index, 1);
          }.bind(this));
        }.bind(this));
        this.selectedAttributes = [];
        // Focus the last attribute.
        window.setTimeout(function () {
          this.$refs.attributesList.$refs.tableView.focus(-1);
        }.bind(this), 0);
      }
    },
    setAttribute: function (newKey, newValue, newType) {
      Bridge.get("set_attribute", this.selectedPath, newKey, newValue, newType)
      .then(function (success) {
          // Set is applied to the same attribute in all entities, so it will be created for all
          // entities that didn't have it, and all will receive the same value. Ungray the row and value.
          // TODO: TEST
          //tableView.ungrayRow(key);
          //tableView.ungrayValue(key);
      }, function (error) {
          //utils.alert(Translate.get(error.message));
      });
    },
    renameAttribute: function (oldKey, newKey) {
      Bridge.get("rename_attribute", this.selectedPath, oldKey, newKey)
      .then(function (success) {
          // Rename is applied to the same attribute in all entities, so it will be created for all
          // entities that didn't have it. Ungray the row. TODO: TEST
          //tableView.ungrayRow(newKey);
      }, function (error) {
          //utils.alert(Translate.get(error.message));
      });
    }
  },
  template:
'<div>\n\
  <top-toolbar>\n\
    <entity-description slot="left" :entity="entity" />\n\
    <entity-type-selector slot="right" :selectedEntityType="entityType" />\n\
  </top-toolbar>\n\
  <split-pane-vertical :initial="30" style="width: 100%; top: 3em; bottom: 0; position: absolute;">\n\
    <dictionary-pane slot="left" \n\
                     ref="dictionaryPane" \n\
                     @selectedDictionary="selectDictionary" \n\
                     style="width: 100%; height: 100%; margin-top: 1px;" />\n\
    <!--<template slot="left">\n\
      <tree-view-overlay-buttons @expandAll="$refs.dictionaryList.expandAll()" @collapseAll="$refs.dictionaryList.collapseAll()" />\n\
      <dictionary-list ref="dictionaryList" \n\
                       :dictionaries="dictionaries" :selectedPath="selectedPath" \n\
                       @selected="selectDictionary" />\n\
      <bottom-toolbar>\n\
        <toolbar-button title="Add a new dictionary" image="../images/plus.svg" \n\
                        @click.native="onAddDictionary" :disabled="!entity" />\n\
        <toolbar-button title="Add a nested dictionary" image="../images/plus-nested.svg" \n\
                        @click.native="onAddNestedDictionary" :disabled="!entity || !selectedPath" />\n\
        <toolbar-button title="Rename the selected dictionary" image="../images/rename.svg" \n\
                        @click.native="onRenameDictionary" :disabled="!entity || !selectedPath" />\n\
        <toolbar-button title="Remove the selected dictionary" image="../images/minus.svg" \n\
                        @click.native="onRemoveDictionary" :disabled="!entity || !selectedPath" />\n\
      </bottom-toolbar>\n\
    </template>-->\n\
    <!--<div slot="right" id="attributes-pane">-->\n\
    <template slot="right">\n\
      <attributes-list ref="attributesList" \n\
                       :attributes="currentAttributes" :selectedAttributes="selectedAttributes" \n\
                       @attributeChanged="setAttribute" @attributeRenamed="renameAttribute" @selected="selectAttributes" />\n\
      <bottom-toolbar>\n\
        <toolbar-button title="Add a new attribute" image="../images/plus.svg" \n\
                        @click.native="onAddAttribute" :disabled="!entity"  />\n\
        <toolbar-button title="Remove the selected attribute" image="../images/minus.svg" \n\
                        @click.native="onRemoveAttribute" :disabled="!entity || !currentAttributes || selectedAttributes.length == 0" />\n\
        <label v-if="nonCommonDictionaries || nonCommonAttributes" \n\
               class="vertical-centered" \n\
               title="When you change a grayed out value that is not shared by all selected entities, it will be added to all selected entities.">\n\
          <input id="option-share-changes" type="checkbox" />\n\
          Allow editing grayed values\
        </label>\n\
      </bottom-toolbar>\n\
    </template>\n\
    <!--</div>-->\n\
  </split-pane-vertical>\n\
</div>',
  renderError: function (node, error) {
    console.log('renderError', node, error);
    return JSON.stringify(error);
  },
  errorCaptured: function (error, component, info) {
    console.log('errorCaptured', error, component, info);
    return false;
  }
});
