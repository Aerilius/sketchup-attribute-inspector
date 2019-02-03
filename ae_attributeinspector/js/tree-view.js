define(['vue'], function (Vue) {

  var LIST_SELECTOR          = 'ul',
      LIST_ITEM_SELECTOR = 'li';
  var ID_ATTR_NAME           = 'id', 
      ITEM_ID_PREFIX = 'at', 
      ITEM_ID_DATA_ATTR = 'at-identity', 
      NODE_LABEL_SUFFIX = '-label', 
      NODE_ID_PREFIX = '-n';
  var TABINDEX_ATTR_NAME     = 'tabindex';
  var KEYDOWN_EVENT          = 'keydown', 
      CLICK_EVENT = 'click';
  var ROLE_ATTR_NAME         = 'role', 
      ARIA_LEVEL_ATTR_NAME = 'aria-level';
  var ARIA_TREE_ROLE         = 'tree', 
      ARIA_TREEITEM_ROLE = 'treeitem', 
      ARIA_GROUP_ROLE = 'group';
  var ARIA_SELECTED_ATTR     = 'aria-selected', 
      ARIA_HIDDEN_ATTR = 'aria-hidden', 
      ARIA_EXPANDED_ATTR = 'aria-expanded', 
      ARIA_ACTIVEDESCENDANT_ATTR = 'aria-activedescendant', 
      ARIA_LABELLEDBY_ATTR = 'aria-labelledby';
  var EXPANDED_ITEM_SELECTOR = 'li[aria-expanded="true"]', 
      ITEM_SELECTED_SELECTOR = '[aria-selected="true"]';
  var HAS_CHILDREN_CLASS     = 'at-has-children', 
      HAS_CHILDREN_CLASS_SELECTOR = '.' + HAS_CHILDREN_CLASS;
  var NO_CHILDREN_CLASS      = 'at-no-children';
  var TOGGLE_CLASS           = 'at-toggle', 
      TOGGLE_CLASS_SELECTOR = '.' + TOGGLE_CLASS;
  var DOWN_ARROW_KEY         = 40, 
      UP_ARROW_KEY = 38, 
      RIGHT_ARROW_KEY = 39, 
      LEFT_ARROW_KEY = 37, 
      ENTER_KEY = 13, 
      END_KEY = 35, 
      HOME_KEY = 36;

  Vue.component('tree-view-node', {
    props: {
      name: String,
      children: {
        type: Array,
        default: function () { return []; }
      },
      parentPath: {
        type: Array,
        default: []
      },
      nonCommonDictionary: {
        type: Boolean,
        default: false
      },
      tree: Object
    },
    data: function () {
      return {
        expanded: false
      }
    },
    computed: {
      id: function () {
        return this.path.join('-');
      },
      path: function () {
        return this.parentPath.slice().concat([this.name]);
      },
      selected: function () {
        return (this.tree.selectedInstance && this.tree.selectedInstance.id) === this.id;
      }
    },
    methods: {
      handleClickSelect: function (event) {
        this.tree._selectInstance(this);
      },
      toggleExpand: function (event) {
        this.expanded = !this.expanded;
      }
    },
    template:
  '<li :id="id" \n\
       :aria-selected="String(selected)" \n\
       :aria-expanded="String(expanded)" \n\
       :class="{ \'at-has-children\': children }" \n\
       @click.stop="handleClickSelect" \n\
       role="treeitem" aria-level="1">\n\
    <div v-if="children && Object.keys(children).length > 0" \n\
         @click="toggleExpand" \n\
         class="at-toggle" aria-hidden="true" ></div>\n\
    <div class="tree-view-node-label" :class="{grayed: nonCommonDictionary}">{{ name }}</div>\n\
    <tree-view-subtree v-if="children" \n\
                       :children="children" \n\
                       :parentPath="path" \n\
                       :tree="tree" />\n\
  </li>'
  });

  Vue.component('tree-view-subtree', {
    props: ['children', 'parentPath', 'tree'],
    template:
  '<ul role="tree" tabindex="0">\n\
    <tree-view-node v-for="node in children" \n\
                   :key="node.name" \n\
                   :parentPath="parentPath" \n\
                   :name="node.name" \n\
                   :nonCommonDictionary="node.nonCommonDictionary" \n\
                   :children="node.children" \n\
                   :tree="tree" />\n\
  </ul>'
  });

  Vue.component('tree-view', {
    props: ['children'],
    data: function () {
      return {
        selectedInstance: null,
      };
    },
    methods: {
      onKeyDown: function (event) {
        switch (event.which) {
          case DOWN_ARROW_KEY:
            this._selectInstance(this._nextVisible(this.selectedInstance));
            break;
          case UP_ARROW_KEY:
            this._selectInstance(this._previousVisible(this.selectedInstance));
            break;
          case RIGHT_ARROW_KEY:
            if (this._hasChildren(this.selectedInstance)) {
              this.selectedInstance.expanded = true;
              this._selectInstance(this._firstChild(this.selectedInstance));
            }
            break;
          case LEFT_ARROW_KEY:
            if (this._hasParent(this.selectedInstance)) {
              var parent = this._parent(this.selectedInstance);
              parent.expanded = false;
              this._selectInstance(parent);
            }
            break;
          case ENTER_KEY:
            this.selectedInstance.expanded = !this.selectedInstance.expanded;
            break;
          case END_KEY:
            if (this.selectedInstance.$parent) {
              this._selectInstance(this._lastSibling(this.selectedInstance));
            }
            break;
          case HOME_KEY:
            if (this.selectedInstance.$parent) {
              this._selectInstance(this._firstSibling(this.selectedInstance));
            }
        }
      },
      collapseAll: function () {
        var subtree = this.$children[0];
        this._recurse(subtree, function (instance) {
          instance.expanded = false;
        });
      },
      expandAll: function () {
        var subtree = this.$children[0];
        this._recurse(subtree, function (instance) {
          instance.expanded = true;
        });
      },
      selectPath: function (path) {
        var instance;
        var subtree = this.$children[0].$children;
        for (var i = 0; i < path.length; i++) {
          for (var j = 0; j < subtree.length; j++) {
            if (subtree[j].name === path[i]) {
              instance = subtree[j];
              instance.expanded = true;
              subtree = instance.$children[0].$children;
              continue;
            }
          }
        }
        this._selectInstance(instance);
        /*var subtree = this.$children[0];
        this._recurse(subtree, function (instance) {
          if (shallowArrayEqual(instance.path, path)) {
            this._selectInstance(instance);
            return true; // break
          }
        });*/
      },
      _selectInstance: function (treeNodeInstance) {
        if (treeNodeInstance) {
          this.selectedInstance = treeNodeInstance;
          this.$emit('selected', treeNodeInstance.path);
          this.$el.setAttribute('aria-activedescendant', treeNodeInstance.id);
        } else {
          this.selectedInstance = null;
          this.$emit('selected', []);
          this.$el.removeAttribute('aria-activedescendant');
        }
      },
      _recurse: function (tree, visitor) {
        for (var i = 0; i < tree.$children.length; i++) {
          var child = tree.$children[i];
          if (visitor.call(this, child) == true) return;
          if (this._hasChildren(child)) {
            this._recurse(child.$children[0], visitor);
          }
        }
      },
      _previousVisible: function (instance) {
        var previousInstance = this._previousSibling(instance);
        // Previous sibling node
        if (previousInstance) {
          if (previousInstance.expanded && this._hasChildren(previousInstance)) {
            return this._lastChild(previousInstance);
          } else {
            return previousInstance;
          }
        } else if (this._hasParent(instance)) {
          // Parent node
          return this._parent(instance);
        }
      },
      _nextVisible: function (instance) {
        // Child node if visible
        if (instance && this._hasChildren(instance) && instance.expanded) {
          return this._firstChild(instance);
        } else {
          // Next sibling node
          var currentInstance = instance;
          var nextSibling;
          while (currentInstance) {
            nextSibling = this._nextSibling(currentInstance);
            if (nextSibling) {
              return nextSibling;
            } else {
              // Parent node's sibling node
              currentInstance = (this._hasParent(instance) && instance.$parent !== this) ? instance.$parent.$parent : undefined;
            }
          }
        }
      },
      _hasParent: function (instance) {
        return instance && instance.$parent && instance.$parent !== this && instance.$parent.$parent && instance.$parent.$parent !== this;
      },
      _hasChildren: function (instance) {
        return instance && instance.$children && instance.$children.length > 0 && instance.$children[0].$children.length > 0;
      },
      _parent: function (instance) {
        return instance.$parent.$parent;
      },
      _firstChild: function (instance) {
        return instance && instance.$children[0] && instance.$children[0].$children[0];
      },
      _lastChild: function (instance) {
        return instance && instance.$children[0] && instance.$children[0].$children[instance.$children[0].$children.length - 1];
      },
      _firstSibling: function (instance) {
        return instance.$parent && instance.$parent.$children.length > 0 && instance.$parent.$children[0];
      },
      _previousSibling: function (instance) {
        if (instance && instance.$parent) {
          var siblings = instance.$parent.$children;
          var index = siblings.indexOf(instance);
          if (index > 0) {
            return siblings[index - 1];
          }
        }
      },
      _nextSibling: function (instance) {
        if (instance && instance.$parent) {
          var siblings = instance.$parent.$children;
          var index = siblings.indexOf(instance);
          if (0 <= index && index < siblings.length - 1) {
            return siblings[index + 1];
          }
        }
      },
      _lastSibling: function (instance) {
        return instance.$parent && instance.$parent.$children.length > 0 && instance.$parent.$children[instance.$parent.$children.length - 1];
      }
    },
    template: '<tree-view-subtree ref="root" \n\
                                  aria-activedescendant="selectedInstance && selectedInstance.id" \n\
                                  :children="children" \n\
                                  :parentPath="[]" \n\
                                  :tree="this" \n\
                                  @keydown.native="onKeyDown" />'
  });

  /**
   * Returns whether all members of two arrays are identical.
   */
  function shallowArrayEqual (array1, array2) {
    if (!(array1 instanceof Array)) return false;
    if (!(array2 instanceof Array)) return false;
    if (array1.length != array2.length) return false;
    for (var i = 0; i < array1.length; i++) {
      if (array1[i] != array2[i]) return false;
    }
    return true;
  }

});
