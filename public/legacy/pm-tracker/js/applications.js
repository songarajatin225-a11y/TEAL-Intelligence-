/* applications.js — Laser application database page */
(function (window, document) {
  'use strict';
  var LPM = window.LPM;

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'applications' }).then(function () {
      LPM.crud.listPage({ entity: 'applications', root: document.getElementById('pageRoot') });
    }).catch(function () {});
  });
})(window, document);
