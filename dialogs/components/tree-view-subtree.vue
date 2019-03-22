<template>
  <ul role="tree" tabindex="0">
    <tree-view-node v-for="node in children" 
                   :key="node.name" 
                   :parentPath="parentPath" 
                   :name="node.name" 
                   :nonCommonDictionary="node.nonCommonDictionary" 
                   :children="node.children" 
                   :tree="tree" />
  </ul>
</template>

<script>
import TreeViewNode from './tree-view-node.vue'

export default {
  components: {TreeViewNode},
  props: ['children', 'parentPath', 'tree']
}
</script>

<style lang="scss">
</style>
