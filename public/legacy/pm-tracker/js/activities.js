/* activities.js — Master Activity Tracker page */
(function (window, document) {
  'use strict';
  var LPM = window.LPM;

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'activities' }).then(function () {
      LPM.crud.listPage({ entity: 'activities', root: document.getElementById('pageRoot') });
    }).catch(function () { /* boot handles redirects and fatal errors */ });
  });
})(window, document);
