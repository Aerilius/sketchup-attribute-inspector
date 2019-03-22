import Vue from 'vue'
import Bridge from './bridge.js'
import './error_handlers.js'
import app from './components/app.vue'

window.refresh = app.refresh

new Vue({
  el: '#app',
  render: h => h(app),
})

Bridge.call('translate')
