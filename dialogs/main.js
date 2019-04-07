import Vue from 'vue'
import Bridge from './bridge.js'
//import './error_handlers.js'
import app from './components/app.vue'
import TRANSLATE from './translate.js'

window.refresh = app.refresh

new Vue({
  el: '#app',
  render: h => h(app),
})

Bridge.get('get_translations').then((translations) => {
  TRANSLATE.load(translations)
  //TRANSLATE.html(document.body)
})
