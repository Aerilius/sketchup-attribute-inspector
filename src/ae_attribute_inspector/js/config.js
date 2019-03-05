// Before loading requirejs.
var requirejs = {
  baseUrl: '../js', /* relative to html directory */
  paths: {
    vue: '../external/vue',
    'vs-notify': '../external/vs-notify.min',
    'vue-json-viewer': '../external/vue-json-viewer',
    debounce: '../external/debounce@1.2.0',
    polyfills: '../external/polyfills',
    './bridge': '../js/bridge_mock'
  },
  shim: {
    debounce: {
      deps: [],
      exports: 'debounce'
    }
  },
  /*map: {
    'the-entity-pane': {
        'bridge': 'bridge_mock'
    },
    'the-dictionary-pane': {
        'bridge': 'bridge_mock'
    },
    'the-attribute-pane': {
        'bridge': 'bridge_mock'
    }
  }*/
};
