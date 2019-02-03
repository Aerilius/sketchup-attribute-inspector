define(['vue', 'vs-notify', './bridge', './translate'], function (Vue, _, Bridge, Translate) {

  var s = document.createElement('style');
  s.type = 'text/css';
  document.getElementsByTagName('head')[0].appendChild(s);
  s.innerHTML =
'.related_title {\n\
  display: inline-block;\n\
  font-size: 80%;\n\
  color: GrayText;\n\
}\n\
.related_title a {\n\
  color: #47e;\n\
}\n\
.related_title a:hover {\n\
  text-decoration: underline;\n\
}';

  Vue.component('the-entity-pane', {
    data: function () {
      return {
        tr: Translate.get,
        entity: {
          title: '',
          id: null,
          related: {
            title: null,
            id: null
          }
        },
        entityType: 'DrawingElement',
        entityTypes: [
          'Drawingelement',
          'ComponentDefinition',
          'Material',
          'Layer',
          'Page',
          'Style'
        ],
        defaultEntityTitle: 'No entities selected'
      };
    },
    methods: {
      refresh: function () {
        var self = this;
        Bridge.get('get_entity_type').then(function (entityType) {
          self.entityType = entityType;
        });
        Bridge.get('get_entity').then(function (entity) {
          console.log('get_entity', JSON.parse(JSON.stringify(entity)));//////////
          if (entity && (!self.entity || self.entity.id != entity.id)) {
            self.entity = entity;
          } else {
            self.entity = null;
          }
          self.$emit('selectedEntity', entity);
        }, function (error) {
          self.$notify('alert', error.message, 'error');
        });
      },
      selectRelatedEntity: function () {
        Bridge.call('select', this.entity.related.id);
      },
      changeEntityType: function (event) {
        Bridge.call('set_entity_type', this.$refs.typeSelector.value);
      }
    },
    template:
'<div class="top-toolbar horizontal-flex-parent">\n\
  <clip-box style="width: 100%">\n\
    <span style="line-height: 0.9em">\n\
      <h2 style="display: inline; font: caption; font-size: 1.125em !important; font-weight: bold !important;">\n\
        {{ (entity && entity.id) ? entity.title : tr(defaultEntityTitle) }}\n\
      </h2>\n\
      <span class="related_title">{{ (entity && entity.related && entity.related.title) ? tr("see also: ") : ""}}\n\
        <a v-if="entity && entity.related && entity.related.title" \n\
           @click="selectRelatedEntity"> \n\
           {{ entity.related.title }}</a>\n\
      </span>\n\
    </span>\n\
  </clip-box>\n\
  <clip-box>\n\
    <label :title="tr(\'How to select other entity types\')">\n\
      <select ref="typeSelector" \n\
              :value="entityType" \n\
              @change="changeEntityType" >\n\
        <option v-for="anEntityType in entityTypes" \n\
                :value="anEntityType" \n\
                :key="anEntityType">\n\
          {{ tr(anEntityType) }}\n\
        </option>\n\
      </select>\n\
    </label>\n\
  </clip-box>\n\
</div>'
  });

});
