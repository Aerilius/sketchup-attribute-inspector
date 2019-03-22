<template>
  <div class="clip-box">
    <div class="toolbar vertical-centered-parent">
      <slot/>
    </div>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss">
/* Clip content: Injected div as workaround because elements with table layout ignore height and overflow. */
.clip-box {
    height:inherit;
    overflow: hidden;
}
</style>
