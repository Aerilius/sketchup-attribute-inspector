<template>
  <div class="left vertical-centered-parent">
    <slot/>
  </div>
</template>

<script>
import Vue from 'vue'
import ToolbarButton from './toolbar-button.vue'

export default {
  components: {ToolbarButton}
}
</script>

<style lang="scss" scoped>
</style>
