/* ==========================================================================
   utils.js — shared helpers: dates, business logic, formatting, CSV
   Exposes the global namespace `LPM`.
   ========================================================================== */
(function (window) {
  'use strict';

  var LPM = window.LPM || (window.LPM = {});
  var U = {};

  /* ---------------- Identity ---------------- */

  U.uid = function (prefix) {
    var rnd;
    if (window.crypto && window.crypto.getRandomValues) {
      var a = new Uint8Array(8);
      window.crypto.getRandomValues(a);
      rnd = Array.prototype.map.call(a, function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    } else {
      rnd = Math.random().toString(16).slice(2, 18);
    }
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + rnd;
  };

  /** Next sequential human code, e.g. ACT-0007, from existing records. */
  U.nextCode = function (records, prefix) {
    var max = 0;
    (records || []).forEach(function (r) {
      var m = /(\d+)\s*$/.exec(String(r && r.code || ''));
      if (m) { var n = parseInt(m[1], 10); if (n > max) max = n; }
    });
    return prefix + '-' + String(max + 1).padStart(4, '0');
  };

  /* ---------------- Dates ---------------- */

  var MS_DAY = 86400000;

  /** Parse 'YYYY-MM-DD' (or Date/ISO string) into a local Date at midnight. Returns null when invalid. */
  U.parseDate = function (v) {
    if (!v && v !== 0) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : U.startOfDay(v);
    var s = String(v).trim();
    if (!s) return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    var d;
    if (m) {
      d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    } else {
      d = new Date(s);
    }
    if (!d || isNaN(d.getTime())) return null;
    return U.startOfDay(d);
  };

  U.startOfDay = function (d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  U.today = function () { return U.startOfDay(new Date()); };

  /** 'YYYY-MM-DD' for a Date (local, no timezone drift). */
  U.toISODate = function (d) {
    var dt = (d instanceof Date) ? d : U.parseDate(d);
    if (!dt) return '';
    return dt.getFullYear() + '-' +
      String(dt.getMonth() + 1).padStart(2, '0') + '-' +
      String(dt.getDate()).padStart(2, '0');
  };

  U.todayISO = function () { return U.toISODate(U.today()); };

  U.addDays = function (d, n) {
    var dt = (d instanceof Date) ? new Date(d.getTime()) : U.parseDate(d);
    if (!dt) return null;
    dt.setDate(dt.getDate() + n);
    return U.startOfDay(dt);
  };

  /** Whole days between two dates (b - a). Null when either is invalid. */
  U.daysBetween = function (a, b) {
    var da = U.parseDate(a), db = U.parseDate(b);
    if (!da || !db) return null;
    return Math.round((db.getTime() - da.getTime()) / MS_DAY);
  };

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /** Human date: 12 Mar 2026. Empty string when missing/invalid. */
  U.formatDate = function (v) {
    var d = U.parseDate(v);
    if (!d) return '';
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };

  U.formatDateTime = function (v) {
    if (!v) return '';
    var d = (v instanceof Date) ? v : new Date(v);
    if (isNaN(d.getTime())) return '';
    return U.formatDate(d) + ', ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  U.formatLongDate = function (v) {
    var d = U.parseDate(v);
    if (!d) return '';
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var full = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    return days[d.getDay()] + ', ' + d.getDate() + ' ' + full[d.getMonth()] + ' ' + d.getFullYear();
  };

  /** Monday of the week containing d. */
  U.startOfWeek = function (d) {
    var dt = U.parseDate(d) || U.today();
    var day = (dt.getDay() + 6) % 7; // 0 = Monday
    return U.addDays(dt, -day);
  };

  U.endOfWeek = function (d) { return U.addDays(U.startOfWeek(d), 6); };

  U.isoWeekNumber = function (d) {
    var dt = U.parseDate(d) || U.today();
    var target = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    var dayNr = (dt.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    var firstThursday = new Date(target.getFullYear(), 0, 4);
    var diff = target - firstThursday;
    return 1 + Math.round(diff / (7 * MS_DAY) - ((firstThursday.getDay() + 6) % 7 - 3) / 7);
  };

  U.weekLabel = function (dateISO) {
    var s = U.startOfWeek(dateISO), e = U.endOfWeek(dateISO);
    return 'Week ' + U.isoWeekNumber(s) + ' · ' + U.formatDate(s) + ' – ' + U.formatDate(e);
  };

  U.inRange = function (value, fromISO, toISO) {
    var d = U.parseDate(value);
    if (!d) return false;
    if (fromISO) { var f = U.parseDate(fromISO); if (f && d < f) return false; }
    if (toISO) { var t = U.parseDate(toISO); if (t && d > t) return false; }
    return true;
  };

  /** Deadline-oriented wording for a "days remaining" number. */
  U.dueLabel = function (n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (n === 0) return 'Due today';
    if (n === 1) return 'Due tomorrow';
    if (n < 0) return Math.abs(n) + (Math.abs(n) === 1 ? ' day overdue' : ' days overdue');
    return 'in ' + n + ' days';
  };

  U.relativeDays = function (n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    if (n === 0) return 'Today';
    if (n === 1) return 'Tomorrow';
    if (n === -1) return 'Yesterday';
    if (n > 0) return 'in ' + n + ' days';
    return Math.abs(n) + ' days ago';
  };

  /* ---------------- Numbers & text ---------------- */

  U.toNumber = function (v) {
    if (v === null || v === undefined || v === '') return null;
    var n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? n : null;
  };

  /** Compact currency-ish formatting for opportunity values. */
  U.formatValue = function (v, currency) {
    var n = U.toNumber(v);
    if (n === null) return '—';
    var cur = currency || (LPM.prefs && LPM.prefs.currency) || 'USD';
    var sym = ({ USD: '$', EUR: '€', GBP: '£', INR: '₹', JPY: '¥' })[cur] || (cur + ' ');
    var abs = Math.abs(n), out;
    if (abs >= 1e9) out = (n / 1e9).toFixed(2).replace(/\.00$/, '') + 'B';
    else if (abs >= 1e6) out = (n / 1e6).toFixed(2).replace(/\.00$/, '') + 'M';
    else if (abs >= 1e3) out = (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    else out = String(Math.round(n * 100) / 100);
    return sym + out;
  };

  U.formatNumber = function (v) {
    var n = U.toNumber(v);
    if (n === null) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  U.formatPercent = function (v) {
    var n = U.toNumber(v);
    if (n === null) return '—';
    return Math.round(n) + '%';
  };

  U.escapeHtml = function (s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  U.truncate = function (s, n) {
    s = String(s === null || s === undefined ? '' : s);
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  };

  U.initials = function (name) {
    var parts = String(name || '?').trim().split(/[\s._-]+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  U.titleCase = function (s) {
    return String(s || '').replace(/\w\S*/g, function (t) {
      return t.charAt(0).toUpperCase() + t.slice(1);
    });
  };

  U.isBlank = function (v) {
    return v === null || v === undefined || (typeof v === 'string' && !v.trim());
  };

  U.debounce = function (fn, wait) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait || 200);
    };
  };

  U.deepClone = function (o) {
    if (o === null || typeof o !== 'object') return o;
    try { return JSON.parse(JSON.stringify(o)); } catch (e) { return o; }
  };

  U.unique = function (arr) {
    var seen = Object.create(null), out = [];
    (arr || []).forEach(function (v) {
      var k = String(v);
      if (!U.isBlank(v) && !seen[k]) { seen[k] = 1; out.push(v); }
    });
    return out;
  };

  U.sortBy = function (arr, key, dir) {
    var mul = dir === 'desc' ? -1 : 1;
    return arr.slice().sort(function (a, b) {
      var va = typeof key === 'function' ? key(a) : a[key];
      var vb = typeof key === 'function' ? key(b) : b[key];
      if (U.isBlank(va) && U.isBlank(vb)) return 0;
      if (U.isBlank(va)) return 1;   // blanks always last
      if (U.isBlank(vb)) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mul;
      var numRe = /^-?\d+(\.\d+)?$/;
      if (numRe.test(String(va).trim()) && numRe.test(String(vb).trim())) {
        return (parseFloat(va) - parseFloat(vb)) * mul;
      }
      return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' }) * mul;
    });
  };

  U.groupCount = function (records, key) {
    var out = {};
    (records || []).forEach(function (r) {
      var v = (typeof key === 'function' ? key(r) : r[key]);
      if (U.isBlank(v)) v = 'Unspecified';
      out[v] = (out[v] || 0) + 1;
    });
    return out;
  };

  /* ---------------- Business logic (spec §28) ---------------- */

  var CLOSED_STATUSES = ['Completed', 'Cancelled', 'Closed', 'Lost', 'Order'];

  U.isClosed = function (status) {
    return CLOSED_STATUSES.indexOf(String(status || '')) !== -1;
  };

  /** targetDate < today AND status != Completed */
  U.isOverdue = function (rec, dateField) {
    if (!rec) return false;
    var f = dateField || 'targetDate';
    var d = U.parseDate(rec[f]);
    if (!d) return false;
    if (U.isClosed(rec.status)) return false;
    return d < U.today();
  };

  /** nextActionDate <= today AND status != Completed */
  U.isFollowUpDue = function (rec, dateField) {
    if (!rec) return false;
    var f = dateField || 'nextActionDate';
    var d = U.parseDate(rec[f]);
    if (!d) return false;
    if (U.isClosed(rec.status)) return false;
    return d <= U.today();
  };

  /** targetDate - today, in days. Null when no valid target date. */
  U.daysRemaining = function (rec, dateField) {
    var d = U.parseDate(rec && rec[dateField || 'targetDate']);
    if (!d) return null;
    return U.daysBetween(U.today(), d);
  };

  /** today - dateAdded, in days. */
  U.aging = function (rec, dateField) {
    var d = U.parseDate(rec && (rec[dateField || 'dateAdded'] || rec.createdAt));
    if (!d) return null;
    var n = U.daysBetween(d, U.today());
    return n === null ? null : Math.max(0, n);
  };

  /** estimatedOpportunityValue x probability%. Null when value missing. */
  U.weightedValue = function (rec) {
    if (!rec) return null;
    var v = U.toNumber(rec.estimatedOpportunityValue !== undefined
      ? rec.estimatedOpportunityValue : rec.commercialPotential);
    if (v === null) return null;
    var p = U.toNumber(rec.probability);
    if (p === null) p = 0;
    if (p > 1 && p <= 100) p = p / 100;
    if (p > 1) p = 1;
    if (p < 0) p = 0;
    return Math.round(v * p * 100) / 100;
  };

  /** Attach every derived value used by the UI. Never throws on bad data. */
  U.decorate = function (rec) {
    if (!rec || typeof rec !== 'object') return rec;
    rec._overdue = U.isOverdue(rec);
    rec._followUpDue = U.isFollowUpDue(rec);
    rec._daysRemaining = U.daysRemaining(rec);
    rec._aging = U.aging(rec);
    rec._weighted = U.weightedValue(rec);
    return rec;
  };

  U.dueThisWeek = function (rec, dateField) {
    var d = U.parseDate(rec && rec[dateField || 'targetDate']);
    if (!d || U.isClosed(rec.status)) return false;
    var t = U.today();
    return d >= t && d <= U.addDays(t, 7);
  };

  U.isDueToday = function (rec) {
    if (!rec || U.isClosed(rec.status)) return false;
    var t = U.todayISO();
    return U.toISODate(rec.targetDate) === t || U.toISODate(rec.nextActionDate) === t;
  };

  U.needsManagement = function (rec) {
    if (!rec) return false;
    var flag = rec.managementSupportRequired;
    var yes = flag === true || /^(yes|required|y|true)$/i.test(String(flag || ''));
    var blocked = String(rec.status || '') === 'Blocked';
    var hasBlocker = !U.isBlank(rec.blocker);
    var critical = String(rec.priority || '') === 'Critical' && !U.isClosed(rec.status);
    return yes || blocked || hasBlocker || critical;
  };

  /** Entity-aware decoration: uses the derive mapping declared in schema.js. */
  U.deriveCfg = function (entityKey) {
    var e = LPM.schema && LPM.schema.entities && LPM.schema.entities[entityKey];
    var d = (e && e.derive) || {};
    return {
      target: d.target === undefined ? 'targetDate' : d.target,
      follow: d.follow === undefined ? 'nextActionDate' : d.follow,
      status: d.status === undefined ? 'status' : d.status,
      closed: d.closed || CLOSED_STATUSES
    };
  };

  U.statusOf = function (rec, cfg) {
    if (!rec) return '';
    var key = cfg && cfg.status;
    return key ? (rec[key] || '') : (rec.status || '');
  };

  U.isClosedFor = function (rec, cfg) {
    var st = String(U.statusOf(rec, cfg) || '');
    var list = (cfg && cfg.closed) || CLOSED_STATUSES;
    return list.indexOf(st) !== -1;
  };

  /**
   * Decorate a record with derived values for a given entity.
   * Sets _overdue, _followUpDue, _daysRemaining, _aging, _weighted, _status.
   */
  U.decorateFor = function (rec, entityKey) {
    if (!rec || typeof rec !== 'object') return rec;
    var cfg = U.deriveCfg(entityKey);
    var closed = U.isClosedFor(rec, cfg);
    var t = cfg.target ? U.parseDate(rec[cfg.target]) : null;
    var fdate = cfg.follow ? U.parseDate(rec[cfg.follow]) : null;
    var today = U.today();

    rec._status = U.statusOf(rec, cfg);
    rec._closed = closed;
    rec._overdue = !!(t && !closed && t < today);
    rec._followUpDue = !!(fdate && !closed && fdate <= today);
    rec._daysRemaining = t ? U.daysBetween(today, t) : null;
    rec._dueThisWeek = !!(t && !closed && t >= today && t <= U.addDays(today, 7));
    rec._dueToday = !!((t && +t === +today) || (fdate && +fdate === +today)) && !closed;
    rec._aging = U.aging(rec);
    rec._weighted = U.weightedValue(rec);
    rec._targetDate = cfg.target ? (rec[cfg.target] || '') : '';
    rec._followDate = cfg.follow ? (rec[cfg.follow] || '') : '';
    rec._entity = entityKey;
    return rec;
  };

  U.decorateAll = function (records, entityKey) {
    return (records || []).map(function (r) { return U.decorateFor(r, entityKey); });
  };

  /* ---------------- CSV ---------------- */

  U.csvEscape = function (v) {
    if (v === null || v === undefined) return '';
    var s = String(v);
    // Neutralise spreadsheet formula injection on export.
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  U.toCSV = function (rows, columns) {
    if (!rows || !rows.length) {
      return (columns || []).map(function (c) { return U.csvEscape(c.label || c.key); }).join(',') + '\n';
    }
    var cols = columns && columns.length ? columns : Object.keys(rows[0]).map(function (k) {
      return { key: k, label: k };
    });
    var out = [cols.map(function (c) { return U.csvEscape(c.label || c.key); }).join(',')];
    rows.forEach(function (r) {
      out.push(cols.map(function (c) {
        var v = typeof c.value === 'function' ? c.value(r) : r[c.key];
        if (v === true) v = 'Yes';
        if (v === false) v = 'No';
        return U.csvEscape(v);
      }).join(','));
    });
    return out.join('\n') + '\n';
  };

  /** Minimal RFC4180 CSV parser -> array of objects keyed by header row. */
  U.parseCSV = function (text) {
    var rows = [], row = [], field = '', inQuotes = false, i = 0;
    text = String(text || '').replace(/^﻿/, '');
    while (i < text.length) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
          inQuotes = false; i++; continue;
        }
        field += ch; i++; continue;
      }
      if (ch === '"') { inQuotes = true; i++; continue; }
      if (ch === ',') { row.push(field); field = ''; i++; continue; }
      if (ch === '\r') { i++; continue; }
      if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      field += ch; i++;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    var header = rows.shift().map(function (h) { return String(h).trim(); });
    return rows.filter(function (r) {
      return r.some(function (c) { return String(c).trim() !== ''; });
    }).map(function (r) {
      var o = {};
      header.forEach(function (h, idx) { o[h] = r[idx] === undefined ? '' : r[idx]; });
      return o;
    });
  };

  U.downloadFile = function (filename, content, mime) {
    try {
      var blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
      return true;
    } catch (e) {
      if (LPM.ui && LPM.ui.toast) LPM.ui.toast('Download failed: ' + e.message, 'error');
      return false;
    }
  };

  U.copyToClipboard = function (text) {
    return new Promise(function (resolve, reject) {
      if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(resolve).catch(function () { fallback(); });
      } else { fallback(); }
      function fallback() {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.setAttribute('readonly', '');
          ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          var ok = document.execCommand('copy');
          document.body.removeChild(ta);
          ok ? resolve() : reject(new Error('Clipboard blocked by the browser'));
        } catch (e) { reject(e); }
      }
    });
  };

  /* ---------------- Query string (deep links from KPI cards) ---------------- */

  U.getQuery = function () {
    var out = {};
    var q = window.location.search.replace(/^\?/, '');
    if (!q) return out;
    q.split('&').forEach(function (pair) {
      if (!pair) return;
      var idx = pair.indexOf('=');
      var k = decodeURIComponent(idx < 0 ? pair : pair.slice(0, idx));
      var v = idx < 0 ? '' : decodeURIComponent(pair.slice(idx + 1).replace(/\+/g, ' '));
      out[k] = v;
    });
    return out;
  };

  U.buildQuery = function (obj) {
    var parts = [];
    Object.keys(obj || {}).forEach(function (k) {
      if (U.isBlank(obj[k])) return;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]));
    });
    return parts.length ? '?' + parts.join('&') : '';
  };

  LPM.utils = U;
})(window);
