import Vue from 'vue'
import Bridge from 'sketchup-bridge'
//import './error_handlers.js'
import App from './components/app.vue'
import TRANSLATE from './translate.js'

const app = new Vue({
  el: '#app',
  render: h => h(App),
  mounted: function () {
    let appInstance = this.$children[0]
    global.refresh = appInstance.refresh.bind(appInstance)
  },
})

Bridge.get('get_translations').then((translations) => {
  TRANSLATE.load(translations)
  //TRANSLATE.html(document.body)
})
