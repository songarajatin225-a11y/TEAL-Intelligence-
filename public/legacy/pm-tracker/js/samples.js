/* samples.js — Sample / demo / trial tracker
   Adds a lifecycle summary and a one-click "advance stage" row action. */
(function (window, document) {
  'use strict';
  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  var STAGES = LPM.schema.V.sampleStatus;

  function summaryCard() {
    var card = ui.el('div', { class: 'card mb-4' });
    card.innerHTML =
      '<div class="card__head"><span class="card__title">Sample lifecycle</span>' +
      '<span class="card__hint" data-smp-hint></span></div>' +
      '<div class="card__body"><div id="smpPipeline"></div></div>';
    return card;
  }

  function renderSummary(rows) {
    var host = document.getElementById('smpPipeline');
    if (!host) return;
    var counts = U.groupCount(rows, 'sampleStatus');
    host.innerHTML = '<div class="pipeline">' + STAGES.map(function (s) {
      var n = counts[s] || 0;
      return '<span class="pipeline__step' + (n ? ' pipeline__step--current' : '') +
        '" title="' + U.escapeHtml(s) + ': ' + n + '">' + U.escapeHtml(s) + '<br>' + n + '</span>';
    }).join('') + '</div>';
    var hint = document.querySelector('[data-smp-hint]');
    if (hint) {
      var open = rows.filter(function (r) { return r.sampleStatus !== 'Closed'; }).length;
      hint.textContent = open + ' in progress · ' + rows.length + ' in view';
    }
  }

  LPM.crud.hooks.samples = {
    rowActions: [{
      label: 'Advance to next stage', icon: 'check',
      when: function (r) { return r.sampleStatus && r.sampleStatus !== 'Closed'; },
      onClick: function (r, reload) {
        var i = STAGES.indexOf(r.sampleStatus);
        if (i < 0 || i >= STAGES.length - 1) return;
        var next = STAGES[i + 1];
        ui.confirm({
          title: 'Advance sample stage',
          message: 'Move ' + (r.code || 'this sample') + ' from “' + r.sampleStatus + '” to “' + next + '”?',
          confirmLabel: 'Advance'
        }).then(function (ok) {
          if (!ok) return;
          LPM.db.updateRecord('samples', { id: r.id, sampleStatus: next })
            .then(function () { ui.toast('Sample stage updated to ' + next, 'success'); reload(); })
            .catch(function (e) { ui.toast('Update failed: ' + e.message, 'error'); });
        });
      }
    }]
  };

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'samples' }).then(function () {
      LPM.crud.listPage({
        entity: 'samples',
        root: document.getElementById('pageRoot'),
        beforeTable: summaryCard(),
        onRendered: function (filtered) { renderSummary(filtered); }
      });
    }).catch(function () {});
  });
})(window, document);
