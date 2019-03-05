define(['vue', './style'], function (Vue, Style) {

  Style.addCSS(
'/* Clip content: Injected div as workaround because elements with table layout ignore height and overflow. */\n\
.clip-box {\n\
    height:inherit;\n\
    overflow: hidden;\n\
}');

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

  Style.addCSS(
'.toolbar-button button {\n\
    min-height: 1.25em; /* For Safari, which ignores all other/smaller button size properties. */\n\
    line-height: 1.25em;\n\
    min-width: 1.25em;\n\
    padding: 0;\n\
    overflow: hidden;\n\
    text-align: center;\n\
    vertical-align: middle;\n\
}\n\
.toolbar-button button > img {\n\
    vertical-align: middle;\n\
    width: 1em;\n\
    height: 1em;\n\
    padding: 0.125em;\n\
}\n\
.toolbar-button button:disabled > img {\n\
    opacity: 0.3;\n\
}');

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
'<div class="toolbar-button vertical-centered">\n\
  <button :title="title" \n\
          :disabled="disabled">\n\
    <img v-if="image" \n\
         :src="image" />\n\
    <slot/> \n\
  </button>\n\
</div>'
  });

  Style.addCSS(
'.split-pane-vertical > div:first-child {\n\
    position: absolute;\n\
    left: 0;\n\
    width: 50%;\n\
    height: 100%;\n\
}\n\
.split-pane-vertical > div:first-child + div {\n\
    position: absolute;\n\
    right: 0;\n\
    width: 50%;\n\
    height: 100%;\n\
}');

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
'<div class="split-pane-vertical">\n\
  <div ref="leftPane">\n\
    <slot name="left" /> \n\
    <divider-vertical ref="divider" :initial="initial"/>\n\
  </div>\n\
  <div ref="rightPane">\n\
    <slot name="right" />\n\
  </div>\n\
</div>'
  });

  Style.addCSS(
'.divider-vertical {\n\
    position: absolute;\n\
    z-index: 1;\n\
    top: 0;\n\
    right: 0;\n\
    cursor: col-resize;\n\
    width: 0.5em;\n\
    min-width: 0.5em;\n\
    height: 100%;\n\
    margin-right: -0.25em;\n\
    background: transparent;\n\
    border: none;\n\
    user-select: none;\n\
}');

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
         class="divider-vertical"/>'
  });

});
