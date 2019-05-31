<template>
  <div
    :style="{ display: isOpen ? 'block' : 'none' }"
    style="position: absolute; width: 100%; height: 100%; z-index: 100; background-color: Window;"
    @keyup.esc="close"
  >
    <div style="width: 100%; height: 2.5em">
      <Toolbar
        style="float: left"
      >
        <ToolbarButton
          style="width: 0;"
          @click.native="activeTab = 0"
        >
          {{ tr('JSON Tree') }}
        </ToolbarButton>
        <ToolbarButton
          @click.native="function() { activeTab = 1;focus() }"
        >
          {{ tr('JSON Source') }}
        </ToolbarButton>
      </Toolbar>
      <Toolbar
        class="right"
        style="float: right; margin-right: 0;"
      >
        <ToolbarButton
          style="padding: 0.25em;"
          @click.native="submit"
        >
          ×
        </ToolbarButton>
      </Toolbar>
    </div>
    <div
      style="position: absolute; top: 2.5em; bottom: 0; width: 100%; border: 1px ThreeDShadow solid;"
    >
      <JsonView
        v-show="activeTab === 0"
        ref="tree"
        :value="jsonData"
        :expand-depth="expandDepth"
        copyable
        sort
        :expandable-code="false"
        style="width: 100%; height: 100%; overflow: auto;"
      />
      <textarea
        v-show="activeTab === 1"
        ref="source"
        v-model="jsonString"
        style="width: 100%; height: 100%; resize: none; padding: 20px;"
        @keyup.esc="close"
      />
    </div>
  </div>
</template>

<script>
import Vue from 'vue'
import JsonView from 'vue-json-viewer'
import Deferred from '../deferred.js'
import Translate from '../translate.js'
import '../vendor/vs-notify.js'
import Toolbar from './toolbar.vue'
import ToolbarButton from './toolbar-button.vue'

Vue.use(JsonView)

const TheJsonViewerPlugin = {
  install(Vue) {
    let self = this
    this.useInstance = null
    let $jsonviewerpopup = function(jsonString) {
      if (self.useInstance) {
        return self.useInstance(jsonString)
      } else {
        return Promise.reject(
          'No <the-json-viewer> element found to use for $jsonviewerpopup.'
        )
      }
    }
    Object.defineProperty(Vue.prototype, '$jsonviewerpopup', {
      get() {
        return $jsonviewerpopup
      },
    })
  },
}

Vue.use(TheJsonViewerPlugin)

export default {
  components: { JsonView, Toolbar, ToolbarButton },
  data() {
    return {
      tr: Translate.get,
      isOpen: false,
      deferred: null,
      activeTab: 0,
      expandDepth: 5,
      jsonString: '{}',
    }
  },
  computed: {
    jsonData() {
      try {
        return JSON.parse(this.jsonString)
      } catch (e) {
        return {}
      }
    },
  },
  created() {
    TheJsonViewerPlugin.useInstance = jsonString => {
      this.isOpen = true
      this.deferred = new Deferred()
      this.jsonString = jsonString
      Vue.nextTick(this.focus)
      return this.deferred.promise
    }
  },
  methods: {
    focus() {
      let source = this.$refs.source
      source.focus()
      window.setTimeout(source.focus.bind(source), 0)
    },
    submit() {
      if (this.deferred) {
        try {
          this.validate(this.jsonString)
          this.deferred.resolve(this.jsonString)
        } catch (error) {
          this.$notify('alert', error.message, 'error', 10000)
          return
        }
      }
      this.jsonString = '{}'
      this.close()
    },
    close() {
      this.isOpen = false
      this.deferred = null
    },
    validate(jsonString) {
      JSON.parse(this.jsonString)
    },
  },
}
</script>

<style lang="scss">
.jv-container .jv-code {
  max-height: initial !important;
  overflow: visible !important;
}
.jv-container {
  font-size: inherit !important;
}
.jv-container .jv-more {
  display: none !important;
}
</style>
