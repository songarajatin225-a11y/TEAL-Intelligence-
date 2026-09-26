/* ==========================================================================
   crud.js — generic record engine
   Builds list pages, forms, detail drawers and record actions from the
   declarations in schema.js. Every data module reuses this.
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM || (window.LPM = {});
  var U = LPM.utils, ui = LPM.ui;
  var crud = {};

  var state = null; // active list-page state

  /* Per-module extras (extra detail buttons / row actions), registered by
     the module scripts, e.g. LPM.crud.hooks.meetings = { detailButtons: fn }. */
  crud.hooks = {};

  /* ========================== FORM BUILDING ========================== */

  function defaultValue(field) {
    if (field.default === 'today') return U.todayISO();
    return field.default !== undefined ? field.default : '';
  }

  function collectDatalists(entityKey) {
    var needed = {};
    LPM.schema.fieldList(entityKey).forEach(function (f) {
      if (f.datalist) needed[f.datalist] = true;
    });
    var keys = Object.keys(needed);
    if (!keys.length) return Promise.resolve({});
    var stores = U.unique(keys.map(function (k) { return k.split('.')[0]; }));
    return LPM.db.getMany(stores).then(function (data) {
      var out = {};
      keys.forEach(function (k) {
        var parts = k.split('.');
        out[k] = U.unique((data[parts[0]] || []).map(function (r) { return r[parts[1]]; })).sort();
      });
      return out;
    }).catch(function () { return {}; });
  }

  function buildField(field, value, datalists) {
    var wrap = ui.el('div', { class: 'field' + (field.span === 2 ? ' full' : '') });
    var id = 'f_' + field.key;
    var label = ui.el('label', { for: id });
    label.textContent = field.label;
    if (field.required) label.innerHTML += '<span class="req" aria-hidden="true">*</span>';
    wrap.appendChild(label);

    var input;
    if (field.type === 'textarea') {
      input = ui.el('textarea', { id: id, name: field.key, rows: field.rows || 3 });
      input.value = value === null || value === undefined ? '' : String(value);
    } else if (field.type === 'select') {
      input = ui.el('select', { id: id, name: field.key });
      input.appendChild(ui.el('option', { value: '' }, '— Select —'));
      (field.options || []).forEach(function (o) {
        var opt = ui.el('option', { value: o });
        opt.textContent = o;
        input.appendChild(opt);
      });
      var v = value === null || value === undefined || value === '' ? '' : String(value);
      if (v && (field.options || []).indexOf(v) === -1) {
        var extra = ui.el('option', { value: v });
        extra.textContent = v + ' (custom)';
        input.appendChild(extra);
      }
      input.value = v;
    } else {
      var type = field.type === 'number' ? 'number'
        : field.type === 'date' ? 'date'
        : field.type === 'email' ? 'email'
        : field.type === 'tel' ? 'tel'
        : field.type === 'url' ? 'url' : 'text';
      input = ui.el('input', { type: type, id: id, name: field.key });
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      if (field.step) input.step = field.step;
      if (field.placeholder) input.placeholder = field.placeholder;
      input.value = value === null || value === undefined ? '' : String(value);

      if (field.datalist && datalists && datalists[field.datalist]) {
        var listId = 'dl_' + field.key;
        input.setAttribute('list', listId);
        var dl = ui.el('datalist', { id: listId });
        datalists[field.datalist].forEach(function (o) {
          if (U.isBlank(o)) return;
          dl.appendChild(ui.el('option', { value: o }));
        });
        wrap.appendChild(dl);
      }
    }
    if (field.required) input.setAttribute('required', 'required');
    input.setAttribute('data-field', field.key);
    wrap.appendChild(input);

    if (field.hint) wrap.appendChild(ui.el('div', { class: 'hint', text: field.hint }));
    wrap.appendChild(ui.el('div', { class: 'error-text', hidden: 'hidden' }));
    return wrap;
  }

  function buildForm(entityKey, record, datalists) {
    var e = LPM.schema.entities[entityKey];
    var form = ui.el('form', { class: 'form-grid', novalidate: 'novalidate', id: 'recordForm' });
    e.sections.forEach(function (s) {
      form.appendChild(ui.el('div', { class: 'fieldset-title', text: s.title }));
      s.fields.forEach(function (f) {
        var val = record && record[f.key] !== undefined && record[f.key] !== null && record[f.key] !== ''
          ? record[f.key] : defaultValue(f);
        form.appendChild(buildField(f, val, datalists));
      });
    });
    return form;
  }

  function readForm(entityKey, form) {
    var out = {};
    LPM.schema.fieldList(entityKey).forEach(function (f) {
      var el = form.querySelector('[data-field="' + f.key + '"]');
      if (!el) return;
      var v = el.value;
      if (typeof v === 'string') v = v.trim();
      if (f.type === 'number') {
        var n = U.toNumber(v);
        out[f.key] = (v === '' || n === null) ? '' : n;
      } else {
        out[f.key] = v;
      }
    });
    return out;
  }

  function validateForm(entityKey, form, values) {
    var errors = [];
    ui.qsa('.error-text', form).forEach(function (n) { n.hidden = true; n.textContent = ''; });
    ui.qsa('[data-field]', form).forEach(function (n) { n.removeAttribute('aria-invalid'); });

    function setError(key, msg) {
      var el = form.querySelector('[data-field="' + key + '"]');
      if (el) {
        el.setAttribute('aria-invalid', 'true');
        var box = el.parentNode.querySelector('.error-text');
        if (box) { box.hidden = false; box.textContent = msg; }
      }
      errors.push(msg);
    }

    LPM.schema.fieldList(entityKey).forEach(function (f) {
      var v = values[f.key];
      if (f.required && U.isBlank(v)) { setError(f.key, f.label + ' is required.'); return; }
      if (U.isBlank(v)) return;
      if (f.type === 'date' && !U.parseDate(v)) setError(f.key, f.label + ' is not a valid date.');
      if (f.type === 'number') {
        var n = U.toNumber(v);
        if (n === null) setError(f.key, f.label + ' must be a number.');
        else {
          if (f.min !== undefined && n < Number(f.min)) setError(f.key, f.label + ' cannot be below ' + f.min + '.');
          if (f.max !== undefined && n > Number(f.max)) setError(f.key, f.label + ' cannot exceed ' + f.max + '.');
        }
      }
      if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
        setError(f.key, 'Enter a valid email address.');
      }
      if (f.type === 'url' && !/^https?:\/\/\S+$/i.test(String(v))) {
        setError(f.key, 'Links must start with http:// or https://');
      }
    });

    // Cross-field sanity: start must not be after target.
    var startD = U.parseDate(values.startDate), targetD = U.parseDate(values.targetDate);
    if (startD && targetD && startD > targetD) setError('targetDate', 'Target date is before the start date.');

    return errors;
  }

  /* ======================= DUPLICATE DETECTION ======================= */

  function duplicateCheck(entityKey, values, currentId) {
    var e = LPM.schema.entities[entityKey];
    var keyField = e.titleField;
    var val = String(values[keyField] || '').trim().toLowerCase();
    if (!val) return Promise.resolve(null);
    return LPM.db.getAllRecords(e.store).then(function (rows) {
      var hit = rows.filter(function (r) {
        return r.id !== currentId &&
          String(r[keyField] || '').trim().toLowerCase() === val &&
          String(r.customer || '').trim().toLowerCase() === String(values.customer || '').trim().toLowerCase();
      });
      return hit.length ? hit[0] : null;
    }).catch(function () { return null; });
  }

  /* ========================== RECORD MODAL ========================== */

  /**
   * openRecordModal({ entity, record, preset, onSaved })
   */
  crud.openRecordModal = function (opts) {
    var entityKey = opts.entity;
    var e = LPM.schema.entities[entityKey];
    if (!e) { ui.toast('Unknown module: ' + entityKey, 'error'); return; }
    var isEdit = !!(opts.record && opts.record.id);
    var base = Object.assign({}, opts.preset || {}, opts.record || {});

    var holder = ui.el('div', {});
    holder.appendChild(ui.loadingState('Preparing form…'));

    var modal = ui.modal({
      title: (isEdit ? 'Edit ' : 'New ') + e.singular,
      size: 'lg',
      body: holder,
      buttons: [
        { label: 'Cancel', class: 'btn--ghost' },
        { label: isEdit ? 'Save changes' : 'Create ' + e.singular, class: 'btn--primary', icon: 'check',
          onClick: function () { submit(); } }
      ]
    });

    var form = null;
    collectDatalists(entityKey).then(function (datalists) {
      ui.clear(holder);
      form = buildForm(entityKey, base, datalists);
      form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(); });
      form.addEventListener('keydown', function (ev) {
        if ((ev.ctrlKey || ev.metaKey) && ev.key === 'Enter') { ev.preventDefault(); submit(); }
      });
      holder.appendChild(form);
      var first = form.querySelector('[data-field]');
      if (first) first.focus();
    }).catch(function (err) {
      ui.clear(holder);
      holder.appendChild(ui.errorState('Could not build the form: ' + err.message));
    });

    function submit() {
      if (!form) return;
      var values = readForm(entityKey, form);
      var errors = validateForm(entityKey, form, values);
      if (errors.length) {
        ui.toast(errors[0], 'error');
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      save(values, false);
    }

    function save(values, skipDupCheck) {
      var work = skipDupCheck ? Promise.resolve(null)
        : duplicateCheck(entityKey, values, opts.record && opts.record.id);
      work.then(function (dup) {
        if (dup) {
          return ui.confirm({
            title: 'Possible duplicate',
            message: 'Another ' + e.singular.toLowerCase() + ' with the same name and customer ' +
              'already exists' + (dup.code ? ' (' + dup.code + ')' : '') + '.',
            detail: 'Save anyway, or cancel and edit the existing record instead.',
            confirmLabel: 'Save anyway'
          }).then(function (ok) { if (ok) persist(values); });
        }
        return persist(values);
      });
    }

    function persist(values) {
      var rec = Object.assign({}, opts.record || {}, values);
      if (opts.record && opts.record.id) rec.id = opts.record.id;
      var ready;
      if (!rec.code) {
        ready = LPM.db.getAllRecords(e.store).then(function (rows) {
          rec.code = U.nextCode(rows, e.codePrefix);
        });
      } else { ready = Promise.resolve(); }

      return ready.then(function () {
        return isEdit ? LPM.db.updateRecord(e.store, rec) : LPM.db.addRecord(e.store, rec);
      }).then(function (saved) {
        modal.close();
        ui.toast(e.singular + ' ' + (isEdit ? 'updated' : 'created') + ' · ' + (saved.code || ''), 'success');
        if (opts.onSaved) opts.onSaved(saved);
      }).catch(function (err) {
        ui.toast('Save failed: ' + err.message, 'error');
      });
    }

    return modal;
  };

  /* ========================== DETAIL DRAWER ========================== */

  var RELATED = {
    customers: [
      { store: 'activities', label: 'Activities', match: 'customer' },
      { store: 'meetings', label: 'Meetings', match: 'customer' },
      { store: 'samples', label: 'Samples / Trials', match: 'customer' },
      { store: 'applications', label: 'Applications', match: 'customer' },
      { store: 'localization', label: 'Localization Projects', match: 'customer' }
    ],
    applications: [
      { store: 'activities', label: 'Activities', match: 'application' },
      { store: 'samples', label: 'Samples / Trials', match: 'application' }
    ],
    localization: [{ store: 'activities', label: 'Activities', match: 'customer' }],
    suppliers: [{ store: 'samples', label: 'Samples supplied', match: 'supplier', field: 'supplier' }],
    products: [{ store: 'samples', label: 'Samples', match: 'partNumber', field: 'partNumber' }]
  };

  function relatedFor(entityKey, record) {
    var defs = RELATED[entityKey];
    if (!defs) return Promise.resolve([]);
    var e = LPM.schema.entities[entityKey];
    var value = String(record[e.titleField] || '').trim().toLowerCase();
    if (!value) return Promise.resolve([]);
    return LPM.db.getMany(defs.map(function (d) { return d.store; })).then(function (data) {
      return defs.map(function (d) {
        var field = d.field || d.match;
        var rows = (data[d.store] || []).filter(function (r) {
          return String(r[field] || '').trim().toLowerCase() === value;
        });
        return { label: d.label, store: d.store, rows: rows };
      }).filter(function (g) { return g.rows.length; });
    }).catch(function () { return []; });
  }

  crud.openDetail = function (entityKey, record, callbacks) {
    var e = LPM.schema.entities[entityKey];
    U.decorateFor(record, entityKey);
    var body = ui.el('div', {});

    /* Derived metrics strip */
    var metrics = [];
    if (record._targetDate) {
      metrics.push({ label: 'Target', value: U.formatDate(record._targetDate) });
      metrics.push({ label: 'Days Remaining',
        html: record._daysRemaining === null ? '—'
          : '<span class="' + (record._daysRemaining < 0 ? 'text-danger bold' : 'bold') + '">' +
            U.escapeHtml(U.dueLabel(record._daysRemaining)) + '</span>' });
    }
    metrics.push({ label: 'Aging', value: record._aging === null ? '—' : record._aging + ' days' });
    if (record._weighted !== null && record._weighted !== undefined) {
      metrics.push({ label: 'Weighted Value', value: U.formatValue(record._weighted) });
    }
    metrics.push({ label: 'Follow-up Due', html: record._followUpDue
      ? '<span class="badge badge--warning">Yes</span>' : '<span class="muted">No</span>' });
    metrics.push({ label: 'Overdue', html: record._overdue
      ? '<span class="badge badge--danger">Yes</span>' : '<span class="muted">No</span>' });

    var head = ui.el('div', { class: 'card mb-4' });
    var headBody = ui.el('div', { class: 'card__body' });
    headBody.innerHTML = '<div class="row row--tight mb-3">' +
      (record.code ? '<span class="mono muted">' + U.escapeHtml(record.code) + '</span>' : '') +
      (record._status ? ui.badge(record._status) : '') +
      (record.priority ? ui.badge(record.priority) : '') +
      (record.isSample ? '<span class="badge badge--neutral">Sample data</span>' : '') +
      '</div>';
    headBody.appendChild(ui.detailGrid([{ items: metrics.map(function (m) {
      return { label: m.label, value: m.value, html: m.html, always: true };
    }) }]));
    head.appendChild(headBody);
    body.appendChild(head);

    if (e.pipeline) {
      var pl = ui.el('div', { class: 'card mb-4' });
      pl.innerHTML = '<div class="card__head"><span class="card__title">Pipeline</span></div>' +
        '<div class="card__body">' + ui.pipeline(e.pipeline.stages, record[e.pipeline.field]) + '</div>';
      body.appendChild(pl);
    }

    /* All fields, grouped by section */
    var groups = e.sections.map(function (s) {
      return {
        title: s.title,
        items: s.fields.map(function (f) {
          var v = record[f.key];
          var item = { label: f.label, value: v, span: f.span === 2 ? 2 : 1 };
          if (f.type === 'date') item.value = U.formatDate(v);
          if (f.type === 'number') item.value = U.isBlank(v) ? '' : U.formatNumber(v);
          if (f.type === 'url' && !U.isBlank(v)) {
            item.html = '<a href="' + U.escapeHtml(v) + '" target="_blank" rel="noopener noreferrer">' +
              U.escapeHtml(U.truncate(v, 60)) + '</a>';
          }
          if (f.type === 'select' && !U.isBlank(v)) item.html = ui.badge(v);
          if (f.type === 'email' && !U.isBlank(v)) {
            item.html = '<a href="mailto:' + U.escapeHtml(v) + '">' + U.escapeHtml(v) + '</a>';
          }
          return item;
        })
      };
    });
    groups.push({ title: 'Record', items: [
      { label: 'Date Added', value: U.formatDate(record.dateAdded), always: true },
      { label: 'Last Updated', value: U.formatDateTime(record.updatedAt) || U.formatDate(record.lastUpdated), always: true }
    ] });
    body.appendChild(ui.detailGrid(groups));

    var relatedHost = ui.el('div', { class: 'mt-5' });
    body.appendChild(relatedHost);

    var hook = crud.hooks[entityKey] || {};
    var extraButtons = hook.detailButtons
      ? hook.detailButtons(record, { reload: callbacks && callbacks.onChanged }) || []
      : [];

    var drawer = ui.drawer({
      title: record[e.titleField] || record.code || e.singular,
      subtitle: (e.subtitleFields || []).map(function (k) { return record[k]; })
        .filter(function (v) { return !U.isBlank(v); }).join(' · '),
      body: body,
      buttons: extraButtons.concat([
        { label: 'Duplicate', icon: 'copy', class: 'btn--ghost', onClick: function (api) {
          api.close();
          crud.duplicate(entityKey, record, callbacks && callbacks.onChanged);
        } },
        { label: 'Delete', icon: 'trash', class: 'btn--ghost', onClick: function (api) {
          crud.deleteRecord(entityKey, record, function () {
            api.close();
            if (callbacks && callbacks.onChanged) callbacks.onChanged();
          });
        } },
        { label: 'Edit', icon: 'edit', class: 'btn--primary', onClick: function (api) {
          api.close();
          crud.openRecordModal({
            entity: entityKey, record: record,
            onSaved: function () { if (callbacks && callbacks.onChanged) callbacks.onChanged(); }
          });
        } }
      ])
    });

    relatedFor(entityKey, record).then(function (groupsRel) {
      if (!groupsRel.length) return;
      groupsRel.forEach(function (g) {
        var card = ui.el('div', { class: 'card mb-4' });
        card.innerHTML = '<div class="card__head"><span class="card__title">' +
          U.escapeHtml(g.label) + '</span><span class="card__hint">' + g.rows.length + '</span></div>';
        var cb = ui.el('div', { class: 'card__body' });
        var list = ui.el('div', { class: 'related-list' });
        var relEntity = LPM.schema.entities[g.store];
        g.rows.slice(0, 8).forEach(function (r) {
          U.decorateFor(r, g.store);
          var item = ui.el('div', { class: 'related-item', tabindex: '0', role: 'button' });
          item.innerHTML = '<span style="min-width:0"><span class="bold">' +
            U.escapeHtml(U.truncate(r[relEntity.titleField] || r.code || '(untitled)', 46)) + '</span>' +
            '<div class="xsmall muted">' + U.escapeHtml(r.code || '') +
            (r._targetDate ? ' · ' + U.escapeHtml(U.formatDate(r._targetDate)) : '') + '</div></span>' +
            (r._status ? ui.badge(r._status) : '');
          function open() { drawer.close(); LPM.app.openRecord(g.store, r.id); }
          item.addEventListener('click', open);
          item.addEventListener('keydown', function (ev) {
            if (ev.key === 'Enter') { ev.preventDefault(); open(); }
          });
          list.appendChild(item);
        });
        cb.appendChild(list);
        card.appendChild(cb);
        relatedHost.appendChild(card);
      });
    });

    return drawer;
  };

  /* ========================== RECORD ACTIONS ========================== */

  crud.duplicate = function (entityKey, record, onDone) {
    var e = LPM.schema.entities[entityKey];
    var copy = U.deepClone(record);
    delete copy.id; delete copy.code; delete copy.createdAt; delete copy.updatedAt;
    copy.isSample = false;
    var titleKey = e.titleField;
    if (copy[titleKey]) copy[titleKey] = String(copy[titleKey]) + ' (copy)';
    crud.openRecordModal({
      entity: entityKey, preset: copy,
      onSaved: function () { if (onDone) onDone(); }
    });
  };

  crud.deleteRecord = function (entityKey, record, onDone) {
    var e = LPM.schema.entities[entityKey];
    ui.confirm({
      title: 'Delete ' + e.singular.toLowerCase() + '?',
      message: '“' + U.truncate(record[e.titleField] || record.code || 'this record', 60) + '” will be removed.',
      detail: 'This cannot be undone. Export a backup first if you may need it.',
      confirmLabel: 'Delete', danger: true
    }).then(function (ok) {
      if (!ok) return;
      LPM.db.deleteRecord(e.store, record.id).then(function () {
        ui.toast(e.singular + ' deleted', 'success');
        if (onDone) onDone();
      }).catch(function (err) { ui.toast('Delete failed: ' + err.message, 'error'); });
    });
  };

  /* ============================ LIST PAGE ============================ */

  var SPECIAL_FILTERS = {
    overdue: { label: 'Overdue', test: function (r) { return r._overdue; } },
    today: { label: 'Due today', test: function (r) { return r._dueToday; } },
    week: { label: 'Due this week', test: function (r) { return r._dueThisWeek; } },
    followup: { label: 'Follow-up due', test: function (r) { return r._followUpDue; } },
    critical: { label: 'Critical priority', test: function (r) { return r.priority === 'Critical' && !r._closed; } },
    management: { label: 'Needs management attention', test: function (r) { return U.needsManagement(r); } },
    open: { label: 'Open items', test: function (r) { return !r._closed; } },
    blocked: { label: 'Blocked', test: function (r) { return r._status === 'Blocked' || !U.isBlank(r.blocker); } },
    sample: { label: 'Sample data', test: function (r) { return !!r.isSample; } }
  };

  function filterDefs(entityKey, rows) {
    var e = LPM.schema.entities[entityKey];
    var fmap = LPM.schema.fieldMap(entityKey);
    return (e.filters || []).map(function (key) {
      if (key === 'dateRange') return { key: 'dateRange', type: 'dateRange', label: 'Date range' };
      var field = fmap[key];
      var options;
      if (field && field.type === 'select') {
        options = field.options.slice();
        // include values present in data that are not in the vocabulary
        options = U.unique(options.concat(rows.map(function (r) { return r[key]; })));
      } else {
        options = U.unique(rows.map(function (r) { return r[key]; })).sort();
      }
      return {
        key: key, type: 'select',
        label: field ? field.label : U.titleCase(key.replace(/([A-Z])/g, ' $1')),
        options: options
      };
    });
  }

  function applyFilters(rows, s) {
    var q = String(s.search || '').trim().toLowerCase();
    var e = LPM.schema.entities[s.entity];
    var dateField = e.dateFilterField || (e.derive && e.derive.target) || 'targetDate';

    return rows.filter(function (r) {
      if (q) {
        var hit = e.searchFields.some(function (fk) {
          var v = r[fk];
          return v !== null && v !== undefined && String(v).toLowerCase().indexOf(q) !== -1;
        });
        if (!hit) return false;
      }
      var okSelects = Object.keys(s.filters).every(function (k) {
        var v = s.filters[k];
        if (U.isBlank(v)) return true;
        return String(r[k] || '') === String(v);
      });
      if (!okSelects) return false;

      if (s.dateFrom || s.dateTo) {
        if (!U.inRange(r[dateField], s.dateFrom, s.dateTo)) return false;
      }
      if (s.special && SPECIAL_FILTERS[s.special] && !SPECIAL_FILTERS[s.special].test(r)) return false;
      return true;
    });
  }

  function buildFilterBar(s, defs) {
    var bar = ui.el('div', { class: 'filter-bar' });

    var searchWrap = ui.el('div', { class: 'field-search' });
    searchWrap.innerHTML = '<label class="sr-only" for="listSearch">Search records</label>';
    var searchInput = ui.el('input', {
      type: 'search', id: 'listSearch', placeholder: 'Search ' + LPM.schema.entities[s.entity].label.toLowerCase() + '…',
      value: s.search || '', autocomplete: 'off'
    });
    searchInput.addEventListener('input', U.debounce(function () {
      s.search = searchInput.value; s.page = 1; render();
    }, 200));
    searchWrap.appendChild(searchInput);
    bar.appendChild(searchWrap);

    defs.forEach(function (d) {
      if (d.type === 'dateRange') {
        ['dateFrom', 'dateTo'].forEach(function (k, i) {
          var inp = ui.el('input', {
            type: 'date', value: s[k] || '',
            'aria-label': i === 0 ? 'From date' : 'To date',
            title: (i === 0 ? 'From ' : 'To ') + d.label
          });
          inp.addEventListener('change', function () { s[k] = inp.value; s.page = 1; render(); });
          bar.appendChild(inp);
        });
        return;
      }
      var sel = ui.el('select', { 'aria-label': 'Filter by ' + d.label });
      sel.appendChild(ui.el('option', { value: '' }, 'All ' + d.label.toLowerCase()));
      d.options.forEach(function (o) {
        if (U.isBlank(o)) return;
        var opt = ui.el('option', { value: o });
        opt.textContent = o;
        sel.appendChild(opt);
      });
      sel.value = s.filters[d.key] || '';
      sel.addEventListener('change', function () {
        s.filters[d.key] = sel.value; s.page = 1; render();
      });
      bar.appendChild(sel);
    });

    var specialSel = ui.el('select', { 'aria-label': 'Quick view' });
    specialSel.appendChild(ui.el('option', { value: '' }, 'All records'));
    Object.keys(SPECIAL_FILTERS).forEach(function (k) {
      var o = ui.el('option', { value: k });
      o.textContent = SPECIAL_FILTERS[k].label;
      specialSel.appendChild(o);
    });
    specialSel.value = s.special || '';
    specialSel.addEventListener('change', function () {
      s.special = specialSel.value; s.page = 1; render();
    });
    bar.appendChild(specialSel);

    var clear = ui.el('button', { type: 'button', class: 'btn btn--sm btn--ghost' },
      ui.icon('close') + '<span>Clear</span>');
    clear.addEventListener('click', function () {
      s.search = ''; s.filters = {}; s.dateFrom = ''; s.dateTo = ''; s.special = ''; s.page = 1;
      render();
    });
    bar.appendChild(clear);

    return bar;
  }

  function render() {
    var s = state;
    if (!s) return;
    var e = LPM.schema.entities[s.entity];
    var decorated = U.decorateAll(s.rows, s.entity);
    var filtered = applyFilters(decorated, s);
    var sorted = U.sortBy(filtered, s.sort.key, s.sort.dir);

    var size = s.pageSize;
    var pages = Math.max(1, Math.ceil(sorted.length / size));
    if (s.page > pages) s.page = pages;
    var pageRows = sorted.slice((s.page - 1) * size, s.page * size);
    s.filteredRows = sorted;

    ui.clear(s.filterHost);
    s.filterHost.appendChild(buildFilterBar(s, filterDefs(s.entity, decorated)));

    ui.renderTable(s.tableHost, {
      columns: s.columns,
      rows: pageRows,
      sort: s.sort,
      onSort: function (key) {
        if (s.sort.key === key) s.sort.dir = s.sort.dir === 'asc' ? 'desc' : 'asc';
        else { s.sort.key = key; s.sort.dir = 'asc'; }
        render();
      },
      onRowClick: function (r) { crud.openDetail(s.entity, r, { onChanged: reload }); },
      rowActions: ((crud.hooks[s.entity] || {}).rowActions || []).map(function (a) {
        return { label: a.label, icon: a.icon, when: a.when,
          onClick: function (r) { a.onClick(r, reload); } };
      }).concat([
        { label: 'Edit', icon: 'edit', onClick: function (r) {
          crud.openRecordModal({ entity: s.entity, record: r, onSaved: reload });
        } },
        { label: 'Duplicate', icon: 'copy', onClick: function (r) { crud.duplicate(s.entity, r, reload); } },
        { label: 'Delete', icon: 'trash', onClick: function (r) { crud.deleteRecord(s.entity, r, reload); } }
      ]),
      emptyState: {
        title: s.rows.length ? 'No records match these filters' : 'No ' + e.label.toLowerCase() + ' yet',
        text: s.rows.length
          ? 'Adjust or clear the filters to see more records.'
          : 'Create the first ' + e.singular.toLowerCase() + ' to start tracking.',
        actionLabel: s.rows.length ? null : 'New ' + e.singular,
        onAction: s.rows.length ? null : function () { crud.newRecord(); }
      }
    });

    ui.clear(s.footHost);
    if (sorted.length) {
      s.footHost.appendChild(ui.pagination({
        total: sorted.length, page: s.page, size: size,
        onPage: function (p) { s.page = p; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      }));
    }

    if (s.countHost) {
      s.countHost.textContent = sorted.length + ' of ' + s.rows.length + ' records';
    }
    if (s.onRendered) s.onRendered(sorted, decorated);
  }

  function reload() {
    var s = state;
    if (!s) return Promise.resolve();
    return LPM.db.getAllRecords(LPM.schema.entities[s.entity].store).then(function (rows) {
      s.rows = rows;
      render();
      LPM.app.loadNotifications();
      LPM.app.updateRecordCount();
    }).catch(function (err) {
      ui.clear(s.tableHost);
      s.tableHost.appendChild(ui.errorState('Could not load records: ' + err.message, reload));
    });
  }

  crud.newRecord = function (preset) {
    if (!state) return;
    crud.openRecordModal({ entity: state.entity, preset: preset, onSaved: reload });
  };

  crud.focusRecord = function (id) {
    if (!state) return;
    var rec = (state.rows || []).filter(function (r) { return r.id === id; })[0];
    if (rec) crud.openDetail(state.entity, rec, { onChanged: reload });
    else ui.toast('That record no longer exists', 'warning');
  };

  crud.currentRows = function () { return state ? state.filteredRows || [] : []; };
  crud.reload = reload;

  /**
   * listPage({ entity, root, extraActions, onRendered })
   * Builds the whole page body: header, filter bar, table, pagination.
   */
  crud.listPage = function (opts) {
    var entityKey = opts.entity;
    var e = LPM.schema.entities[entityKey];
    var root = opts.root || document.getElementById('pageRoot');
    var q = U.getQuery();

    var prefs = LPM.auth.getPrefs();
    state = {
      entity: entityKey,
      rows: [],
      filteredRows: [],
      search: q.q || '',
      filters: {},
      dateFrom: q.from || '',
      dateTo: q.to || '',
      special: q.filter || '',
      page: 1,
      pageSize: Number(prefs.pageSize) || 25,
      sort: { key: (e.defaultSort && e.defaultSort.key) || 'code',
        dir: (e.defaultSort && e.defaultSort.dir) || 'asc' },
      columns: opts.columns || e.columns,
      onRendered: opts.onRendered
    };
    // Query parameters may preset any select filter, e.g. ?status=Blocked
    (e.filters || []).forEach(function (k) { if (q[k]) state.filters[k] = q[k]; });
    if (q.sort) state.sort.key = q.sort;

    ui.clear(root);

    var head = ui.el('div', { class: 'page__head' });
    head.innerHTML =
      '<div><h1 class="page__title" data-page-title>' + U.escapeHtml(e.label) + '</h1>' +
      '<div class="page__subtitle"><span data-count>—</span>' +
      (state.special && SPECIAL_FILTERS[state.special]
        ? ' · filtered: ' + U.escapeHtml(SPECIAL_FILTERS[state.special].label) : '') +
      '</div></div>';
    var actions = ui.el('div', { class: 'page__actions' });

    (opts.extraActions || []).forEach(function (a) {
      var b = ui.el('button', { type: 'button', class: 'btn ' + (a.class || '') },
        ui.icon(a.icon || 'file') + '<span>' + U.escapeHtml(a.label) + '</span>');
      b.addEventListener('click', function () { a.onClick(state); });
      actions.appendChild(b);
    });

    var exportBtn = ui.el('button', { type: 'button', class: 'btn' },
      ui.icon('download') + '<span>Export CSV</span>');
    exportBtn.addEventListener('click', function () {
      LPM.exporter.exportEntityCSV(entityKey, state.filteredRows);
    });
    actions.appendChild(exportBtn);

    var addBtn = ui.el('button', { type: 'button', class: 'btn btn--primary' },
      ui.icon('plus') + '<span>New ' + U.escapeHtml(e.singular) + '</span>');
    addBtn.addEventListener('click', function () { crud.newRecord(); });
    actions.appendChild(addBtn);

    head.appendChild(actions);
    root.appendChild(head);

    if (opts.beforeTable) root.appendChild(opts.beforeTable);

    var card = ui.el('div', { class: 'card' });
    state.filterHost = ui.el('div', {});
    state.tableHost = ui.el('div', { class: 'card__body card__body--flush' });
    state.footHost = ui.el('div', {});
    card.appendChild(state.filterHost);
    card.appendChild(state.tableHost);
    card.appendChild(state.footHost);
    root.appendChild(card);

    state.countHost = head.querySelector('[data-count]');
    ui.setLoading(state.tableHost, 'Loading records…');

    LPM.app.onDataChanged = function (changedEntity) {
      if (changedEntity === entityKey) reload();
    };

    return reload().then(function () {
      if (q.focus) crud.focusRecord(q.focus);
      if (q.new === '1') crud.newRecord();
    });
  };

  crud.SPECIAL_FILTERS = SPECIAL_FILTERS;
  crud.buildForm = buildForm;
  crud.readForm = readForm;
  crud.validateForm = validateForm;

  LPM.crud = crud;
})(window, document);
