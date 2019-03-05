define(['vue', './deferred', './translate'], function (Vue, Deferred, Translate) {
  var s = document.createElement('style');
  s.type = 'text/css';
  document.getElementsByTagName('head')[0].appendChild(s);
  s.innerHTML =
'.vs-prompt.vs-prompt-background {\n\
    position: absolute;\n\
    top: 0;\n\
    left: 0;\n\
    z-index: 1000;\n\
    width: 100%;\n\
    height: 100%;\n\
    background: rgba(64, 64, 64, 0.25);\n\
}\n\
.vs-prompt .vs-prompt-dialog {\n\
    position: absolute;\n\
    top: 50%;\n\
    left: 50%;\n\
    margin-left: -15em;\n\
    margin-top: -5em;\n\
    width: 20em;\n\
    padding: 1em;\n\
    background: Window;\n\
    text-align: center;\n\
    box-shadow: 0 0.5em 2em #888;\n\
    border-radius: 0.5em;\n\
}\n\
.vs-prompt .vs-prompt-dialog p {\n\
  margin-bottom: 1em;\n\
}\n\
.vs-prompt .vs-prompt-dialog form {\n\
  padding: 0;\n\
}\n\
.vs-prompt .vs-prompt-dialog input[type="button"],\n\
.vs-prompt .vs-prompt-dialog input[type="submit"],\n\
.vs-prompt .vs-prompt-dialog button {\n\
    min-width: 5em;\n\
    margin: 0.5em;\n\
}';

  var VsPrompt = {
    install: function (Vue) {
      var self = this;
      this.useInstance = null;
      var $prompt = function (question, value) {
        if (self.useInstance) {
          return self.useInstance(question, value);
        } else {
          return Promise.reject('No <vs-prompt> element found to use for prompt.');
        }
      };
      Object.defineProperty(Vue.prototype, '$prompt', {
        get: function () {
          return $prompt;
        }
      });
    }
  };

  Vue.use(VsPrompt);

  Vue.component('vs-prompt', {
    data: function () {
      return {
        tr: Translate.get,
        pending: false,
        deferred: null,
        question: '',
        value: ''
      };
    },
    methods: {
      submit: function () {
        this.pending = false;
        if (this.deferred) this.deferred.resolve(this.value);
        this.value = '';
      },
      abort: function () {
        this.pending = false;
        if (this.deferred) this.deferred.reject('Prompt cancelled.');
        this.value = '';
      },
      focus: function () {
        this.$refs.valueElement.focus();
      }
    },
    created: function () {
      var self = this;
      VsPrompt.useInstance = function (question, value) {
        self.pending = true;
        self.deferred = new Deferred();
        self.question = question;
        self.value = value || '';
        Vue.nextTick(self.focus);
        return self.deferred.promise;
      };
    },
    template:
  '<div :style="{display: (pending) ? \'block\' : \'none\'}" \n\
        @click="focus" \n\
        @keydown.esc="abort" \n\
        class="vs-prompt vs-prompt-background" \n\
        style="position: absolute; top: 0; left: 0; z-index: 1000; width: 100%; height: 100%" >\n\
    <div class="vs-prompt-dialog">\n\
      <p>{{question}}</p>\n\
      <form @submit.stop.prevent="submit">\n\
        <input ref="valueElement" \n\
               v-model:value="value" \n\
               type="text">\n\
        <br/>\n\
        <input type="submit" \n\
               :value="tr(\'Ok\')" />\n\
        <input type="button" \n\
               :value="tr(\'Abort\')" \n\
               @click.stop="abort" />\n\
      </form>\n\
    </div>\n\
  </div>'
  });

});
