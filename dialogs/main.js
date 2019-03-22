import Vue from 'vue'
import Bridge from './bridge.js'
//import './error_handlers.js'
import app from './components/app.vue'

window.refresh = app.refresh

// TODO:
// single-component files have
// - use attribute scoped in style, remove extra namespacing class
// - remove import Vue from 'vue'
// - if needed, add components: { ...contained components } in components
// https://vuejs.org/v2/cookbook/avoiding-memory-leaks.html

new Vue({
  el: '#app',
  render: h => h(app)
})

Bridge.call('translate')