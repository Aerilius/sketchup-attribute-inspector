define(['vue', 'vue-json-viewer', './deferred', './translate', 'vs-notify', './style'], function (Vue, JsonView, Deferred, Translate, _, Style) {

  Style.addCSS(
'.jv-container .jv-code {\n\
  max-height: initial !important;\n\
  overflow: visible !important;\n\
}\n\
.jv-container .jv-more {\n\
  display: none !important;\n\
}');

  Vue.use(JsonView.default);

  var TheJsonViewer = {
    install: function (Vue) {
      var self = this;
      this.useInstance = null;
      var $jsonviewerpopup = function (jsonString) {
        if (self.useInstance) {
          return self.useInstance(jsonString);
        } else {
          return Promise.reject('No <the-json-viewer> element found to use for $jsonviewerpopup.');
        }
      };
      Object.defineProperty(Vue.prototype, '$jsonviewerpopup', {
        get: function () {
          return $jsonviewerpopup;
        }
      });
    }
  };

  Vue.use(TheJsonViewer);

  Vue.component('the-json-viewer', {
    data: function () {
      return {
        tr: Translate.get,
        isOpen: false,
        deferred: null,
        activeTab: 0,
        expandDepth: 5,
        jsonString: '{}'
      };
    },
    computed: {
      jsonData: function () {
        try {
          return JSON.parse(this.jsonString);
        } catch (e) {
          return {};
        }
      }
    },
    methods: {
      focus: function () {
        var source = this.$refs.source;
        source.focus();
        window.setTimeout(source.focus.bind(source), 0);
      },
      submit: function () {
        if (this.deferred) {
          try {
            this.validate(this.jsonString);
            this.deferred.resolve(this.jsonString);
          } catch (error) {
            this.$notify('alert', error.message, 'error', 10000);
            return;
            // this.deferred.reject(error);
          }
        }
        this.jsonString = '{}';
        this.close();
      },
      close: function () {
        this.isOpen = false;
        this.deferred = null;
      },
      validate: function (jsonString) {
        JSON.parse(this.jsonString);
      }
    },
    created: function () {
      var self = this;
      TheJsonViewer.useInstance = function (jsonString) {
        self.isOpen = true;
        self.deferred = new Deferred();
        self.jsonString = jsonString;
        Vue.nextTick(self.focus);
        return self.deferred.promise;
      };
    },
    template:
'<div :style="{display: (isOpen) ? \'block\' : \'none\'}" \n\
      @keyup.esc="close" \n\
      style="position: absolute; width: 100%; height: 100%; z-index: 100; background-color: Window;">\n\
  <toolbar style="width: 100%; height: 2.5em; white-space: pre;">\n\
    <toolbar-button @click.native="activeTab=0" style="width: 0;">{{tr("JSON Tree")}}</toolbar-button>\n\
    <toolbar-button @click.native="function(){ activeTab = 1; focus(); }">{{tr("JSON Source")}}</toolbar-button>\n\
    <toolbar-button @click.native="submit" style="float: right; padding: 0.25em;">×</toolbar-button>\n\
  </toolbar>\n\
  <div style="position: absolute; top: 2.5em; bottom: 0; width: 100%; border: 1px ThreeDShadow solid;">\n\
    <json-viewer v-show="activeTab === 0" \n\
      ref="tree" \n\
      :value="jsonData" \n\
      :expand-depth="expandDepth" \n\
      copyable \n\
      sort \n\
      :expandableCode="false" \n\
      style="width: 100%; height: 100%; overflow: auto;"/> \n\
    <textarea v-show="activeTab === 1" \n\
              ref="source" \n\
              v-model="jsonString" \n\
              @keyup.esc="close" \n\
              style="width: 100%; height: 100%; resize: none; padding: 20px;"></textarea>\n\
  </div>\n\
</div>'
  });

});
