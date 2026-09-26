/* ==========================================================================
   database.js — IndexedDB persistence layer
   The only module that knows about IndexedDB. Everything else talks to
   LPM.db.* so the storage engine can later be swapped (Supabase/Firebase)
   without touching the UI.
   ========================================================================== */
(function (window) {
  'use strict';

  var LPM = window.LPM || (window.LPM = {});
  var U = LPM.utils;

  var DB_NAME = 'laser_pm_tracker';
  var SCHEMA_VERSION = 1;

  /** Data stores. `settings` is keyed by `key`; everything else by `id`. */
  var STORES = {
    activities:    { key: 'id', indexes: ['status', 'priority', 'customer', 'workstream', 'targetDate', 'nextActionDate', 'owner'] },
    customers:     { key: 'id', indexes: ['company', 'customerType', 'opportunityStage', 'owner', 'nextInteraction'] },
    applications:  { key: 'id', indexes: ['application', 'industry', 'customer', 'applicationStatus', 'targetDate'] },
    products:      { key: 'id', indexes: ['partNumber', 'productFamily', 'manufacturer', 'status', 'laserType'] },
    localization:  { key: 'id', indexes: ['projectName', 'customer', 'currentStatus', 'owner', 'targetCompletion'] },
    samples:       { key: 'id', indexes: ['customer', 'sampleStatus', 'status', 'requiredDate', 'owner'] },
    meetings:      { key: 'id', indexes: ['meetingDate', 'customer', 'status', 'dueDate', 'owner'] },
    suppliers:     { key: 'id', indexes: ['company', 'partnerType', 'country', 'owner'] },
    competitors:   { key: 'id', indexes: ['competitor', 'company', 'threatLevel', 'date'] },
    dailyLogs:     { key: 'id', indexes: ['date'] },
    weeklyReviews: { key: 'id', indexes: ['weekStart'] },
    settings:      { key: 'key', indexes: [] }
  };

  var DATA_STORES = Object.keys(STORES).filter(function (s) { return s !== 'settings'; });

  var _db = null;
  var _opening = null;
  var listeners = [];

  function isSupported() {
    try { return !!window.indexedDB; } catch (e) { return false; }
  }

  function fail(msg, err) {
    var e = new Error(msg + (err && err.message ? ' (' + err.message + ')' : ''));
    e.cause = err;
    return e;
  }

  /* ---------------- Open / upgrade ---------------- */

  function initDB() {
    if (_db) return Promise.resolve(_db);
    if (_opening) return _opening;

    if (!isSupported()) {
      return Promise.reject(fail('IndexedDB is not available in this browser. ' +
        'Private/incognito mode or blocked site data can cause this.'));
    }

    _opening = new Promise(function (resolve, reject) {
      var req;
      try { req = window.indexedDB.open(DB_NAME, SCHEMA_VERSION); }
      catch (e) { _opening = null; return reject(fail('Could not open the local database', e)); }

      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        Object.keys(STORES).forEach(function (name) {
          var def = STORES[name];
          var store;
          if (!db.objectStoreNames.contains(name)) {
            store = db.createObjectStore(name, { keyPath: def.key });
          } else {
            store = ev.target.transaction.objectStore(name);
          }
          def.indexes.forEach(function (ix) {
            if (!store.indexNames.contains(ix)) {
              try { store.createIndex(ix, ix, { unique: false }); } catch (e) { /* index optional */ }
            }
          });
        });
      };

      req.onsuccess = function (ev) {
        _db = ev.target.result;
        _db.onversionchange = function () {
          try { _db.close(); } catch (e) {}
          _db = null;
          if (LPM.ui && LPM.ui.toast) {
            LPM.ui.toast('The database was upgraded in another tab. Please reload this page.', 'warning', 10000);
          }
        };
        resolve(_db);
      };

      req.onerror = function (ev) {
        _opening = null;
        reject(fail('Could not open the local database', ev.target.error));
      };
      req.onblocked = function () {
        _opening = null;
        reject(fail('The database is blocked by another open tab. Close other tabs and reload.'));
      };
    });

    return _opening;
  }

  function tx(storeNames, mode) {
    return initDB().then(function (db) {
      var names = Array.isArray(storeNames) ? storeNames : [storeNames];
      names.forEach(function (n) {
        if (!STORES[n]) throw fail('Unknown data store "' + n + '"');
      });
      return db.transaction(names, mode || 'readonly');
    });
  }

  function reqPromise(request) {
    return new Promise(function (resolve, reject) {
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(fail('Database operation failed', request.error)); };
    });
  }

  /* ---------------- Change notification ---------------- */

  function onChange(fn) {
    listeners.push(fn);
    return function () {
      var i = listeners.indexOf(fn);
      if (i >= 0) listeners.splice(i, 1);
    };
  }

  function emit(store, action, record) {
    listeners.slice().forEach(function (fn) {
      try { fn({ store: store, action: action, record: record }); } catch (e) { /* listener errors are non-fatal */ }
    });
    try {
      window.dispatchEvent(new CustomEvent('lpm:data-changed', {
        detail: { store: store, action: action }
      }));
    } catch (e) { /* older browsers */ }
  }

  /* ---------------- CRUD ---------------- */

  function stamp(record, isNew) {
    var now = new Date().toISOString();
    if (isNew) {
      if (!record.id) record.id = U.uid('rec');
      if (!record.createdAt) record.createdAt = now;
      if (!record.dateAdded) record.dateAdded = U.todayISO();
    }
    record.updatedAt = now;
    record.lastUpdated = U.todayISO();
    return record;
  }

  function addRecord(store, record) {
    if (!record || typeof record !== 'object') {
      return Promise.reject(fail('Cannot save an empty record'));
    }
    var rec = U.deepClone(record);
    if (store === 'settings') {
      if (!rec.key) return Promise.reject(fail('Settings entries need a key'));
    } else {
      stamp(rec, true);
    }
    return tx(store, 'readwrite').then(function (t) {
      return reqPromise(t.objectStore(store).add(rec)).then(function () {
        emit(store, 'add', rec);
        return rec;
      }).catch(function (e) {
        if (e.cause && e.cause.name === 'ConstraintError') {
          throw fail('A record with this ID already exists');
        }
        throw e;
      });
    });
  }

  function putRecord(store, record) {
    var rec = U.deepClone(record);
    if (store !== 'settings') stamp(rec, !rec.id);
    return tx(store, 'readwrite').then(function (t) {
      return reqPromise(t.objectStore(store).put(rec)).then(function () {
        emit(store, 'put', rec);
        return rec;
      });
    });
  }

  function updateRecord(store, record) {
    if (!record || (!record.id && !record.key)) {
      return Promise.reject(fail('Cannot update a record without an identifier'));
    }
    var keyVal = store === 'settings' ? record.key : record.id;
    return getRecord(store, keyVal).then(function (existing) {
      if (!existing) throw fail('Record not found — it may have been deleted');
      var merged = Object.assign({}, existing, U.deepClone(record));
      if (store !== 'settings') stamp(merged, false);
      return tx(store, 'readwrite').then(function (t) {
        return reqPromise(t.objectStore(store).put(merged)).then(function () {
          emit(store, 'update', merged);
          return merged;
        });
      });
    });
  }

  function getRecord(store, key) {
    if (key === undefined || key === null || key === '') return Promise.resolve(null);
    return tx(store).then(function (t) {
      return reqPromise(t.objectStore(store).get(key));
    }).then(function (r) { return r || null; });
  }

  function getAllRecords(store) {
    return tx(store).then(function (t) {
      return reqPromise(t.objectStore(store).getAll());
    }).then(function (rows) { return rows || []; });
  }

  /** Read several stores at once: getMany(['activities','customers']) -> {activities: [], ...} */
  function getMany(storeNames) {
    var names = storeNames && storeNames.length ? storeNames : DATA_STORES;
    return Promise.all(names.map(function (n) { return getAllRecords(n); }))
      .then(function (results) {
        var out = {};
        names.forEach(function (n, i) { out[n] = results[i]; });
        return out;
      });
  }

  function deleteRecord(store, key) {
    return tx(store, 'readwrite').then(function (t) {
      return reqPromise(t.objectStore(store).delete(key)).then(function () {
        emit(store, 'delete', { id: key });
        return true;
      });
    });
  }

  function deleteMany(store, keys) {
    return tx(store, 'readwrite').then(function (t) {
      var s = t.objectStore(store);
      return Promise.all((keys || []).map(function (k) { return reqPromise(s.delete(k)); }));
    }).then(function () { emit(store, 'delete-many', { count: (keys || []).length }); return true; });
  }

  function bulkAdd(store, records) {
    if (!records || !records.length) return Promise.resolve(0);
    return tx(store, 'readwrite').then(function (t) {
      var s = t.objectStore(store);
      var ops = records.map(function (r) {
        var rec = U.deepClone(r);
        if (store !== 'settings') stamp(rec, true);
        return reqPromise(s.put(rec));
      });
      return Promise.all(ops);
    }).then(function (r) {
      emit(store, 'bulk', { count: records.length });
      return r.length;
    });
  }

  function count(store) {
    return tx(store).then(function (t) { return reqPromise(t.objectStore(store).count()); });
  }

  /**
   * Case-insensitive substring search across a store.
   * `fields` limits which keys are searched; omit to search all string values.
   */
  function searchRecords(store, query, fields) {
    var q = String(query || '').trim().toLowerCase();
    return getAllRecords(store).then(function (rows) {
      if (!q) return rows;
      return rows.filter(function (r) { return matches(r, q, fields); });
    });
  }

  function matches(rec, lowerQuery, fields) {
    var keys = fields && fields.length ? fields : Object.keys(rec);
    for (var i = 0; i < keys.length; i++) {
      var v = rec[keys[i]];
      if (v === null || v === undefined) continue;
      if (typeof v === 'object') continue;
      if (String(v).toLowerCase().indexOf(lowerQuery) !== -1) return true;
    }
    return false;
  }

  /* ---------------- Settings helpers ---------------- */

  function getSetting(key, fallbackValue) {
    return getRecord('settings', key).then(function (r) {
      return r && r.value !== undefined ? r.value : fallbackValue;
    }).catch(function () { return fallbackValue; });
  }

  function setSetting(key, value) {
    return putRecord('settings', { key: key, value: value, updatedAt: new Date().toISOString() });
  }

  /* ---------------- Export / import / reset ---------------- */

  function exportDatabase() {
    return getMany(DATA_STORES).then(function (data) {
      return getAllRecords('settings').then(function (settings) {
        var safeSettings = settings.filter(function (s) { return s.key !== 'auth.credential'; });
        var payload = {
          app: 'Laser Applications PM Operating Tracker',
          schemaVersion: SCHEMA_VERSION,
          exportDate: new Date().toISOString()
        };
        DATA_STORES.forEach(function (s) { payload[s] = data[s] || []; });
        payload.settings = safeSettings;
        return payload;
      });
    });
  }

  /** Structural validation of an import payload before anything is written. */
  function validateImport(payload) {
    var errors = [];
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { valid: false, errors: ['The file does not contain a valid backup object.'], counts: {} };
    }
    if (payload.schemaVersion === undefined) {
      errors.push('Missing "schemaVersion" — this may not be a tracker backup.');
    } else if (Number(payload.schemaVersion) > SCHEMA_VERSION) {
      errors.push('Backup schema version ' + payload.schemaVersion +
        ' is newer than this app (v' + SCHEMA_VERSION + ').');
    }
    var known = Object.keys(STORES);
    var found = 0, counts = {};
    known.forEach(function (s) {
      if (payload[s] === undefined) return;
      if (!Array.isArray(payload[s])) { errors.push('"' + s + '" must be a list of records.'); return; }
      var bad = payload[s].filter(function (r) { return !r || typeof r !== 'object' || Array.isArray(r); });
      if (bad.length) errors.push('"' + s + '" contains ' + bad.length + ' invalid entries.');
      counts[s] = payload[s].length;
      found++;
    });
    if (!found) errors.push('No recognised data stores were found in the file.');
    return { valid: errors.length === 0, errors: errors, counts: counts };
  }

  /**
   * importDatabase(payload, { mode: 'replace' | 'merge' })
   * replace — wipe the data stores then load the file (default)
   * merge   — keep existing records, add/overwrite by id
   */
  function importDatabase(payload, options) {
    var opts = options || {};
    var check = validateImport(payload);
    if (!check.valid) return Promise.reject(fail('Import rejected: ' + check.errors.join(' ')));

    var mode = opts.mode === 'merge' ? 'merge' : 'replace';
    var storesInFile = Object.keys(STORES).filter(function (s) { return Array.isArray(payload[s]); });

    var prep = mode === 'replace' ? clearDatabase(storesInFile.filter(function (s) {
      return s !== 'settings';
    })) : Promise.resolve();

    return prep.then(function () {
      return storesInFile.reduce(function (chain, store) {
        return chain.then(function () {
          var rows = payload[store].map(function (r) {
            var rec = U.deepClone(r);
            if (store === 'settings') {
              if (!rec.key || rec.key === 'auth.credential') return null;
            } else if (!rec.id) {
              rec.id = U.uid('rec');
            }
            return rec;
          }).filter(Boolean);
          return bulkAdd(store, rows);
        });
      }, Promise.resolve());
    }).then(function () {
      emit('*', 'import', null);
      return check.counts;
    });
  }

  /** Wipe data stores (never touches `settings` unless asked explicitly). */
  function clearDatabase(storeNames) {
    var names = storeNames && storeNames.length ? storeNames : DATA_STORES;
    return tx(names, 'readwrite').then(function (t) {
      return Promise.all(names.map(function (n) { return reqPromise(t.objectStore(n).clear()); }));
    }).then(function () {
      emit('*', 'clear', null);
      return true;
    });
  }

  function deleteDatabaseFile() {
    return new Promise(function (resolve, reject) {
      if (_db) { try { _db.close(); } catch (e) {} _db = null; _opening = null; }
      var req = window.indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = function () { resolve(true); };
      req.onerror = function () { reject(fail('Could not delete the database')); };
      req.onblocked = function () { resolve(true); };
    });
  }

  LPM.db = {
    NAME: DB_NAME,
    SCHEMA_VERSION: SCHEMA_VERSION,
    STORES: STORES,
    DATA_STORES: DATA_STORES,
    isSupported: isSupported,
    initDB: initDB,
    addRecord: addRecord,
    putRecord: putRecord,
    getRecord: getRecord,
    getAllRecords: getAllRecords,
    getMany: getMany,
    updateRecord: updateRecord,
    deleteRecord: deleteRecord,
    deleteMany: deleteMany,
    bulkAdd: bulkAdd,
    count: count,
    searchRecords: searchRecords,
    getSetting: getSetting,
    setSetting: setSetting,
    exportDatabase: exportDatabase,
    validateImport: validateImport,
    importDatabase: importDatabase,
    clearDatabase: clearDatabase,
    deleteDatabaseFile: deleteDatabaseFile,
    onChange: onChange
  };
})(window);
