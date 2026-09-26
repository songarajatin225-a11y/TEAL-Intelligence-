/* ==========================================================================
   login.js — first-time setup and sign-in (index.html)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  function nextTarget() {
    var q = U.getQuery();
    var next = q.next || 'dashboard.html';
    // Only allow same-directory page targets — never an absolute or external URL.
    if (!/^[A-Za-z0-9._-]+\.html(\?[^#]*)?$/.test(next)) next = 'dashboard.html';
    return next;
  }

  function show(id) {
    ['setupView', 'loginView', 'blockedView'].forEach(function (v) {
      var el = document.getElementById(v);
      if (el) el.hidden = v !== id;
    });
  }

  function setError(id, message) {
    var el = document.getElementById(id);
    if (!el) return;
    if (!message) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = message;
  }

  function wireSetup() {
    var form = document.getElementById('setupForm');
    var pw = document.getElementById('setupPassword');
    pw.addEventListener('input', function () {
      var score = LPM.auth.passwordScore(pw.value);
      var bar = document.getElementById('setupPwBar');
      bar.style.width = (score / 5 * 100) + '%';
      bar.style.background = score <= 2 ? 'var(--danger)' : (score <= 3 ? 'var(--warning)' : 'var(--success)');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setError('setupError', '');
      var btn = document.getElementById('setupSubmit');
      btn.disabled = true;
      var username = document.getElementById('setupUsername').value;
      var wantsSample = document.getElementById('setupSample').checked;

      LPM.auth.setup(username, pw.value, document.getElementById('setupPassword2').value)
        .then(function () { return LPM.auth.login(username, pw.value, true); })
        .then(function () {
          if (!wantsSample) return null;
          return LPM.exporter.loadSampleData().catch(function (err) {
            ui.toast(err.message, 'warning', 9000);
          });
        })
        .then(function () { window.location.href = 'dashboard.html'; })
        .catch(function (err) {
          setError('setupError', err.message);
          btn.disabled = false;
        });
    });
  }

  function wireLogin() {
    var form = document.getElementById('loginForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setError('loginError', '');
      var btn = document.getElementById('loginSubmit');
      btn.disabled = true;
      LPM.auth.login(
        document.getElementById('loginUsername').value,
        document.getElementById('loginPassword').value,
        document.getElementById('loginRemember').checked
      ).then(function () {
        window.location.href = nextTarget();
      }).catch(function (err) {
        setError('loginError', err.message);
        document.getElementById('loginPassword').select();
        btn.disabled = false;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.applyTheme();

    var themeBtn = document.getElementById('btnThemeToggle');
    if (themeBtn) {
      themeBtn.innerHTML = ui.icon('sun');
      themeBtn.addEventListener('click', function () {
        var cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        LPM.app.setTheme(cur);
      });
    }

    var q = U.getQuery();
    if (q.reason === 'timeout') {
      ui.toast('Your session timed out. Please sign in again.', 'warning', 6000);
    }

    if (!LPM.db.isSupported()) {
      show('blockedView');
      document.getElementById('blockedMessage').textContent =
        'This browser cannot store data (IndexedDB is unavailable). Private browsing or blocked ' +
        'site data usually causes this. Open the app in a normal window in a modern browser.';
      return;
    }
    if (!LPM.auth.cryptoAvailable()) {
      show('blockedView');
      document.getElementById('blockedMessage').textContent =
        'Secure password hashing (Web Crypto) is unavailable. This happens when the page is opened ' +
        'directly from the file system or over plain HTTP. Serve the folder over http://localhost ' +
        'or deploy it to GitHub Pages (HTTPS).';
      return;
    }

    LPM.db.initDB()
      .then(function () { return LPM.auth.isSetupComplete(); })
      .then(function (done) {
        if (!done) { show('setupView'); wireSetup(); document.getElementById('setupUsername').focus(); return; }
        if (LPM.auth.isAuthenticated()) { window.location.replace(nextTarget()); return; }
        show('loginView');
        wireLogin();
        LPM.auth.getCredential().then(function (cred) {
          if (cred && cred.username) document.getElementById('loginUsername').value = cred.username;
          document.getElementById('loginPassword').focus();
        });
      })
      .catch(function (err) {
        show('blockedView');
        document.getElementById('blockedMessage').textContent =
          'The local database could not be opened: ' + err.message;
      });
  });
})(window, document);
