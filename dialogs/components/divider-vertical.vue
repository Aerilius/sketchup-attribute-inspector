<template>
  <button
    ref="divider"
    class="divider-vertical"
    @mousedown="mousedown"
  />
</template>

<script>
export default {
  props: {
    initial: {
      type: Number,
      default: () => 50,
    },
    percent: {
      type: Boolean,
      default: () => true,
    },
  },
  data() {
    return {
      first: null,
      second: null,
      dim1: 0,
      dim2: 0,
      start: 0,
    }
  },
  methods: {
    setElements(first, second) {
      this.first = first
      this.second = second
      this.dim1 = this.first.offsetWidth
      this.dim2 = this.second.offsetWidth
      this.moveTo(this.initial)
    },
    mousedown(event) {
      // Register the status at the time of start.
      this.initMove(event)
      let move = this.move
      function removeEventListeners(event) {
        window.document.removeEventListener('mousemove', move)
        window.document.removeEventListener('mouseup', removeEventListeners)
      }
      // Move the divider while the cursor moves.
      window.document.addEventListener('mousemove', this.move)
      // Until the mouse button is released.
      window.document.addEventListener('mouseup', removeEventListeners)
    },
    initMove(event) {
      this.dim1 = this.first.offsetWidth
      this.dim2 = this.second.offsetWidth
      this.start = event.clientX
    },
    move(event) {
      let current = event.clientX
      let delta = current - this.start
      this.moveBy(delta)
    },
    moveBy(delta) {
      let newDim1 = this.dim1 + delta
      if (this.percent) {
        newDim1 = (100 * newDim1) / (this.dim1 + this.dim2)
      }
      this.moveTo(newDim1)
    },
    moveTo(newDim1) {
      let newDim2
      if (this.percent) {
        newDim2 = 100 - newDim1 + '%'
        newDim1 += '%'
      } else {
        newDim2 = this.dim1 + this.dim2 - newDim1
      }
      this.first.style.width = newDim1
      this.second.style.width = newDim2
    },
  },
}
</script>

<style lang="scss">
.divider-vertical {
  position: absolute;
  z-index: 1;
  top: 0;
  right: 0;
  cursor: col-resize;
  width: 0.5em;
  min-width: 0.5em;
  height: 100%;
  margin-right: -0.25em;
  background: transparent;
  border: none;
  user-select: none;
}
</style>
