define([], function () {

  function addCSS (cssString) {
    var styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(styleElement);
    styleElement.innerHTML = cssString;
  }

  return {
    addCSS: addCSS
  }
});
