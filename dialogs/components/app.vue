<template>
  <div>
    <vs-notify
      group="alert"
      position="top center"
      transition="ntf-top"
    />
    <VsPrompt />
    <TheJsonViewer />
    <TheEntityPane
      ref="theEntityPane"
      style="display: block; width: 100%; height: 2.5em; overflow: hidden;"
      @selectedEntity="selectedEntity"
    />
    <SplitPaneVertical
      :initial="30"
      style="width: 100%; top: 2.5em; bottom: 0; position: absolute;"
    >
      <TheDictionaryPane
        slot="left"
        ref="theDictionaryPane"
        :selected-entity-id="selectedEntityId"
        style="width: 100%; height: 100%; margin-top: 1px;"
        @onSelectedDictionary="onSelectedDictionary"
      />
      <TheAttributePane
        slot="right"
        ref="theAttributePane"
        :selected-path="selectedPath"
        :selected-dictionary="selectedDictionary"
        style="width: 100%; height: 100%; margin-top: 1px;"
        @attributeChanged="updateIsNonCommonDictionary"
      />
    </SplitPaneVertical>
  </div>
</template>

<script>
import Vue from 'vue'
import '../vendor/vs-notify.js'
import VsPrompt from './vs-prompt.vue'
import TheJsonViewer from './the-json-viewer.vue'
import TheEntityPane from './the-entity-pane.vue'
import SplitPaneVertical from './split-pane-vertical.vue'
import TheDictionaryPane from './the-dictionary-pane.vue'
import TheAttributePane from './the-attribute-pane.vue'

export default {
  name: 'App',
  components: {
    VsPrompt,
    TheJsonViewer,
    TheEntityPane,
    SplitPaneVertical,
    TheDictionaryPane,
    TheAttributePane,
  },
  data() {
    return {
      selectedEntityId: null,
      selectedPath: [],
      selectedDictionary: null,
    }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    refresh() {
      this.$refs.theEntityPane.refresh()
    },
    selectedEntity(entityId) {
      this.selectedEntityId = entityId
      this.$refs.theDictionaryPane.refresh()
    },
    onSelectedDictionary(dictionaryPath, dictionary) {
      this.selectedPath = dictionaryPath
      this.selectedDictionary = dictionary
      // Timeout so that changed property can be propagated into the-attribute-pane.
      Vue.nextTick(this.$refs.theAttributePane.refresh)
    },
    updateIsNonCommonDictionary: function() {
      let self = this
      Bridge.get('is_non_common_dictionary', self.selectedPath).then(
        function(isNonCommonDictionary) {
          self.selectedDictionary.nonCommonDictionary = isNonCommonDictionary
        }
      )
    },
  },
}
</script>

<style lang="scss"></style>
