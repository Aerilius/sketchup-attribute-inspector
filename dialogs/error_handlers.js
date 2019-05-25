import Vue from 'vue'
import Bridge from 'sketchup-bridge'

Vue.config.errorHandler = function(error, node, info) {
  Bridge.error(error)
}

window.onerror = function(
  messageOrEvent,
  source,
  lineNumber,
  columnNumber,
  errorObject
) {
  console.log([messageOrEvent, source, lineNumber, columnNumber, errorObject])
  if (!errorObject) {
    errorObject = new Error()
    errorObject.name = 'Error'
    errorObject.message = messageOrEvent
    errorObject.fileName = source
    errorObject.lineNumber = lineNumber
    errorObject.columnNumber = columnNumber
  }
  Bridge.error(errorObject)
  return true
}
