/**
 * SSPO Patient Model — automatic backup from Firebase (Firestore) to Google Drive.
 *
 * Every day it saves into the Drive folder "SSPO Backups":
 *   - a Google Sheet  (tabs: Patients, Requests, Users, Notifications) — easy to open and read
 *   - a JSON file     (exact copy of all data) — for restoring if ever needed
 * Backups older than KEEP_DAYS are moved to the Drive trash.
 *
 * Must run under the Google account that OWNS the Firebase project "sspo-model"
 * (it reads the database with that account's permission, so no keys or passwords are stored here).
 * Setup steps: see README.md in this folder.
 */

const PROJECT_ID = 'sspo-model';
const FOLDER_NAME = 'SSPO Backups';
const KEEP_DAYS = 30;
const BACKUP_HOUR = 2; // around 02:00 (Asia/Bangkok, set in appsscript.json)
const COLLECTIONS = [
  { name: 'patients', tab: 'Patients' },
  { name: 'requests', tab: 'Requests' },
  { name: 'users', tab: 'Users' },
  { name: 'notifications', tab: 'Notifications' }
];

/** Run this once: makes the first backup and schedules a daily one. */
function setup() {
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'backupNow'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('backupNow').timeBased().everyDays(1).atHour(BACKUP_HOUR).create();
  backupNow();
  Logger.log('Daily backup scheduled at about %s:00.', BACKUP_HOUR);
}

/** Make one backup right now (also called every day by the trigger). */
function backupNow() {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
  const folder = getFolder_();
  const data = {};
  COLLECTIONS.forEach(function (c) { data[c.name] = fetchCollection_(c.name); });

  // 1) Google Sheet
  const ss = SpreadsheetApp.create('SSPO backup ' + stamp);
  COLLECTIONS.forEach(function (c, i) {
    const sheet = i === 0 ? ss.getSheets()[0].setName(c.tab) : ss.insertSheet(c.tab);
    writeSheet_(sheet, c.name === 'requests' ? data[c.name].map(addPatientNames_) : data[c.name]);
  });
  DriveApp.getFileById(ss.getId()).moveTo(folder);

  // 2) JSON (exact copy)
  folder.createFile('SSPO backup ' + stamp + '.json',
    JSON.stringify({ backedUpAt: new Date().toISOString(), project: PROJECT_ID, data: data }, null, 1),
    MimeType.PLAIN_TEXT);

  removeOldBackups_(folder);
  Logger.log('Backup done: %s patients, %s requests, %s users -> folder "%s"',
    data.patients.length, data.requests.length, data.users.length, FOLDER_NAME);
}

/* ---------------- helpers ---------------- */

function getFolder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}

// Reads every document of a collection through the Firestore REST API (all pages).
function fetchCollection_(name) {
  const docs = [];
  let pageToken = '';
  do {
    const url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT_ID +
      '/databases/(default)/documents/' + name + '?pageSize=300' +
      (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
    const res = UrlFetchApp.fetch(url, {
      headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': PROJECT_ID },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) {
      throw new Error('Could not read "' + name + '" (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 300) +
        '\nCheck that this script runs under the Google account that owns the Firebase project.');
    }
    const body = JSON.parse(res.getContentText());
    (body.documents || []).forEach(function (d) {
      const doc = decodeFields_(d.fields || {});
      doc.id = d.name.split('/').pop();
      docs.push(doc);
    });
    pageToken = body.nextPageToken || '';
  } while (pageToken);
  return docs;
}

// Firestore REST values -> plain values
function decodeValue_(v) {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.nullValue !== undefined) return null;
  if (v.mapValue !== undefined) return decodeFields_(v.mapValue.fields || {});
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(decodeValue_);
  if (v.referenceValue !== undefined) return v.referenceValue;
  if (v.geoPointValue !== undefined) return v.geoPointValue;
  if (v.bytesValue !== undefined) return v.bytesValue;
  return null;
}
function decodeFields_(fields) {
  const out = {};
  Object.keys(fields).forEach(function (k) { out[k] = decodeValue_(fields[k]); });
  return out;
}

function addPatientNames_(r) {
  const copy = Object.assign({}, r);
  copy.patientNames = (r.patients || []).map(function (p) { return p.name; }).join(', ');
  return copy;
}

// Writes rows to a sheet: "id" first, then the other columns A–Z. Lists/objects become JSON text.
function writeSheet_(sheet, rows) {
  if (!rows.length) { sheet.getRange(1, 1).setValue('(no data)'); return; }
  const keys = {};
  rows.forEach(function (r) { Object.keys(r).forEach(function (k) { keys[k] = true; }); });
  const cols = ['id'].concat(Object.keys(keys).filter(function (k) { return k !== 'id'; }).sort());
  const values = rows.map(function (r) {
    return cols.map(function (k) {
      const v = r[k];
      if (v === undefined || v === null) return '';
      const cell = typeof v === 'object' ? JSON.stringify(v) : v;
      return typeof cell === 'string' && cell.length > 49000 ? cell.slice(0, 49000) + '…' : cell; // Sheets cell limit
    });
  });
  sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
  sheet.getRange(2, 1, values.length, cols.length).setValues(values);
  sheet.setFrozenRows(1);
}

function removeOldBackups_(folder) {
  const cutoff = Date.now() - KEEP_DAYS * 24 * 3600 * 1000;
  const files = folder.getFiles();
  while (files.hasNext()) {
    const f = files.next();
    if (f.getName().indexOf('SSPO backup ') === 0 && f.getDateCreated().getTime() < cutoff) f.setTrashed(true);
  }
}
