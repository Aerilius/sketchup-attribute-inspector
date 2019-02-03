/*
TODO:
- missing features:
  - changing key/value of non-common does not update grayed (esp. dict pane)
  - new attribute type DC with validation: (How to get dc instance? ObjectSpace.each_object(DynamicComponentsV1).first )
    dc = $dc_observers.get_class_by_version(entity)
    has_dc_attribute_dictionary: entity or its definition has "dynamic_attributes" dictionary
    dc.parse_formula("5+copy*SmartBench!spacing", group, "_x_formula")
    ["120", "5+<span class=subformula-success>23.0</span>*<span class=subformula-success>5</span>"]
    dc.parse_formula("5+copy*SmartBench~spacing", group, "_x_formula")
    [nil, "5+<span class=subformula-success>23.0</span>*<span class=subformula-error>smartbench~spacing</span>"]
  - simplify table-view (use computed properties; include css)
  - cleanup css
  - search for TODOs, comments <!-- /* // //// console.log TODO ### puts window.xxx=
  - Indentation: 2!
    when adding nested dictionary to all, but parent is grayed (does not exist for all), the parent must be created on demand
  - test modification of grayed dictionaries/attributes
*/
define(['vue', 'vs-notify', './vs-prompt', './the-entity-pane', './components', './the-dictionary-pane', './the-attribute-pane', './the-json-viewer'], function (Vue, _, _, _, _, _, _, _) {
  var app = new Vue({
    el: '#app',
    data: {
      selectedEntityId: null,
      selectedPath: []
    },
    mounted: function () {
      this.refresh();
    },
    methods: {
      refresh: function () {
        this.$refs.theEntityPane.refresh();
      },
      selectedEntity: function (entityId) {
        console.log('app selectedEntity', entityId);
        this.selectedEntityId = entityId;
        this.$refs.theDictionaryPane.refresh();
      },
      selectedDictionary: function (dictionaryPath) {
        console.log('app selectedDictionary', dictionaryPath);
        this.selectedPath = dictionaryPath;
        // Timeout so that changed property can be propagated into the-attribute-pane.
        Vue.nextTick(this.$refs.theAttributePane.refresh); //, this
      }
    },
    template:
'<div>\n\
  <vs-notify group="alert" position="top center" transition="ntf-top" />\n\
  <vs-prompt />\n\
  <the-json-viewer/>\n\
  <the-entity-pane ref="theEntityPane" \n\
                   @selectedEntity="selectedEntity" \n\
                   style="display: block; width: 100%; height: 2.5em; overflow: hidden;" />\n\
  <split-pane-vertical :initial="30" \n\
                       style="width: 100%; top: 2.5em; bottom: 0; position: absolute;">\n\
    <the-dictionary-pane slot="left" \n\
                         ref="theDictionaryPane" \n\
                         :selectedEntityId="selectedEntityId" \n\
                         @selectedDictionary="selectedDictionary" \n\
                         style="width: 100%; height: 100%; margin-top: 1px;" />\n\
    <the-attribute-pane slot="right" \n\
                        ref="theAttributePane" \n\
                        :selectedDictionary="selectedPath" \n\
                        style="width: 100%; height: 100%; margin-top: 1px;" />\n\
  </split-pane-vertical>\n\
</div>'
  });

  window.refresh = app.refresh;

  return app;
});
