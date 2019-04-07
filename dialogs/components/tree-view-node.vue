<template>
  <li
    :id="id"
    :aria-selected="String(selected)"
    :aria-expanded="String(expanded)"
    :class="{ 'at-has-children': children }"
    role="treeitem"
    aria-level="1"
    @click.stop="handleClickSelect"
  >
    <div
      v-if="children && Object.keys(children).length > 0"
      class="at-toggle"
      aria-hidden="true"
      @click="toggleExpand"
    />
    <div
      class="tree-view-node-label"
      :class="{ grayed: nonCommonDictionary }"
    >{{ name }}</div>
    <TreeViewSubtree
      v-if="children"
      :children="children"
      :parent-path="path"
      :tree="tree"
    />
  </li>
</template>

<script>
import TreeViewSubtree from './tree-view-subtree.vue'

export default {
  components: {TreeViewSubtree},
  beforeCreate () {
    // Resolve circular import at runtime
    // (https://vuejs.org/v2/guide/components-edge-cases.html#Circular-References-Between-Components)
    this.$options.components.TreeViewSubtree = require('./tree-view-subtree.vue').default
  },
  props: {
    name: {
      type: String,
      default: '',
    },
    children: {
      type: Array,
      default: () => [],
    },
    parentPath: {
      type: Array,
      default: () => [],
    },
    nonCommonDictionary: {
      type: Boolean,
      default: false,
    },
    tree: {
      type: Object,
      default: () => { return {} },
    },
  },
  data () {
    return {
      expanded: false,
    }
  },
  computed: {
    id () {
      return this.path.join('-')
    },
    path () {
      return this.parentPath.slice().concat([this.name])
    },
    selected () {
      return (
        (this.tree.selectedInstance && this.tree.selectedInstance.id) ===
        this.id
      )
    },
  },
  methods: {
    handleClickSelect (event) {
      this.tree._selectInstance(this)
    },
    toggleExpand (event) {
      this.expanded = !this.expanded
    },
  },
}
</script>

<style lang="scss">
li .tree-view-node-label {
  display: block;
  border: dotted 1px #eee;
  margin-top: -1px; /* for collapsing dotted borders */
  padding: 0.2em 0.2em;
  white-space: pre;
  min-height: 1em; /* to prevent zero height box when empty text */
}
</style>
