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
    >
      {{ name }}
    </div>
    <tree-view-subtree
      v-if="children"
      :children="children"
      :parent-path="path"
      :tree="tree"
    />
  </li>
</template>

<script>
export default {
  components: {},
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

<style lang="scss"></style>
