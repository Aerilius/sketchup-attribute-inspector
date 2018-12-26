/*
idea:
keyboard events handlers should not operate on html elements (jquery)
but vue components or data (?) or props (?)
- collapse: changes ARIA_EXPANDED_ATTR
- focusOn:
  - sets all to ARIA_EXPANDED_ATTR = false
  - sets one to ARIA_EXPANDED_ATTR = true
  - sets tree ARIA_ACTIVEDESCENDANT_ATTR to $item.attr(ID_ATTR_NAME)
  - emits 'selected' with node.name
=>
- instead of traversing html with jquery, traverse data or props
- instead of changing ARIA_EXPANDED_ATTR, change prop selected
- set or bind tree ARIA_ACTIVEDESCENDANT_ATTR to leaf component id
*/

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
  props: ['name', 'children', 'selected', 'tree'],
  data: function () {
    return {
      expanded: true,
      //selected: false
    }
  },
  methods: {
    onSelected: function (path) {
      path.unshift(this.name);
      this.$emit('selected', path);
    },
    handleClickSelect: function (event) {
      var $item = $(this.$el);
      var $tree = $(this.tree.$el);
      this.focusOn($item, $tree);
    },
    handleClickToggle: function (event) {
      var $listItemWithToggle = $(event.target).parent(LIST_ITEM_SELECTOR);
      this.toggleExpandCollapse();
    },
    focusOn: function ($item, $tree) {
      if ($item.length === 1) {
        $tree.find(LIST_ITEM_SELECTOR).attr(ARIA_SELECTED_ATTR, 'false');
        $item.attr(ARIA_SELECTED_ATTR, 'true');
        $tree.attr(ARIA_ACTIVEDESCENDANT_ATTR, $item.attr(ID_ATTR_NAME));
        //if (this.options.onFocus) {
        //  this.options.onFocus($item);
        //} emit event!!!!!
        this.$emit('selected', [this.name]);
      } else { console.log('focusOn with more than one element', $item)}/////////////////
    },
    isExpanded: function () {
        var $item = $(this.$el);
        return $item.attr(ARIA_EXPANDED_ATTR) === 'true';
    },
    isCollapsed: function () {
        var $item = $(this.$el);
        return $item.attr(ARIA_EXPANDED_ATTR) === 'false';
    },
    expand: function () {
        //if (this.options.onExpand) {
        //    this.options.onExpand($item, event);
        //}
        var $item = $(this.$el);
        var $tree = $(this.$root.$el);
        $item.attr(ARIA_EXPANDED_ATTR, 'true');
        $item.parentsUntil($tree, 'li').each(function (i, item) {
            $(item).attr(ARIA_EXPANDED_ATTR, 'true');
        });
    },
    collapse: function () {
        //if (this.options.onCollapse) {
        //    this.options.onCollapse($item, event);
        //}
        $(this.$el).attr(ARIA_EXPANDED_ATTR, 'false');
    },
    toggleExpandCollapse: function () {
        if (this.isCollapsed()) {
            this.expand();
        } else {
            this.collapse();
        }
    },
  },
  template:
'<li :class="{ \'at-has-children\': children }" \n\
     :aria-selected="selected" \n\
     @click.stop="handleClickSelect" \n\
     role="treeitem" aria-level="1" aria-expanded="false">\n\
  <div v-if="children && Object.keys(children).length > 0" \n\
       @click="handleClickToggle" \n\
       class="at-toggle" aria-hidden="true" ></div>\n\
  <div class="tree-view-node-label">{{ name }}</div>\n\
  <tree-view-subtree v-if="children" \n\
                     :children="children" \n\
                     :tree="tree" \n\
                     @selected="onSelected" />\n\
</li>'
});


Vue.component('tree-view-subtree', {
  props: ['children', 'tree'],
  methods: {
    onSelected: function (path) {
      this.$emit('selected', path);
    }
  },
  template:
'<ul role="tree" tabindex="0">\n\
  <tree-view-node v-for="node in children" \n\
                 :key="node.name" \n\
                 :name="node.name" \n\
                 :children="node.children" \n\
                 :selected="node.selected" \n\
                 :tree="tree" \n\
                 @selected="onSelected" />\n\
</ul>'
});


Vue.component('tree-view', {
  props: ['children'],
  data: function () {
    return {
      htmlElementToVueComponent: {}
    };
  },
  methods: {
    onSelected: function (path) {
      this.$emit('selected', path);
    },
    handleKeys: function (event) {
      var $tree = $(this.$refs.root.$el);
      var $currentFocusedElement = $tree.find(ITEM_SELECTED_SELECTOR);
      switch (event.which) {
        case DOWN_ARROW_KEY:
          event.preventDefault();
          event.stopImmediatePropagation(); // PATCH: Otherwise IE8 would trigger on newly selected item and jump over several steps.
          this.handleDownArrowKey($currentFocusedElement, $tree);
          break;
        case UP_ARROW_KEY:
          event.preventDefault();
          event.stopImmediatePropagation();
          this.handleUpArrowKey($currentFocusedElement, $tree);
          break;
        case RIGHT_ARROW_KEY:
          event.preventDefault();
          event.stopImmediatePropagation();
          this.handleRightArrowKey($currentFocusedElement, $tree, event);
          break;
        case LEFT_ARROW_KEY:
          event.preventDefault();
          event.stopImmediatePropagation();
          this.handleLeftArrowKey($currentFocusedElement, $tree, event);
          break;
        case ENTER_KEY:
          event.stopImmediatePropagation();
          this.handleEnterKey($currentFocusedElement, event);
          break;
        case END_KEY:
          event.preventDefault();
          event.stopImmediatePropagation();
          this.handleEndKey($currentFocusedElement, $tree);
          break;
        case HOME_KEY:
          event.preventDefault();
          event.stopImmediatePropagation();
          this.handleHomeKey($currentFocusedElement, $tree);
        }
    },
    handleLeftArrowKey: function ($item, $tree, event) {
      if (this.isExpanded($item)) {
        this.collapse($item, event);
      } else {
        this.focusOn(this.findParent($item), $tree);
      }
    },
    handleRightArrowKey: function ($item, $tree, event) {
      if (this.isCollapsed($item)) {
        this.expand($item, event);
      } else if (this.isExpanded($item)) {
        this.focusOn(this.findFirstListItemInSubList($item), $tree);
      }
    },
    handleUpArrowKey: function ($item, $tree) {
      var $prevSibling = $item.prev();
      if (this.isExpanded($prevSibling)) {
        this.focusOnLastVisibleElementInTree($prevSibling.children(LIST_SELECTOR), $tree);
      } else if ($item.prev().length === 0) {
        this.focusOn(this.findParent($item), $tree);
      } else {
        this.focusOn($item.prev(), $tree);
      }
    },
    handleDownArrowKey: function ($item, $tree) {
      if (this.hasChildren($item) && this.isExpanded($item)) {
        this.focusOn(this.findFirstListItemInSubList($item), $tree);
      } else {
        this.focusOnNextAvailableSiblingInTree($item, $tree);
      }
    },
    handleEnterKey: function ($item, event) {
      this.toggleExpandCollapse($item, event);
    },
    handleEndKey: function ($item, $tree) {
      this.focusOnLastVisibleElementInTree($tree);
    },
    handleHomeKey: function ($item, $tree) {
      this.focusOn(this.findFirstListItem($tree), $tree);
    },
    expand: function ($item, event) {
        //if (this.options.onExpand) {
        //    this.options.onExpand($item, event);
        //}
        $item.attr(ARIA_EXPANDED_ATTR, 'true');
        $item.parentsUntil($(this.element), 'li').each(function (i, item) {
            $(item).attr(ARIA_EXPANDED_ATTR, 'true');
        });
    },
    collapse: function ($item, event) {
        //if (this.options.onCollapse) {
        //    this.options.onCollapse($item, event);
        //}
        $item.attr(ARIA_EXPANDED_ATTR, 'false');
    },
    isExpanded: function ($item) {
        return $item.attr(ARIA_EXPANDED_ATTR) === 'true';
    },
    isCollapsed: function ($item) {
        return $item.attr(ARIA_EXPANDED_ATTR) === 'false';
    },
    toggleExpandCollapse: function ($item, event) {
        if (this.isCollapsed($item)) {
            this.expand($item, event);
        } else {
            this.collapse($item, event);
        }
    },
    hasChildren: function ($item) {
        return $item.hasClass(HAS_CHILDREN_CLASS);
    },
    isParentTree: function ($list) {
        return $list.attr(ROLE_ATTR_NAME) === ARIA_TREE_ROLE;
    },
    findParent: function ($item) {
        return $item.parent(LIST_SELECTOR).parent(LIST_ITEM_SELECTOR);
    },
    focusOn: function ($item, $tree) {
      if ($item.length === 1) {
        $tree.find(LIST_ITEM_SELECTOR).attr(ARIA_SELECTED_ATTR, 'false');
        $item.attr(ARIA_SELECTED_ATTR, 'true');
        $tree.attr(ARIA_ACTIVEDESCENDANT_ATTR, $item.attr(ID_ATTR_NAME));
        //if (this.options.onFocus) {
        //  this.options.onFocus($item);
        //} emit event!!!!!
        this.$emit('selected', [this.node.name]);/////////////////// TODO: need to trigger from $item node
      } else { console.log('focusOn with more than one element', $item)}/////////////////
    },
    focusOnNextAvailableSiblingInTree: function ($item, $tree) {
        if ($item.length === 0) {
            return;
        }
        if ($item.next().length > 0) {
            this.focusOn($item.next(), $tree);
        } else {
            this.focusOnNextAvailableSiblingInTree(this.findParent($item), $tree);
        }
    },
    focusOnLastVisibleElementInTree: function ($tree, $parentTree) {
        var $lastListItemInTree         = $tree.find(LIST_ITEM_SELECTOR).last();
        var $listWithLastListItemInTree = $lastListItemInTree.parent(LIST_SELECTOR);
        if (!this.isParentTree($listWithLastListItemInTree)) {
            $listWithLastListItemInTree = this.findClosestExpandedTree($tree, $lastListItemInTree);
        }
        this.focusOn(this.findLastListItem($listWithLastListItemInTree), $parentTree || $tree);
    },
    findClosestExpandedTree: function ($tree, $listItem) {
        var $closestExpandedListItem = $listItem.parent(LIST_SELECTOR).closest(EXPANDED_ITEM_SELECTOR);
        if ($closestExpandedListItem.length === 0) {
            return $tree;
        }

        var $parentOfClosestExpandedListItem = $closestExpandedListItem.parent(LIST_SELECTOR).closest(LIST_ITEM_SELECTOR);
        if ($parentOfClosestExpandedListItem.length === 0 || this.isExpanded($parentOfClosestExpandedListItem)) {
            return $closestExpandedListItem.children(LIST_SELECTOR);
        }
        return this.findClosestExpandedTree($tree, $closestExpandedListItem);
    },
    findLastListItem: function ($list) {
        return $list.find(' > li:last-child');
    },
    findFirstListItem: function ($list) {
        return $list.find(' > li:first-child');
    },
    findFirstListItemInSubList: function ($item) {
        return $item.children(LIST_SELECTOR).find(' > li:first-child');
    },
    collapseAll: function () {
      var $tree = $(this.$refs.root.$el);
      $tree.find('li').attr('aria-expanded', 'false');
      // TODO: this.select([selectedPath[0]]);
    },
    expandAll: function () {
      var $tree = $(this.$refs.root.$el);
      $tree.find('li').attr('aria-expanded', 'true');
    }
  },
  template: '<tree-view-subtree ref="root" \n\
                                :children="children" \n\
                                :tree="this" \n\
                                @keydown.native="handleKeys" \n\
                                @selected="onSelected" />'
});
