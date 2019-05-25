<template>
  <ul
    role="tree"
    tabindex="0"
  >
    <TreeViewNode
      v-for="node in children"
      :key="node.name"
      :parent-path="parentPath"
      :name="node.name"
      :non-common-dictionary="node.nonCommonDictionary"
      :children="node.children"
      :tree="tree"
    />
  </ul>
</template>

<script>
import TreeViewNode from './tree-view-node.vue'

export default {
  components: { TreeViewNode },
  props: {
    children: {
      type: Array,
      default: () => [],
    },
    parentPath: {
      type: Array,
      default: () => [],
    },
    tree: {
      type: Object,
      default: () => { return {} },
    },
  },
}
</script>

<style lang="scss"></style>
