/**
 * SSPO Patient Model — email notifications.
 *
 * The web app writes a small "please send" note into the Firestore collection `mail`
 * (who to tell + what happened). About once a minute this script:
 *   1. reads the queued notes,
 *   2. looks up the real request / account in the database,
 *   3. builds the email and sends it from this Google account (Gmail),
 *   4. marks the note as sent (or failed, with the reason).
 * Because the email is built here from the database, nobody can change its content from the web page.
 *
 * Put this file in the SAME Apps Script project as Code.gs (it uses PROJECT_ID, fetchCollection_ and decodeFields_)
 * and run setupMail() once. Must run under the Google account that owns the Firebase project.
 */

const APP_URL = 'https://sspomodel.vercel.app/';
const MAIL_FROM_NAME = 'SSPO Patient Model';
const MAIL_BATCH = 40; // emails handled per run (Gmail allows about 100 recipients a day on a free account)

/** Run this once: checks the queue now and then every minute. */
function setupMail() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'sendQueuedMail'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendQueuedMail').timeBased().everyMinutes(1).create();
  sendQueuedMail();
  Logger.log('Email sending scheduled every minute. Emails left today: %s', MailApp.getRemainingDailyQuota());
}

/** Sends every queued email (also called every minute by the trigger). */
function sendQueuedMail() {
  const queued = queryEqual_('mail', 'status', 'queued', MAIL_BATCH);
  if (!queued.length) return;
  const users = fetchCollection_('users');
  const byId = {};
  users.forEach(function (u) { byId[u.id] = u; });
  const adminEmails = users
    .filter(function (u) { return u.role === 'Admin' && u.status === 'active' && u.email; })
    .map(function (u) { return u.email; });

  queued.forEach(function (m) {
    try {
      const to = m.to === 'admins' ? adminEmails : (byId[m.to] && byId[m.to].email ? [byId[m.to].email] : []);
      if (!to.length) return markMail_(m.id, { status: 'failed', error: 'No email address for "' + m.to + '"' });
      const mail = buildMail_(m, byId);
      if (!mail) return markMail_(m.id, { status: 'failed', error: 'Request or account not found' });
      if (MailApp.getRemainingDailyQuota() < to.length) throw new Error('Daily Gmail limit reached — will retry tomorrow');
      MailApp.sendEmail({ to: to.join(','), subject: mail.subject, htmlBody: mail.html, body: mail.text, name: MAIL_FROM_NAME });
      markMail_(m.id, { status: 'sent', sentAt: new Date().toISOString(), recipients: to.join(', ') });
    } catch (e) {
      const msg = String(e && e.message || e);
      if (msg.indexOf('Daily Gmail limit') === 0) { Logger.log(msg); return; } // stays queued
      markMail_(m.id, { status: 'failed', error: msg.slice(0, 300) });
    }
  });
}

/* ---------------- email content ---------------- */

const STATUS_TEXT_ = {
  Approved: 'has been approved', Rejected: 'was not approved', Cancelled: 'was cancelled',
  Completed: 'was marked as completed', Pending: 'is pending again'
};
const STATUS_COLOR_ = { Pending: '#b45309', Approved: '#047857', Rejected: '#b91c1c', Cancelled: '#4b5563', Completed: '#1d4ed8' };

function buildMail_(m, usersById) {
  if (m.kind === 'account_new' || m.kind === 'account_approved') {
    const u = usersById[m.userId];
    if (!u) return null;
    if (m.kind === 'account_new') {
      return layout_('New account waiting for approval: ' + u.name,
        'New account waiting for approval',
        [['Name', u.name], ['Email', u.email], ['Department', u.department || '–']],
        'Approve or decline it in Admin Dashboard → Waiting for your approval.', 'Open Admin Dashboard', APP_URL + '#/dashboard');
    }
    return layout_('Your SSPO account has been approved',
      'Your account has been approved',
      [['Name', u.name], ['Email', u.email]],
      'You can now sign in, choose patient models and send requests.', 'Open SSPO Patient Model', APP_URL);
  }

  const r = getDoc_('requests', m.requestId);
  if (!r) return null;
  const when = fmtDate_(r.dateNeeded) + ' · ' + (r.timeStart || r.timeEnd ? (r.timeStart || '?') + '–' + (r.timeEnd || '?') : 'All day');
  const course = r.courseName + (r.courseCode ? ' (' + r.courseCode + ')' : '');
  const requester = usersById[r.requesterId] || {};
  const facts = [
    ['Course', course], ['Date', when], ['Location', r.location || '–'],
    ['Requester', (r.requesterName || requester.name || r.requesterEmail || '') + (r.requesterDepartment ? ' · ' + r.requesterDepartment : '')],
    ['Requester contact', [r.requesterPhone || requester.phone, r.requesterEmail || requester.email].filter(Boolean).join(' · ') || '–'],
    ['Purpose', r.purpose || '–'],
    ['Status', r.status]
  ];
  const patients = patientRows_(r);

  if (m.kind === 'request_new') {
    return layout_('New patient model request: ' + course + ' on ' + fmtDate_(r.dateNeeded),
      'New request waiting for approval', facts.concat([['Note from requester', r.notes || '–']]),
      'Approve or reject it in Admin Dashboard → Waiting for your approval.', 'Review the request', APP_URL + '#/dashboard', patients);
  }
  if (m.kind === 'request_cancelled') {
    return layout_('Request cancelled: ' + course + ' on ' + fmtDate_(r.dateNeeded),
      'The requester cancelled this request', facts.concat([['Reason', m.note || '–']]),
      'No action is needed.', 'Open Manage Requests', APP_URL + '#/requests', patients);
  }
  if (m.kind === 'request_edited') {
    return layout_('Your request was updated: ' + course,
      'An admin updated your request', facts.concat([['What changed', changedLabels_(m.note)]]),
      'Please check the new details.', 'Open My Requests', APP_URL + '#/requests', patients);
  }
  // request_status: sent to the requester after an admin decision
  const verb = STATUS_TEXT_[r.status] || r.status;
  return layout_('Your request "' + course + '" ' + verb,
    'Your request ' + verb, facts.concat([['Message from admin', m.note || r.adminNote || '–']]),
    r.status === 'Approved' ? 'The patient models are booked for this time. Their contact numbers are below.' :
      r.status === 'Rejected' ? 'You can change the details and send it again with “Request again”.' : '',
    'Open My Requests', APP_URL + '#/requests', r.status === 'Approved' || r.status === 'Completed' ? patients : patients.map(function (p) { return [p[0], p[1], '']; }));
}

// [name, device + code, phones] for each patient in the request (live phone numbers when the patient still exists)
function patientRows_(r) {
  return (r.patients || []).map(function (s) {
    const p = getDoc_('patients', s.id) || {};
    const raw = p.rawExcelData || {};
    const phones = [p.phone || s.phone || raw.Phone, p.phone2 || raw.Phone2].filter(Boolean).join(' / ');
    const code = p.code || raw['ID / Code'] || s.code || '';
    return [p.name || s.name, [p.deviceType || s.deviceType, code && '#' + code].filter(Boolean).join(' '), phones];
  });
}

function layout_(subject, headline, facts, lead, buttonText, buttonUrl, patients) {
  const color = '#4338ca';
  const rows = facts.map(function (f) {
    const val = f[0] === 'Status'
      ? '<b style="color:' + (STATUS_COLOR_[f[1]] || '#334155') + '">' + esc_(f[1]) + '</b>' : esc_(f[1]);
    return '<tr><td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap;vertical-align:top">' + esc_(f[0]) +
      '</td><td style="padding:6px 0;color:#0f172a">' + val + '</td></tr>';
  }).join('');
  let table = '';
  if (patients && patients.length) {
    table = '<h3 style="font-size:15px;margin:22px 0 8px;color:#0f172a">Patient models (' + patients.length + ')</h3>' +
      '<table style="border-collapse:collapse;width:100%;font-size:14px">' +
      '<tr style="background:#f1f5f9"><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">#</th><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">Patient</th><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">Device</th><th align="left" style="padding:8px;border-bottom:1px solid #e2e8f0">Phone</th></tr>' +
      patients.map(function (p, i) {
        return '<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">' + (i + 1) + '</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">' + esc_(p[0]) +
          '</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">' + esc_(p[1] || '–') + '</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;white-space:nowrap">' + esc_(p[2] || '–') + '</td></tr>';
      }).join('') + '</table>';
  }
  const html = '<div style="font-family:Arial,\'Leelawadee UI\',Tahoma,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">' +
    '<div style="background:' + color + ';color:#fff;padding:14px 20px;border-radius:10px 10px 0 0;font-weight:bold">SSPO Patient Model</div>' +
    '<div style="border:1px solid #e2e8f0;border-top:0;padding:20px;border-radius:0 0 10px 10px">' +
    '<h2 style="font-size:19px;margin:0 0 6px">' + esc_(headline) + '</h2>' +
    (lead ? '<p style="margin:0 0 14px;color:#334155">' + esc_(lead) + '</p>' : '') +
    '<table style="border-collapse:collapse;font-size:14px">' + rows + '</table>' + table +
    '<p style="margin:22px 0 0"><a href="' + buttonUrl + '" style="background:' + color + ';color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block">' + esc_(buttonText) + '</a></p>' +
    '<p style="margin:18px 0 0;font-size:12px;color:#94a3b8">Sent automatically by SSPO Patient Model. Contains personal data of patient models — do not forward outside the teaching team.</p>' +
    '</div></div>';
  const text = [headline, lead].filter(Boolean).join('\n') + '\n\n' +
    facts.map(function (f) { return f[0] + ': ' + f[1]; }).join('\n') +
    (patients && patients.length ? '\n\nPatient models:\n' + patients.map(function (p, i) { return (i + 1) + '. ' + p[0] + (p[1] ? ' · ' + p[1] : '') + (p[2] ? ' · Tel ' + p[2] : ''); }).join('\n') : '') +
    '\n\n' + buttonUrl;
  return { subject: subject, html: html, text: text };
}

const FIELD_LABELS_ = { courseName: 'course name', courseCode: 'course code', dateNeeded: 'date', timeStart: 'start time',
  timeEnd: 'end time', location: 'location', purpose: 'purpose', notes: 'note', adminNote: 'message from admin' };
function changedLabels_(note) {
  const keys = String(note || '').replace(/^Changed: /, '').split(/,\s*/).filter(Boolean);
  return keys.length ? keys.map(function (k) { return FIELD_LABELS_[k] || k; }).join(', ') : '–';
}

function esc_(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtDate_(iso) {
  if (!iso) return '–';
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? iso : Utilities.formatDate(d, Session.getScriptTimeZone(), 'd MMM yyyy');
}

/* ---------------- Firestore REST helpers ---------------- */

function fsUrl_(path) {
  return 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID + '/databases/(default)/documents' + path;
}
function fsHeaders_() {
  return { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': PROJECT_ID };
}

function getDoc_(collectionName, id) {
  if (!id) return null;
  const res = UrlFetchApp.fetch(fsUrl_('/' + collectionName + '/' + encodeURIComponent(id)), { headers: fsHeaders_(), muteHttpExceptions: true });
  if (res.getResponseCode() === 404) return null;
  if (res.getResponseCode() !== 200) throw new Error('Could not read ' + collectionName + '/' + id + ' (' + res.getResponseCode() + ')');
  const d = JSON.parse(res.getContentText());
  const doc = decodeFields_(d.fields || {});
  doc.id = id;
  return doc;
}

function queryEqual_(collectionName, field, value, limit) {
  const res = UrlFetchApp.fetch(fsUrl_(':runQuery'), {
    method: 'post', contentType: 'application/json', headers: fsHeaders_(), muteHttpExceptions: true,
    payload: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: collectionName }],
      where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } },
      limit: limit || 50
    } })
  });
  if (res.getResponseCode() !== 200) throw new Error('Could not read the email queue (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText())
    .filter(function (row) { return row.document; })
    .map(function (row) {
      const doc = decodeFields_(row.document.fields || {});
      doc.id = row.document.name.split('/').pop();
      return doc;
    });
}

function markMail_(id, values) {
  const fields = {};
  Object.keys(values).forEach(function (k) { fields[k] = { stringValue: String(values[k]) }; });
  const mask = Object.keys(values).map(function (k) { return 'updateMask.fieldPaths=' + encodeURIComponent(k); }).join('&');
  const res = UrlFetchApp.fetch(fsUrl_('/mail/' + encodeURIComponent(id) + '?' + mask), {
    method: 'patch', contentType: 'application/json', headers: fsHeaders_(), muteHttpExceptions: true,
    payload: JSON.stringify({ fields: fields })
  });
  if (res.getResponseCode() !== 200) Logger.log('Could not mark mail %s: %s', id, res.getContentText().slice(0, 200));
}

/** Optional: send yourself a test email to check that Gmail sending works. */
function testMail() {
  const me = Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({ to: me, subject: 'SSPO email test', body: 'Email sending works.', name: MAIL_FROM_NAME });
  Logger.log('Test email sent to %s', me);
}
