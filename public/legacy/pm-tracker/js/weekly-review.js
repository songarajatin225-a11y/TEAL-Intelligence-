/* ==========================================================================
   weekly-review.js — weekly product manager review
   Narrative sections + automatic current vs previous week KPI comparison.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  var SECTIONS = [
    { key: 'keyAchievements', label: 'Key Achievements' },
    { key: 'customerProgress', label: 'Customer Progress' },
    { key: 'newOpportunities', label: 'New Opportunities' },
    { key: 'technicalProgress', label: 'Technical Progress' },
    { key: 'rdProgress', label: 'R&D Progress' },
    { key: 'localizationProgress', label: 'Localization Progress' },
    { key: 'samplesDemos', label: 'Samples / Demonstrations' },
    { key: 'supplierPartnerProgress', label: 'Supplier / Partner Progress' },
    { key: 'majorChallenges', label: 'Major Challenges' },
    { key: 'decisionsRequired', label: 'Decisions Required' },
    { key: 'nextWeekPriorities', label: 'Next Week Priorities' }
  ];

  var weekStart = U.toISODate(U.startOfWeek(U.today()));
  var current = null;
  var cache = null;

  /* --------------------------- Week analytics --------------------------- */

  function inWeek(dateValue, start) {
    var d = U.parseDate(dateValue);
    if (!d) return false;
    var s = U.parseDate(start), e = U.addDays(s, 6);
    return d >= s && d <= e;
  }

  function weekMetrics(d, start) {
    var acts = d.activities || [];
    var created = acts.filter(function (r) { return inWeek(r.dateAdded || r.createdAt, start); });
    var completed = acts.filter(function (r) {
      return r.status === 'Completed' && inWeek(r.lastUpdated || r.updatedAt, start);
    });
    var meetings = (d.meetings || []).filter(function (r) { return inWeek(r.meetingDate, start); });
    var samples = (d.samples || []).filter(function (r) {
      return inWeek(r.requestDate, start) || inWeek(r.lastUpdated, start);
    });
    var customersAdded = (d.customers || []).filter(function (r) { return inWeek(r.dateAdded, start); });
    var opportunities = (d.customers || []).filter(function (r) {
      return inWeek(r.lastUpdated, start) && r.opportunityStage && r.opportunityStage !== 'Lost';
    });
    var locUpdated = (d.localization || []).filter(function (r) { return inWeek(r.lastUpdated, start); });
    var weighted = (d.customers || []).reduce(function (a, r) {
      return a + (U.weightedValue(r) || 0);
    }, 0) + (d.activities || []).reduce(function (a, r) {
      return a + (U.weightedValue(r) || 0);
    }, 0);
    var overdueNow = ['activities', 'samples', 'meetings', 'localization'].reduce(function (a, k) {
      return a + (d[k] || []).filter(function (r) { return U.decorateFor(r, k)._overdue; }).length;
    }, 0);

    return {
      'Activities created': created.length,
      'Activities completed': completed.length,
      'Meetings held': meetings.length,
      'Samples touched': samples.length,
      'Customers added': customersAdded.length,
      'Opportunities updated': opportunities.length,
      'Localization updates': locUpdated.length,
      'Weighted pipeline': Math.round(weighted),
      'Currently overdue': overdueNow
    };
  }

  function deltaCell(cur, prev, key) {
    if (prev === 0 && cur === 0) return '<span class="delta-flat">—</span>';
    if (prev === 0) return '<span class="delta-up">new</span>';
    var pct = Math.round(((cur - prev) / Math.abs(prev)) * 100);
    var lowerIsBetter = key === 'Currently overdue';
    var good = lowerIsBetter ? pct <= 0 : pct >= 0;
    var cls = pct === 0 ? 'delta-flat' : (good ? 'delta-up' : 'delta-down');
    var arrow = pct === 0 ? '' : (pct > 0 ? '▲ ' : '▼ ');
    return '<span class="' + cls + '">' + arrow + (pct > 0 ? '+' : '') + pct + '%</span>';
  }

  function renderKpiTable(d) {
    var host = document.getElementById('weekKpis');
    if (!host) return;
    var cur = weekMetrics(d, weekStart);
    var prev = weekMetrics(d, U.toISODate(U.addDays(weekStart, -7)));
    // Two indicators are point-in-time snapshots, not per-week counts, so no
    // week-over-week comparison is meaningful for them.
    var SNAPSHOT = { 'Weighted pipeline': 1, 'Currently overdue': 1 };
    var rows = Object.keys(cur).map(function (k) {
      var isValue = k === 'Weighted pipeline';
      var fmt = function (v) { return isValue ? U.formatValue(v) : v; };
      if (SNAPSHOT[k]) {
        return '<tr><td>' + U.escapeHtml(k) + ' <span class="xsmall muted">(now)</span></td>' +
          '<td class="num bold">' + fmt(cur[k]) + '</td>' +
          '<td class="num muted">—</td>' +
          '<td class="num"><span class="delta-flat xsmall">snapshot</span></td></tr>';
      }
      return '<tr><td>' + U.escapeHtml(k) + '</td>' +
        '<td class="num bold">' + fmt(cur[k]) + '</td>' +
        '<td class="num muted">' + fmt(prev[k]) + '</td>' +
        '<td class="num">' + deltaCell(cur[k], prev[k], k) + '</td></tr>';
    }).join('');
    host.innerHTML =
      '<table class="kpi-compare-table"><thead><tr>' +
      '<th scope="col">Indicator</th><th scope="col" class="num">This week</th>' +
      '<th scope="col" class="num">Previous</th><th scope="col" class="num">Change</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* --------------------------- Auto-fill draft --------------------------- */

  function autoDraft(d) {
    function lines(rows, fn) {
      return rows.slice(0, 8).map(function (r) { return '• ' + fn(r); }).join('\n');
    }
    var s = weekStart;
    var out = {};

    out.keyAchievements = lines((d.activities || []).filter(function (r) {
      return r.status === 'Completed' && inWeek(r.lastUpdated || r.updatedAt, s);
    }), function (r) { return r.activity + (r.customer ? ' (' + r.customer + ')' : ''); });

    out.customerProgress = lines((d.meetings || []).filter(function (r) { return inWeek(r.meetingDate, s); }),
      function (r) {
        return (r.customer || 'Customer') + ' — ' + (r.objective || r.meetingType || 'meeting') +
          (U.isBlank(r.decision) ? '' : ' | Decision: ' + r.decision);
      });

    out.newOpportunities = lines((d.customers || []).filter(function (r) {
      return inWeek(r.dateAdded, s) || (inWeek(r.lastUpdated, s) && r.opportunityStage);
    }), function (r) {
      return r.company + ' — ' + (r.opportunityStage || 'Lead') +
        (U.isBlank(r.commercialPotential) ? '' : ' | ' + U.formatValue(r.commercialPotential));
    });

    out.technicalProgress = lines((d.activities || []).filter(function (r) {
      return ['Technical Evaluation', 'Application Engineering'].indexOf(r.workstream) !== -1 &&
        inWeek(r.lastUpdated, s);
    }), function (r) { return r.activity + ' — ' + (r.status || ''); });

    out.rdProgress = lines((d.activities || []).filter(function (r) {
      return r.workstream === 'R&D' && inWeek(r.lastUpdated, s);
    }), function (r) { return r.activity + ' — ' + (r.status || ''); });

    out.localizationProgress = lines((d.localization || []).filter(function (r) {
      return inWeek(r.lastUpdated, s);
    }), function (r) {
      return r.projectName + ' — ' + (r.currentStatus || '') +
        (U.isBlank(r.localizationPercent) ? '' : ' (' + r.localizationPercent + '% localized)');
    });

    out.samplesDemos = lines((d.samples || []).filter(function (r) {
      return inWeek(r.lastUpdated, s) || inWeek(r.requestDate, s);
    }), function (r) {
      return (r.customer || '') + ' — ' + (r.product || r.partNumber || 'sample') + ' — ' + (r.sampleStatus || '');
    });

    out.supplierPartnerProgress = lines((d.suppliers || []).filter(function (r) {
      return inWeek(r.lastUpdated, s);
    }), function (r) { return r.company + ' — ' + (r.currentEngagement || ''); });

    var blocked = [];
    ['activities', 'localization', 'samples'].forEach(function (k) {
      (d[k] || []).forEach(function (r) {
        U.decorateFor(r, k);
        if (r._closed) return;
        var reason = r.blocker || r.keyChallenge || r.technicalIssue;
        if (!U.isBlank(reason)) {
          var e = LPM.schema.entities[k];
          blocked.push('• ' + (r[e.titleField] || r.code) + ' — ' + reason);
        }
      });
    });
    out.majorChallenges = blocked.slice(0, 8).join('\n');

    var decisions = [];
    ['activities', 'localization'].forEach(function (k) {
      (d[k] || []).forEach(function (r) {
        if (/^yes$/i.test(String(r.managementSupportRequired || r.managementSupport || ''))) {
          var e = LPM.schema.entities[k];
          decisions.push('• ' + (r[e.titleField] || r.code) + ' — management support required');
        }
      });
    });
    (d.dailyLogs || []).forEach(function (l) {
      if (inWeek(l.date, s) && !U.isBlank(l.decisionRequired)) decisions.push('• ' + l.decisionRequired);
    });
    out.decisionsRequired = U.unique(decisions).slice(0, 8).join('\n');

    var next = [];
    ['activities'].forEach(function (k) {
      (d[k] || []).forEach(function (r) {
        U.decorateFor(r, k);
        if (r._closed) return;
        var t = U.parseDate(r.targetDate);
        var from = U.addDays(U.parseDate(weekStart), 7), to = U.addDays(from, 6);
        if ((t && t >= from && t <= to) || r._overdue) {
          next.push('• ' + r.activity + (r.customer ? ' (' + r.customer + ')' : '') +
            (r._overdue ? ' [overdue]' : ''));
        }
      });
    });
    (d.dailyLogs || []).forEach(function (l) {
      if (inWeek(l.date, s) && !U.isBlank(l.tomorrowPriority)) next.push('• ' + l.tomorrowPriority);
    });
    out.nextWeekPriorities = U.unique(next).slice(0, 10).join('\n');

    return out;
  }

  /* ------------------------------ Rendering ------------------------------ */

  function buildPage(root) {
    ui.clear(root);
    var head = ui.el('div', { class: 'page__head' });
    head.innerHTML = '<div><h1 class="page__title">Weekly Product Manager Review</h1>' +
      '<div class="page__subtitle" id="weekSubtitle"></div></div>';
    var actions = ui.el('div', { class: 'page__actions' });
    actions.innerHTML =
      '<div class="week-nav">' +
        '<button type="button" class="btn btn--icon" id="btnPrevWeek" aria-label="Previous week">' +
          ui.icon('chevronLeft') + '</button>' +
        '<span class="week-label" id="weekLabel"></span>' +
        '<button type="button" class="btn btn--icon" id="btnNextWeek" aria-label="Next week">' +
          ui.icon('chevronRight') + '</button>' +
      '</div>' +
      '<button type="button" class="btn" id="btnThisWeek">This week</button>' +
      '<button type="button" class="btn" id="btnAutoFill">' + ui.icon('refresh') + '<span>Auto-fill from data</span></button>' +
      '<button type="button" class="btn" id="btnPrintWeek">' + ui.icon('print') + '<span>Print</span></button>' +
      '<button type="button" class="btn btn--primary" id="btnSaveWeek">' + ui.icon('check') + '<span>Save review</span></button>';
    head.appendChild(actions);
    root.appendChild(head);

    var kpiCard = ui.el('div', { class: 'card mb-4' });
    kpiCard.innerHTML = '<div class="card__head"><span class="card__title">Week over week</span>' +
      '<span class="card__hint">Calculated from the database</span></div>' +
      '<div class="card__body card__body--flush"><div class="table-wrap" id="weekKpis"></div></div>';
    root.appendChild(kpiCard);

    var card = ui.el('div', { class: 'card' });
    card.innerHTML = '<div class="card__head"><span class="card__title">Review</span>' +
      '<span class="card__hint" id="weekSavedHint"></span></div>';
    var body = ui.el('div', { class: 'card__body' });
    var grid = ui.el('div', { class: 'log-grid' });
    SECTIONS.forEach(function (s) {
      var w = ui.el('div', { class: 'field full' });
      w.innerHTML = '<label for="wr_' + s.key + '">' + U.escapeHtml(s.label) + '</label>' +
        '<textarea id="wr_' + s.key + '" data-wr="' + s.key + '" rows="3"></textarea>';
      grid.appendChild(w);
    });
    body.appendChild(grid);
    card.appendChild(body);
    root.appendChild(card);

    document.getElementById('btnPrevWeek').addEventListener('click', function () { shift(-7); });
    document.getElementById('btnNextWeek').addEventListener('click', function () { shift(7); });
    document.getElementById('btnThisWeek').addEventListener('click', function () {
      weekStart = U.toISODate(U.startOfWeek(U.today())); refresh();
    });
    document.getElementById('btnSaveWeek').addEventListener('click', save);
    document.getElementById('btnPrintWeek').addEventListener('click', function () { window.print(); });
    document.getElementById('btnAutoFill').addEventListener('click', function () {
      if (!cache) return;
      var draft = autoDraft(cache);
      var filled = 0;
      SECTIONS.forEach(function (s) {
        var el = document.getElementById('wr_' + s.key);
        if (!el) return;
        if (U.isBlank(el.value) && !U.isBlank(draft[s.key])) { el.value = draft[s.key]; filled++; }
      });
      ui.toast(filled ? filled + ' sections drafted from your data' :
        'Nothing new to draft — all sections already have content', filled ? 'success' : 'info');
    });
  }

  function shift(days) {
    weekStart = U.toISODate(U.addDays(U.parseDate(weekStart), days));
    refresh();
  }

  function readForm() {
    var rec = { weekStart: weekStart };
    ui.qsa('[data-wr]').forEach(function (el) { rec[el.getAttribute('data-wr')] = el.value.trim(); });
    return rec;
  }

  function save() {
    var rec = readForm();
    var filled = SECTIONS.some(function (s) { return !U.isBlank(rec[s.key]); });
    if (!filled) { ui.toast('Add at least one section before saving', 'warning'); return; }
    var work = current && current.id
      ? LPM.db.updateRecord('weeklyReviews', Object.assign({ id: current.id }, rec))
      : LPM.db.addRecord('weeklyReviews', rec);
    work.then(function () {
      ui.toast('Weekly review saved', 'success');
      refresh();
      LPM.app.updateRecordCount();
    }).catch(function (err) { ui.toast('Save failed: ' + err.message, 'error'); });
  }

  function refresh() {
    document.getElementById('weekLabel').textContent = U.weekLabel(weekStart);
    document.getElementById('weekSubtitle').textContent =
      U.formatDate(weekStart) + ' – ' + U.formatDate(U.addDays(U.parseDate(weekStart), 6));

    return LPM.db.getMany(['activities', 'customers', 'localization', 'samples', 'meetings',
      'suppliers', 'dailyLogs', 'weeklyReviews']).then(function (d) {
      cache = d;
      renderKpiTable(d);
      current = (d.weeklyReviews || []).filter(function (r) { return r.weekStart === weekStart; })[0] || null;
      ui.qsa('[data-wr]').forEach(function (el) {
        el.value = (current && current[el.getAttribute('data-wr')]) || '';
      });
      document.getElementById('weekSavedHint').textContent = current
        ? 'Saved ' + (U.formatDateTime(current.updatedAt) || '')
        : 'Not saved yet';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'weekly-review' }).then(function () {
      var q = U.getQuery();
      if (q.week && U.parseDate(q.week)) weekStart = U.toISODate(U.startOfWeek(q.week));
      buildPage(document.getElementById('pageRoot'));
      return refresh();
    }).catch(function () {});
  });
})(window, document);
