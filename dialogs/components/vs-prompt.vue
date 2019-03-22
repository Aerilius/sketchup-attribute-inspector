<template>
  <div :style="{display: (pending) ? 'block' : 'none'}" 
        @click="focus" 
        @keydown.esc="abort" 
        class="vs-prompt-background" 
        style="position: absolute; top: 0; left: 0; z-index: 1000; width: 100%; height: 100%" >
    <div class="vs-prompt-dialog">
      <p>{{question}}</p>
      <form @submit.stop.prevent="submit">
        <input ref="valueElement" 
               v-model:value="value" 
               type="text">
        <br/>
        <input type="submit" 
               :value="tr('Ok')" />
        <input type="button" 
               :value="tr('Abort')" 
               @click.stop="abort" />
      </form>
    </div>
  </div>
</template>

<script>
import Deferred from '../deferred.js'
import TRANSLATE from '../translate.js'

const VsPromptPlugin = {
  install (Vue) {
    let self = this
    this.useInstance = null
    let $prompt = function (question, value) {
      if (self.useInstance) {
        return self.useInstance(question, value)
      } else {
        return Promise.reject('No <vs-prompt> element found to use for prompt.')
      }
    }
    Object.defineProperty(Vue.prototype, '$prompt', {
      get () {
        return $prompt
      }
    })
  }
}

Vue.use(VsPromptPlugin)

export default {
  components: {},
  data () {
    return {
      tr: TRANSLATE.get,
      pending: false,
      deferred: null,
      question: '',
      value: ''
    }
  },
  methods: {
    submit () {
      this.pending = false
      if (this.deferred) this.deferred.resolve(this.value)
      this.value = ''
    },
    abort () {
      this.pending = false
      if (this.deferred) this.deferred.reject('Prompt cancelled.')
      this.value = ''
    },
    focus () {
      this.$refs.valueElement.focus()
    }
  },
  created () {
    let self = this
    VsPromptPlugin.useInstance = function (question, value) {
      self.pending = true
      self.deferred = new Deferred()
      self.question = question
      self.value = value || ''
      Vue.nextTick(self.focus)
      return self.deferred.promise
    }
  }
}
</script>

<style lang="scss" scoped>
.vs-prompt-background {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1000;
    width: 100%;
    height: 100%;
    background: rgba(64, 64, 64, 0.25);
}
.vs-prompt-dialog {
    position: absolute;
    top: 50%;
    left: 50%;
    margin-left: -15em;
    margin-top: -5em;
    width: 20em;
    padding: 1em;
    background: Window;
    text-align: center;
    box-shadow: 0 0.5em 2em #888;
    border-radius: 0.5em;
}
.vs-prompt-dialog p {
  margin-bottom: 1em;
}
.vs-prompt-dialog form {
  padding: 0;
}
.vs-prompt-dialog input[type="button"],
.vs-prompt-dialog input[type="submit"],
.vs-prompt-dialog button {
    min-width: 5em;
    margin: 0.5em;
}
</style>
