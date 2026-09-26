/* ==========================================================================
   dashboard.js — operating dashboard
   Every number is computed from IndexedDB at render time. Nothing is
   hard-coded. Charts degrade gracefully if the Chart.js CDN is unavailable.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  var STORES = ['activities', 'customers', 'applications', 'products', 'localization',
    'samples', 'meetings', 'suppliers', 'competitors', 'dailyLogs'];

  var data = {};
  var charts = {};

  /* ============================ DATA MODEL ============================ */

  function load() {
    return LPM.db.getMany(STORES).then(function (d) {
      STORES.forEach(function (s) { d[s] = U.decorateAll(d[s] || [], s); });
      data = d;
      return d;
    });
  }

  function openActivities(d) { return d.activities.filter(function (r) { return !r._closed; }); }

  /**
   * The opportunity view of the data.
   * A customer record carrying an opportunity stage is the authoritative entry
   * for that customer; activities only add an opportunity when their customer is
   * not tracked at customer level (or has no customer at all). Without this rule
   * the same deal would be counted twice — once from each module.
   */
  function opportunities(d) {
    var out = [];
    var tracked = {};
    d.customers.forEach(function (r) {
      if (U.isBlank(r.opportunityStage)) return;
      tracked[String(r.company || '').trim().toLowerCase()] = true;
      out.push({ stage: r.opportunityStage, weighted: r._weighted || 0, entity: 'customers',
        id: r.id, title: r.company, customer: r.company,
        value: U.toNumber(r.commercialPotential), probability: U.toNumber(r.probability) });
    });
    d.activities.forEach(function (r) {
      if (U.isBlank(r.currentStage)) return;
      var key = String(r.customer || '').trim().toLowerCase();
      if (key && tracked[key]) return;
      out.push({ stage: r.currentStage, weighted: r._weighted || 0, entity: 'activities',
        id: r.id, title: r.activity, customer: r.customer,
        value: U.toNumber(r.estimatedOpportunityValue), probability: U.toNumber(r.probability) });
    });
    return out;
  }

  function allOverdue(d) {
    var out = [];
    ['activities', 'customers', 'localization', 'samples', 'meetings', 'suppliers'].forEach(function (k) {
      (d[k] || []).forEach(function (r) { if (r._overdue) out.push(withMeta(r, k)); });
    });
    return out.sort(function (a, b) { return (a._daysRemaining || 0) - (b._daysRemaining || 0); });
  }

  function withMeta(r, entityKey) {
    var e = LPM.schema.entities[entityKey];
    r._entityKey = entityKey;
    r._title = r[e.titleField] || r.code || '(untitled)';
    r._entityLabel = e.label;
    return r;
  }

  function followUpsDue(d) {
    var out = [];
    ['activities', 'customers', 'localization', 'samples', 'meetings', 'suppliers'].forEach(function (k) {
      (d[k] || []).forEach(function (r) { if (r._followUpDue && !r._overdue) out.push(withMeta(r, k)); });
    });
    return out;
  }

  function upcoming(d) {
    var out = [];
    ['activities', 'localization', 'samples', 'meetings'].forEach(function (k) {
      (d[k] || []).forEach(function (r) { if (r._dueThisWeek) out.push(withMeta(r, k)); });
    });
    return out.sort(function (a, b) { return (a._daysRemaining || 0) - (b._daysRemaining || 0); });
  }

  function managementAttention(d) {
    var out = [];
    ['activities', 'localization', 'samples'].forEach(function (k) {
      (d[k] || []).forEach(function (r) {
        if (r._closed) return;
        if (U.needsManagement(r) || !U.isBlank(r.blocker) || !U.isBlank(r.keyChallenge) ||
            !U.isBlank(r.technicalIssue)) {
          out.push(withMeta(r, k));
        }
      });
    });
    return out.sort(function (a, b) {
      var pr = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return (pr[a.priority] === undefined ? 4 : pr[a.priority]) -
        (pr[b.priority] === undefined ? 4 : pr[b.priority]);
    });
  }

  function todaysTasks(d) {
    return d.activities.filter(function (r) { return r._dueToday || r._followUpDue; });
  }

  function technicalIssues(d) {
    var n = 0;
    d.activities.forEach(function (r) {
      if (!r._closed && (!U.isBlank(r.blocker) || r.status === 'Blocked')) n++;
    });
    d.samples.forEach(function (r) { if (!U.isBlank(r.technicalIssue) && r.sampleStatus !== 'Closed') n++; });
    d.localization.forEach(function (r) { if (!U.isBlank(r.technologyGap) && r.currentStatus !== 'Production') n++; });
    return n;
  }

  /* ============================== KPIs ============================== */

  function kpis(d) {
    var open = openActivities(d);
    var opps = opportunities(d);
    return [
      { label: 'Active Activities', value: open.length, tone: 'info', icon: 'activity',
        meta: d.activities.length + ' total', href: 'activities.html?filter=open' },
      { label: "Today's Tasks", value: todaysTasks(d).length, tone: 'accent', icon: 'clock',
        meta: 'due or follow-up today', href: 'activities.html?filter=today' },
      { label: 'Overdue', value: allOverdue(d).length, tone: 'danger', icon: 'alert',
        meta: 'all modules', href: 'reports.html?report=overdue' },
      { label: 'Due This Week', value: open.filter(function (r) { return r._dueThisWeek; }).length,
        tone: 'warning', icon: 'calendar', meta: 'next 7 days', href: 'activities.html?filter=week' },
      { label: 'Active Customers',
        value: d.customers.filter(function (r) { return r.opportunityStage && r.opportunityStage !== 'Lost'; }).length,
        tone: 'success', icon: 'users', meta: d.customers.length + ' in database', href: 'customers.html' },
      { label: 'Open Opportunities',
        value: opps.filter(function (o) { return o.stage !== 'Order' && o.stage !== 'Lost'; }).length,
        tone: 'purple', icon: 'trend',
        meta: U.formatValue(opps.filter(function (o) { return o.stage !== 'Order' && o.stage !== 'Lost'; })
          .reduce(function (a, o) { return a + (o.weighted || 0); }, 0)) + ' weighted',
        href: 'customers.html?filter=open' },
      { label: 'Samples in Progress',
        value: d.samples.filter(function (r) { return r.sampleStatus !== 'Closed'; }).length,
        tone: 'info', icon: 'package', meta: d.samples.length + ' total', href: 'samples.html' },
      { label: 'R&D Projects',
        value: open.filter(function (r) { return r.workstream === 'R&D'; }).length,
        tone: 'purple', icon: 'cpu', meta: 'open R&D activities',
        href: 'activities.html?workstream=' + encodeURIComponent('R&D') },
      { label: 'Localization Projects',
        value: d.localization.filter(function (r) { return r.currentStatus !== 'Production'; }).length,
        tone: 'accent', icon: 'cpu', meta: d.localization.length + ' total', href: 'localization.html' },
      { label: 'Technical Issues', value: technicalIssues(d), tone: 'danger', icon: 'alert',
        meta: 'blockers & gaps', href: 'activities.html?filter=blocked' }
    ];
  }

  function renderKPIs(d) {
    var host = document.getElementById('kpiGrid');
    ui.clear(host);
    kpis(d).forEach(function (k) {
      host.appendChild(ui.kpiCard({
        label: k.label, value: k.value, meta: k.meta, tone: k.tone, icon: k.icon,
        onClick: function () { window.location.href = k.href; }
      }));
    });
  }

  /* ============================== CHARTS ============================== */

  var PALETTE = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626',
    '#4f46e5', '#0d9488', '#db2777', '#65a30d', '#9333ea', '#64748b'];

  function themeColors() {
    var cs = getComputedStyle(document.documentElement);
    return {
      text: cs.getPropertyValue('--text-secondary').trim() || '#475467',
      grid: cs.getPropertyValue('--border').trim() || '#e3e7ee',
      surface: cs.getPropertyValue('--bg-surface').trim() || '#fff'
    };
  }

  function chartAvailable() { return typeof window.Chart !== 'undefined'; }

  function fallback(canvasId, message) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return;
    var box = canvas.parentNode;
    box.innerHTML = '<div class="chart-fallback">' + U.escapeHtml(message) + '</div>';
  }

  function makeChart(canvasId, config) {
    if (!chartAvailable()) {
      fallback(canvasId, 'Charts need the Chart.js library, which could not be loaded. ' +
        'All figures remain available in the panels and reports below.');
      return null;
    }
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (charts[canvasId]) { charts[canvasId].destroy(); delete charts[canvasId]; }
    try {
      charts[canvasId] = new window.Chart(canvas.getContext('2d'), config);
      return charts[canvasId];
    } catch (err) {
      fallback(canvasId, 'This chart could not be drawn (' + err.message + ').');
      return null;
    }
  }

  function countsFor(rows, key, vocabulary) {
    var counts = U.groupCount(rows, key);
    var labels = (vocabulary || Object.keys(counts)).filter(function (v) { return counts[v]; });
    return { labels: labels, values: labels.map(function (l) { return counts[l] || 0; }) };
  }

  function renderCharts(d) {
    var c = themeColors();
    var common = {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { color: c.text, boxWidth: 10, font: { size: 11 }, padding: 10 } },
        tooltip: { backgroundColor: '#101828', titleFont: { size: 12 }, bodyFont: { size: 12 } }
      }
    };

    /* 1. Activity status */
    var st = countsFor(d.activities, 'status', LPM.schema.V.status);
    if (st.labels.length) {
      makeChart('chartStatus', {
        type: 'doughnut',
        data: { labels: st.labels, datasets: [{ data: st.values, backgroundColor: PALETTE,
          borderColor: c.surface, borderWidth: 2 }] },
        options: Object.assign({ cutout: '58%' }, common)
      });
    } else fallback('chartStatus', 'No activities recorded yet.');

    /* 2. Opportunity funnel */
    var opps = opportunities(d);
    var stages = LPM.schema.V.opportunityStage;
    var stageCounts = stages.map(function (s) {
      return opps.filter(function (o) { return o.stage === s; }).length;
    });
    if (stageCounts.some(Boolean)) {
      makeChart('chartFunnel', {
        type: 'bar',
        data: { labels: stages, datasets: [{ label: 'Opportunities', data: stageCounts,
          backgroundColor: '#2563eb', borderRadius: 3, maxBarThickness: 20 }] },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: common.plugins.tooltip },
          scales: {
            x: { beginAtZero: true, ticks: { color: c.text, precision: 0 }, grid: { color: c.grid } },
            y: { ticks: { color: c.text, font: { size: 11 } }, grid: { display: false } }
          }
        }
      });
    } else fallback('chartFunnel', 'No opportunity stages recorded yet.');

    /* 3. Workstream distribution */
    var ws = countsFor(d.activities, 'workstream', LPM.schema.V.workstream);
    if (ws.labels.length) {
      makeChart('chartWorkstream', {
        type: 'bar',
        data: { labels: ws.labels, datasets: [{ label: 'Activities', data: ws.values,
          backgroundColor: PALETTE, borderRadius: 3, maxBarThickness: 26 }] },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: common.plugins.tooltip },
          scales: {
            x: { ticks: { color: c.text, font: { size: 10 }, maxRotation: 60, minRotation: 35 },
              grid: { display: false } },
            y: { beginAtZero: true, ticks: { color: c.text, precision: 0 }, grid: { color: c.grid } }
          }
        }
      });
    } else fallback('chartWorkstream', 'No activities recorded yet.');

    /* 4. Priority */
    var pr = countsFor(d.activities.filter(function (r) { return !r._closed; }),
      'priority', LPM.schema.V.priority);
    if (pr.labels.length) {
      makeChart('chartPriority', {
        type: 'doughnut',
        data: { labels: pr.labels, datasets: [{ data: pr.values,
          backgroundColor: ['#dc2626', '#d97706', '#2563eb', '#64748b'],
          borderColor: c.surface, borderWidth: 2 }] },
        options: Object.assign({ cutout: '58%' }, common)
      });
    } else fallback('chartPriority', 'No open activities.');
  }

  /* ============================== PANELS ============================== */

  function panelItem(opts) {
    var b = ui.el('button', { type: 'button', class: 'panel-item' });
    b.innerHTML =
      (opts.rank ? '<span class="panel-item__rank">' + opts.rank + '</span>' : '') +
      '<span class="panel-item__main"><span class="panel-item__title"></span>' +
      '<span class="panel-item__meta"></span></span>' +
      (opts.right ? '<span class="panel-item__right">' + opts.right + '</span>' : '');
    b.querySelector('.panel-item__title').textContent = U.truncate(opts.title, 64);
    b.querySelector('.panel-item__meta').innerHTML = opts.meta || '';
    if (opts.onClick) b.addEventListener('click', opts.onClick);
    return b;
  }

  function fillPanel(id, rows, mapper, emptyText) {
    var host = document.getElementById(id);
    if (!host) return;
    ui.clear(host);
    if (!rows.length) {
      host.appendChild(ui.el('div', { class: 'panel-empty', text: emptyText }));
      return;
    }
    rows.forEach(function (r, i) { host.appendChild(mapper(r, i)); });
  }

  function recordItem(r, rank) {
    return panelItem({
      rank: rank,
      title: r._title || '(untitled)',
      meta: [
        r._entityLabel ? '<span>' + U.escapeHtml(r._entityLabel) + '</span>' : '',
        r.customer ? '<span>' + U.escapeHtml(U.truncate(r.customer, 24)) + '</span>' : '',
        r.priority ? ui.badge(r.priority) : '',
        r._status ? ui.badge(r._status) : ''
      ].filter(Boolean).join(''),
      right: r._targetDate
        ? (r._daysRemaining !== null && r._daysRemaining < 0
          ? '<span class="text-danger bold">' + Math.abs(r._daysRemaining) + 'd over</span>'
          : U.escapeHtml(U.formatDate(r._targetDate)))
        : '',
      onClick: function () { LPM.app.openRecord(r._entityKey, r.id); }
    });
  }

  function renderPanels(d) {
    /* Today's priorities — from today's daily log, else the top open activities */
    var todayLog = (d.dailyLogs || []).filter(function (l) { return l.date === U.todayISO(); })[0];
    var priorities = [];
    if (todayLog) {
      ['priority1', 'priority2', 'priority3'].forEach(function (k) {
        if (!U.isBlank(todayLog[k])) priorities.push({ text: todayLog[k], fromLog: true });
      });
    }
    if (!priorities.length) {
      var rank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      priorities = openActivities(d).slice().sort(function (a, b) {
        var pa = rank[a.priority] === undefined ? 4 : rank[a.priority];
        var pb = rank[b.priority] === undefined ? 4 : rank[b.priority];
        if (pa !== pb) return pa - pb;
        var da = a._daysRemaining === null ? 9999 : a._daysRemaining;
        var db = b._daysRemaining === null ? 9999 : b._daysRemaining;
        return da - db;
      }).slice(0, 3).map(function (r) { return { record: withMeta(r, 'activities') }; });
    }
    fillPanel('panelPriorities', priorities, function (p, i) {
      if (p.fromLog) {
        return panelItem({ rank: i + 1, title: p.text,
          meta: '<span>From today’s log</span>',
          onClick: function () { window.location.href = 'daily-log.html'; } });
      }
      return recordItem(p.record, i + 1);
    }, 'No priorities set. Add them in the Daily Log or create activities.');

    var fu = followUpsDue(d);
    fillPanel('panelFollowups', fu.slice(0, 8), function (r) { return recordItem(r); },
      'No follow-ups due today. ');

    var up = upcoming(d);
    fillPanel('panelUpcoming', up.slice(0, 8), function (r) { return recordItem(r); },
      'Nothing due in the next 7 days.');

    var od = allOverdue(d);
    fillPanel('panelOverdue', od.slice(0, 10), function (r) { return recordItem(r); },
      'Nothing is overdue. ');

    var mg = managementAttention(d);
    fillPanel('panelManagement', mg.slice(0, 8), function (r) {
      var reasons = [];
      if (/^(yes)$/i.test(String(r.managementSupportRequired || r.managementSupport || ''))) reasons.push('Support required');
      if (r._status === 'Blocked' || !U.isBlank(r.blocker)) reasons.push('Blocked');
      if (r.priority === 'Critical') reasons.push('Critical');
      if (!U.isBlank(r.technicalIssue)) reasons.push('Technical issue');
      if (!U.isBlank(r.keyChallenge)) reasons.push('Key challenge');
      var item = recordItem(r);
      var meta = item.querySelector('.panel-item__meta');
      meta.innerHTML = reasons.map(function (x) {
        return '<span class="badge badge--danger">' + U.escapeHtml(x) + '</span>';
      }).join('') + meta.innerHTML;
      return item;
    }, 'No escalations or blockers. ');

    var opps = opportunities(d).filter(function (o) { return o.stage !== 'Lost'; })
      .sort(function (a, b) { return (b.weighted || 0) - (a.weighted || 0); }).slice(0, 8);
    fillPanel('panelOpportunities', opps.filter(function (o) { return o.weighted > 0; }),
      function (o) {
        return panelItem({
          title: o.title || '(untitled)',
          meta: [
            o.customer ? '<span>' + U.escapeHtml(U.truncate(o.customer, 26)) + '</span>' : '',
            ui.badge(o.stage),
            o.probability ? '<span>' + o.probability + '%</span>' : ''
          ].filter(Boolean).join(''),
          right: '<span class="bold">' + U.escapeHtml(U.formatValue(o.weighted)) + '</span>',
          onClick: function () { LPM.app.openRecord(o.entity, o.id); }
        });
      }, 'No valued opportunities yet. Add an estimated value and probability.');

    var counts = {
      followups: fu.length, upcoming: up.length, overdue: od.length,
      management: mg.length, opportunities: opps.length
    };
    Object.keys(counts).forEach(function (k) {
      var el = document.querySelector('[data-count-' + k + ']');
      if (el) el.textContent = counts[k];
    });
  }

  /* =============================== BOOT =============================== */

  function renderAll() {
    return load().then(function (d) {
      renderKPIs(d);
      renderCharts(d);
      renderPanels(d);
      var meta = document.getElementById('dashMeta');
      if (meta) {
        meta.textContent = U.formatLongDate(U.today()) + ' · ' +
          U.weekLabel(U.todayISO()) + ' · last refreshed ' +
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }).catch(function (err) {
      var host = document.getElementById('pageRoot');
      if (host) {
        ui.clear(host);
        host.appendChild(ui.errorState('The dashboard could not be built: ' + err.message, renderAll));
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'dashboard' }).then(function () {
      LPM.app.onDataChanged = function () { renderAll(); };
      window.addEventListener('lpm:theme-changed', function () {
        if (Object.keys(charts).length) renderCharts(data);
      });
      var refresh = document.getElementById('btnRefresh');
      if (refresh) refresh.addEventListener('click', function () {
        renderAll().then(function () { ui.toast('Dashboard refreshed', 'success'); });
      });
      var print = document.getElementById('btnPrint');
      if (print) print.addEventListener('click', function () { window.print(); });
      return renderAll();
    }).catch(function () {});
  });
})(window, document);
