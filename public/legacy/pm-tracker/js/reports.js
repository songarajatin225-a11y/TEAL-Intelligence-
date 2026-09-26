/* ==========================================================================
   reports.js — operational reports with CSV export and print layouts
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  var data = {};
  var range = { from: '', to: '' };
  var activeId = 'daily';

  function ent(k) { return LPM.schema.entities[k]; }

  function decorateAll(d) {
    Object.keys(d).forEach(function (k) {
      if (LPM.schema.entities[k]) d[k] = U.decorateAll(d[k], k);
    });
    return d;
  }

  function within(v) { return U.inRange(v, range.from, range.to); }

  function tag(rows, entityKey) {
    return rows.map(function (r) {
      r._entityKey = entityKey;
      r._title = r[ent(entityKey).titleField] || r.code || '(untitled)';
      r._module = ent(entityKey).label;
      return r;
    });
  }

  /* ------------------------------ Reports ------------------------------ */

  var REPORTS = [
    {
      id: 'daily', label: 'Daily Activity', defaultRange: 'today',
      build: function (d) {
        var rows = tag((d.activities || []).filter(function (r) {
          return within(r.lastUpdated) || within(r.dateAdded) || within(r.targetDate) ||
            within(r.nextActionDate);
        }), 'activities');
        var meetings = tag((d.meetings || []).filter(function (r) { return within(r.meetingDate); }), 'meetings');
        return {
          title: 'Daily Activity Report',
          summary: [
            { l: 'Activities touched', v: rows.length },
            { l: 'Meetings', v: meetings.length },
            { l: 'Overdue', v: rows.filter(function (r) { return r._overdue; }).length },
            { l: 'Completed', v: rows.filter(function (r) { return r.status === 'Completed'; }).length }
          ],
          columns: [
            { key: 'code', label: 'ID', type: 'code' },
            { key: 'activity', label: 'Activity', type: 'title' },
            { key: 'customer', label: 'Customer' },
            { key: 'workstream', label: 'Workstream' },
            { key: 'priority', label: 'Priority', type: 'badge' },
            { key: 'status', label: 'Status', type: 'badge' },
            { key: 'nextAction', label: 'Next Action' },
            { key: 'targetDate', label: 'Target', type: 'date' }
          ],
          rows: rows,
          extraTables: [{
            title: 'Meetings in period',
            columns: [
              { key: 'meetingDate', label: 'Date', type: 'date' },
              { key: 'customer', label: 'Customer' },
              { key: 'meetingType', label: 'Type' },
              { key: 'objective', label: 'Objective' },
              { key: 'actionItem', label: 'Action Item' },
              { key: 'dueDate', label: 'Due', type: 'date' },
              { key: 'status', label: 'Status', type: 'badge' }
            ],
            rows: meetings
          }]
        };
      }
    },
    {
      id: 'weekly', label: 'Weekly Review', defaultRange: 'week',
      build: function (d) {
        var acts = tag((d.activities || []).filter(function (r) {
          return within(r.lastUpdated) || within(r.dateAdded);
        }), 'activities');
        var completed = acts.filter(function (r) { return r.status === 'Completed'; });
        var samples = tag((d.samples || []).filter(function (r) {
          return within(r.lastUpdated) || within(r.requestDate);
        }), 'samples');
        var meetings = tag((d.meetings || []).filter(function (r) { return within(r.meetingDate); }), 'meetings');
        return {
          title: 'Weekly Review Report',
          summary: [
            { l: 'Activities in period', v: acts.length },
            { l: 'Completed', v: completed.length },
            { l: 'Meetings held', v: meetings.length },
            { l: 'Samples touched', v: samples.length }
          ],
          columns: [
            { key: 'code', label: 'ID', type: 'code' },
            { key: 'activity', label: 'Activity', type: 'title' },
            { key: 'customer', label: 'Customer' },
            { key: 'status', label: 'Status', type: 'badge' },
            { key: 'priority', label: 'Priority', type: 'badge' },
            { key: 'expectedOutcome', label: 'Expected Outcome' },
            { key: 'targetDate', label: 'Target', type: 'date' }
          ],
          rows: acts,
          extraTables: [{
            title: 'Samples / demonstrations',
            columns: [
              { key: 'code', label: 'ID', type: 'code' },
              { key: 'customer', label: 'Customer' },
              { key: 'product', label: 'Product' },
              { key: 'sampleStatus', label: 'Stage', type: 'badge' },
              { key: 'requiredDate', label: 'Required', type: 'date' },
              { key: 'nextStep', label: 'Next Step' }
            ],
            rows: samples
          }]
        };
      }
    },
    {
      id: 'monthly', label: 'Monthly Activity', defaultRange: 'month',
      build: function (d) {
        var acts = tag((d.activities || []).filter(function (r) {
          return within(r.lastUpdated) || within(r.dateAdded) || within(r.targetDate);
        }), 'activities');
        var byWs = U.groupCount(acts, 'workstream');
        return {
          title: 'Monthly Activity Report',
          summary: [
            { l: 'Activities', v: acts.length },
            { l: 'Completed', v: acts.filter(function (r) { return r.status === 'Completed'; }).length },
            { l: 'Open', v: acts.filter(function (r) { return !r._closed; }).length },
            { l: 'Workstreams', v: Object.keys(byWs).length }
          ],
          columns: [
            { key: 'code', label: 'ID', type: 'code' },
            { key: 'activity', label: 'Activity', type: 'title' },
            { key: 'workstream', label: 'Workstream' },
            { key: 'customer', label: 'Customer' },
            { key: 'status', label: 'Status', type: 'badge' },
            { key: 'startDate', label: 'Start', type: 'date' },
            { key: 'targetDate', label: 'Target', type: 'date' },
            { key: '_aging', label: 'Aging (d)', type: 'number' }
          ],
          rows: acts
        };
      }
    },
    {
      id: 'customers', label: 'Customer Pipeline',
      build: function (d) {
        var rows = tag((d.customers || []).slice(), 'customers');
        var weighted = rows.reduce(function (a, r) { return a + (r._weighted || 0); }, 0);
        return {
          title: 'Customer Pipeline Report',
          summary: [
            { l: 'Customers', v: rows.length },
            { l: 'Active', v: rows.filter(function (r) { return r.opportunityStage && r.opportunityStage !== 'Lost'; }).length },
            { l: 'Weighted value', v: U.formatValue(weighted) },
            { l: 'Follow-ups due', v: rows.filter(function (r) { return r._followUpDue; }).length }
          ],
          columns: [
            { key: 'company', label: 'Company', type: 'title' },
            { key: 'industry', label: 'Industry' },
            { key: 'customerType', label: 'Type' },
            { key: 'application', label: 'Application' },
            { key: 'opportunityStage', label: 'Stage', type: 'badge' },
            { key: 'commercialPotential', label: 'Potential', type: 'value' },
            { key: 'probability', label: 'Prob.', type: 'percent' },
            { key: '_weighted', label: 'Weighted', type: 'value' },
            { key: 'nextInteraction', label: 'Next Interaction', type: 'date' },
            { key: 'owner', label: 'Owner' }
          ],
          rows: U.sortBy(rows, '_weighted', 'desc')
        };
      }
    },
    {
      id: 'opportunities', label: 'Opportunity Pipeline',
      build: function (d) {
        var rows = tag((d.activities || []).filter(function (r) {
          return !U.isBlank(r.currentStage) || !U.isBlank(r.estimatedOpportunityValue);
        }), 'activities');
        var weighted = rows.reduce(function (a, r) { return a + (r._weighted || 0); }, 0);
        var stages = LPM.schema.V.opportunityStage;
        var byStage = stages.map(function (s) {
          var n = rows.filter(function (r) { return r.currentStage === s; }).length;
          return n ? s + ': ' + n : null;
        }).filter(Boolean).join(' · ');
        return {
          title: 'Opportunity Pipeline Report',
          note: byStage,
          summary: [
            { l: 'Opportunities', v: rows.length },
            { l: 'Open', v: rows.filter(function (r) {
              return r.currentStage !== 'Order' && r.currentStage !== 'Lost' && !r._closed; }).length },
            { l: 'Weighted value', v: U.formatValue(weighted) },
            { l: 'Won', v: rows.filter(function (r) { return r.currentStage === 'Order'; }).length }
          ],
          columns: [
            { key: 'code', label: 'ID', type: 'code' },
            { key: 'activity', label: 'Opportunity', type: 'title' },
            { key: 'customer', label: 'Customer' },
            { key: 'opportunityType', label: 'Type' },
            { key: 'currentStage', label: 'Stage', type: 'badge' },
            { key: 'estimatedOpportunityValue', label: 'Value', type: 'value' },
            { key: 'probability', label: 'Prob.', type: 'percent' },
            { key: '_weighted', label: 'Weighted', type: 'value' },
            { key: 'targetDate', label: 'Target', type: 'date' }
          ],
          rows: U.sortBy(rows, '_weighted', 'desc')
        };
      }
    },
    {
      id: 'localization', label: 'Localization',
      build: function (d) {
        var rows = tag((d.localization || []).slice(), 'localization');
        var pct = rows.map(function (r) { return U.toNumber(r.localizationPercent); })
          .filter(function (n) { return n !== null; });
        var avg = pct.length ? Math.round(pct.reduce(function (a, b) { return a + b; }, 0) / pct.length) : 0;
        return {
          title: 'Laser Diode Localization Report',
          summary: [
            { l: 'Projects', v: rows.length },
            { l: 'In development', v: rows.filter(function (r) { return r.currentStatus !== 'Production'; }).length },
            { l: 'Average localization', v: avg + '%' },
            { l: 'Overdue', v: rows.filter(function (r) { return r._overdue; }).length }
          ],
          columns: [
            { key: 'code', label: 'ID', type: 'code' },
            { key: 'projectName', label: 'Project', type: 'title' },
            { key: 'customer', label: 'Customer' },
            { key: 'laserDiodeType', label: 'Diode' },
            { key: 'wavelength', label: 'Wavelength' },
            { key: 'currentStatus', label: 'Stage', type: 'badge' },
            { key: 'localizationPercent', label: 'Local %', type: 'percent' },
            { key: 'importedCost', label: 'Imported Cost', type: 'value' },
            { key: 'expectedLocalizedCost', label: 'Localized Cost', type: 'value' },
            { key: 'targetCompletion', label: 'Target', type: 'date' },
            { key: 'keyChallenge', label: 'Key Challenge' }
          ],
          rows: rows
        };
      }
    },
    {
      id: 'rd', label: 'R&D',
      build: function (d) {
        var rows = tag((d.activities || []).filter(function (r) {
          return r.workstream === 'R&D' || r.workstream === 'Technical Evaluation';
        }), 'activities');
        var proj = tag((d.localization || []).filter(function (r) {
          return !U.isBlank(r.rdRequirement);
        }), 'localization');
        return {
          title: 'R&D Report',
          summary: [
            { l: 'R&D activities', v: rows.length },
            { l: 'Open', v: rows.filter(function (r) { return !r._closed; }).length },
            { l: 'Linked projects', v: proj.length },
            { l: 'Blocked', v: rows.filter(function (r) {
              return r.status === 'Blocked' || !U.isBlank(r.blocker); }).length }
          ],
          columns: [
            { key: 'code', label: 'ID', type: 'code' },
            { key: 'activity', label: 'Activity', type: 'title' },
            { key: 'customer', label: 'Customer' },
            { key: 'laserType', label: 'Laser Type' },
            { key: 'status', label: 'Status', type: 'badge' },
            { key: 'expectedOutcome', label: 'Expected Outcome' },
            { key: 'blocker', label: 'Blocker' },
            { key: 'targetDate', label: 'Target', type: 'date' }
          ],
          rows: rows,
          extraTables: [{
            title: 'Projects with R&D requirement',
            columns: [
              { key: 'code', label: 'ID', type: 'code' },
              { key: 'projectName', label: 'Project', type: 'title' },
              { key: 'rdRequirement', label: 'R&D Requirement' },
              { key: 'internalCapability', label: 'Internal Capability' },
              { key: 'externalPartner', label: 'External Partner' },
              { key: 'currentStatus', label: 'Stage', type: 'badge' }
            ],
            rows: proj
          }]
        };
      }
    },
    {
      id: 'samples', label: 'Samples / Trials',
      build: function (d) {
        var rows = tag((d.samples || []).slice(), 'samples');
        return {
          title: 'Samples / Trials Report',
          summary: [
            { l: 'Samples', v: rows.length },
            { l: 'In progress', v: rows.filter(function (r) { return r.sampleStatus !== 'Closed'; }).length },
            { l: 'With issues', v: rows.filter(function (r) { return !U.isBlank(r.technicalIssue); }).length },
            { l: 'Overdue', v: rows.filter(function (r) { return r._overdue; }).length }
          ],
          columns: [
            { key: 'code', label: 'ID', type: 'code' },
            { key: 'customer', label: 'Customer', type: 'title' },
            { key: 'product', label: 'Product' },
            { key: 'partNumber', label: 'Part Number' },
            { key: 'quantity', label: 'Qty', type: 'number' },
            { key: 'supplier', label: 'Supplier' },
            { key: 'sampleStatus', label: 'Stage', type: 'badge' },
            { key: 'requiredDate', label: 'Required', type: 'date' },
            { key: 'testResult', label: 'Test Result' },
            { key: 'nextStep', label: 'Next Step' }
          ],
          rows: rows
        };
      }
    },
    {
      id: 'overdue', label: 'Overdue Actions',
      build: function (d) {
        var rows = [];
        ['activities', 'customers', 'localization', 'samples', 'meetings', 'suppliers'].forEach(function (k) {
          tag((d[k] || []).filter(function (r) { return r._overdue; }), k)
            .forEach(function (r) { rows.push(r); });
        });
        rows = rows.sort(function (a, b) { return (a._daysRemaining || 0) - (b._daysRemaining || 0); });
        return {
          title: 'Overdue Actions Report',
          summary: [
            { l: 'Overdue records', v: rows.length },
            { l: 'Critical', v: rows.filter(function (r) { return r.priority === 'Critical'; }).length },
            { l: 'Over 30 days', v: rows.filter(function (r) { return (r._daysRemaining || 0) < -30; }).length },
            { l: 'Modules affected', v: U.unique(rows.map(function (r) { return r._module; })).length }
          ],
          columns: [
            { key: '_module', label: 'Module' },
            { key: '_title', label: 'Record', type: 'title' },
            { key: 'customer', label: 'Customer' },
            { key: 'owner', label: 'Owner' },
            { key: 'priority', label: 'Priority', type: 'badge' },
            { key: '_status', label: 'Status', type: 'badge' },
            { key: '_targetDate', label: 'Target', type: 'date' },
            { key: '_daysRemaining', label: 'Days', type: 'days' }
          ],
          rows: rows
        };
      }
    },
    {
      id: 'management', label: 'Management Attention',
      build: function (d) {
        var rows = [];
        ['activities', 'localization', 'samples'].forEach(function (k) {
          tag((d[k] || []).filter(function (r) {
            if (r._closed) return false;
            return U.needsManagement(r) || !U.isBlank(r.blocker) ||
              !U.isBlank(r.keyChallenge) || !U.isBlank(r.technicalIssue);
          }), k).forEach(function (r) { rows.push(r); });
        });
        return {
          title: 'Management Attention Report',
          summary: [
            { l: 'Items', v: rows.length },
            { l: 'Critical', v: rows.filter(function (r) { return r.priority === 'Critical'; }).length },
            { l: 'Blocked', v: rows.filter(function (r) {
              return r._status === 'Blocked' || !U.isBlank(r.blocker); }).length },
            { l: 'Support requested', v: rows.filter(function (r) {
              return /^yes$/i.test(String(r.managementSupportRequired || r.managementSupport || '')); }).length }
          ],
          columns: [
            { key: '_module', label: 'Module' },
            { key: '_title', label: 'Record', type: 'title' },
            { key: 'customer', label: 'Customer' },
            { key: 'priority', label: 'Priority', type: 'badge' },
            { key: '_status', label: 'Status', type: 'badge' },
            { key: 'blocker', label: 'Blocker / Challenge',
              value: function (r) { return r.blocker || r.keyChallenge || r.technicalIssue || ''; } },
            { key: 'requiredAction', label: 'Required Action',
              value: function (r) { return r.requiredAction || r.nextAction || r.correctiveAction || ''; } },
            { key: '_targetDate', label: 'Target', type: 'date' }
          ],
          rows: rows
        };
      }
    }
  ];

  /* ------------------------------ Rendering ------------------------------ */

  function setDefaultRange(reportId) {
    var r = REPORTS.filter(function (x) { return x.id === reportId; })[0];
    var t = U.today();
    if (!r || !r.defaultRange) { range = { from: '', to: '' }; return; }
    if (r.defaultRange === 'today') range = { from: U.todayISO(), to: U.todayISO() };
    else if (r.defaultRange === 'week') {
      range = { from: U.toISODate(U.startOfWeek(t)), to: U.toISODate(U.endOfWeek(t)) };
    } else if (r.defaultRange === 'month') {
      range = {
        from: U.toISODate(new Date(t.getFullYear(), t.getMonth(), 1)),
        to: U.toISODate(new Date(t.getFullYear(), t.getMonth() + 1, 0))
      };
    }
  }

  function buildPage(root) {
    ui.clear(root);
    var head = ui.el('div', { class: 'page__head' });
    head.innerHTML = '<div><h1 class="page__title">Reports</h1>' +
      '<div class="page__subtitle">Generated from the live database</div></div>';
    var actions = ui.el('div', { class: 'page__actions' });
    actions.innerHTML =
      '<label class="sr-only" for="repFrom">From</label><input type="date" id="repFrom" style="width:auto">' +
      '<label class="sr-only" for="repTo">To</label><input type="date" id="repTo" style="width:auto">' +
      '<button type="button" class="btn" id="btnClearRange">Clear dates</button>' +
      '<button type="button" class="btn" id="btnPrintReport">' + ui.icon('print') + '<span>Print</span></button>' +
      '<button type="button" class="btn btn--primary" id="btnCsvReport">' +
      ui.icon('download') + '<span>Export CSV</span></button>';
    head.appendChild(actions);
    root.appendChild(head);

    var chips = ui.el('div', { class: 'report-picker mb-4 no-print' });
    REPORTS.forEach(function (r) {
      var b = ui.el('button', { type: 'button', class: 'report-chip', 'aria-pressed': String(r.id === activeId),
        'data-report': r.id });
      b.textContent = r.label;
      b.addEventListener('click', function () {
        activeId = r.id;
        setDefaultRange(activeId);
        syncRangeInputs();
        ui.qsa('[data-report]').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x.getAttribute('data-report') === activeId));
        });
        render();
      });
      chips.appendChild(b);
    });
    root.appendChild(chips);

    root.appendChild(ui.el('div', { id: 'reportBody' }));

    document.getElementById('repFrom').addEventListener('change', function (e) {
      range.from = e.target.value; render();
    });
    document.getElementById('repTo').addEventListener('change', function (e) {
      range.to = e.target.value; render();
    });
    document.getElementById('btnClearRange').addEventListener('click', function () {
      range = { from: '', to: '' }; syncRangeInputs(); render();
    });
    document.getElementById('btnPrintReport').addEventListener('click', function () { window.print(); });
    document.getElementById('btnCsvReport').addEventListener('click', exportCSV);
  }

  function syncRangeInputs() {
    document.getElementById('repFrom').value = range.from || '';
    document.getElementById('repTo').value = range.to || '';
  }

  var lastBuilt = null;

  function render() {
    var def = REPORTS.filter(function (r) { return r.id === activeId; })[0] || REPORTS[0];
    var out = def.build(data);
    lastBuilt = out;
    var host = document.getElementById('reportBody');
    ui.clear(host);

    var doc = ui.el('div', { class: 'report-doc' });
    doc.innerHTML = '<h2></h2><div class="report-meta"></div>';
    doc.querySelector('h2').textContent = out.title;
    doc.querySelector('.report-meta').textContent =
      'Generated ' + U.formatDateTime(new Date()) +
      (range.from || range.to
        ? ' · Period ' + (range.from ? U.formatDate(range.from) : 'start') + ' – ' +
          (range.to ? U.formatDate(range.to) : 'today')
        : ' · All dates') +
      (out.note ? ' · ' + out.note : '');

    var summary = ui.el('div', { class: 'report-summary' });
    (out.summary || []).forEach(function (s) {
      var box = ui.el('div', { class: 'box' });
      box.innerHTML = '<div class="l"></div><div class="v"></div>';
      box.querySelector('.l').textContent = s.l;
      box.querySelector('.v').textContent = s.v;
      summary.appendChild(box);
    });
    doc.appendChild(summary);

    var tableHost = ui.el('div', {});
    ui.renderTable(tableHost, {
      columns: out.columns, rows: out.rows, cards: false,
      onRowClick: function (r) {
        if (r._entityKey) LPM.app.openRecord(r._entityKey, r.id);
      },
      emptyState: { title: 'No records in this report',
        text: 'Try widening the date range or adding records in the relevant module.' }
    });
    doc.appendChild(tableHost);

    (out.extraTables || []).forEach(function (t) {
      doc.appendChild(ui.el('h3', { text: t.title }));
      var h = ui.el('div', {});
      ui.renderTable(h, { columns: t.columns, rows: t.rows, cards: false,
        emptyState: { title: 'Nothing recorded', text: 'No entries in this period.' } });
      doc.appendChild(h);
    });

    host.appendChild(doc);
  }

  function exportCSV() {
    if (!lastBuilt) return;
    LPM.exporter.exportRowsCSV(activeId + '_report_' + U.todayISO() + '.csv',
      lastBuilt.rows, lastBuilt.columns.map(function (c) {
        return { key: c.key, label: c.label, value: c.value };
      }));
  }

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'reports' }).then(function () {
      var q = U.getQuery();
      if (q.report && REPORTS.some(function (r) { return r.id === q.report; })) activeId = q.report;
      buildPage(document.getElementById('pageRoot'));
      setDefaultRange(activeId);
      if (q.from) range.from = q.from;
      if (q.to) range.to = q.to;
      syncRangeInputs();
      return LPM.db.getMany(LPM.db.DATA_STORES).then(function (d) {
        data = decorateAll(d);
        render();
      });
    }).catch(function () {});
  });
})(window, document);
