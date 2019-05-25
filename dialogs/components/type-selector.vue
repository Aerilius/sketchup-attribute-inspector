<template>
  <select
    v-model="attribute.type"
  >
    <option
      v-for="attributetype in attributetypes"
      :key="attributetype"
      :value="attributetype"
    >
      {{ getDisplayName(attributetype) }}
    </option>
  </select>
</template>

<script>
import TypedValueParser from '../typedvalueparser.js'

export default {
  components: {},
  props: {
    attribute: {
      type: Object,
      default () {
        return { type: 'String' }
      },
    },
  },
  data () {
    return {
      getDisplayName: TypedValueParser.getDisplayName,
      attributetypes: TypedValueParser.TYPES,
    }
  },
}
</script>

<style lang="scss"></style>
