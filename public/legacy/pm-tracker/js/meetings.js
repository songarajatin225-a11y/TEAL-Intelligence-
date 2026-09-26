/* meetings.js — Meeting & follow-up tracker
   Adds the "Generate Follow-up" composer (editable message + copy). */
(function (window, document) {
  'use strict';
  var LPM = window.LPM, U = LPM.utils, ui = LPM.ui;

  function bullets(text) {
    if (U.isBlank(text)) return [];
    return String(text).split(/\r?\n|;/).map(function (l) { return l.trim(); })
      .filter(Boolean).map(function (l) { return '  • ' + l.replace(/^[-•*]\s*/, ''); });
  }

  function buildMessage(rec, userName) {
    var contact = U.isBlank(rec.contact) ? 'Sir / Madam' : rec.contact;
    var when = U.formatDate(rec.meetingDate) || 'our recent discussion';
    var lines = [];

    lines.push('Subject: Follow-up — ' + (rec.objective || 'Discussion') +
      (U.isBlank(rec.customer) ? '' : ' | ' + rec.customer));
    lines.push('');
    lines.push('Dear ' + contact + ',');
    lines.push('');
    lines.push('Thank you for your time on ' + when + '. Please find below a summary of our ' +
      'discussion and the agreed next steps.');
    lines.push('');

    lines.push('DISCUSSION SUMMARY');
    var summary = []
      .concat(bullets(rec.keyDiscussion))
      .concat(U.isBlank(rec.customerRequirement) ? [] : ['  • Requirement: ' + rec.customerRequirement])
      .concat(U.isBlank(rec.technicalRequirement) ? [] : ['  • Technical: ' + rec.technicalRequirement])
      .concat(U.isBlank(rec.commercialRequirement) ? [] : ['  • Commercial: ' + rec.commercialRequirement]);
    lines = lines.concat(summary.length ? summary : ['  • (add the key points discussed)']);
    lines.push('');

    lines.push('AGREED ACTIONS');
    var actions = bullets(rec.actionItem);
    if (actions.length) {
      var suffix = [];
      if (!U.isBlank(rec.owner)) suffix.push('Owner: ' + rec.owner);
      if (!U.isBlank(rec.dueDate)) suffix.push('By: ' + U.formatDate(rec.dueDate));
      lines = lines.concat(actions.map(function (a, i) {
        return a + (i === 0 && suffix.length ? '  (' + suffix.join(', ') + ')' : '');
      }));
    } else {
      lines.push('  • (add the agreed actions)');
    }
    if (!U.isBlank(rec.decision)) { lines.push(''); lines.push('DECISION'); lines.push('  • ' + rec.decision); }
    lines.push('');

    lines.push('NEXT STEPS');
    if (!U.isBlank(rec.nextMeeting)) lines.push('  • Next review scheduled for ' + U.formatDate(rec.nextMeeting) + '.');
    lines.push('  • We will revert with the required technical details and sample plan.');
    lines.push('');
    lines.push('Please let me know if any point above needs correction or if you would like ' +
      'further technical information.');
    lines.push('');
    lines.push('Best regards,');
    lines.push(userName || 'Product Manager');
    lines.push('Laser Applications — Product Management');

    return lines.join('\n');
  }

  function openComposer(rec, reload) {
    var user = LPM.auth.currentUser() || 'Product Manager';
    var wrap = ui.el('div', { class: 'composer' });
    wrap.innerHTML =
      '<div class="field"><label for="fuText">Follow-up message (edit before sending)</label>' +
      '<textarea id="fuText" spellcheck="true"></textarea>' +
      '<div class="hint">Nothing is sent automatically. Copy the text into your email client.</div></div>';
    var ta = wrap.querySelector('#fuText');
    ta.value = buildMessage(rec, user);

    ui.modal({
      title: 'Generate follow-up',
      size: 'lg',
      body: wrap,
      buttons: [
        { label: 'Close', class: 'btn--ghost' },
        { label: 'Mark follow-up as sent', class: '', icon: 'check', onClick: function (api) {
          LPM.db.updateRecord('meetings', { id: rec.id, followUpSent: 'Yes' }).then(function () {
            ui.toast('Marked as sent', 'success');
            api.close();
            if (reload) reload();
          }).catch(function (e) { ui.toast('Update failed: ' + e.message, 'error'); });
        } },
        { label: 'Copy to clipboard', class: 'btn--primary', icon: 'copy', onClick: function () {
          U.copyToClipboard(ta.value)
            .then(function () { ui.toast('Follow-up copied to clipboard', 'success'); })
            .catch(function (e) {
              ui.toast('Copy failed (' + e.message + '). Select the text and copy manually.', 'error');
              ta.focus(); ta.select();
            });
        } }
      ]
    });
  }

  LPM.crud.hooks.meetings = {
    detailButtons: function (record, ctx) {
      return [{ label: 'Generate follow-up', icon: 'mail', class: 'btn--ghost',
        onClick: function () { openComposer(record, ctx.reload); } }];
    },
    rowActions: [{
      label: 'Generate follow-up', icon: 'mail',
      onClick: function (r, reload) { openComposer(r, reload); }
    }]
  };

  document.addEventListener('DOMContentLoaded', function () {
    LPM.app.boot({ page: 'meetings' }).then(function () {
      LPM.crud.listPage({ entity: 'meetings', root: document.getElementById('pageRoot') });
    }).catch(function () {});
  });

  LPM.followUp = { build: buildMessage, open: openComposer };
})(window, document);
