requirejs(['vue', './bridge'], function (Vue, Bridge) {

  Vue.config.errorHandler = function (error, node, info) {
    console.log('errorHandler', error, node, info);
    Bridge.error(error);
  };

  function init () {
    require(['./app']);
  }

  Bridge.call('translate');

  if (document.readyState === 'loading') { // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.onerror = function (messageOrEvent, source, lineNumber, columnNumber, errorObject) {
    console.log([messageOrEvent, source, lineNumber, columnNumber, errorObject]);
    if (!errorObject) {
      errorObject = new Error();
      errorObject.name = 'Error';
      errorObject.message = messageOrEvent;
      errorObject.fileName = source;
      errorObject.lineNumber = lineNumber;
      errorObject.columnNumber = columnNumber;
    }
    Bridge.error(errorObject);
    return true;
  };
});
