/* suppliers.js — Supplier / partner database page */
(function (window, document) {
  'use strict';
  var LPM = window.LPM;

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'suppliers' }).then(function () {
      LPM.crud.listPage({ entity: 'suppliers', root: document.getElementById('pageRoot') });
    }).catch(function () {});
  });
})(window, document);
