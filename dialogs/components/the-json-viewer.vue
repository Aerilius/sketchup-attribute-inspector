<template>
<div :style="{display: (isOpen) ? 'block' : 'none'}" 
      @keyup.esc="close" 
      style="position: absolute; width: 100%; height: 100%; z-index: 100; background-color: Window;">
  <Toolbar style="width: 100%; height: 2.5em; white-space: pre;">
    <ToolbarButton @click.native="activeTab=0" style="width: 0;">{{tr("JSON Tree")}}</ToolbarButton>
    <ToolbarButton @click.native="function(){ activeTab = 1; focus(); }">{{tr("JSON Source")}}</ToolbarButton>
    <ToolbarButton @click.native="submit" style="float: right; padding: 0.25em;">×</ToolbarButton>
  </Toolbar>
  <div style="position: absolute; top: 2.5em; bottom: 0; width: 100%; border: 1px ThreeDShadow solid;">
    <json-viewer v-show="activeTab === 0" 
      ref="tree" 
      :value="jsonData" 
      :expand-depth="expandDepth" 
      copyable 
      sort 
      :expandableCode="false" 
      style="width: 100%; height: 100%; overflow: auto;"/> 
    <textarea v-show="activeTab === 1" 
              ref="source" 
              v-model="jsonString" 
              @keyup.esc="close" 
              style="width: 100%; height: 100%; resize: none; padding: 20px;"></textarea>
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
  install (Vue) {
    let self = this
    this.useInstance = null
    let $jsonviewerpopup = function (jsonString) {
      if (self.useInstance) {
        return self.useInstance(jsonString)
      } else {
        return Promise.reject('No <the-json-viewer> element found to use for $jsonviewerpopup.')
      }
    }
    Object.defineProperty(Vue.prototype, '$jsonviewerpopup', {
      get () {
        return $jsonviewerpopup
      }
    })
  }
}

Vue.use(TheJsonViewerPlugin)

export default {
  components: {JsonView, Toolbar, ToolbarButton},
  data () {
    return {
      tr: Translate.get,
      isOpen: false,
      deferred: null,
      activeTab: 0,
      expandDepth: 5,
      jsonString: '{}'
    }
  },
  computed: {
    jsonData () {
      try {
        return JSON.parse(this.jsonString)
      } catch (e) {
        return {}
      }
    }
  },
  methods: {
    focus () {
      let source = this.$refs.source
      source.focus()
      window.setTimeout(source.focus.bind(source), 0)
    },
    submit () {
      if (this.deferred) {
        try {
          this.validate(this.jsonString)
          this.deferred.resolve(this.jsonString)
        } catch (error) {
          this.$notify('alert', error.message, 'error', 10000)
          return
          // TODO: ? this.deferred.reject(error)
        }
      }
      this.jsonString = '{}'
      this.close()
    },
    close () {
      this.isOpen = false
      this.deferred = null
    },
    validate (jsonString) {
      JSON.parse(this.jsonString)
    }
  },
  created () {
    TheJsonViewerPlugin.useInstance = (jsonString) => {
      this.isOpen = true
      this.deferred = new Deferred()
      this.jsonString = jsonString
      Vue.nextTick(this.focus)
      return this.deferred.promise
    }
  }
}
</script>

<style lang="scss">
.jv-container .jv-code {
  max-height: initial !important;
  overflow: visible !important;
}
.jv-container .jv-more {
  display: none !important;
}
</style>
