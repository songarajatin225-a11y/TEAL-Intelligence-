/* customers.js — Customer & partner database page */
(function (window, document) {
  'use strict';
  var LPM = window.LPM;

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'customers' }).then(function () {
      LPM.crud.listPage({ entity: 'customers', root: document.getElementById('pageRoot') });
    }).catch(function () {});
  });
})(window, document);
