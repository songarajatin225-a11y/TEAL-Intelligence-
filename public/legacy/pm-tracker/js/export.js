/* ==========================================================================
   export.js — CSV / JSON export and import
   ========================================================================== */
(function (window) {
  'use strict';

  var LPM = window.LPM || (window.LPM = {});
  var U = LPM.utils, ui = LPM.ui;
  var ex = {};

  function stampName(base, ext) {
    return base + '_' + U.todayISO() + '.' + ext;
  }

  /* --------------------------- CSV columns --------------------------- */

  /** Every stored field for an entity, plus derived values. */
  function csvColumns(entityKey) {
    var cols = [
      { key: 'code', label: 'ID' },
      { key: 'dateAdded', label: 'Date Added' },
      { key: 'lastUpdated', label: 'Last Updated' }
    ];
    LPM.schema.fieldList(entityKey).forEach(function (f) {
      cols.push({ key: f.key, label: f.label });
    });
    var e = LPM.schema.entities[entityKey];
    if (e.derive && e.derive.target) {
      cols.push({ key: '_daysRemaining', label: 'Days Remaining' });
      cols.push({ key: '_overdue', label: 'Overdue', value: function (r) { return r._overdue ? 'Yes' : 'No'; } });
    }
    cols.push({ key: '_aging', label: 'Aging (days)' });
    cols.push({ key: '_followUpDue', label: 'Follow-up Due', value: function (r) { return r._followUpDue ? 'Yes' : 'No'; } });
    cols.push({ key: '_weighted', label: 'Weighted Opportunity Value' });
    cols.push({ key: 'isSample', label: 'Sample Record', value: function (r) { return r.isSample ? 'Yes' : 'No'; } });
    return cols;
  }

  ex.exportEntityCSV = function (entityKey, rows) {
    var e = LPM.schema.entities[entityKey];
    var work = rows ? Promise.resolve(rows) : LPM.db.getAllRecords(e.store);
    return work.then(function (data) {
      var decorated = U.decorateAll(U.deepClone(data), entityKey);
      var csv = U.toCSV(decorated, csvColumns(entityKey));
      var ok = U.downloadFile(stampName(entityKey, 'csv'), csv, 'text/csv');
      if (ok) ui.toast(decorated.length + ' ' + e.label.toLowerCase() + ' exported to CSV', 'success');
      return csv;
    }).catch(function (err) { ui.toast('CSV export failed: ' + err.message, 'error'); });
  };

  /** Simple table export used by Reports. */
  ex.exportRowsCSV = function (filename, rows, columns) {
    try {
      var csv = U.toCSV(rows, columns);
      if (U.downloadFile(filename, csv, 'text/csv')) {
        ui.toast('Exported ' + rows.length + ' rows', 'success');
      }
    } catch (err) { ui.toast('Export failed: ' + err.message, 'error'); }
  };

  /* --------------------------- JSON backup --------------------------- */

  ex.exportFullJSON = function () {
    return LPM.db.exportDatabase().then(function (payload) {
      var json = JSON.stringify(payload, null, 2);
      if (U.downloadFile(stampName('laser_pm_backup', 'json'), json, 'application/json')) {
        var n = LPM.db.DATA_STORES.reduce(function (acc, s) { return acc + (payload[s] || []).length; }, 0);
        ui.toast('Backup exported · ' + n + ' records', 'success');
      }
      return payload;
    }).catch(function (err) { ui.toast('Backup failed: ' + err.message, 'error'); });
  };

  ex.readFile = function (file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error('No file selected'));
      if (file.size > 25 * 1024 * 1024) return reject(new Error('File is larger than 25 MB'));
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('The file could not be read')); };
      reader.readAsText(file);
    });
  };

  /**
   * importJSONFile(file, mode) — validates first, asks for confirmation,
   * then writes. mode: 'replace' | 'merge'
   */
  ex.importJSONFile = function (file, mode) {
    return ex.readFile(file).then(function (text) {
      var payload;
      try { payload = JSON.parse(text); }
      catch (e) { throw new Error('The file is not valid JSON.'); }

      var check = LPM.db.validateImport(payload);
      if (!check.valid) throw new Error(check.errors.join(' '));

      var summary = Object.keys(check.counts).map(function (k) {
        return check.counts[k] + ' ' + k;
      }).join(', ');

      return ui.confirm({
        title: mode === 'merge' ? 'Merge backup into current data?' : 'Replace all data with this backup?',
        message: 'The file contains: ' + (summary || 'no records') + '.',
        detail: mode === 'merge'
          ? 'Existing records with the same ID will be overwritten; everything else is kept.'
          : 'All current records in those modules will be deleted first. This cannot be undone.',
        confirmLabel: mode === 'merge' ? 'Merge' : 'Replace all',
        danger: mode !== 'merge'
      }).then(function (ok) {
        if (!ok) return null;
        return LPM.db.importDatabase(payload, { mode: mode }).then(function (counts) {
          var total = Object.keys(counts).reduce(function (a, k) { return a + counts[k]; }, 0);
          ui.toast('Import complete · ' + total + ' records', 'success');
          return counts;
        });
      });
    }).catch(function (err) {
      ui.toast('Import failed: ' + err.message, 'error', 8000);
      throw err;
    });
  };

  /* ---------------------------- CSV import ---------------------------- */

  /** Map CSV header labels back to field keys for an entity. */
  function headerMap(entityKey) {
    var map = {};
    LPM.schema.fieldList(entityKey).forEach(function (f) {
      map[f.label.toLowerCase()] = f.key;
      map[f.key.toLowerCase()] = f.key;
    });
    map['id'] = 'code';
    map['date added'] = 'dateAdded';
    return map;
  }

  ex.importCSVFile = function (file, entityKey) {
    var e = LPM.schema.entities[entityKey];
    if (!e) return Promise.reject(new Error('Unknown module'));
    return ex.readFile(file).then(function (text) {
      var rows = U.parseCSV(text);
      if (!rows.length) throw new Error('The CSV file contains no data rows.');
      var map = headerMap(entityKey);
      var mappedHeaders = Object.keys(rows[0]).filter(function (h) { return map[h.toLowerCase()]; });
      if (!mappedHeaders.length) {
        throw new Error('No column headings matched the ' + e.label + ' fields. ' +
          'Export a CSV from this module first and use it as the template.');
      }
      var records = rows.map(function (row) {
        var rec = {};
        Object.keys(row).forEach(function (h) {
          var key = map[h.toLowerCase()];
          if (!key) return;
          var v = String(row[h]).trim();
          if (v !== '') rec[key] = v;
        });
        return rec;
      }).filter(function (r) { return Object.keys(r).length > 0; });

      if (!records.length) throw new Error('No usable rows were found.');

      return ui.confirm({
        title: 'Import ' + records.length + ' ' + e.label.toLowerCase() + '?',
        message: mappedHeaders.length + ' columns matched: ' + mappedHeaders.slice(0, 8).join(', ') +
          (mappedHeaders.length > 8 ? '…' : ''),
        detail: 'Rows are added as new records. Existing records are not modified.',
        confirmLabel: 'Import'
      }).then(function (ok) {
        if (!ok) return null;
        return LPM.db.getAllRecords(e.store).then(function (existing) {
          var all = existing.slice();
          records.forEach(function (r) {
            if (!r.code) r.code = U.nextCode(all, e.codePrefix);
            r.id = U.uid('rec');
            all.push(r);
          });
          return LPM.db.bulkAdd(e.store, records);
        }).then(function (n) {
          ui.toast(n + ' records imported into ' + e.label, 'success');
          return n;
        });
      });
    }).catch(function (err) {
      ui.toast('CSV import failed: ' + err.message, 'error', 8000);
      throw err;
    });
  };

  /* ------------------------- Sample data set ------------------------- */

  /** Resolve "@today", "@today+5", "@today-3" tokens into real dates. */
  function resolveDates(value) {
    if (typeof value === 'string') {
      var m = /^@today(?:([+-])(\d+))?$/.exec(value.trim());
      if (m) {
        var offset = m[1] ? (m[1] === '-' ? -Number(m[2]) : Number(m[2])) : 0;
        return U.toISODate(U.addDays(U.today(), offset));
      }
      return value;
    }
    if (Array.isArray(value)) return value.map(resolveDates);
    if (value && typeof value === 'object') {
      var out = {};
      Object.keys(value).forEach(function (k) { out[k] = resolveDates(value[k]); });
      return out;
    }
    return value;
  }

  ex.loadSampleData = function () {
    return fetch('data/sample-data.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function () {
        throw new Error('Could not load data/sample-data.json. ' +
          'When opening the app directly from the file system, browsers block local file reads — ' +
          'run a small static server (see the README) or deploy to GitHub Pages.');
      })
      .then(function (payload) {
        var stores = LPM.db.DATA_STORES.filter(function (s) { return Array.isArray(payload[s]); });
        return stores.reduce(function (chain, store) {
          return chain.then(function () {
            var rows = payload[store].map(function (r) {
              var rec = resolveDates(U.deepClone(r));
              rec.isSample = true;
              rec.id = rec.id || U.uid('sample');
              return rec;
            });
            return LPM.db.bulkAdd(store, rows);
          });
        }, Promise.resolve()).then(function () {
          var n = stores.reduce(function (a, s) { return a + payload[s].length; }, 0);
          return n;
        });
      });
  };

  ex.removeSampleData = function () {
    return LPM.db.getMany(LPM.db.DATA_STORES).then(function (data) {
      var ops = [];
      LPM.db.DATA_STORES.forEach(function (store) {
        var ids = (data[store] || []).filter(function (r) { return r.isSample; })
          .map(function (r) { return r.id; });
        if (ids.length) ops.push(LPM.db.deleteMany(store, ids));
      });
      var removed = LPM.db.DATA_STORES.reduce(function (a, s) {
        return a + (data[s] || []).filter(function (r) { return r.isSample; }).length;
      }, 0);
      return Promise.all(ops).then(function () { return removed; });
    });
  };

  LPM.exporter = ex;
})(window);
