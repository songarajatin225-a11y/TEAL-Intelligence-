/* products.js — Product / part number database page */
(function (window, document) {
  'use strict';
  var LPM = window.LPM;

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'products' }).then(function () {
      LPM.crud.listPage({ entity: 'products', root: document.getElementById('pageRoot') });
    }).catch(function () {});
  });
})(window, document);
