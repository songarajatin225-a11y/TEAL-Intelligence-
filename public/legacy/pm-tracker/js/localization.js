/* localization.js — Laser diode localization & R&D module
   Adds a pipeline summary above the standard record table. */
(function (window, document) {
  'use strict';
  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  var STAGES = LPM.schema.V.localizationStage;

  function summaryCard() {
    var card = ui.el('div', { class: 'card mb-4' });
    card.innerHTML =
      '<div class="card__head"><span class="card__title">Localization pipeline</span>' +
      '<span class="card__hint" data-loc-hint></span></div>' +
      '<div class="card__body"><div id="locPipeline"></div>' +
      '<div class="grid-3 mt-4" id="locStats"></div></div>';
    return card;
  }

  function renderSummary(rows) {
    var host = document.getElementById('locPipeline');
    var stats = document.getElementById('locStats');
    var hint = document.querySelector('[data-loc-hint]');
    if (!host) return;

    var counts = U.groupCount(rows, 'currentStatus');
    host.innerHTML = '<div class="pipeline">' + STAGES.map(function (s) {
      var n = counts[s] || 0;
      return '<span class="pipeline__step' + (n ? ' pipeline__step--current' : '') +
        '" title="' + U.escapeHtml(s) + ': ' + n + ' project(s)">' +
        U.escapeHtml(s) + '<br>' + n + '</span>';
    }).join('') + '</div>';

    var active = rows.filter(function (r) { return r.currentStatus !== 'Production'; });
    var overdue = rows.filter(function (r) { return r._overdue; });
    var pct = rows.map(function (r) { return U.toNumber(r.localizationPercent); })
      .filter(function (n) { return n !== null; });
    var avg = pct.length ? Math.round(pct.reduce(function (a, b) { return a + b; }, 0) / pct.length) : 0;
    var mgmt = rows.filter(function (r) { return U.needsManagement(r); });

    stats.innerHTML = '' +
      '<div><div class="detail-item__label">Active projects</div>' +
        '<div class="bold" style="font-size:20px">' + active.length + '</div></div>' +
      '<div><div class="detail-item__label">Average localization</div>' +
        '<div class="bold" style="font-size:20px">' + avg + '%</div>' + ui.progress(avg, 'success') + '</div>' +
      '<div><div class="detail-item__label">Overdue / needs support</div>' +
        '<div class="bold" style="font-size:20px">' + overdue.length + ' / ' + mgmt.length + '</div></div>';

    if (hint) hint.textContent = rows.length + ' projects in view';
  }

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'localization' }).then(function () {
      LPM.crud.listPage({
        entity: 'localization',
        root: document.getElementById('pageRoot'),
        beforeTable: summaryCard(),
        onRendered: function (filtered) { renderSummary(filtered); }
      });
    }).catch(function () {});
  });
})(window, document);
