/* ==========================================================================
   ui.js — reusable UI components
   Toasts, modals, confirmation dialogs, drawers, tables, badges, KPI cards,
   filter bars, menus, empty/loading states, icons.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM || (window.LPM = {});
  var U = LPM.utils;
  var ui = {};

  /* ============================== ICONS ============================== */

  var ICONS = {
    grid: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/>',
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>',
    package: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    truck: '<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    trend: '<path d="m23 6-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
  };

  ui.icon = function (name, cls) {
    var body = ICONS[name] || ICONS.grid;
    return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      body + '</svg>';
  };

  /* ============================ DOM HELPERS ============================ */

  ui.el = function (tag, attrs, html) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') {
        e.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
      } else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) {
        e.setAttribute(k, attrs[k]);
      }
    });
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  };

  ui.qs = function (sel, root) { return (root || document).querySelector(sel); };
  ui.qsa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  ui.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); };

  /* =============================== TOAST =============================== */

  function toastStack() {
    var s = document.getElementById('toastStack');
    if (!s) {
      s = ui.el('div', { id: 'toastStack', class: 'toast-stack', role: 'status',
        'aria-live': 'polite', 'aria-atomic': 'false' });
      document.body.appendChild(s);
    }
    return s;
  }

  ui.toast = function (message, type, duration) {
    var stack = toastStack();
    var t = ui.el('div', { class: 'toast toast--' + (type || 'info') });
    t.innerHTML = '<div class="toast__msg"></div>' +
      '<button class="toast__close" type="button" aria-label="Dismiss">&times;</button>';
    t.querySelector('.toast__msg').textContent = String(message);
    var timer;
    function close() { clearTimeout(timer); if (t.parentNode) t.parentNode.removeChild(t); }
    t.querySelector('.toast__close').addEventListener('click', close);
    stack.appendChild(t);
    timer = setTimeout(close, duration || (type === 'error' ? 6500 : 3500));
    return close;
  };

  /* ============================ FOCUS TRAP ============================ */

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
    'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function trapFocus(container, ev) {
    var nodes = ui.qsa(FOCUSABLE, container).filter(function (n) {
      return n.offsetParent !== null || n === document.activeElement;
    });
    if (!nodes.length) return;
    var first = nodes[0], last = nodes[nodes.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  }

  /* =============================== MODAL =============================== */

  var openLayers = [];
  var activeMenu = null;

  /* Escape always closes the topmost open layer, wherever focus currently is.
     A menu open on top of a layer takes the key first (see escClose). */
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape' || !openLayers.length) return;
    if (activeMenu) return;
    var top = openLayers[openLayers.length - 1];
    if (top.dismissible === false) return;
    ev.stopPropagation();
    top.close();
  });

  ui.modal = function (opts) {
    opts = opts || {};
    var lastFocus = document.activeElement;
    var backdrop = ui.el('div', { class: 'modal-backdrop', role: 'presentation' });
    var modal = ui.el('div', {
      class: 'modal' + (opts.size ? ' modal--' + opts.size : ''),
      role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Dialog'
    });

    var head = ui.el('div', { class: 'modal__head' });
    head.innerHTML = '<h2 class="modal__title"></h2>' +
      '<button type="button" class="icon-btn" data-close aria-label="Close dialog">' + ui.icon('close') + '</button>';
    head.querySelector('.modal__title').textContent = opts.title || '';

    var body = ui.el('div', { class: 'modal__body' });
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    modal.appendChild(head);
    modal.appendChild(body);

    var foot = null;
    if (opts.buttons && opts.buttons.length) {
      foot = ui.el('div', { class: 'modal__foot' });
      opts.buttons.forEach(function (b) {
        var btn = ui.el('button', {
          type: b.type || 'button',
          class: 'btn ' + (b.class || '') + (b.align === 'left' ? ' left' : '')
        }, (b.icon ? ui.icon(b.icon) : '') + '<span></span>');
        btn.querySelector('span').textContent = b.label;
        if (b.id) btn.id = b.id;
        btn.addEventListener('click', function () {
          if (b.onClick) b.onClick(api);
          else if (b.close !== false) api.close();
        });
        foot.appendChild(btn);
      });
      modal.appendChild(foot);
    }

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    document.body.style.overflow = 'hidden';

    function onKey(ev) {
      if (ev.key === 'Escape' && opts.dismissible !== false) { ev.stopPropagation(); api.close(); }
      else if (ev.key === 'Tab') trapFocus(modal, ev);
    }
    backdrop.addEventListener('keydown', onKey);
    backdrop.addEventListener('mousedown', function (ev) {
      if (ev.target === backdrop && opts.dismissible !== false) api.close();
    });
    ui.qsa('[data-close]', modal).forEach(function (b) {
      b.addEventListener('click', function () { api.close(); });
    });

    var api = {
      root: backdrop,
      body: body,
      footer: foot,
      dismissible: opts.dismissible !== false,
      close: function () {
        if (!backdrop.parentNode) return;
        backdrop.parentNode.removeChild(backdrop);
        openLayers = openLayers.filter(function (l) { return l !== api; });
        if (!openLayers.length) document.body.style.overflow = '';
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
        if (opts.onClose) opts.onClose();
      }
    };
    openLayers.push(api);

    setTimeout(function () {
      var target = modal.querySelector('[autofocus]') ||
        modal.querySelector('.modal__body ' + FOCUSABLE) ||
        modal.querySelector('[data-close]');
      if (target && target.focus) target.focus();
    }, 30);

    if (opts.onOpen) opts.onOpen(api);
    return api;
  };

  /* ========================= CONFIRM DIALOG ========================= */

  ui.confirm = function (opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      var settled = false;
      var wrap = ui.el('div', {}, '');
      var p = ui.el('p', { class: 'mb-0', text: opts.message || 'Are you sure?' });
      wrap.appendChild(p);
      if (opts.detail) {
        wrap.appendChild(ui.el('p', { class: 'small muted mt-3 mb-0', text: opts.detail }));
      }
      var m = ui.modal({
        title: opts.title || 'Please confirm',
        size: 'sm',
        body: wrap,
        buttons: [
          { label: opts.cancelLabel || 'Cancel', class: 'btn--ghost',
            onClick: function (api) { settled = true; api.close(); resolve(false); } },
          { label: opts.confirmLabel || 'Confirm',
            class: opts.danger ? 'btn--danger' : 'btn--primary',
            onClick: function (api) { settled = true; api.close(); resolve(true); } }
        ],
        onClose: function () { if (!settled) resolve(false); }
      });
      setTimeout(function () {
        var btns = m.footer ? m.footer.querySelectorAll('button') : [];
        if (btns.length > 1) btns[1].focus();
      }, 40);
    });
  };

  ui.alert = function (title, message) {
    return new Promise(function (resolve) {
      ui.modal({
        title: title, size: 'sm',
        body: ui.el('p', { class: 'mb-0', text: message }),
        buttons: [{ label: 'OK', class: 'btn--primary', onClick: function (a) { a.close(); resolve(true); } }],
        onClose: resolve
      });
    });
  };

  /* ============================== DRAWER ============================== */

  ui.drawer = function (opts) {
    opts = opts || {};
    var lastFocus = document.activeElement;
    var backdrop = ui.el('div', { class: 'drawer-backdrop' });
    var panel = ui.el('aside', {
      class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || 'Details'
    });

    var head = ui.el('div', { class: 'drawer__head' });
    head.innerHTML =
      '<div class="row row--between" style="align-items:flex-start">' +
        '<div style="min-width:0"><h2 class="page__title" style="font-size:16px"></h2>' +
        '<div class="page__subtitle" data-sub></div></div>' +
        '<button type="button" class="icon-btn" data-close aria-label="Close details">' + ui.icon('close') + '</button>' +
      '</div>';
    head.querySelector('h2').textContent = opts.title || '';
    var sub = head.querySelector('[data-sub]');
    if (opts.subtitle) sub.textContent = opts.subtitle; else sub.remove();

    var body = ui.el('div', { class: 'drawer__body' });
    if (typeof opts.body === 'string') body.innerHTML = opts.body;
    else if (opts.body) body.appendChild(opts.body);

    panel.appendChild(head);
    panel.appendChild(body);

    if (opts.buttons && opts.buttons.length) {
      var foot = ui.el('div', { class: 'drawer__foot' });
      opts.buttons.forEach(function (b) {
        var btn = ui.el('button', { type: 'button', class: 'btn ' + (b.class || '') },
          (b.icon ? ui.icon(b.icon) : '') + '<span></span>');
        btn.querySelector('span').textContent = b.label;
        btn.addEventListener('click', function () { if (b.onClick) b.onClick(api); else api.close(); });
        foot.appendChild(btn);
      });
      panel.appendChild(foot);
    }

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    document.body.style.overflow = 'hidden';

    function onKey(ev) {
      if (ev.key === 'Escape') api.close();
      else if (ev.key === 'Tab') trapFocus(panel, ev);
    }
    panel.addEventListener('keydown', onKey);
    backdrop.addEventListener('click', function () { api.close(); });
    ui.qsa('[data-close]', panel).forEach(function (b) {
      b.addEventListener('click', function () { api.close(); });
    });

    var api = {
      root: panel, body: body,
      dismissible: true,
      close: function () {
        if (panel.parentNode) panel.parentNode.removeChild(panel);
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
        openLayers = openLayers.filter(function (l) { return l !== api; });
        if (!openLayers.length) document.body.style.overflow = '';
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
        if (opts.onClose) opts.onClose();
      }
    };
    openLayers.push(api);
    setTimeout(function () { var c = panel.querySelector('[data-close]'); if (c) c.focus(); }, 30);
    return api;
  };

  /* =============================== BADGE =============================== */

  ui.badge = function (value, toneOverride) {
    if (U.isBlank(value)) return '<span class="muted">—</span>';
    var t = toneOverride || LPM.schema.tone(value);
    return '<span class="badge badge--' + t + ' badge--dot">' + U.escapeHtml(value) + '</span>';
  };

  ui.flagBadge = function (label, tone) {
    return '<span class="badge badge--' + (tone || 'neutral') + '">' + U.escapeHtml(label) + '</span>';
  };

  /* ============================ CELL FORMAT ============================ */

  ui.formatCell = function (value, type, row) {
    switch (type) {
      case 'badge': return ui.badge(value);
      case 'date':
        if (U.isBlank(value)) return '<span class="muted">—</span>';
        return '<span class="nowrap">' + U.escapeHtml(U.formatDate(value)) + '</span>';
      case 'datetime': return U.escapeHtml(U.formatDateTime(value)) || '<span class="muted">—</span>';
      case 'value': return U.formatValue(value) === '—'
        ? '<span class="muted">—</span>'
        : '<span class="nowrap">' + U.escapeHtml(U.formatValue(value)) + '</span>';
      case 'number': return U.isBlank(value) ? '<span class="muted">—</span>' : U.escapeHtml(U.formatNumber(value));
      case 'percent': return U.isBlank(value) ? '<span class="muted">—</span>' : U.escapeHtml(U.formatPercent(value));
      case 'code': return '<span class="mono muted">' + U.escapeHtml(value || '—') + '</span>';
      case 'days': {
        if (value === null || value === undefined || value === '') return '<span class="muted">—</span>';
        var n = Number(value);
        if (isNaN(n)) return '<span class="muted">—</span>';
        var cls = n < 0 ? 'text-danger' : (n <= 3 ? 'text-warning' : '');
        var txt = n < 0 ? (Math.abs(n) + 'd over') : (n + 'd');
        return '<span class="nowrap bold ' + cls + '">' + txt + '</span>';
      }
      case 'title': {
        var html = '<span class="cell-title">' +
          U.escapeHtml(U.truncate(value || '(untitled)', 70)) + '</span>';
        if (row && row._overdue) {
          html += ' <span class="badge badge--danger" title="Past target date">Overdue</span>';
        }
        return html;
      }
      case 'bool': return value === true || /^(yes|true)$/i.test(String(value || ''))
        ? '<span class="badge badge--success">Yes</span>'
        : '<span class="badge badge--neutral">No</span>';
      case 'link':
        if (U.isBlank(value)) return '<span class="muted">—</span>';
        return '<a href="' + U.escapeHtml(value) + '" target="_blank" rel="noopener noreferrer">Open</a>';
      default:
        if (U.isBlank(value)) return '<span class="muted">—</span>';
        return U.escapeHtml(U.truncate(String(value), 60));
    }
  };

  /* =============================== TABLE =============================== */

  /**
   * ui.renderTable(container, {
   *   columns, rows, sort:{key,dir}, onSort, onRowClick, rowActions, emptyState, cards
   * })
   */
  ui.renderTable = function (container, opts) {
    opts = opts || {};
    var rows = opts.rows || [];
    ui.clear(container);

    if (!rows.length) {
      container.appendChild(ui.emptyState(opts.emptyState || {}));
      return;
    }

    var wrap = ui.el('div', { class: 'table-wrap' + (opts.cards === false ? '' : ' table-wrap--cards') });
    var table = ui.el('table', { class: 'data-table' });

    var thead = ui.el('thead');
    var htr = ui.el('tr');
    opts.columns.forEach(function (c) {
      var th = ui.el('th', { scope: 'col',
        class: (c.sortable === false ? '' : 'sortable') +
          (c.primary || c.type === 'title' ? ' col-primary' : '') });
      th.innerHTML = U.escapeHtml(c.label) +
        (c.sortable === false ? '' : '<span class="sort-ind">↕</span>');
      if (opts.sort && opts.sort.key === c.key) {
        th.setAttribute('aria-sort', opts.sort.dir === 'asc' ? 'ascending' : 'descending');
        th.querySelector('.sort-ind').textContent = opts.sort.dir === 'asc' ? '↑' : '↓';
      }
      if (c.sortable !== false && opts.onSort) {
        th.tabIndex = 0;
        var doSort = function () { opts.onSort(c.key); };
        th.addEventListener('click', doSort);
        th.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doSort(); }
        });
      }
      htr.appendChild(th);
    });
    if (opts.rowActions) {
      htr.appendChild(ui.el('th', { scope: 'col', class: 'col-actions' }, 'Actions'));
    }
    thead.appendChild(htr);
    table.appendChild(thead);

    var tbody = ui.el('tbody');
    rows.forEach(function (r) {
      var tr = ui.el('tr', {
        class: (r._overdue ? 'row--overdue ' : '') + (r.isSample ? 'row--sample' : ''),
        tabindex: opts.onRowClick ? '0' : null
      });
      opts.columns.forEach(function (c) {
        var td = ui.el('td', { 'data-label': c.label,
          class: (c.align === 'right' ? 'num' : '') +
            (c.primary || c.type === 'title' ? ' col-primary' : '') });
        var val = typeof c.value === 'function' ? c.value(r) : r[c.key];
        td.innerHTML = c.render ? c.render(val, r) : ui.formatCell(val, c.type, r);
        tr.appendChild(td);
      });
      if (opts.rowActions) {
        var td2 = ui.el('td', { class: 'col-actions', 'data-label': '' });
        var acts = ui.el('div', { class: 'row-actions' });
        opts.rowActions.forEach(function (a) {
          if (a.when && !a.when(r)) return;
          var b = ui.el('button', {
            type: 'button', class: 'icon-btn btn--sm', title: a.label, 'aria-label': a.label + ' ' + (r.code || '')
          }, ui.icon(a.icon));
          b.addEventListener('click', function (ev) { ev.stopPropagation(); a.onClick(r); });
          acts.appendChild(b);
        });
        td2.appendChild(acts);
        tr.appendChild(td2);
      }
      if (opts.onRowClick) {
        tr.addEventListener('click', function () { opts.onRowClick(r); });
        tr.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); opts.onRowClick(r); }
        });
      }
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);
    container.appendChild(wrap);
  };

  /* ============================== STATES ============================== */

  ui.emptyState = function (opts) {
    opts = opts || {};
    var d = ui.el('div', { class: 'empty-state' });
    d.innerHTML =
      '<div class="empty-state__icon">' + ui.icon(opts.icon || 'inbox') + '</div>' +
      '<div class="empty-state__title"></div>' +
      '<div class="empty-state__text"></div>';
    d.querySelector('.empty-state__title').textContent = opts.title || 'Nothing here yet';
    d.querySelector('.empty-state__text').textContent = opts.text ||
      'Records you add will appear in this list.';
    if (opts.actionLabel && opts.onAction) {
      var b = ui.el('button', { type: 'button', class: 'btn btn--primary' },
        ui.icon('plus') + '<span></span>');
      b.querySelector('span').textContent = opts.actionLabel;
      b.addEventListener('click', opts.onAction);
      d.appendChild(b);
    }
    return d;
  };

  ui.loadingState = function (text) {
    var d = ui.el('div', { class: 'loading-state' });
    d.innerHTML = '<span class="spinner"></span><span></span>';
    d.querySelector('span:last-child').textContent = text || 'Loading…';
    return d;
  };

  ui.setLoading = function (container, text) {
    ui.clear(container);
    container.appendChild(ui.loadingState(text));
  };

  ui.errorState = function (message, onRetry) {
    var d = ui.el('div', { class: 'empty-state' });
    d.innerHTML = '<div class="empty-state__icon">' + ui.icon('alert') + '</div>' +
      '<div class="empty-state__title">Something went wrong</div>' +
      '<div class="empty-state__text"></div>';
    d.querySelector('.empty-state__text').textContent = message;
    if (onRetry) {
      var b = ui.el('button', { type: 'button', class: 'btn' }, ui.icon('refresh') + '<span>Try again</span>');
      b.addEventListener('click', onRetry);
      d.appendChild(b);
    }
    return d;
  };

  /* ============================ KPI CARD ============================ */

  ui.kpiCard = function (opts) {
    var b = ui.el('button', {
      type: 'button',
      class: 'kpi-card' + (opts.tone ? ' kpi-card--' + opts.tone : ''),
      'aria-label': opts.label + ': ' + opts.value
    });
    b.innerHTML =
      '<span class="kpi-card__accent"></span>' +
      '<span class="kpi-card__label">' + (opts.icon ? ui.icon(opts.icon) : '') + '<span></span></span>' +
      '<span class="kpi-card__value"></span>' +
      '<span class="kpi-card__meta"></span>';
    b.querySelector('.kpi-card__label span').textContent = opts.label;
    b.querySelector('.kpi-card__value').textContent = opts.value;
    var meta = b.querySelector('.kpi-card__meta');
    if (opts.meta) meta.textContent = opts.meta; else meta.remove();
    if (opts.onClick) b.addEventListener('click', opts.onClick);
    else if (opts.href) b.addEventListener('click', function () { window.location.href = opts.href; });
    return b;
  };

  /* ============================== MENU ============================== */

  ui.closeMenu = function () {
    if (activeMenu && activeMenu.parentNode) activeMenu.parentNode.removeChild(activeMenu);
    activeMenu = null;
    document.removeEventListener('mousedown', outsideClose, true);
    document.removeEventListener('keydown', escClose, true);
  };

  function outsideClose(ev) {
    if (activeMenu && !activeMenu.contains(ev.target) &&
        !(activeMenu._anchor && activeMenu._anchor.contains(ev.target))) ui.closeMenu();
  }
  function escClose(ev) { if (ev.key === 'Escape') ui.closeMenu(); }

  /**
   * Attach any element as the anchored popover layer, with the same
   * outside-click / Escape / toggle behaviour as ui.menu.
   */
  ui.attachMenu = function (anchor, node) {
    if (activeMenu && activeMenu._anchor === anchor) { ui.closeMenu(); return null; }
    ui.closeMenu();
    node._anchor = anchor;
    var host = anchor.closest('.menu-anchor') || anchor.parentNode;
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.appendChild(node);
    activeMenu = node;
    setTimeout(function () {
      document.addEventListener('mousedown', outsideClose, true);
      document.addEventListener('keydown', escClose, true);
      var first = node.querySelector('.menu__item, button, [tabindex]');
      if (first && first.focus) first.focus();
    }, 0);
    return node;
  };

  /**
   * ui.menu(anchorButton, items, options)
   * items: [{label, icon, onClick} | {label, header:true} | {separator:true}]
   */
  ui.menu = function (anchor, items, options) {
    options = options || {};
    var toggling = activeMenu && activeMenu._anchor === anchor;

    var m = ui.el('div', { class: 'menu ' + (options.class || ''), role: 'menu' });
    (items || []).forEach(function (it) {
      if (it.separator) { m.appendChild(ui.el('div', { class: 'menu__sep' })); return; }
      if (it.header) { m.appendChild(ui.el('div', { class: 'menu__label', text: it.label })); return; }
      var b = ui.el('button', { type: 'button', class: 'menu__item', role: 'menuitem' },
        (it.icon ? ui.icon(it.icon) : '') + '<span></span>');
      b.querySelector('span').textContent = it.label;
      b.addEventListener('click', function () { ui.closeMenu(); if (it.onClick) it.onClick(); });
      m.appendChild(b);
    });

    if (toggling) { ui.closeMenu(); return null; }
    return ui.attachMenu(anchor, m);
  };

  /* ============================= PIPELINE ============================= */

  ui.pipeline = function (stages, current) {
    var idx = stages.indexOf(current);
    return '<div class="pipeline" role="img" aria-label="Stage: ' + U.escapeHtml(current || 'not set') + '">' +
      stages.map(function (s, i) {
        var cls = i < idx ? ' pipeline__step--done' : (i === idx ? ' pipeline__step--current' : '');
        return '<span class="pipeline__step' + cls + '" title="' + U.escapeHtml(s) + '">' +
          U.escapeHtml(s) + '</span>';
      }).join('') + '</div>';
  };

  ui.progress = function (percent, tone) {
    var p = Math.max(0, Math.min(100, Number(percent) || 0));
    return '<div class="progress" role="progressbar" aria-valuenow="' + p +
      '" aria-valuemin="0" aria-valuemax="100"><div class="progress__bar' +
      (tone ? ' progress__bar--' + tone : '') + '" style="width:' + p + '%"></div></div>';
  };

  /* ============================ PAGINATION ============================ */

  ui.pagination = function (opts) {
    var total = opts.total, page = opts.page, size = opts.size;
    var pages = Math.max(1, Math.ceil(total / size));
    var wrap = ui.el('div', { class: 'table-foot' });
    var from = total === 0 ? 0 : (page - 1) * size + 1;
    var to = Math.min(total, page * size);
    wrap.appendChild(ui.el('div', { class: 'pagination__info',
      text: 'Showing ' + from + '–' + to + ' of ' + total + ' records' }));

    var nav = ui.el('div', { class: 'pagination' });
    var prev = ui.el('button', { type: 'button', class: 'btn btn--sm', 'aria-label': 'Previous page' },
      ui.icon('chevronLeft') + '<span>Prev</span>');
    prev.disabled = page <= 1;
    prev.addEventListener('click', function () { opts.onPage(page - 1); });

    var label = ui.el('span', { class: 'pagination__info nowrap', text: 'Page ' + page + ' of ' + pages });

    var next = ui.el('button', { type: 'button', class: 'btn btn--sm', 'aria-label': 'Next page' },
      '<span>Next</span>' + ui.icon('chevronRight'));
    next.disabled = page >= pages;
    next.addEventListener('click', function () { opts.onPage(page + 1); });

    nav.appendChild(prev); nav.appendChild(label); nav.appendChild(next);
    wrap.appendChild(nav);
    return wrap;
  };

  /* ============================ DETAIL GRID ============================ */

  ui.detailGrid = function (groups) {
    var g = ui.el('div', { class: 'detail-grid' });
    groups.forEach(function (grp) {
      if (grp.title) g.appendChild(ui.el('div', { class: 'detail-section-title', text: grp.title }));
      (grp.items || []).forEach(function (it) {
        if (U.isBlank(it.value) && !it.always) return;
        var d = ui.el('div', { class: 'detail-item' + (it.span === 2 ? ' full' : '') });
        d.innerHTML = '<div class="detail-item__label"></div><div class="detail-item__value"></div>';
        d.querySelector('.detail-item__label').textContent = it.label;
        var v = d.querySelector('.detail-item__value');
        if (it.html) v.innerHTML = it.html;
        else v.textContent = it.value === '' || it.value === null || it.value === undefined ? '—' : String(it.value);
        g.appendChild(d);
      });
    });
    return g;
  };

  LPM.ui = ui;
})(window, document);
