<template>
  <div class="vertical-centered">
    <button
      :title="title"
      :disabled="disabled"
    >
      <img
        v-if="image"
        :src="image"
      />
      <slot />
    </button>
  </div>
</template>

<script>
import Vue from 'vue'

export default {
  props: {
    image: {
      type: String,
      default: null,
    },
    title: {
      type: String,
      default: null,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="scss" scoped>
button {
  min-height: 1.25em; /* For Safari, which ignores all other/smaller button size properties. */
  line-height: 1.25em;
  min-width: 1.25em;
  padding: 0;
  overflow: hidden;
  text-align: center;
  vertical-align: middle;
}
button > img {
  vertical-align: middle;
  width: 1em;
  height: 1em;
  padding: 0.125em;
}
button:disabled > img {
  opacity: 0.3;
}
</style>
