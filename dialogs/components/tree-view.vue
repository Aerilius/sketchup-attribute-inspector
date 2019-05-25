<template>
  <TreeViewSubtree
    ref="root"
    aria-activedescendant="selectedInstance && selectedInstance.id"
    :children="children"
    :parent-path="[]"
    :tree="this"
    @keydown.native="onKeyDown"
  />
</template>

<script>
import TreeViewSubtree from './tree-view-subtree.vue'
import {DOWN_ARROW_KEY, UP_ARROW_KEY, RIGHT_ARROW_KEY, LEFT_ARROW_KEY, ENTER_KEY, END_KEY, HOME_KEY} from './tree-view-base.js'

export default {
  components: { TreeViewSubtree },
  props: {
    children: {
      type: Array,
      default: () => [],
    },
  },
  data () {
    return {
      selectedInstance: null,
    }
  },
  methods: {
    onKeyDown (event) {
      switch (event.which) {
        case DOWN_ARROW_KEY:
          this._selectInstance(this._nextVisible(this.selectedInstance))
          break
        case UP_ARROW_KEY:
          this._selectInstance(this._previousVisible(this.selectedInstance))
          break
        case RIGHT_ARROW_KEY:
          if (this._hasChildren(this.selectedInstance)) {
            this.selectedInstance.expanded = true
            this._selectInstance(this._firstChild(this.selectedInstance))
          }
          break
        case LEFT_ARROW_KEY:
          if (this._hasParent(this.selectedInstance)) {
            let parent = this._parent(this.selectedInstance)
            parent.expanded = false
            this._selectInstance(parent)
          }
          break
        case ENTER_KEY:
          this.selectedInstance.expanded = !this.selectedInstance.expanded
          break
        case END_KEY:
          if (this.selectedInstance.$parent) {
            this._selectInstance(this._lastSibling(this.selectedInstance))
          }
          break
        case HOME_KEY:
          if (this.selectedInstance.$parent) {
            this._selectInstance(this._firstSibling(this.selectedInstance))
          }
      }
    },
    collapseAll () {
      let subtree = this.$children[0]
      this._recurse(subtree, function(instance) {
        instance.expanded = false
      })
    },
    expandAll () {
      let subtree = this.$children[0]
      this._recurse(subtree, function(instance) {
        instance.expanded = true
      })
    },
    selectPath (path) {
      let instance
      let subtree = this.$children[0].$children
      for (let i = 0; i < path.length; i++) {
        for (let j = 0; j < subtree.length; j++) {
          if (subtree[j].name === path[i]) {
            instance = subtree[j]
            instance.expanded = true
            subtree = instance.$children[0].$children
            continue
          }
        }
      }
      this._selectInstance(instance)
      /*var subtree = this.$children[0];
      this._recurse(subtree, function (instance) {
        if (shallowArrayEqual(instance.path, path)) {
          this._selectInstance(instance);
          return true; // break
        }
      });*/
    },
    _selectInstance (treeNodeInstance) {
      if (treeNodeInstance) {
        this.selectedInstance = treeNodeInstance
        this.$emit('selected', treeNodeInstance.path)
        this.$el.setAttribute('aria-activedescendant', treeNodeInstance.id)
      } else {
        this.selectedInstance = null
        this.$emit('selected', [])
        this.$el.removeAttribute('aria-activedescendant')
      }
    },
    _recurse (tree, visitor) {
      for (let i = 0; i < tree.$children.length; i++) {
        let child = tree.$children[i]
        if (visitor.call(this, child) == true) return
        if (this._hasChildren(child)) {
          this._recurse(child.$children[0], visitor)
        }
      }
    },
    _previousVisible (instance) {
      let previousInstance = this._previousSibling(instance)
      // Previous sibling node
      if (previousInstance) {
        if (previousInstance.expanded && this._hasChildren(previousInstance)) {
          return this._lastChild(previousInstance)
        } else {
          return previousInstance
        }
      } else if (this._hasParent(instance)) {
        // Parent node
        return this._parent(instance)
      }
    },
    _nextVisible (instance) {
      // Child node if visible
      if (instance && this._hasChildren(instance) && instance.expanded) {
        return this._firstChild(instance)
      } else {
        // Next sibling node
        let currentInstance = instance
        let nextSibling
        while (currentInstance) {
          nextSibling = this._nextSibling(currentInstance)
          if (nextSibling) {
            return nextSibling
          } else {
            // Parent node's sibling node
            currentInstance =
              this._hasParent(instance) && instance.$parent !== this
                ? instance.$parent.$parent
                : undefined
          }
        }
      }
    },
    _hasParent (instance) {
      return (
        instance &&
        instance.$parent &&
        instance.$parent !== this &&
        instance.$parent.$parent &&
        instance.$parent.$parent !== this
      )
    },
    _hasChildren (instance) {
      return (
        instance &&
        instance.$children &&
        instance.$children.length > 0 &&
        instance.$children[0].$children.length > 0
      )
    },
    _parent (instance) {
      return instance.$parent.$parent
    },
    _firstChild (instance) {
      return (
        instance && instance.$children[0] && instance.$children[0].$children[0]
      )
    },
    _lastChild (instance) {
      return (
        instance &&
        instance.$children[0] &&
        instance.$children[0].$children[
          instance.$children[0].$children.length - 1
        ]
      )
    },
    _firstSibling (instance) {
      return (
        instance.$parent &&
        instance.$parent.$children.length > 0 &&
        instance.$parent.$children[0]
      )
    },
    _previousSibling (instance) {
      if (instance && instance.$parent) {
        let siblings = instance.$parent.$children
        let index = siblings.indexOf(instance)
        if (index > 0) {
          return siblings[index - 1]
        }
      }
    },
    _nextSibling (instance) {
      if (instance && instance.$parent) {
        let siblings = instance.$parent.$children
        let index = siblings.indexOf(instance)
        if (0 <= index && index < siblings.length - 1) {
          return siblings[index + 1]
        }
      }
    },
    _lastSibling (instance) {
      return (
        instance.$parent &&
        instance.$parent.$children.length > 0 &&
        instance.$parent.$children[instance.$parent.$children.length - 1]
      )
    },
  },
}

/**
 * Returns whether all members of two arrays are identical.
 */
function shallowArrayEqual(array1, array2) {
  if (!(array1 instanceof Array)) return false
  if (!(array2 instanceof Array)) return false
  if (array1.length != array2.length) return false
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] != array2[i]) return false
  }
  return true
}
</script>

<style lang="scss"></style>
