<template>
  <div class="the-dictionary-pane">
    <div class="overlay-toolbar right">
      <button
        :title="tr('Expand all')"
        @click="expandAll()"
      >
        <img src="../images/expand-all.svg">
      </button>
      <button
        :title="tr('Collapse all')"
        @click="collapseAll()"
      >
        <img src="../images/collapse-all.svg">
      </button>
    </div>
    <div class="a11ytree dictionary-list">
      <TreeView
        v-show="!_isEmpty(dictionaries)"
        ref="treeView"
        :children="dictionaries"
        @selected="onSelectedDictionary"
      />
      <div
        v-show="_isEmpty(dictionaries)"
        class="message-no-dictionaries"
      >
        {{ tr('No attribute dictionaries') }}
      </div>
    </div>
    <Toolbar class="bottom-toolbar">
      <ToolbarButton
        :title="tr('Add a new dictionary')"
        image="../images/plus.svg"
        :disabled="!dictionaries"
        @click.native="onAddDictionary"
      />
      <ToolbarButton
        :title="tr('Add a nested dictionary')"
        image="../images/plus-nested.svg"
        :disabled="_isEmpty(dictionaries) || _isEmpty(selectedPath)"
        @click.native="onAddNestedDictionary"
      />
      <ToolbarButton
        :title="tr('Rename the selected dictionary')"
        image="../images/rename.svg"
        :disabled="_isEmpty(dictionaries) || _isEmpty(selectedPath)"
        @click.native="onRenameDictionary"
      />
      <ToolbarButton
        :title="tr('Remove the selected dictionary')"
        image="../images/minus.svg"
        :disabled="_isEmpty(dictionaries) || _isEmpty(selectedPath)"
        @click.native="onRemoveDictionary"
      />
    </Toolbar>
  </div>
</template>

<script>
import Vue from 'vue'
import './tree-view.vue'
import '../vendor/vs-notify.js'
import './vs-prompt.vue'
import Bridge from '../bridge.js'
import TRANSLATE from '../translate.js'
import Toolbar from './toolbar.vue'
import ToolbarButton from './toolbar-button.vue'
import TreeView from './tree-view.vue'

export default {
  components: { Toolbar, ToolbarButton, TreeView },
  props: {},
  data: function() {
    return {
      tr: TRANSLATE.get,
      dictionaries: null,
      selectedPath: [],
      recentPaths: [],
    }
  },
  methods: {
    refresh: function() {
      let self = this
      Bridge.get('get_dictionaries').then(
        function(dictionaries) {
          self.dictionaries = dictionaries
          // Initially select a dictionary. Try to match to a recently viewed dictionary, or default to the first.
          Vue.nextTick(function() {
            self.selectDictionary(self._defaultSelectedDictionary())
          })
        },
        function(error) {
          self.dictionaries = null
          self.$notify('alert', error.message, 'error')
        }
      )
    },
    onAddDictionary: function(event) {
      // In Chromium, disabled button still triggers click event.
      if (!this.dictionaries) return
      let self = this
      this.$prompt(this.tr('Choose a new dictionary name')).then(function(name) {
        let parentPath = self.selectedPath.slice(0, -1)
        let newPath = parentPath.concat(name)
        Bridge.get('add_dictionary', newPath).then(
          function() {
            // Insert the new path in the dictionaries data object.
            let subtree = findSubtree(self.dictionaries, parentPath)
            // Add the new dictionary only if it does not exist.
            if (!subtreeHasChild(subtree, name)) {
              subtree.push({ name: name })
            }
            // Select the new path
            Vue.nextTick(function() {
              self.selectDictionary(newPath)
            })
          },
          function(error) {
            self.$notify('alert', error.message, 'error')
          }
        )
      })
    },
    onAddNestedDictionary: function(event) {
      // In Chromium, disabled button still triggers click event.
      if (this._isEmpty(this.dictionaries) || this._isEmpty(this.selectedPath))
        return
      let self = this
      this.$prompt(this.tr('Choose a new dictionary name')).then(function(name) {
        let newPath = self.selectedPath.concat(name)
        Bridge.get('add_dictionary', newPath).then(
          function() {
            // Insert the new path in the dictionaries data object.
            let selectedDictionary = findDictionary(
              self.dictionaries,
              self.selectedPath
            )
            // Add the new dictionary only if it does not exist.
            if (
              selectedDictionary &&
              !dictionaryHasChild(selectedDictionary, name)
            ) {
              if (!selectedDictionary.children)
                Vue.set(selectedDictionary, 'children', [])
              selectedDictionary.children.push({ name: name })
            }
            // Select the new path
            Vue.nextTick(function() {
              self.selectDictionary(newPath)
            })
          },
          function(error) {
            self.$notify('alert', error.message, 'error')
          }
        )
      })
    },
    onRenameDictionary: function(event) {
      // In Chromium, disabled button still triggers click event.
      if (this._isEmpty(this.dictionaries) || this._isEmpty(this.selectedPath))
        return
      let self = this
      let oldName = self.selectedPath.slice(-1)[0]
      this.$prompt(this.tr('Choose a new dictionary name'), oldName).then(function(
        newName
      ) {
        let parentPath = self.selectedPath.slice(0, -1)
        let newPath = parentPath.concat([newName])
        let subtree = findSubtree(self.dictionaries, parentPath)
        // Add the new dictionary only if it does not exist.
        let dictionaryToRename = findDictionary(
          self.dictionaries,
          self.selectedPath
        )
        if (subtreeHasChild(subtree, newName)) {
          self.$notify(
            'alert',
            this.tr(
              'A dictionary with the same name already exists. Please choose a different name.'
            ),
            'error'
          )
        } else {
          Bridge.puts(
            'rename_dictionary(' +
              JSON.stringify(self.selectedPath) +
              ', ' +
              JSON.stringify(newName) +
              ')'
          ) ///////////////////////////
          Bridge.get('rename_dictionary', self.selectedPath, newName).then(
            function() {
              dictionaryToRename.name = newName
              dictionaryToRename.nonCommonDictionary = false
              Vue.nextTick(function() {
                self.selectDictionary(newPath)
              })
            },
            function(error) {
              self.$notify('alert', error.message, 'error')
            }
          )
        }
      })
    },
    onRemoveDictionary: function(event) {
      // In Chromium, disabled button still triggers click event.
      if (this._isEmpty(this.dictionaries) || this._isEmpty(this.selectedPath))
        return
      let self = this
      Bridge.get('remove_dictionary', self.selectedPath).then(
        function() {
          let parentPath = self.selectedPath.slice(0, -1)
          let name = self.selectedPath.slice(-1)[0]
          let subtree = findSubtree(self.dictionaries, parentPath)
          let indexOfDictionaryToDelete = subtree.findIndex(function(
            dictionary
          ) {
            return dictionary.name === name
          })
          subtree.splice(indexOfDictionaryToDelete, 1)
          self.selectDictionary(
            parentPath.length !== 0
              ? parentPath
              : self._defaultSelectedDictionary()
          )
        },
        function(error) {
          self.$notify('alert', error.message, 'error')
        }
      )
    },
    onSelectedDictionary: function(newPath) {
      this.selectedPath = newPath
      this.recentPaths.push(newPath)
      let selectedDictionary = findDictionary(
        this.dictionaries,
        newPath
      )
      this.$emit('onSelectedDictionary', newPath, selectedDictionary)
    },
    selectDictionary: function(newPath) {
      this.$refs.treeView.selectPath(newPath)
    },
    collapseAll: function() {
      this.$refs.treeView.collapseAll()
      // Since the selected tree item might not be visible anymore, select its top-level parent.
      let newPath =
        this.selectedPath && this.selectedPath.length >= 1
          ? [this.selectedPath[0]]
          : this._defaultSelectedDictionary()
      this.selectDictionary(newPath)
    },
    expandAll: function() {
      this.$refs.treeView.expandAll()
    },
    _defaultSelectedDictionary: function() {
      return !this._isEmpty(this.dictionaries)
        ? findRecentPath(this.dictionaries, this.recentPaths) || [
            this.dictionaries[0].name,
          ]
        : []
    },
    _isEmpty: function(array) {
      return !array || array.length == 0
    },
  },
}

function findDictionary(dictionaries, path) {
  let dictionary = null
  path = [].concat(path)
  while (path.length > 0) {
    let name = path.shift()
    for (let i = 0; i < dictionaries.length; i++) {
      if (dictionaries[i].name === name) {
        dictionary = dictionaries[i]
        dictionaries = dictionary.children || []
        break
      }
    }
  }
  return dictionary
}

function findSubtree(dictionaries, path) {
  if (path.length > 0) {
    return findDictionary(dictionaries, path).children
  } else {
    return dictionaries
  }
}

function dictionaryHasChild(dictionary, name) {
  return (
    dictionary &&
    dictionary.children &&
    !!dictionary.children.find(function(child) {
      return !name || child.name === name
    })
  )
}

function subtreeHasChild(subtree, name) {
  return (
    subtree &&
    !!subtree.find(function(child) {
      return !name || child.name === name
    })
  )
}

/**
 * Given a path of node labels and a tree, it descends the nodes from the
 * tree's root and returns the common path.
 * @param {Array<string>} path
 * @param {Array<{name: string, children: Array}>} tree
 * @returns {Array<string>} the part of the given path that is also a path of the tree.
 */
function findCommonPathInDictionaries(path, tree) {
  let nextNode, name
  let j = 0
  while (tree != null && j < path.length) {
    if (tree.length == 0) break
    name = path[j]
    nextNode = tree.find(function(child) {
      return child.name === name
    })
    if (!nextNode) break
    tree = nextNode.children
    j++
  }
  return path.slice(0, j)
}

/**
 * Finds the recently viewed path that best matches the current tree.
 */
function findRecentPath(dictionaries, recentPaths) {
  let longest = null
  // If there are recently viewed paths, try to choose the longest that is available in the current tree.
  for (let i = recentPaths.length - 1; i >= 0; i--) {
    let common = findCommonPathInDictionaries(recentPaths[i], dictionaries)
    if (
      (!longest && common.length > 0) ||
      (longest && common.length > longest.length)
    ) {
      longest = common
    }
  }
  return longest
}
</script>

<style lang="scss">
/* Overlay toolbar for small buttons to expand/collapse the treeview */
.the-dictionary-pane .overlay-toolbar {
  position: absolute;
  z-index: 1;
}
.the-dictionary-pane .overlay-toolbar.right {
  right: 0;
  float: right;
}
.the-dictionary-pane .overlay-toolbar button {
  width: 1.25em;
  height: 1.25em;
  /* Add some space to avoid overlap with container border */
  position: relative;
  top: 1px;
  right: 1px;
  -moz-appearance: none;
}
.the-dictionary-pane .overlay-toolbar button:not(:hover) {
  background: transparent;
  border: none;
}
.the-dictionary-pane .overlay-toolbar button img {
  width: 0.75em;
  height: 0.75em;
}
.the-dictionary-pane .dictionary-list {
  position: absolute;
  top: 0;
  bottom: 2.5em; /* bottom toolbar */
  left: 0;
  right: 0;
  border: 1px ThreeDShadow solid;
}
.the-dictionary-pane .dictionary-list {
  background: white;
  border-left: none;
  border-right: none;
  overflow-x: auto;
  overflow-y: auto;
  padding: 1em 0;
}
.the-dictionary-pane .bottom-toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2.5em;
}
.the-dictionary-pane .message-no-dictionaries {
  color: silver;
  font-size: 1.5em;
  text-align: center;
  padding: 2em 0.5em;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
}
.the-dictionary-pane .grayed {
  color: #aaaaaa !important;
}
</style>
