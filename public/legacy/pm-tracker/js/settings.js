/* ==========================================================================
   settings.js — preferences, security and data management
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  var SECTIONS = [
    { id: 'general', label: 'General' },
    { id: 'security', label: 'Security' },
    { id: 'data', label: 'Data Management' },
    { id: 'about', label: 'About' }
  ];
  var active = 'general';

  function card(title, hint) {
    var c = ui.el('div', { class: 'card mb-4' });
    c.innerHTML = '<div class="card__head"><span class="card__title">' + U.escapeHtml(title) + '</span>' +
      (hint ? '<span class="card__hint">' + U.escapeHtml(hint) + '</span>' : '') + '</div>';
    var body = ui.el('div', { class: 'card__body' });
    c.appendChild(body);
    c._body = body;
    return c;
  }

  /* ------------------------------ General ------------------------------ */

  function renderGeneral(host) {
    var prefs = LPM.auth.getPrefs();

    var themeCard = card('Appearance', 'Stored in this browser');
    var opts = ui.el('div', { class: 'theme-options' });
    [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']].forEach(function (t) {
      var b = ui.el('button', { type: 'button', class: 'theme-option',
        'aria-pressed': String((prefs.theme || 'system') === t[0]) });
      b.innerHTML = '<span class="theme-swatch theme-swatch--' + t[0] + '"></span><span>' + t[1] + '</span>';
      b.addEventListener('click', function () {
        LPM.app.setTheme(t[0]);
        ui.qsa('.theme-option', opts).forEach(function (x, i) {
          x.setAttribute('aria-pressed', String(['light', 'dark', 'system'][i] === t[0]));
        });
        ui.toast('Theme updated', 'success');
      });
      opts.appendChild(b);
    });
    themeCard._body.appendChild(opts);
    host.appendChild(themeCard);

    var wc = card('Working preferences');
    var grid = ui.el('div', { class: 'form-grid' });
    grid.innerHTML =
      '<div class="field"><label for="prefCurrency">Currency for opportunity values</label>' +
        '<select id="prefCurrency">' + LPM.schema.V.currency.map(function (c) {
          return '<option value="' + c + '"' + (prefs.currency === c ? ' selected' : '') + '>' + c + '</option>';
        }).join('') + '</select></div>' +
      '<div class="field"><label for="prefPageSize">Records per page</label>' +
        '<select id="prefPageSize">' + [10, 25, 50, 100].map(function (n) {
          return '<option value="' + n + '"' + (Number(prefs.pageSize) === n ? ' selected' : '') + '>' + n + '</option>';
        }).join('') + '</select></div>' +
      '<div class="field"><label for="prefInactivity">Lock after inactivity (minutes)</label>' +
        '<input type="number" id="prefInactivity" min="1" max="480" value="' +
        Number(prefs.inactivityMinutes || 30) + '">' +
        '<div class="hint">The session locks and asks for your password again.</div></div>' +
      '<div class="field"><label for="prefRemember">“Remember me” duration (days)</label>' +
        '<input type="number" id="prefRemember" min="1" max="365" value="' +
        Number(prefs.rememberDays || 30) + '"></div>';
    wc._body.appendChild(grid);
    var saveBtn = ui.el('button', { type: 'button', class: 'btn btn--primary mt-4' },
      ui.icon('check') + '<span>Save preferences</span>');
    saveBtn.addEventListener('click', function () {
      var inact = Math.max(1, Math.min(480, Number(document.getElementById('prefInactivity').value) || 30));
      var rem = Math.max(1, Math.min(365, Number(document.getElementById('prefRemember').value) || 30));
      LPM.auth.setPrefs({
        currency: document.getElementById('prefCurrency').value,
        pageSize: Number(document.getElementById('prefPageSize').value),
        inactivityMinutes: inact,
        rememberDays: rem
      });
      ui.toast('Preferences saved', 'success');
    });
    wc._body.appendChild(saveBtn);
    host.appendChild(wc);

    var cc = card('Customising dropdowns');
    cc._body.innerHTML =
      '<p class="secondary">Statuses, priorities, workstreams, application categories, laser types, ' +
      'packages and pipeline stages are defined in one place: <code class="mono">js/schema.js</code> ' +
      '(the <code class="mono">V</code> object at the top of the file). Add or rename a value there and ' +
      'it appears in every form, filter and chart. Fields themselves are declared just below, per module.</p>' +
      '<p class="secondary mb-0">Existing records keep any value that is no longer in the list — it is shown ' +
      'as “(custom)” in the edit form so nothing is silently lost.</p>';
    host.appendChild(cc);
  }

  /* ------------------------------ Security ------------------------------ */

  function renderSecurity(host) {
    var warn = card('How this login works');
    warn._body.innerHTML =
      '<p class="secondary">This authentication protects the application interface and local browser data. ' +
      'It is <strong>not</strong> equivalent to server-side authentication and should not be used as a ' +
      'security boundary for confidential shared data.</p>' +
      '<p class="secondary mb-0">Your password is never stored. Only a PBKDF2-SHA256 hash (210,000 iterations) ' +
      'with a random salt is kept, in this browser\'s IndexedDB. Anyone with access to this computer profile ' +
      'can read the underlying database directly, so treat it as a personal working tool.</p>';
    host.appendChild(warn);

    var pw = card('Change password');
    var f = ui.el('form', { class: 'form-grid', novalidate: 'novalidate' });
    f.innerHTML =
      '<div class="field"><label for="curPw">Current password</label>' +
        '<input type="password" id="curPw" autocomplete="current-password" required></div>' +
      '<div class="field"></div>' +
      '<div class="field"><label for="newPw">New password</label>' +
        '<input type="password" id="newPw" autocomplete="new-password" required>' +
        '<div class="pw-meter mt-2"><div class="pw-meter__bar" id="pwBar"></div></div>' +
        '<div class="hint">Minimum 8 characters, with at least one letter and one number.</div></div>' +
      '<div class="field"><label for="newPw2">Confirm new password</label>' +
        '<input type="password" id="newPw2" autocomplete="new-password" required></div>';
    pw._body.appendChild(f);
    var btn = ui.el('button', { type: 'submit', class: 'btn btn--primary mt-4' },
      ui.icon('lock') + '<span>Update password</span>');
    f.appendChild(btn);

    f.querySelector('#newPw').addEventListener('input', function (e) {
      var score = LPM.auth.passwordScore(e.target.value);
      var bar = document.getElementById('pwBar');
      bar.style.width = (score / 5 * 100) + '%';
      bar.style.background = score <= 2 ? 'var(--danger)' : (score <= 3 ? 'var(--warning)' : 'var(--success)');
    });

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      LPM.auth.changePassword(
        document.getElementById('curPw').value,
        document.getElementById('newPw').value,
        document.getElementById('newPw2').value
      ).then(function () {
        ui.toast('Password updated', 'success');
        f.reset();
        document.getElementById('pwBar').style.width = '0';
      }).catch(function (err) { ui.toast(err.message, 'error'); });
    });
    host.appendChild(pw);

    var un = card('Change username');
    var f2 = ui.el('form', { class: 'form-grid', novalidate: 'novalidate' });
    f2.innerHTML =
      '<div class="field"><label for="newUser">New username</label>' +
        '<input type="text" id="newUser" value="' + U.escapeHtml(LPM.auth.currentUser() || '') + '" required></div>' +
      '<div class="field"><label for="userPw">Confirm with password</label>' +
        '<input type="password" id="userPw" autocomplete="current-password" required></div>';
    un._body.appendChild(f2);
    var b2 = ui.el('button', { type: 'submit', class: 'btn mt-4' }, '<span>Update username</span>');
    f2.appendChild(b2);
    f2.addEventListener('submit', function (e) {
      e.preventDefault();
      LPM.auth.changeUsername(document.getElementById('newUser').value,
        document.getElementById('userPw').value)
        .then(function () { ui.toast('Username updated. It appears after the next page load.', 'success'); f2.reset(); })
        .catch(function (err) { ui.toast(err.message, 'error'); });
    });
    host.appendChild(un);

    var sess = card('Session');
    var st = LPM.auth.sessionState();
    var prefs = LPM.auth.getPrefs();
    sess._body.innerHTML =
      '<div class="stat-row"><span class="stat-row__label">Signed in as</span>' +
      '<span class="stat-row__value">' + U.escapeHtml(LPM.auth.currentUser() || '—') + '</span></div>' +
      '<div class="stat-row"><span class="stat-row__label">State</span>' +
      '<span class="stat-row__value">' + U.escapeHtml(st.state) + '</span></div>' +
      '<div class="stat-row"><span class="stat-row__label">Remembered on this device</span>' +
      '<span class="stat-row__value">' + (st.session && st.session.remember ? 'Yes' : 'No') + '</span></div>' +
      '<div class="stat-row"><span class="stat-row__label">Session expires</span>' +
      '<span class="stat-row__value">' +
      (st.session ? U.escapeHtml(U.formatDateTime(new Date(st.session.expiresAt))) : '—') + '</span></div>' +
      '<div class="stat-row"><span class="stat-row__label">Inactivity lock</span>' +
      '<span class="stat-row__value">' + prefs.inactivityMinutes + ' minutes</span></div>';
    var row = ui.el('div', { class: 'row mt-4' });
    var lockBtn = ui.el('button', { type: 'button', class: 'btn' }, ui.icon('lock') + '<span>Lock now</span>');
    lockBtn.addEventListener('click', function () { LPM.auth.lockSession(); LPM.app.showLock(); });
    var outBtn = ui.el('button', { type: 'button', class: 'btn' }, ui.icon('logout') + '<span>Log out</span>');
    outBtn.addEventListener('click', LPM.app.logout);
    row.appendChild(lockBtn); row.appendChild(outBtn);
    sess._body.appendChild(row);
    host.appendChild(sess);
  }

  /* --------------------------- Data management --------------------------- */

  function renderData(host) {
    var backup = card('Backup & restore', 'Full JSON');
    backup._body.innerHTML =
      '<p class="secondary">The JSON backup contains the schema version, export date and every record from ' +
      'all modules plus your app settings. Your password hash is never included.</p>';
    var row = ui.el('div', { class: 'row' });

    var expBtn = ui.el('button', { type: 'button', class: 'btn btn--primary' },
      ui.icon('download') + '<span>Export full JSON</span>');
    expBtn.addEventListener('click', function () { LPM.exporter.exportFullJSON(); });

    var impBtn = ui.el('button', { type: 'button', class: 'btn' },
      ui.icon('upload') + '<span>Import JSON (replace)</span>');
    impBtn.addEventListener('click', function () { pickFile('.json,application/json', function (file) {
      LPM.exporter.importJSONFile(file, 'replace')
        .then(function (r) { if (r) refreshCounts(); })
        .catch(function () { /* the importer already reported the problem */ });
    }); });

    var mergeBtn = ui.el('button', { type: 'button', class: 'btn' },
      ui.icon('upload') + '<span>Import JSON (merge)</span>');
    mergeBtn.addEventListener('click', function () { pickFile('.json,application/json', function (file) {
      LPM.exporter.importJSONFile(file, 'merge')
        .then(function (r) { if (r) refreshCounts(); })
        .catch(function () { /* the importer already reported the problem */ });
    }); });

    row.appendChild(expBtn); row.appendChild(impBtn); row.appendChild(mergeBtn);
    backup._body.appendChild(row);
    host.appendChild(backup);

    var csv = card('CSV export & import', 'Per module');
    csv._body.innerHTML = '<p class="secondary">CSV is convenient for Excel analysis and for bulk-loading ' +
      'existing spreadsheets. Export a module first to get the exact column headings used on import.</p>';
    var csvRow = ui.el('div', { class: 'row' });
    var sel = ui.el('select', { id: 'csvModule', 'aria-label': 'Module', style: 'max-width:260px' });
    LPM.db.DATA_STORES.forEach(function (s) {
      if (!LPM.schema.entities[s] || !LPM.schema.entities[s].sections) return;
      var o = ui.el('option', { value: s });
      o.textContent = LPM.schema.entities[s].label;
      sel.appendChild(o);
    });
    var csvExp = ui.el('button', { type: 'button', class: 'btn' },
      ui.icon('download') + '<span>Export CSV</span>');
    csvExp.addEventListener('click', function () { LPM.exporter.exportEntityCSV(sel.value); });
    var csvImp = ui.el('button', { type: 'button', class: 'btn' },
      ui.icon('upload') + '<span>Import CSV</span>');
    csvImp.addEventListener('click', function () {
      pickFile('.csv,text/csv', function (file) {
        LPM.exporter.importCSVFile(file, sel.value)
          .then(function (n) { if (n) refreshCounts(); })
          .catch(function () { /* the importer already reported the problem */ });
      });
    });
    csvRow.appendChild(sel); csvRow.appendChild(csvExp); csvRow.appendChild(csvImp);
    csv._body.appendChild(csvRow);
    host.appendChild(csv);

    var sample = card('Demonstration data');
    sample._body.innerHTML = '<p class="secondary">A small illustrative dataset covering defence, telecom, ' +
      'datacentre and industrial customers, laser applications, a localization project, R&D, a supplier ' +
      'evaluation, a sample evaluation and a customer meeting. Sample records are tagged and can be removed ' +
      'in one click.</p><div class="mb-3"><span class="badge badge--neutral" id="sampleCount">—</span></div>';
    var sRow = ui.el('div', { class: 'row' });
    var loadBtn = ui.el('button', { type: 'button', class: 'btn' },
      ui.icon('database') + '<span>Load sample data</span>');
    loadBtn.addEventListener('click', function () {
      loadBtn.disabled = true;
      LPM.exporter.loadSampleData().then(function (n) {
        ui.toast(n + ' demonstration records loaded', 'success');
        refreshCounts();
      }).catch(function (e) { ui.toast(e.message, 'error', 9000); })
        .then(function () { loadBtn.disabled = false; });
    });
    var delBtn = ui.el('button', { type: 'button', class: 'btn' },
      ui.icon('trash') + '<span>Delete sample data</span>');
    delBtn.addEventListener('click', function () {
      ui.confirm({ title: 'Delete all sample data?',
        message: 'Every record tagged as demonstration data will be removed.',
        detail: 'Records you created yourself are not affected.',
        confirmLabel: 'Delete sample data', danger: true }).then(function (ok) {
        if (!ok) return;
        LPM.exporter.removeSampleData().then(function (n) {
          ui.toast(n + ' sample records removed', 'success');
          refreshCounts();
        }).catch(function (e) { ui.toast(e.message, 'error'); });
      });
    });
    sRow.appendChild(loadBtn); sRow.appendChild(delBtn);
    sample._body.appendChild(sRow);
    host.appendChild(sample);

    var stats = card('Stored records');
    stats._body.innerHTML = '<div id="storeCounts"></div>';
    host.appendChild(stats);

    var danger = ui.el('div', { class: 'danger-zone' });
    danger.innerHTML = '<h3>Danger zone</h3>' +
      '<p class="small" style="color:var(--danger)">These actions permanently delete data from this browser. ' +
      'Export a backup first.</p>';
    var dRow = ui.el('div', { class: 'row' });
    var resetBtn = ui.el('button', { type: 'button', class: 'btn btn--danger' },
      ui.icon('trash') + '<span>Reset database (keep account)</span>');
    resetBtn.addEventListener('click', function () {
      ui.confirm({ title: 'Delete all records?',
        message: 'Every record in every module will be permanently deleted.',
        detail: 'Your login and preferences are kept. This cannot be undone.',
        confirmLabel: 'Delete everything', danger: true }).then(function (ok) {
        if (!ok) return;
        LPM.db.clearDatabase().then(function () {
          ui.toast('All records deleted', 'success');
          refreshCounts();
        }).catch(function (e) { ui.toast(e.message, 'error'); });
      });
    });
    var nukeBtn = ui.el('button', { type: 'button', class: 'btn btn--danger' },
      ui.icon('alert') + '<span>Reset everything including login</span>');
    nukeBtn.addEventListener('click', function () {
      ui.confirm({ title: 'Full reset?',
        message: 'All records, preferences and the stored login will be deleted from this browser.',
        detail: 'You will be taken back to first-time setup. This cannot be undone.',
        confirmLabel: 'Erase everything', danger: true }).then(function (ok) {
        if (!ok) return;
        LPM.db.clearDatabase().then(function () { return LPM.auth.resetAccount(); })
          .then(function () {
            try { window.localStorage.removeItem('lpm.prefs'); } catch (e) {}
            window.location.href = 'index.html';
          }).catch(function (e) { ui.toast(e.message, 'error'); });
      });
    });
    dRow.appendChild(resetBtn); dRow.appendChild(nukeBtn);
    danger.appendChild(dRow);
    host.appendChild(danger);

    refreshCounts();
  }

  function pickFile(accept, cb) {
    var input = ui.el('input', { type: 'file', accept: accept, style: 'display:none' });
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      document.body.removeChild(input);
      if (file) cb(file);
    });
    input.click();
  }

  function refreshCounts() {
    var host = document.getElementById('storeCounts');
    return LPM.db.getMany(LPM.db.DATA_STORES).then(function (d) {
      var total = 0, samples = 0;
      var rows = LPM.db.DATA_STORES.map(function (s) {
        var n = (d[s] || []).length;
        total += n;
        samples += (d[s] || []).filter(function (r) { return r.isSample; }).length;
        var label = (LPM.schema.entities[s] && LPM.schema.entities[s].label) || s;
        return '<div class="stat-row"><span class="stat-row__label">' + U.escapeHtml(label) +
          '</span><span class="stat-row__value">' + n + '</span></div>';
      }).join('');
      if (host) {
        host.innerHTML = rows + '<div class="stat-row"><span class="stat-row__label bold">Total</span>' +
          '<span class="stat-row__value">' + total + '</span></div>';
      }
      var sc = document.getElementById('sampleCount');
      if (sc) sc.textContent = samples + ' sample records currently stored';
      LPM.app.updateRecordCount();
    }).catch(function () {});
  }

  /* -------------------------------- About -------------------------------- */

  function renderAbout(host) {
    var c = card('Laser Applications PM — Operating Tracker');
    c._body.innerHTML =
      '<div class="stat-row"><span class="stat-row__label">Application version</span>' +
      '<span class="stat-row__value">1.0.0</span></div>' +
      '<div class="stat-row"><span class="stat-row__label">Database schema version</span>' +
      '<span class="stat-row__value">' + LPM.db.SCHEMA_VERSION + '</span></div>' +
      '<div class="stat-row"><span class="stat-row__label">Storage</span>' +
      '<span class="stat-row__value">IndexedDB (' + LPM.db.NAME + ')</span></div>' +
      '<div class="stat-row"><span class="stat-row__label">Charts</span>' +
      '<span class="stat-row__value">' + (typeof window.Chart !== 'undefined'
        ? 'Chart.js loaded' : 'Chart.js not loaded (offline?)') + '</span></div>' +
      '<div class="stat-row"><span class="stat-row__label">Secure context (Web Crypto)</span>' +
      '<span class="stat-row__value">' + (LPM.auth.cryptoAvailable() ? 'Available' : 'Unavailable') +
      '</span></div>';
    host.appendChild(c);

    var c2 = card('Data & privacy');
    c2._body.innerHTML =
      '<p class="secondary">All records live in this browser only. Nothing is uploaded, and there is no ' +
      'server, API key or account anywhere else. Clearing site data, using a different browser or a ' +
      'different device means starting from an empty database — use the JSON backup to move your data.</p>' +
      '<p class="secondary mb-0">Because the app is a static site, it can be hosted on GitHub Pages and ' +
      'opened from any device; each device keeps its own copy of the data.</p>';
    host.appendChild(c2);
  }

  /* ------------------------------ Shell ------------------------------ */

  function render() {
    var host = document.getElementById('settingsBody');
    ui.clear(host);
    if (active === 'general') renderGeneral(host);
    else if (active === 'security') renderSecurity(host);
    else if (active === 'data') renderData(host);
    else renderAbout(host);
    ui.qsa('[data-section]').forEach(function (b) {
      b.setAttribute('aria-current', String(b.getAttribute('data-section') === active));
    });
  }

  function buildPage(root) {
    ui.clear(root);
    var head = ui.el('div', { class: 'page__head' });
    head.innerHTML = '<div><h1 class="page__title">Settings</h1>' +
      '<div class="page__subtitle">Preferences, security and data management</div></div>';
    root.appendChild(head);

    var layout = ui.el('div', { class: 'settings-layout' });
    var nav = ui.el('nav', { class: 'settings-nav', 'aria-label': 'Settings sections' });
    SECTIONS.forEach(function (s) {
      var b = ui.el('button', { type: 'button', 'data-section': s.id,
        'aria-current': String(s.id === active) });
      b.textContent = s.label;
      b.addEventListener('click', function () { active = s.id; render(); });
      nav.appendChild(b);
    });
    layout.appendChild(nav);
    layout.appendChild(ui.el('div', { id: 'settingsBody' }));
    root.appendChild(layout);
  }

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'settings' }).then(function () {
      var q = U.getQuery();
      if (q.section && SECTIONS.some(function (s) { return s.id === q.section; })) active = q.section;
      buildPage(document.getElementById('pageRoot'));
      render();
    }).catch(function () {});
  });
})(window, document);
