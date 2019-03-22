<template>
<li :id="id" 
     :aria-selected="String(selected)" 
     :aria-expanded="String(expanded)" 
     :class="{ 'at-has-children': children }" 
     @click.stop="handleClickSelect" 
     role="treeitem" aria-level="1">
  <div v-if="children && Object.keys(children).length > 0" 
       @click="toggleExpand" 
       class="at-toggle" aria-hidden="true" ></div>
  <div class="tree-view-node-label" :class="{grayed: nonCommonDictionary}">{{ name }}</div>
  <tree-view-subtree v-if="children" 
                     :children="children" 
                     :parentPath="path" 
                     :tree="tree" />
</li>
</template>

<script>
export default {
  components: {},
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
  }
}
</script>

<style lang="scss">
</style>
