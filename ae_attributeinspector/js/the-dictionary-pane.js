define(['vue', './tree-view', 'vs-notify', './vs-prompt', './bridge', './translate', './style'], function (Vue, _, _, _, Bridge, Translate, Style) {

  Style.addCSS(
'/* Overlay toolbar for small buttons to expand/collapse the treeview */\n\
.the-dictionary-pane .overlay-toolbar {\n\
    position: absolute;\n\
    z-index: 1;\n\
}\n\
.the-dictionary-pane .overlay-toolbar.right {\n\
    right: 0;\n\
    float: right;\n\
}\n\
.the-dictionary-pane .overlay-toolbar button {\n\
    width: 1.25em;\n\
    height: 1.25em;\n\
    /* Add some space to avoid overlap with container border */\n\
    position: relative;\n\
    top: 1px;\n\
    right: 1px;\n\
    -moz-appearance: none;\n\
}\n\
.the-dictionary-pane .overlay-toolbar button:not(:hover) {\n\
    background: transparent;\n\
    border: none;\n\
}\n\
.the-dictionary-pane .overlay-toolbar button img {\n\
    width: 0.75em;\n\
    height: 0.75em;\n\
}\n\
.the-dictionary-pane .dictionary-list{\n\
    position: absolute;\n\
    top: 0;\n\
    bottom: 2.5em; /* bottom toolbar */\n\
    left: 0;\n\
    right: 0;\n\
    border: 1px ThreeDShadow solid;\n\
}\n\
.the-dictionary-pane .dictionary-list {\n\
    background: white;\n\
    border-left: none;\n\
    border-right: none;\n\
    overflow-x: auto;\n\
    overflow-y: auto;\n\
    padding: 1em 0;\n\
}\n\
.the-dictionary-pane .bottom-toolbar {\n\
    position: absolute;\n\
    bottom: 0;\n\
    left: 0;\n\
    height: 2.5em;\n\
}\n\
.the-dictionary-pane .message-no-dictionaries {\n\
    color: silver;\n\
    font-size: 1.5em;\n\
    text-align: center;\n\
    padding: 2em 0.5em;\n\
    overflow: hidden;\n\
    text-overflow: ellipsis;\n\
    word-break: break-word;\n\
}\n\
.the-dictionary-pane .grayed {\n\
    color: #aaaaaa !important;\n\
}');

  Vue.component('the-dictionary-pane', {
    props: {},
    data: function () {
      return {
        tr: Translate.get,
        dictionaries: null,
        selectedPath: [],
        recentPaths: []
      };
    },
    methods: {
      refresh: function () {
        var self = this;
        Bridge.get('get_dictionaries').then(function (dictionaries) {
          self.dictionaries = dictionaries;
          // Initially select a dictionary. Try to match to a recently viewed dictionary, or default to the first.
          Vue.nextTick(function () {
            self.selectDictionary(self._defaultSelectedDictionary());
          });
        }, function (error) {
          self.dictionaries = null;
          self.$notify('alert', error.message, 'error');
        });
      },
      onAddDictionary: function (event) {
        // In Chromium, disabled button still triggers click event.
        if (!this.dictionaries) return;
        var self = this;
        this.$prompt(tr('Choose a new dictionary name')).then(function (name) {
          var parentPath = self.selectedPath.slice(0, -1);
          var newPath = parentPath.concat(name);
          Bridge.get('add_dictionary', newPath).then(function () {
            // Insert the new path in the dictionaries data object.
            var subtree = findSubtree(self.dictionaries, parentPath);
            // Add the new dictionary only if it does not exist.
            if (!subtreeHasChild(subtree, name)) {
              subtree.push({ name: name });
            }
            // Select the new path
            Vue.nextTick(function () { self.selectDictionary(newPath); });
          }, function (error) {
            self.$notify('alert', error.message, 'error');
          });
        });
      },
      onAddNestedDictionary: function (event) {
        // In Chromium, disabled button still triggers click event.
        if (this._isEmpty(this.dictionaries) || this._isEmpty(this.selectedPath)) return;
        var self = this;
        this.$prompt(tr('Choose a new dictionary name')).then(function (name) {
          var newPath = self.selectedPath.concat(name);
          Bridge.get('add_dictionary', newPath).then(function () {
            // Insert the new path in the dictionaries data object.
            var selectedDictionary = findDictionary(self.dictionaries, self.selectedPath);
            // Add the new dictionary only if it does not exist.
            if (selectedDictionary && !dictionaryHasChild(selectedDictionary, name)) {
              if (!selectedDictionary.children) Vue.set(selectedDictionary, 'children', []);
              selectedDictionary.children.push({ name: name });
            }
            // Select the new path
            Vue.nextTick(function () { self.selectDictionary(newPath); });
          }, function (error) {
            self.$notify('alert', error.message, 'error');
          });
        });
      },
      onRenameDictionary: function (event) {
        // In Chromium, disabled button still triggers click event.
        if (this._isEmpty(this.dictionaries) || this._isEmpty(this.selectedPath)) return;
        var self = this;
        var oldName = self.selectedPath.slice(-1)[0];
        this.$prompt(tr('Choose a new dictionary name'), oldName).then(function (newName) {
          var parentPath = self.selectedPath.slice(0, -1);
          var newPath = parentPath.concat([newName]);
          var subtree = findSubtree(self.dictionaries, parentPath);
          // Add the new dictionary only if it does not exist.
          var dictionaryToRename = findDictionary(self.dictionaries, self.selectedPath);
          if (subtreeHasChild(subtree, newName)) {
            self.$notify('alert', tr('A dictionary with the same name already exists. Please choose a different name.'), 'error');
          } else {
            Bridge.puts('rename_dictionary('+JSON.stringify(self.selectedPath)+', '+JSON.stringify(newName)+')'); ///////////////////////////
            Bridge.get('rename_dictionary', self.selectedPath, newName).then(function () {
              dictionaryToRename.name = newName;
              dictionaryToRename.nonCommonDictionary = false;
              Vue.nextTick(function () { self.selectDictionary(newPath); });
            }, function (error) {
              self.$notify('alert', error.message, 'error');
            });
          }
        });
      },
      onRemoveDictionary: function (event) {
        // In Chromium, disabled button still triggers click event.
        if (this._isEmpty(this.dictionaries) || this._isEmpty(this.selectedPath)) return;
        var self = this;
        Bridge.get('remove_dictionary', self.selectedPath).then(function () {
          var parentPath = self.selectedPath.slice(0, -1);
          var name = self.selectedPath.slice(-1)[0];
          var subtree = findSubtree(self.dictionaries, parentPath);
          var indexOfDictionaryToDelete = subtree.findIndex(function (dictionary) { return dictionary.name === name; });
          subtree.splice(indexOfDictionaryToDelete, 1);
          self.selectDictionary((parentPath.length !== 0) ? parentPath : self._defaultSelectedDictionary());
        }, function (error) {
          self.$notify('alert', error.message, 'error');
        });
      },
      onSelectedDictionary: function (newPath) {
        this.selectedPath = newPath;
        this.recentPaths.push(newPath);
        this.$emit('selectedDictionary', newPath);
      },
      selectDictionary: function (newPath) {
        this.$refs.treeView.selectPath(newPath);
      },
      collapseAll: function () {
        this.$refs.treeView.collapseAll();
        // Since the selected tree item might not be visible anymore, select its top-level parent.
        var newPath = (this.selectedPath && this.selectedPath.length >= 1) ? [this.selectedPath[0]] : this._defaultSelectedDictionary();
        this.selectDictionary(newPath);
      },
      expandAll: function () {
        this.$refs.treeView.expandAll();
      },
      _defaultSelectedDictionary: function () {
        return (!this._isEmpty(this.dictionaries)) ? (
                 findRecentPath(this.dictionaries, this.recentPaths) || 
                 [this.dictionaries[0].name]
               ) :
               [];
      },
      _isEmpty: function (array) {
        return !array || array.length == 0;
      }
    },
    template:
'<div class="the-dictionary-pane">\n\
  <div class="overlay-toolbar right">\n\
    <button @click="expandAll()" \n\
            :title="tr(\'Expand all\')">\n\
      <img src="../images/expand-all.svg" />\n\
    </button>\n\
    <button @click="collapseAll()" \n\
            :title="tr(\'Collapse all\')" >\n\
      <img src="../images/collapse-all.svg" />\n\
    </button>\n\
  </div>\n\
  <div class="a11ytree dictionary-list">\n\
    <tree-view v-show="!_isEmpty(dictionaries)" \n\
               ref="treeView" \n\
               :children="dictionaries" \n\
               @selected="onSelectedDictionary" />\n\
    <div v-show="_isEmpty(dictionaries)" \n\
               class="message-no-dictionaries">{{tr("No attribute dictionaries")}}</div>\n\
  </div>\n\
  <toolbar class="bottom-toolbar">\n\
    <toolbar-button :title="tr(\'Add a new dictionary\')" image="../images/plus.svg" \n\
                    @click.native="onAddDictionary" :disabled="!dictionaries" />\n\
    <toolbar-button :title="tr(\'Add a nested dictionary\')" image="../images/plus-nested.svg" \n\
                    @click.native="onAddNestedDictionary" :disabled="_isEmpty(dictionaries) || _isEmpty(selectedPath)" />\n\
    <toolbar-button :title="tr(\'Rename the selected dictionary\')" image="../images/rename.svg" \n\
                    @click.native="onRenameDictionary" :disabled="_isEmpty(dictionaries) || _isEmpty(selectedPath)" />\n\
    <toolbar-button :title="tr(\'Remove the selected dictionary\')" image="../images/minus.svg" \n\
                    @click.native="onRemoveDictionary" :disabled="_isEmpty(dictionaries) || _isEmpty(selectedPath)" />\n\
  </toolbar>\n\
</div>'
  });

  function findDictionary (dictionaries, path) {
    var dictionary = null;
    path = [].concat(path);
    while (path.length > 0) {
      var name = path.shift();
      for (var i = 0; i < dictionaries.length; i++) {
        if (dictionaries[i].name === name) {
          dictionary = dictionaries[i];
          dictionaries = dictionary.children || [];
          break;
        }
      }
    }
    return dictionary;
  }

  function findSubtree (dictionaries, path) {
    if (path.length > 0) {
      return findDictionary(dictionaries, path).children;
    } else {
      return dictionaries;
    }
  }

  function dictionaryHasChild (dictionary, name) {
    return dictionary && dictionary.children && !!dictionary.children.find(function (child) { return !name || child.name === name});
  }

  function subtreeHasChild (subtree, name) {
    return subtree && !!subtree.find(function (child) { return !name || child.name === name});
  }

  /**
   * Given a path of node labels and a tree, it descends the nodes from the 
   * tree's root and returns the common path.
   * @param {Array<string>} path
   * @param {Array<{name: string, children: Array}>} tree
   * @returns {Array<string>} the part of the given path that is also a path of the tree.
   */
  function findCommonPathInDictionaries(path, tree) {
    var nextNode, name;
    var j = 0;
    while (tree != null && j < path.length) {
      if (tree.length == 0) break;
      name = path[j];
      nextNode = tree.find(function (child) { return child.name === name });
      if (!nextNode) break;
      tree = nextNode.children;
      j++;
    }
    return path.slice(0, j);
  }

  /**
   * Finds the recently viewed path that best matches the current tree.
   */
  function findRecentPath (dictionaries, recentPaths) {
    var longest = null;
    // If there are recently viewed paths, try to choose the longest that is available in the current tree.
    for (var i = recentPaths.length - 1; i >= 0; i--) {
      var common = findCommonPathInDictionaries(recentPaths[i], dictionaries);
      if (!longest && common.length > 0 || longest && common.length > longest.length) {
        longest = common;
      }
    }
    return longest;
  }

});
