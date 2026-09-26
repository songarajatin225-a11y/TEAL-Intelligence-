/* competitors.js — Competitor / market intelligence page */
(function (window, document) {
  'use strict';
  var LPM = window.LPM;

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'competitors' }).then(function () {
      LPM.crud.listPage({ entity: 'competitors', root: document.getElementById('pageRoot') });
    }).catch(function () {});
  });
})(window, document);
