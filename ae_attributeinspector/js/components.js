define(['vue'], function (Vue) {

  Vue.component('clip-box', {
    template:
'<div class="clip-box">\n\
  <div class="toolbar vertical-centered-parent">\n\
    <slot/>\n\
  </div>\n\
</div>',
  });

  Vue.component('toolbar', {
    template:
'<div class="toolbar left vertical-centered-parent">\n\
  <slot/>\n\
</div>'
  });

  Vue.component('toolbar-button', {
    props: {
      image: {
        type: String,
        default: null
      },
      title: {
        type: String,
        default: null
      },
      disabled: {
        default: false
      }
    },
    template: 
'<div class="vertical-centered">\n\
  <button :title="title" \n\
          :disabled="disabled">\n\
    <img v-if="image" \n\
         :src="image" />\n\
    <slot/> \n\
  </button>\n\
</div>'
  });

  Vue.component('split-pane-vertical', {
    props: {
      initial: {
        type: Number,
        default: function () {
          return 50;
        }
      }
    },
    mounted: function () {
      // We can not declaratively set properties to element references in the template
      // because these elements might not be mounted when the template is parsed.
      this.$refs.divider.setElements(this.$refs.leftPane, this.$refs.rightPane);
    },
    template:
'<div>\n\
  <div ref="leftPane" style="position: absolute; left: 0; width: 50%; height: 100%;">\n\
    <slot name="left" /> \n\
    <divider-vertical ref="divider" :initial="initial"/>\n\
  </div>\n\
  <div ref="rightPane" style="position: absolute; right: 0; width: 50%; height: 100%;">\n\
    <slot name="right" />\n\
  </div>\n\
</div>'
  });

  Vue.component('divider-vertical', {
    props: {
      initial: {
        type: Number,
        default: function () {
          return 50;
        }
      },
      percent: {
        type: Boolean,
        default: true
      }
    },
    data: function () {
      return {
        first: null,
        second: null,
        dim1: 0,
        dim2: 0,
        start: 0
      }
    },
    methods: {
      setElements: function (first, second) {
        this.first = first;
        this.second = second;
        this.dim1 = this.first.offsetWidth;
        this.dim2 = this.second.offsetWidth;
        this.moveTo(this.initial);
      },
      mousedown: function (event) {
        // Register the status at the time of start.
        this.initMove(event);
        var move = this.move;
        function removeEventListeners (event) {
          window.document.removeEventListener('mousemove', move);
          window.document.removeEventListener('mouseup', removeEventListeners);
        }
        // Move the divider while the cursor moves.
        window.document.addEventListener('mousemove', this.move);
        // Until the mouse button is released.
        window.document.addEventListener('mouseup', removeEventListeners);
      },
      initMove: function (event) {
        this.dim1  = this.first.offsetWidth;
        this.dim2  = this.second.offsetWidth;
        this.start = event.clientX;
      },
      move: function (event) {
        var current = event.clientX;
        var delta   = current - this.start;
        this.moveBy(delta);
      },
      moveBy: function (delta) {
        var newDim1 = this.dim1 + delta;
        if (this.percent) {
          newDim1 = ( 100 * newDim1 / (this.dim1 + this.dim2) );
        }
        this.moveTo(newDim1);
      },
      moveTo: function (newDim1) {
        var newDim2;
        if (this.percent) {
          newDim2 = (100 - newDim1) + '%';
          newDim1 += '%';
        } else {
          newDim2 = this.dim1 + this.dim2 - newDim1;
        }
        this.first.style.width = newDim1;
        this.second.style.width = newDim2;
      },
    },
    template:
'<button ref="divider" \n\
         @mousedown="mousedown" \n\
         style="position: absolute; z-index: 1; top: 0; right: 0; cursor: col-resize; width: 0.5em; min-width: 0.5em; height: 100%; margin-right: -0.25em; background: transparent; border: none; user-select: none;"/>'
  });

});
