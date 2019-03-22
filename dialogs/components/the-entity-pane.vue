<template>
  <div class="horizontal-flex-parent">
    <ClipBox class="clip-box">
      <span style="line-height: 0.9em">
        <h2 class="selected-title">
          {{ entity && entity.id ? entity.title : tr(defaultEntityTitle) }}
        </h2>
        <span
          class="related-title"
        >
          {{
            entity && entity.related && entity.related.title
              ? tr("see also: ")
              : ''
          }}
          <a
            v-if="entity && entity.related && entity.related.title"
            @click="selectRelatedEntity"
          >
            {{
              entity.related.title
            }}
          </a>
        </span>
      </span>
    </ClipBox>
    <ClipBox class="clip-box">
      <label :title="tr('How to select other entity types')">
        <select
          ref="typeSelector"
          :value="entityType"
          @change="changeEntityType"
        >
          <option
            v-for="anEntityType in entityTypes"
            :key="anEntityType"
            :value="anEntityType"
          >
            {{ tr(anEntityType) }}
          </option>
        </select>
      </label>
    </ClipBox>
  </div>
</template>

<script>
import '../vendor/vs-notify.js'
import ClipBox from './clip-box.vue'
import Bridge from '../bridge.js'
import TRANSLATE from '../translate'

export default {
  components: { ClipBox },
  data() {
    return {
      tr: TRANSLATE.get,
      entity: {
        title: '',
        id: null,
        related: {
          title: null,
          id: null,
        },
      },
      entityType: 'DrawingElement',
      entityTypes: [
        'Drawingelement',
        'ComponentDefinition',
        'Material',
        'Layer',
        'Page',
        'Style',
      ],
      defaultEntityTitle: 'No entities selected',
    }
  },
  methods: {
    refresh() {
      // TODO ?: this.entityType = await Bridge.get('get_entity_type')
      Bridge.get('get_entity_type').then(entityType => {
        this.entityType = entityType
      })
      Bridge.get('get_entity').then(
        entity => {
          if (entity && (!this.entity || this.entity.id != entity.id)) {
            this.entity = entity
          } else {
            this.entity = null
          }
          this.$emit('selectedEntity', entity)
        },
        error => {
          this.$notify('alert', error.message, 'error')
        }
      )
    },
    selectRelatedEntity() {
      Bridge.call('select', this.entity.related.id)
    },
    changeEntityType(event) {
      Bridge.call('set_entity_type', this.$refs.typeSelector.value)
    },
  },
}
</script>

<style lang="scss">
.horizontal-flex-parent > .clip-box:first-child {
  width: 100%;
}
.selected-title {
  display: inline;
  font: caption;
  font-size: 1.125em !important;
  font-weight: bold !important;
}
.related-title {
  display: inline-block;
  font-size: 80%;
  color: GrayText;
}
.related-title a {
  color: #47e;
}
.related-title a:hover {
  text-decoration: underline;
}
/* Spread contained elements by their content width using table layout. */
.horizontal-flex-parent {
  display: table;
}
.horizontal-flex-parent > * {
  display: table-cell;
  height: inherit;
  vertical-align: top; /* to prevent odd layout issue, breaking into two lines. */
}
</style>
