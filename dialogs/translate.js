export class Translate {
  constructor() {
    /* Object containing all translation strings. */
    this.mapping = {}
    this.get = this.get.bind(this)
  }

  load(mapping) {
    Object.assign(this.mapping, mapping)
  }

  /* Method to access a single translation. */
  get(key, ...substitutions) {
    try {
      if (typeof key !== 'string') return ''
      // Get the string from the hash and be tolerant towards punctuation and quotes.
      let value = key
      if (key in this.mapping) {
        value = this.mapping[key]
      } else {
        let strippedKey = key.replace(/[.:]$/, '')
        if (strippedKey in this.mapping) {
          let strippedValue = this.mapping[strippedKey]
          value = key.replace(strippedKey, strippedValue)
        }
      }
      // Substitution of additional strings.
      substitutions.forEach((substitution, index) => {
        value = value.replace(`%${index - 1}`, substitution, 'g')
      })
      return value
    } catch (error) {
      return key || ''
    }
  }

  /* Translate the complete HTML. */
  html(rootNode = document.body) {
    let textNodes = []
    let nodesWithAttr = { title: [], placeholder: [], alt: [] }
    // Translate all found text nodes.
    getTextNodes(rootNode, textNodes, nodesWithAttr)
    for (let i = 0; i < textNodes.length; i++) {
      let text = textNodes[i].nodeValue
      if (text.match(/^\s*$/)) continue
      // Remove whitespace from the source code to make matching easier.
      let strippedKey = String(text).replace(
        /^(\n|\s|&nbsp;)+|(\n|\s|&nbsp;)+$/g,
        ''
      )
      let strippedValue = this.get(strippedKey)
      // Return translated string with original whitespace.
      textNodes[i].nodeValue = text.replace(strippedKey, strippedValue)
    }
    for (let attr in nodesWithAttr) {
      for (let i = 0; i < nodesWithAttr[attr].length; i++) {
        try {
          let node = nodesWithAttr[attr][i]
          node.setAttribute(attr, this.get(node.getAttribute(attr)))
        } catch (e) {}
      }
    }
  }
}

const TRANSLATE = new Translate()
export default TRANSLATE

const EXCLUDED_TAGS_PATTERN = new RegExp('^(script|style)$', 'i')
const EMPTY_STRING_PATTERN = new RegExp('^(\\n|\\s|&nbsp;)+$', 'i')

/**
 * Get all text nodes that are not empty. Get also all title attributes.
 * @private
 */
function getTextNodes(node, textNodes, nodesWithAttr) {
  if (
    node &&
    node.nodeType === 1 &&
    !EXCLUDED_TAGS_PATTERN.test(node.nodeName)
  ) {
    if (
      node.getAttribute('title') !== null &&
      node.getAttribute('title') !== ''
    ) {
      nodesWithAttr['title'].push(node)
    }
    if (
      node.getAttribute('placeholder') !== null &&
      node.getAttribute('placeholder') !== ''
    ) {
      nodesWithAttr['placeholder'].push(node)
    }
    for (let i = 0; i < node.childNodes.length; i++) {
      let childNode = node.childNodes[i]
      if (
        childNode &&
        childNode.nodeType === 3 &&
        !EMPTY_STRING_PATTERN.test(childNode.nodeValue)
      ) {
        textNodes.push(childNode)
      } else {
        getTextNodes(childNode, textNodes, nodesWithAttr)
      }
    }
  }
}
