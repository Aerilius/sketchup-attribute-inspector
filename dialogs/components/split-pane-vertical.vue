<template>
  <div class="split-pane-vertical">
    <div ref="leftPane">
      <slot name="left" />
      <DividerVertical
        ref="divider"
        :initial="initial"
      />
    </div>
    <div ref="rightPane">
      <slot name="right" />
    </div>
  </div>
</template>

<script>
import DividerVertical from './divider-vertical.vue'

export default {
  components: { DividerVertical },
  props: {
    initial: {
      type: Number,
      default: function() {
        return 50
      },
    },
  },
  mounted() {
    // We can not declaratively set properties to element references in the template
    // because these elements might not be mounted when the template is parsed.
    this.$refs.divider.setElements(this.$refs.leftPane, this.$refs.rightPane)
  },
}
</script>

<style lang="scss">
.split-pane-vertical > div:first-child {
  position: absolute;
  left: 0;
  width: 50%;
  height: 100%;
}
.split-pane-vertical > div:first-child + div {
  position: absolute;
  right: 0;
  width: 50%;
  height: 100%;
}
</style>
