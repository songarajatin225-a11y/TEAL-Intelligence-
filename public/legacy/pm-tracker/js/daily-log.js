/* ==========================================================================
   daily-log.js — fast daily capture (target: under 5 minutes)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  var FIELDS = [
    { key: 'meetings', label: 'Meetings', span: 1 },
    { key: 'customerCalls', label: 'Customer Calls', span: 1 },
    { key: 'technicalDiscussions', label: 'Technical Discussions', span: 1 },
    { key: 'rdWork', label: 'R&D Work', span: 1 },
    { key: 'businessDevelopment', label: 'Business Development', span: 1 },
    { key: 'followUps', label: 'Follow-ups', span: 1 },
    { key: 'keyAchievement', label: 'Key Achievement', span: 2 },
    { key: 'keyIssue', label: 'Key Issue', span: 1 },
    { key: 'blocker', label: 'Blocker', span: 1 },
    { key: 'decisionRequired', label: 'Decision Required', span: 1 },
    { key: 'tomorrowPriority', label: "Tomorrow's Priority", span: 1 },
    { key: 'notes', label: 'Notes', span: 2 }
  ];

  var current = null;
  var dateISO = U.todayISO();

  function buildPage(root) {
    ui.clear(root);
    var head = ui.el('div', { class: 'page__head' });
    head.innerHTML =
      '<div><h1 class="page__title">Daily Log</h1>' +
      '<div class="page__subtitle" id="logDateLabel"></div></div>';
    var actions = ui.el('div', { class: 'page__actions' });
    actions.innerHTML =
      '<input type="date" id="logDate" aria-label="Log date" style="width:auto">' +
      '<button type="button" class="btn" id="btnToday">' + ui.icon('clock') + '<span>Today</span></button>' +
      '<button type="button" class="btn btn--primary" id="btnSaveLog">' +
      ui.icon('check') + '<span>Save Today\'s Log</span></button>';
    head.appendChild(actions);
    root.appendChild(head);

    var grid = ui.el('div', { class: 'grid-2' });

    /* Left: the log form */
    var card = ui.el('div', { class: 'card' });
    card.innerHTML = '<div class="card__head"><span class="card__title">Log entry</span>' +
      '<span class="card__hint" id="logSavedHint"></span></div>';
    var body = ui.el('div', { class: 'card__body' });

    var pr = ui.el('div', { class: 'field' });
    pr.innerHTML = '<label for="priority1">Today\'s Top 3 Priorities</label>' +
      '<div class="priority-inputs">' +
      [1, 2, 3].map(function (n) {
        return '<div class="priority-row"><span class="num">' + n + '</span>' +
          '<input type="text" id="priority' + n + '" data-log="priority' + n +
          '" placeholder="Priority ' + n + '" aria-label="Priority ' + n + '"></div>';
      }).join('') + '</div>';
    body.appendChild(pr);
    body.appendChild(ui.el('div', { class: 'divider' }));

    var logGrid = ui.el('div', { class: 'log-grid' });
    FIELDS.forEach(function (f) {
      var w = ui.el('div', { class: 'field' + (f.span === 2 ? ' full' : '') });
      w.innerHTML = '<label for="log_' + f.key + '">' + U.escapeHtml(f.label) + '</label>' +
        '<textarea id="log_' + f.key + '" data-log="' + f.key + '" rows="' + (f.span === 2 ? 3 : 2) +
        '"></textarea>';
      logGrid.appendChild(w);
    });
    body.appendChild(logGrid);
    card.appendChild(body);
    grid.appendChild(card);

    /* Right: context + history */
    var side = ui.el('div', { class: 'stack' });
    var ctx = ui.el('div', { class: 'card' });
    ctx.innerHTML = '<div class="card__head"><span class="card__title">Due today</span>' +
      '<span class="card__hint" id="dueHint"></span></div>' +
      '<div class="card__body card__body--flush"><div class="panel-list" id="dueList"></div></div>';
    side.appendChild(ctx);

    var hist = ui.el('div', { class: 'card' });
    hist.innerHTML = '<div class="card__head"><span class="card__title">Recent logs</span></div>' +
      '<div class="card__body card__body--flush"><div class="panel-list" id="logHistory"></div></div>';
    side.appendChild(hist);
    grid.appendChild(side);

    root.appendChild(grid);

    document.getElementById('logDate').value = dateISO;
    document.getElementById('logDate').addEventListener('change', function (e) {
      dateISO = e.target.value || U.todayISO();
      loadLog();
    });
    document.getElementById('btnToday').addEventListener('click', function () {
      dateISO = U.todayISO();
      document.getElementById('logDate').value = dateISO;
      loadLog();
    });
    document.getElementById('btnSaveLog').addEventListener('click', save);

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); }
    });
  }

  function readForm() {
    var rec = { date: dateISO };
    ui.qsa('[data-log]').forEach(function (el) { rec[el.getAttribute('data-log')] = el.value.trim(); });
    return rec;
  }

  function writeForm(rec) {
    ui.qsa('[data-log]').forEach(function (el) {
      el.value = (rec && rec[el.getAttribute('data-log')]) || '';
    });
  }

  function loadLog() {
    document.getElementById('logDateLabel').textContent = U.formatLongDate(dateISO);
    return LPM.db.getAllRecords('dailyLogs').then(function (rows) {
      current = rows.filter(function (r) { return r.date === dateISO; })[0] || null;
      writeForm(current);
      var hint = document.getElementById('logSavedHint');
      hint.textContent = current
        ? 'Saved ' + (U.formatDateTime(current.updatedAt) || U.formatDate(current.lastUpdated))
        : 'Not saved yet';
      renderHistory(rows);
    });
  }

  function save() {
    var rec = readForm();
    var filled = Object.keys(rec).some(function (k) { return k !== 'date' && !U.isBlank(rec[k]); });
    if (!filled) { ui.toast('Add at least one entry before saving', 'warning'); return; }
    var work;
    if (current && current.id) work = LPM.db.updateRecord('dailyLogs', Object.assign({ id: current.id }, rec));
    else work = LPM.db.addRecord('dailyLogs', rec);
    work.then(function (saved) {
      current = saved;
      ui.toast('Daily log saved for ' + U.formatDate(dateISO), 'success');
      loadLog();
      LPM.app.updateRecordCount();
    }).catch(function (err) { ui.toast('Save failed: ' + err.message, 'error'); });
  }

  function renderHistory(rows) {
    var host = document.getElementById('logHistory');
    ui.clear(host);
    var sorted = rows.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })
      .slice(0, 10);
    if (!sorted.length) {
      host.appendChild(ui.el('div', { class: 'panel-empty', text: 'No logs saved yet.' }));
      return;
    }
    sorted.forEach(function (l) {
      var b = ui.el('button', { type: 'button', class: 'panel-item' });
      var summary = [l.priority1, l.keyAchievement, l.notes].filter(function (v) { return !U.isBlank(v); })[0] || '—';
      b.innerHTML = '<span class="panel-item__main"><span class="panel-item__title"></span>' +
        '<span class="panel-item__meta"></span></span>';
      b.querySelector('.panel-item__title').textContent = U.formatDate(l.date);
      b.querySelector('.panel-item__meta').textContent = U.truncate(summary, 60);
      b.addEventListener('click', function () {
        dateISO = l.date;
        document.getElementById('logDate').value = dateISO;
        loadLog();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      host.appendChild(b);
    });
  }

  function renderDueToday() {
    var stores = ['activities', 'meetings', 'samples', 'localization'];
    return LPM.db.getMany(stores).then(function (d) {
      var rows = [];
      stores.forEach(function (k) {
        U.decorateAll(d[k] || [], k).forEach(function (r) {
          if (r._dueToday || r._followUpDue || r._overdue) {
            var e = LPM.schema.entities[k];
            rows.push({
              entity: k, id: r.id,
              title: r[e.titleField] || r.code || '(untitled)',
              label: e.label, overdue: r._overdue,
              status: r._status, customer: r.customer
            });
          }
        });
      });
      var host = document.getElementById('dueList');
      ui.clear(host);
      document.getElementById('dueHint').textContent = rows.length + ' items';
      if (!rows.length) {
        host.appendChild(ui.el('div', { class: 'panel-empty', text: 'Nothing due today. ' }));
        return;
      }
      rows.slice(0, 12).forEach(function (r) {
        var b = ui.el('button', { type: 'button', class: 'panel-item' });
        b.innerHTML = '<span class="panel-item__main"><span class="panel-item__title"></span>' +
          '<span class="panel-item__meta">' +
          '<span>' + U.escapeHtml(r.label) + '</span>' +
          (r.customer ? '<span>' + U.escapeHtml(U.truncate(r.customer, 20)) + '</span>' : '') +
          (r.overdue ? '<span class="badge badge--danger">Overdue</span>' : '') +
          '</span></span>';
        b.querySelector('.panel-item__title').textContent = U.truncate(r.title, 50);
        b.addEventListener('click', function () { LPM.app.openRecord(r.entity, r.id); });
        host.appendChild(b);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'daily-log' }).then(function () {
      var q = U.getQuery();
      if (q.date && U.parseDate(q.date)) dateISO = U.toISODate(q.date);
      buildPage(document.getElementById('pageRoot'));
      return Promise.all([loadLog(), renderDueToday()]);
    }).catch(function () {});
  });
})(window, document);
