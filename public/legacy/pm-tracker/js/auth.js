/* ==========================================================================
   auth.js — local browser authentication
   Passwords are never stored: only a PBKDF2-SHA256 hash with a random salt,
   kept in IndexedDB. Session metadata lives in local/sessionStorage.

   NOTE: this protects the application interface and the local browser data
   on this device. It is NOT a server-side security boundary.
   ========================================================================== */
(function (window) {
  'use strict';

  var LPM = window.LPM || (window.LPM = {});
  var U = LPM.utils;

  var CRED_KEY = 'auth.credential';
  var SESSION_KEY = 'lpm.session';
  var PREFS_KEY = 'lpm.prefs';

  var PBKDF2_ITERATIONS = 210000;
  var SALT_BYTES = 16;
  var KEY_BITS = 256;

  var DEFAULT_PREFS = {
    theme: 'system',
    inactivityMinutes: 30,
    rememberDays: 30,
    currency: 'USD',
    pageSize: 25,
    dashboardChart: true
  };

  /* ---------------- Preferences (localStorage) ---------------- */

  function getPrefs() {
    var p = {};
    try { p = JSON.parse(window.localStorage.getItem(PREFS_KEY) || '{}') || {}; }
    catch (e) { p = {}; }
    return Object.assign({}, DEFAULT_PREFS, p);
  }

  function setPrefs(patch) {
    var next = Object.assign(getPrefs(), patch || {});
    try { window.localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch (e) { /* storage full/blocked */ }
    LPM.prefs = next;
    return next;
  }

  LPM.prefs = getPrefs();

  /* ---------------- Crypto helpers ---------------- */

  function cryptoAvailable() {
    return !!(window.crypto && window.crypto.subtle && window.crypto.getRandomValues);
  }

  function bytesToB64(buf) {
    var bytes = new Uint8Array(buf), bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return window.btoa(bin);
  }

  function b64ToBytes(b64) {
    var bin = window.atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function randomBytes(n) {
    var a = new Uint8Array(n);
    window.crypto.getRandomValues(a);
    return a;
  }

  function derive(password, saltBytes, iterations) {
    if (!cryptoAvailable()) {
      return Promise.reject(new Error(
        'Secure password hashing is unavailable. Open the app over HTTPS or from localhost.'));
    }
    var enc = new TextEncoder();
    return window.crypto.subtle
      .importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits'])
      .then(function (key) {
        return window.crypto.subtle.deriveBits({
          name: 'PBKDF2', salt: saltBytes, iterations: iterations, hash: 'SHA-256'
        }, key, KEY_BITS);
      })
      .then(function (bits) { return bytesToB64(bits); });
  }

  /** Constant-time-ish string compare. */
  function safeEqual(a, b) {
    a = String(a || ''); b = String(b || '');
    if (a.length !== b.length) return false;
    var diff = 0;
    for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
  }

  /* ---------------- Credential storage ---------------- */

  function getCredential() {
    return LPM.db.getRecord('settings', CRED_KEY).then(function (r) {
      return r && r.value ? r.value : null;
    });
  }

  function saveCredential(cred) {
    return LPM.db.putRecord('settings', { key: CRED_KEY, value: cred });
  }

  function isSetupComplete() {
    return getCredential().then(function (c) { return !!c; });
  }

  /* ---------------- Session ---------------- */

  function storeFor(remember) {
    try { return remember ? window.localStorage : window.sessionStorage; }
    catch (e) { return null; }
  }

  function readSession() {
    var raw = null;
    try { raw = window.sessionStorage.getItem(SESSION_KEY); } catch (e) {}
    if (!raw) { try { raw = window.localStorage.getItem(SESSION_KEY); } catch (e) {} }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function writeSession(sess) {
    var s = storeFor(!!sess.remember);
    try {
      if (window.localStorage) window.localStorage.removeItem(SESSION_KEY);
      if (window.sessionStorage) window.sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {}
    if (!s) return;
    try { s.setItem(SESSION_KEY, JSON.stringify(sess)); } catch (e) { /* blocked storage */ }
  }

  function clearSession() {
    try { window.localStorage.removeItem(SESSION_KEY); } catch (e) {}
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
  }

  function startSession(username, remember) {
    var prefs = getPrefs();
    var now = Date.now();
    var sess = {
      username: username,
      token: bytesToB64(randomBytes(16)),
      startedAt: now,
      lastActivity: now,
      remember: !!remember,
      expiresAt: now + (remember ? prefs.rememberDays * 86400000 : 12 * 3600000),
      locked: false
    };
    writeSession(sess);
    return sess;
  }

  /** Session state: 'none' | 'expired' | 'locked' | 'active' */
  function sessionState() {
    var s = readSession();
    if (!s || !s.username || !s.token) return { state: 'none', session: null };
    var now = Date.now();
    if (s.expiresAt && now > s.expiresAt) { clearSession(); return { state: 'expired', session: null }; }
    if (s.locked) return { state: 'locked', session: s };
    var limit = Math.max(1, Number(getPrefs().inactivityMinutes) || 30) * 60000;
    if (now - (s.lastActivity || 0) > limit) {
      s.locked = true;
      writeSession(s);
      return { state: 'locked', session: s };
    }
    return { state: 'active', session: s };
  }

  function isAuthenticated() { return sessionState().state === 'active'; }

  function currentUser() {
    var s = readSession();
    return s && s.username ? s.username : null;
  }

  /** Refresh the inactivity timer (throttled by the caller). */
  function touch() {
    var s = readSession();
    if (!s || s.locked) return;
    s.lastActivity = Date.now();
    writeSession(s);
  }

  function lockSession() {
    var s = readSession();
    if (!s) return false;
    s.locked = true;
    writeSession(s);
    return true;
  }

  function restoreSession() {
    var st = sessionState();
    return st.state === 'active' ? st.session : null;
  }

  /* ---------------- Public operations ---------------- */

  function setup(username, password, confirmPassword) {
    username = String(username || '').trim();
    if (username.length < 3) return Promise.reject(new Error('Username must be at least 3 characters.'));
    var strength = passwordIssues(password);
    if (strength) return Promise.reject(new Error(strength));
    if (password !== confirmPassword) return Promise.reject(new Error('Passwords do not match.'));

    return isSetupComplete().then(function (done) {
      if (done) throw new Error('An account already exists on this browser.');
      var salt = randomBytes(SALT_BYTES);
      return derive(password, salt, PBKDF2_ITERATIONS).then(function (hash) {
        return saveCredential({
          username: username,
          salt: bytesToB64(salt),
          hash: hash,
          iterations: PBKDF2_ITERATIONS,
          algo: 'PBKDF2-SHA256',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    });
  }

  function login(username, password, remember) {
    return getCredential().then(function (cred) {
      if (!cred) throw new Error('No account exists on this browser yet. Create one first.');
      var uOk = safeEqual(String(username || '').trim().toLowerCase(),
        String(cred.username || '').toLowerCase());
      return derive(password || '', b64ToBytes(cred.salt), cred.iterations || PBKDF2_ITERATIONS)
        .then(function (hash) {
          if (!uOk || !safeEqual(hash, cred.hash)) throw new Error('Incorrect username or password.');
          return startSession(cred.username, remember);
        });
    });
  }

  /** Unlock a locked session — same password, no new session. */
  function unlock(password) {
    var s = readSession();
    if (!s) return Promise.reject(new Error('Session expired. Please sign in again.'));
    return getCredential().then(function (cred) {
      if (!cred) throw new Error('No account found.');
      return derive(password || '', b64ToBytes(cred.salt), cred.iterations || PBKDF2_ITERATIONS)
        .then(function (hash) {
          if (!safeEqual(hash, cred.hash)) throw new Error('Incorrect password.');
          s.locked = false;
          s.lastActivity = Date.now();
          writeSession(s);
          return s;
        });
    });
  }

  function changePassword(currentPassword, newPassword, confirmPassword) {
    var issue = passwordIssues(newPassword);
    if (issue) return Promise.reject(new Error(issue));
    if (newPassword !== confirmPassword) return Promise.reject(new Error('New passwords do not match.'));
    return getCredential().then(function (cred) {
      if (!cred) throw new Error('No account found.');
      return derive(currentPassword || '', b64ToBytes(cred.salt), cred.iterations || PBKDF2_ITERATIONS)
        .then(function (hash) {
          if (!safeEqual(hash, cred.hash)) throw new Error('Current password is incorrect.');
          var salt = randomBytes(SALT_BYTES);
          return derive(newPassword, salt, PBKDF2_ITERATIONS).then(function (newHash) {
            return saveCredential(Object.assign({}, cred, {
              salt: bytesToB64(salt),
              hash: newHash,
              iterations: PBKDF2_ITERATIONS,
              updatedAt: new Date().toISOString()
            }));
          });
        });
    });
  }

  function changeUsername(newUsername, password) {
    newUsername = String(newUsername || '').trim();
    if (newUsername.length < 3) return Promise.reject(new Error('Username must be at least 3 characters.'));
    return getCredential().then(function (cred) {
      if (!cred) throw new Error('No account found.');
      return derive(password || '', b64ToBytes(cred.salt), cred.iterations || PBKDF2_ITERATIONS)
        .then(function (hash) {
          if (!safeEqual(hash, cred.hash)) throw new Error('Password is incorrect.');
          return saveCredential(Object.assign({}, cred, {
            username: newUsername, updatedAt: new Date().toISOString()
          })).then(function () {
            var s = readSession();
            if (s) { s.username = newUsername; writeSession(s); }
          });
        });
    });
  }

  function logout() {
    clearSession();
    return Promise.resolve(true);
  }

  /** Remove the stored credential (used by "reset everything"). */
  function resetAccount() {
    clearSession();
    return LPM.db.deleteRecord('settings', CRED_KEY);
  }

  /* ---------------- Password policy ---------------- */

  function passwordIssues(pw) {
    pw = String(pw || '');
    if (pw.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Za-z]/.test(pw)) return 'Password must contain at least one letter.';
    if (!/[0-9]/.test(pw)) return 'Password must contain at least one number.';
    return null;
  }

  function passwordScore(pw) {
    pw = String(pw || '');
    var score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.min(score, 5);
  }

  LPM.auth = {
    cryptoAvailable: cryptoAvailable,
    isSetupComplete: isSetupComplete,
    setup: setup,
    login: login,
    unlock: unlock,
    logout: logout,
    changePassword: changePassword,
    changeUsername: changeUsername,
    resetAccount: resetAccount,
    isAuthenticated: isAuthenticated,
    sessionState: sessionState,
    restoreSession: restoreSession,
    lockSession: lockSession,
    touch: touch,
    currentUser: currentUser,
    getCredential: getCredential,
    getPrefs: getPrefs,
    setPrefs: setPrefs,
    passwordIssues: passwordIssues,
    passwordScore: passwordScore
  };
})(window);
