/* ==========================================================================
   app.js — application shell
   Theme, auth gate, sidebar + header, global search, quick add,
   notifications, inactivity lock. Every authenticated page calls
   LPM.app.boot({ page: 'activities' }).
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM || (window.LPM = {});
  var U = LPM.utils, ui = LPM.ui;

  var app = {
    page: null,
    ready: false,
    notifications: []
  };

  /* ============================== THEME ============================== */

  function applyTheme(theme) {
    var t = theme || LPM.auth.getPrefs().theme || 'system';
    var root = document.documentElement;
    if (t === 'system') {
      var dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', t);
    }
    root.setAttribute('data-theme-pref', t);
    return t;
  }

  function setTheme(theme) {
    LPM.auth.setPrefs({ theme: theme });
    applyTheme(theme);
    try {
      window.dispatchEvent(new CustomEvent('lpm:theme-changed', { detail: { theme: theme } }));
    } catch (e) {}
  }

  if (window.matchMedia) {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if ((LPM.auth.getPrefs().theme || 'system') === 'system') applyTheme('system');
      });
    } catch (e) { /* Safari < 14 */ }
  }

  /* ============================== SHELL ============================== */

  function buildSidebar(activeId) {
    var s = ui.el('nav', { class: 'sidebar', id: 'sidebar', 'aria-label': 'Main navigation' });
    var html = '' +
      '<div class="sidebar__brand">' +
        '<div class="sidebar__logo" aria-hidden="true">LP</div>' +
        '<div><div class="sidebar__title">Laser Applications PM</div>' +
        '<div class="sidebar__subtitle">Operating Tracker</div></div>' +
      '</div><div class="sidebar__nav">';

    LPM.schema.nav.forEach(function (group) {
      html += '<div class="sidebar__group-label">' + U.escapeHtml(group.group) + '</div>';
      group.items.forEach(function (it) {
        html += '<a class="nav-link" href="' + it.href + '"' +
          (it.id === activeId ? ' aria-current="page"' : '') + ' data-nav="' + it.id + '">' +
          ui.icon(it.icon) + '<span>' + U.escapeHtml(it.label) + '</span>' +
          '<span class="nav-link__badge" data-nav-badge="' + it.id + '" hidden></span></a>';
      });
    });

    html += '</div><div class="sidebar__footer">' +
      '<div>Local data · this browser only</div>' +
      '<div class="mt-2"><span data-db-count>—</span> records stored</div></div>';
    s.innerHTML = html;
    return s;
  }

  function buildTopbar() {
    var t = ui.el('header', { class: 'topbar' });
    t.innerHTML = '' +
      '<button type="button" class="icon-btn topbar__menu" id="btnSidebar" aria-label="Open navigation" aria-expanded="false">' +
        ui.icon('menu') + '</button>' +
      '<div class="topbar__search menu-anchor">' +
        '<span class="search-ico">' + ui.icon('search') + '</span>' +
        '<label for="globalSearch" class="sr-only">Search all records</label>' +
        '<input type="search" id="globalSearch" placeholder="Search activities, customers, products…" ' +
          'autocomplete="off" role="combobox" aria-expanded="false" aria-controls="globalSearchResults">' +
        '<div id="globalSearchResults" class="search-panel" role="listbox" hidden></div>' +
      '</div>' +
      '<div class="topbar__spacer"></div>' +
      '<div class="topbar__actions">' +
        '<div class="menu-anchor">' +
          '<button type="button" class="btn btn--primary" id="btnQuickAdd" aria-haspopup="menu" ' +
            'aria-label="Quick add a record" title="Quick add">' +
            ui.icon('plus') + '<span class="quick-add-label">Quick Add</span></button>' +
        '</div>' +
        '<div class="menu-anchor">' +
          '<button type="button" class="icon-btn" id="btnNotifications" aria-label="Notifications" aria-haspopup="dialog">' +
            ui.icon('bell') + '<span class="icon-btn__dot" id="notifCount" hidden>0</span></button>' +
        '</div>' +
        '<div class="menu-anchor">' +
          '<button type="button" class="icon-btn" id="btnUser" aria-label="Account menu" aria-haspopup="menu">' +
            '<span class="avatar" id="userAvatar">?</span></button>' +
        '</div>' +
      '</div>';
    return t;
  }

  function renderShell(pageId) {
    var shell = document.getElementById('appShell');
    if (!shell) return;
    var main = document.getElementById('main');
    shell.insertBefore(buildSidebar(pageId), main);
    shell.appendChild(ui.el('div', { class: 'sidebar-scrim', id: 'sidebarScrim' }));
    main.insertBefore(buildTopbar(), main.firstChild);
    wireShell();
  }

  function wireShell() {
    var btn = document.getElementById('btnSidebar');
    var scrim = document.getElementById('sidebarScrim');
    function toggleSidebar(open) {
      document.body.classList.toggle('sidebar-open', open);
      if (btn) btn.setAttribute('aria-expanded', String(open));
    }
    if (btn) btn.addEventListener('click', function () {
      toggleSidebar(!document.body.classList.contains('sidebar-open'));
    });
    if (scrim) scrim.addEventListener('click', function () { toggleSidebar(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('sidebar-open')) toggleSidebar(false);
    });

    var avatar = document.getElementById('userAvatar');
    var user = LPM.auth.currentUser() || 'User';
    if (avatar) { avatar.textContent = U.initials(user); avatar.title = user; }

    var userBtn = document.getElementById('btnUser');
    if (userBtn) userBtn.addEventListener('click', function () {
      ui.menu(userBtn, [
        { header: true, label: 'Signed in as ' + user },
        { label: 'Settings', icon: 'settings', onClick: function () { window.location.href = 'settings.html'; } },
        { label: 'Change password', icon: 'lock',
          onClick: function () { window.location.href = 'settings.html?section=security'; } },
        { label: 'Toggle theme', icon: 'sun', onClick: function () {
          var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          setTheme(cur);
          ui.toast('Theme set to ' + cur + ' mode', 'info');
        } },
        { separator: true },
        { label: 'Lock session', icon: 'lock', onClick: function () { LPM.auth.lockSession(); showLock(); } },
        { label: 'Log out', icon: 'logout', onClick: doLogout }
      ]);
    });

    var qa = document.getElementById('btnQuickAdd');
    if (qa) qa.addEventListener('click', function () { openQuickAdd(qa); });

    var nb = document.getElementById('btnNotifications');
    if (nb) nb.addEventListener('click', function () { openNotifications(nb); });

    wireGlobalSearch();
  }

  function doLogout() {
    LPM.auth.logout().then(function () { window.location.href = 'index.html'; });
  }

  /* =========================== QUICK ADD =========================== */

  function openQuickAdd(anchor) {
    var items = [{ header: true, label: 'Create new' }];
    LPM.schema.quickAdd.forEach(function (q) {
      items.push({
        label: q.label, icon: q.icon,
        onClick: function () {
          if (q.link) { window.location.href = q.link; return; }
          LPM.crud.openRecordModal({
            entity: q.entity,
            preset: q.preset,
            onSaved: function (rec) {
              ui.toast(LPM.schema.entities[q.entity].singular + ' saved', 'success');
              refreshAfterChange(q.entity, rec);
            }
          });
        }
      });
    });
    ui.menu(anchor, items);
  }

  function refreshAfterChange(entityKey, rec) {
    if (app.onDataChanged) {
      try { app.onDataChanged(entityKey, rec); } catch (e) { /* page handler */ }
    }
    loadNotifications();
    updateRecordCount();
  }

  /* ========================= GLOBAL SEARCH ========================= */

  var SEARCHABLE = ['activities', 'customers', 'applications', 'products', 'localization',
    'samples', 'meetings', 'suppliers', 'competitors'];

  function globalSearch(query) {
    var q = String(query || '').trim().toLowerCase();
    if (q.length < 2) return Promise.resolve([]);
    return LPM.db.getMany(SEARCHABLE).then(function (data) {
      var out = [];
      SEARCHABLE.forEach(function (key) {
        var e = LPM.schema.entities[key];
        var fields = e.searchFields;
        (data[key] || []).forEach(function (r) {
          var hit = fields.some(function (fk) {
            var v = r[fk];
            return v !== null && v !== undefined && String(v).toLowerCase().indexOf(q) !== -1;
          });
          if (!hit) return;
          U.decorateFor(r, key);
          out.push({
            entity: key,
            entityLabel: e.label,
            id: r.id,
            title: r[e.titleField] || r.code || '(untitled)',
            status: r._status,
            priority: r.priority || r.threatLevel || '',
            next: r.nextAction || r.nextStep || r.actionRequired || r.requiredAction || '',
            record: r
          });
        });
      });
      return out;
    });
  }

  function wireGlobalSearch() {
    var input = document.getElementById('globalSearch');
    var panel = document.getElementById('globalSearchResults');
    if (!input || !panel) return;

    var run = U.debounce(function () {
      var q = input.value;
      if (String(q).trim().length < 2) { hide(); return; }
      globalSearch(q).then(function (results) { render(results, q); })
        .catch(function (err) { ui.toast('Search failed: ' + err.message, 'error'); });
    }, 220);

    function hide() { panel.hidden = true; panel.innerHTML = ''; input.setAttribute('aria-expanded', 'false'); }

    function render(results, q) {
      panel.innerHTML = '';
      input.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      if (!results.length) {
        panel.innerHTML = '<div class="panel-empty">No records match “' + U.escapeHtml(q) + '”.</div>';
        return;
      }
      var byEntity = {};
      results.forEach(function (r) { (byEntity[r.entity] = byEntity[r.entity] || []).push(r); });
      var shown = 0;
      Object.keys(byEntity).forEach(function (key) {
        if (shown >= 40) return;
        panel.appendChild(ui.el('div', { class: 'search-group-label',
          text: LPM.schema.entities[key].label + ' (' + byEntity[key].length + ')' }));
        byEntity[key].slice(0, 8).forEach(function (r) {
          shown++;
          var b = ui.el('button', { type: 'button', class: 'search-result', role: 'option' });
          var meta = [];
          if (r.status) meta.push(ui.badge(r.status));
          if (r.priority) meta.push(ui.badge(r.priority));
          if (r.next) meta.push('<span>Next: ' + U.escapeHtml(U.truncate(r.next, 48)) + '</span>');
          b.innerHTML = '<div class="search-result__title">' +
            U.escapeHtml(U.truncate(r.title, 70)) + '</div>' +
            '<div class="search-result__meta">' + meta.join('') + '</div>';
          b.addEventListener('click', function () {
            hide();
            app.openRecord(r.entity, r.id);
          });
          panel.appendChild(b);
        });
      });
    }

    input.addEventListener('input', run);
    input.addEventListener('focus', function () { if (input.value.trim().length >= 2) run(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { hide(); input.blur(); }
      if (e.key === 'ArrowDown') {
        var first = panel.querySelector('.search-result');
        if (first) { e.preventDefault(); first.focus(); }
      }
    });
    panel.addEventListener('keydown', function (e) {
      var items = ui.qsa('.search-result', panel);
      var i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); (items[i + 1] || items[0]).focus(); }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (i <= 0) input.focus(); else items[i - 1].focus();
      }
      if (e.key === 'Escape') { hide(); input.focus(); }
    });
    document.addEventListener('mousedown', function (e) {
      if (!panel.hidden && !panel.contains(e.target) && e.target !== input) hide();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); input.focus(); input.select(); }
    });
  }

  /** Open a record: same page -> drawer; other page -> navigate with ?focus=id */
  app.openRecord = function (entityKey, id) {
    var e = LPM.schema.entities[entityKey];
    if (!e) return;
    if (app.page === entityKey && LPM.crud && LPM.crud.focusRecord) {
      LPM.crud.focusRecord(id);
    } else {
      window.location.href = e.page + '?focus=' + encodeURIComponent(id);
    }
  };

  /* ========================= NOTIFICATIONS ========================= */

  var NOTIF_ENTITIES = ['activities', 'customers', 'localization', 'samples', 'meetings', 'suppliers'];

  function collectNotifications() {
    return LPM.db.getMany(NOTIF_ENTITIES).then(function (data) {
      var list = [];
      NOTIF_ENTITIES.forEach(function (key) {
        var e = LPM.schema.entities[key];
        (data[key] || []).forEach(function (r) {
          U.decorateFor(r, key);
          var title = r[e.titleField] || r.code || '(untitled)';
          if (r._overdue) {
            list.push({ kind: 'overdue', tone: 'danger', entity: key, id: r.id,
              title: title,
              meta: e.label + ' · target ' + U.formatDate(r._targetDate) + ' · ' +
                Math.abs(r._daysRemaining) + ' days overdue',
              sort: -1000 + (r._daysRemaining || 0) });
          } else if (r._followUpDue) {
            list.push({ kind: 'followup', tone: 'warning', entity: key, id: r.id,
              title: title, meta: e.label + ' · follow-up due ' + U.formatDate(r._followDate),
              sort: -500 });
          } else if (r._dueThisWeek) {
            list.push({ kind: 'upcoming', tone: 'info', entity: key, id: r.id,
              title: title, meta: e.label + ' · due ' + U.formatDate(r._targetDate) +
                ' (' + U.dueLabel(r._daysRemaining) + ')',
              sort: r._daysRemaining || 0 });
          }
          if (String(r.priority) === 'Critical' && !r._closed) {
            list.push({ kind: 'critical', tone: 'danger', entity: key, id: r.id,
              title: title, meta: e.label + ' · critical priority · ' + (r._status || 'no status'),
              sort: -900 });
          }
        });
      });
      list.sort(function (a, b) { return a.sort - b.sort; });
      // de-duplicate: one entry per record, most severe first
      var seen = {}, out = [];
      list.forEach(function (n) {
        var k = n.entity + ':' + n.id;
        if (seen[k]) return;
        seen[k] = 1; out.push(n);
      });
      return out;
    });
  }

  function loadNotifications() {
    return collectNotifications().then(function (list) {
      app.notifications = list;
      var badge = document.getElementById('notifCount');
      var urgent = list.filter(function (n) { return n.kind !== 'upcoming'; }).length;
      if (badge) {
        badge.hidden = urgent === 0;
        badge.textContent = urgent > 99 ? '99+' : String(urgent);
      }
      var navBadge = document.querySelector('[data-nav-badge="activities"]');
      if (navBadge) {
        var acts = list.filter(function (n) { return n.entity === 'activities' && n.kind === 'overdue'; }).length;
        navBadge.hidden = acts === 0;
        navBadge.textContent = String(acts);
      }
      return list;
    }).catch(function () { return []; });
  }

  function openNotifications(anchor) {
    var panel = ui.el('div', { class: 'menu notif-panel', role: 'dialog', 'aria-label': 'Notifications' });
    panel.innerHTML = '<div class="notif-panel__head"><strong>Notifications</strong>' +
      '<span class="small muted" id="notifSummary"></span></div><div class="notif-list"></div>';
    var list = panel.querySelector('.notif-list');

    var counts = { overdue: 0, followup: 0, upcoming: 0, critical: 0 };
    app.notifications.forEach(function (n) { counts[n.kind] = (counts[n.kind] || 0) + 1; });
    panel.querySelector('#notifSummary').textContent =
      counts.overdue + ' overdue · ' + counts.followup + ' follow-ups · ' + counts.upcoming + ' upcoming';

    if (!app.notifications.length) {
      list.innerHTML = '<div class="panel-empty">Nothing needs attention. ' +
        'Overdue items, follow-ups and upcoming deadlines appear here.</div>';
    } else {
      app.notifications.slice(0, 50).forEach(function (n) {
        var b = ui.el('button', { type: 'button', class: 'notif-item' });
        b.innerHTML = '<span class="notif-item__dot" style="background:var(--' + n.tone + ')"></span>' +
          '<span style="flex:1;min-width:0"><span class="notif-item__title"></span>' +
          '<span class="notif-item__meta"></span></span>';
        b.querySelector('.notif-item__title').textContent = U.truncate(n.title, 60);
        b.querySelector('.notif-item__meta').textContent = n.meta;
        b.addEventListener('click', function () { ui.closeMenu(); app.openRecord(n.entity, n.id); });
        list.appendChild(b);
      });
    }

    ui.attachMenu(anchor, panel);
  }

  /* ====================== SESSION / INACTIVITY ====================== */

  var lockShown = false;

  function showLock() {
    if (lockShown) return;
    lockShown = true;
    var overlay = ui.el('div', { class: 'lock-overlay', id: 'lockOverlay' });
    overlay.innerHTML =
      '<div class="auth-card" role="dialog" aria-modal="true" aria-label="Session locked">' +
        '<div class="auth-brand"><div class="auth-brand__logo">' + ui.icon('lock') + '</div>' +
        '<div><div class="auth-title">Session locked</div>' +
        '<div class="auth-sub">Enter your password to continue</div></div></div>' +
        '<form class="auth-form" id="lockForm" novalidate>' +
          '<div class="auth-alert" id="lockError" hidden></div>' +
          '<div class="field"><label for="lockPassword">Password</label>' +
          '<input type="password" id="lockPassword" autocomplete="current-password" required></div>' +
          '<button type="submit" class="btn btn--primary btn--block">Unlock</button>' +
          '<button type="button" class="btn btn--ghost btn--block" id="lockLogout">Log out instead</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(overlay);
    var input = overlay.querySelector('#lockPassword');
    var err = overlay.querySelector('#lockError');
    setTimeout(function () { input.focus(); }, 50);

    overlay.querySelector('#lockForm').addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      LPM.auth.unlock(input.value).then(function () {
        overlay.remove();
        lockShown = false;
        ui.toast('Welcome back', 'success');
      }).catch(function (ex) {
        err.hidden = false;
        err.textContent = ex.message;
        input.select();
      });
    });
    overlay.querySelector('#lockLogout').addEventListener('click', doLogout);
  }

  function startSessionWatch() {
    var throttled = false;
    function activity() {
      if (throttled) return;
      throttled = true;
      setTimeout(function () { throttled = false; }, 15000);
      LPM.auth.touch();
    }
    ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(function (ev) {
      window.addEventListener(ev, activity, { passive: true });
    });

    setInterval(function () {
      var st = LPM.auth.sessionState();
      if (st.state === 'active') return;
      if (st.state === 'locked') showLock();
      else window.location.href = 'index.html?reason=timeout';
    }, 20000);
  }

  function updateRecordCount() {
    LPM.db.getMany(LPM.db.DATA_STORES).then(function (data) {
      var n = 0;
      Object.keys(data).forEach(function (k) { n += (data[k] || []).length; });
      ui.qsa('[data-db-count]').forEach(function (el) { el.textContent = String(n); });
    }).catch(function () {});
  }

  /* ============================== BOOT ============================== */

  /**
   * boot({ page, requireAuth, onReady })
   * Resolves once the shell is rendered and the DB is open.
   */
  app.boot = function (opts) {
    opts = opts || {};
    app.page = opts.page || null;
    applyTheme();

    if (!LPM.db.isSupported()) {
      showFatal('This browser has no IndexedDB support (or site data is blocked). ' +
        'The tracker cannot store data here. Try a normal, non-private window in a modern browser.');
      return Promise.reject(new Error('IndexedDB unavailable'));
    }

    return LPM.db.initDB().then(function () {
      var st = LPM.auth.sessionState();
      return LPM.auth.isSetupComplete().then(function (done) {
        if (!done) { window.location.replace('index.html'); throw new Error('setup required'); }
        if (st.state === 'none' || st.state === 'expired') {
          var next = encodeURIComponent(window.location.pathname.split('/').pop() + window.location.search);
          window.location.replace('index.html?next=' + next +
            (st.state === 'expired' ? '&reason=timeout' : ''));
          throw new Error('not authenticated');
        }
        renderShell(opts.page);
        if (st.state === 'locked') showLock();
        startSessionWatch();
        loadNotifications();
        updateRecordCount();
        LPM.db.onChange(function () { loadNotifications(); updateRecordCount(); });
        app.ready = true;
        return true;
      });
    }).catch(function (err) {
      if (/setup required|not authenticated/.test(err.message)) return Promise.reject(err);
      showFatal('The local database could not be opened. ' + err.message);
      throw err;
    });
  };

  function showFatal(message) {
    var main = document.getElementById('main') || document.body;
    var box = ui.el('div', { class: 'page' });
    box.appendChild(ui.errorState(message, function () { window.location.reload(); }));
    ui.clear(main);
    main.appendChild(box);
  }

  /* Page title helper used by every page */
  app.setPageHeading = function (title, subtitle) {
    var t = document.querySelector('[data-page-title]');
    if (t) t.textContent = title;
    var s = document.querySelector('[data-page-subtitle]');
    if (s) s.textContent = subtitle || '';
  };

  app.applyTheme = applyTheme;
  app.setTheme = setTheme;
  app.loadNotifications = loadNotifications;
  app.updateRecordCount = updateRecordCount;
  app.globalSearch = globalSearch;
  app.logout = doLogout;
  app.showLock = showLock;
  app.refreshAfterChange = refreshAfterChange;

  LPM.app = app;
})(window, document);
