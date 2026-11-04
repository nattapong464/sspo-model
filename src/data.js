// All database (Firestore) and login (Firebase Auth) operations live here.
import {
  collection, doc, setDoc, getDoc, addDoc, deleteDoc, onSnapshot, query, where,
  writeBatch, increment, arrayUnion, arrayRemove
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, onAuthStateChanged, updateProfile
} from "firebase/auth";
import { db, auth } from "./firebase";

export const ROLE = { ADMIN: "Admin", USER: "User" };
export const ACCOUNT_STATUS = { PENDING: "pending", ACTIVE: "active", DISABLED: "disabled" };
export const REQUEST_STATUS = ["Pending", "Approved", "Rejected", "Cancelled", "Completed"];
// Notifications with this userId are shown to every Admin
export const ADMINS_INBOX = "admins";
const STATUS_MSG = {
  Approved: "was approved", Rejected: "was not approved", Cancelled: "was cancelled",
  Completed: "was marked as completed", Pending: "is pending again"
};

const nowIso = () => new Date().toISOString();
const withId = (d) => ({ ...d.data(), id: d.id });

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */
// cb({ uid, email } | null)
export const watchAuth = (cb) => onAuthStateChanged(auth, cb);

export const registerAccount = async ({ email, password, name, department }) => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(cred.user, { displayName: name });
  await createOwnProfile(cred.user, { name, department });
  return cred.user;
};

// New accounts always start as role "User" + status "pending" (enforced by security rules too).
export const createOwnProfile = async (fbUser, { name, department } = {}) => {
  const profile = {
    uid: fbUser.uid,
    email: fbUser.email,
    name: (name || fbUser.displayName || fbUser.email.split("@")[0]).trim(),
    department: (department || "").trim(),
    phone: "",
    role: ROLE.USER,
    status: ACCOUNT_STATUS.PENDING,
    createdAt: nowIso()
  };
  await setDoc(doc(db, "users", fbUser.uid), profile);
  await notify(ADMINS_INBOX, `New account waiting for approval: ${profile.name} (${profile.email})`, "manage_users");
  return profile;
};

export const login = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);
export const logout = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

// cb(profile | null). null means "no profile document yet".
export const subscribeToMyProfile = (uid, cb) =>
  onSnapshot(doc(db, "users", uid), (snap) => cb(snap.exists() ? withId(snap) : null), () => cb(null));

export const getProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? withId(snap) : null;
};

// A user may edit only their own name / department / phone (rules block role & status).
export const updateMyProfile = (uid, { name, department, phone }) =>
  setDoc(doc(db, "users", uid), { name, department, phone }, { merge: true });

/* ------------------------------------------------------------------ */
/* Users (Admin only)                                                  */
/* ------------------------------------------------------------------ */
export const subscribeToUsers = (cb, onErr) =>
  onSnapshot(collection(db, "users"), (snap) => cb(snap.docs.map(withId)), onErr);

export const adminUpdateUser = async (uid, data, notifyMessage) => {
  await setDoc(doc(db, "users", uid), { ...data, updatedAt: nowIso() }, { merge: true });
  if (notifyMessage) await notify(uid, notifyMessage);
};

// Removes the profile (the person can no longer use the app). The login itself
// stays in Firebase Authentication until deleted there.
export const adminDeleteUserProfile = (uid) => deleteDoc(doc(db, "users", uid));

/* ------------------------------------------------------------------ */
/* Patients                                                            */
/* ------------------------------------------------------------------ */
export const subscribeToPatients = (cb, onErr) =>
  onSnapshot(collection(db, "patients"), (snap) => cb(snap.docs.map(withId)), onErr);

const stripId = ({ id, ...rest }) => rest; // eslint-disable-line no-unused-vars
const NEW_PATIENT_DEFAULTS = { inviteCount: 0, documentLinks: [], bookedSlots: [], available: true };

export const addPatient = (patient) =>
  addDoc(collection(db, "patients"), { ...NEW_PATIENT_DEFAULTS, ...stripId(patient), createdAt: nowIso() });

export const updatePatient = (id, data) =>
  setDoc(doc(db, "patients", String(id)), { ...stripId(data), updatedAt: nowIso() }, { merge: true });

export const deletePatient = (id) => deleteDoc(doc(db, "patients", String(id)));

// items: [{ id?: existingDocId, data }] — updates existing docs, creates new ones.
// Firestore batches are limited to 500 writes, so we chunk.
export const upsertPatients = async (items) => {
  for (let i = 0; i < items.length; i += 400) {
    const batch = writeBatch(db);
    items.slice(i, i + 400).forEach(({ id, data }) => {
      const ref = id ? doc(db, "patients", String(id)) : doc(collection(db, "patients"));
      batch.set(ref, id
        ? { ...data, updatedAt: nowIso() }
        : { ...NEW_PATIENT_DEFAULTS, ...data, createdAt: nowIso() },
      { merge: true });
    });
    await batch.commit();
  }
};

/* ------------------------------------------------------------------ */
/* Requests                                                            */
/* ------------------------------------------------------------------ */
// Admin sees every request; a User only sees their own (security rules enforce this too).
export const subscribeToRequests = ({ uid, isAdmin }, cb, onErr) => {
  const q = isAdmin
    ? collection(db, "requests")
    : query(collection(db, "requests"), where("requesterId", "==", uid));
  return onSnapshot(q, (snap) => cb(snap.docs.map(withId)), onErr);
};

export const createRequest = async (req, requester) => {
  const ref = await addDoc(collection(db, "requests"), {
    ...req,
    requesterId: requester.uid,
    requesterEmail: requester.email,
    status: "Pending",
    createdAt: nowIso(),
    history: [{ status: "Pending", by: requester.name, at: nowIso() }]
  });
  await notify(ADMINS_INBOX,
    `New request from ${requester.name}: ${req.courseName} on ${req.dateNeeded} (${req.patients.length} patient${req.patients.length > 1 ? "s" : ""})`,
    "requests");
  return ref.id;
};

const slotOf = (req) => ({ date: req.dateNeeded, timeStart: req.timeStart || "", timeEnd: req.timeEnd || "", requestId: String(req.id) });

/**
 * Change a request's status and keep patient booking data in sync (one atomic batch):
 *  - becoming Approved              -> patient inviteCount +1 and the time slot is booked
 *  - Approved -> Rejected/Cancelled -> undo the above
 * patients: the current patient list (deleted patients are skipped).
 */
export const changeRequestStatus = async (req, newStatus, { note = "", actor, patients = [] } = {}) => {
  const batch = writeBatch(db);
  const isAdminActor = actor?.role === ROLE.ADMIN;
  const wasApproved = req.status === "Approved" || req.status === "Completed";
  const becomesApproved = newStatus === "Approved";
  const undo = wasApproved && (newStatus === "Rejected" || newStatus === "Cancelled");
  const existing = new Set(patients.map((p) => String(p.id)));

  const entry = { status: newStatus, by: actor?.name || "", at: nowIso(), ...(note ? { note } : {}) };
  batch.set(doc(db, "requests", String(req.id)), {
    status: newStatus,
    ...(note && isAdminActor ? { adminNote: note } : {}),
    updatedAt: nowIso(),
    history: arrayUnion(entry)
  }, { merge: true });

  if ((becomesApproved && !wasApproved) || undo) {
    const slot = slotOf(req);
    (req.patients || []).forEach((p) => {
      if (!existing.has(String(p.id))) return;
      batch.update(doc(db, "patients", String(p.id)), becomesApproved
        ? { inviteCount: increment(1), bookedSlots: arrayUnion(slot) }
        : { inviteCount: increment(-1), bookedSlots: arrayRemove(slot) });
    });
  }
  await batch.commit();

  // Tell the other side what happened
  if (isAdminActor && req.requesterId) {
    await notify(req.requesterId,
      `Your request "${req.courseName}" (${req.dateNeeded}) ${STATUS_MSG[newStatus] || newStatus}${note ? ` — ${note}` : ""}`,
      "requests");
  } else if (newStatus === "Cancelled") {
    await notify(ADMINS_INBOX, `${actor?.name || "A user"} cancelled the request "${req.courseName}" (${req.dateNeeded})${note ? ` — ${note}` : ""}`, "requests");
  }
};

/**
 * Admin edits a request's details. If the request is already booked (Approved / Completed)
 * and the date or time changed, the patients' booked slots move with it.
 */
export const adminEditRequest = async (req, changes, { actor, patients = [] } = {}) => {
  const batch = writeBatch(db);
  const changed = Object.keys(changes).filter((k) => String(changes[k] ?? "") !== String(req[k] ?? ""));
  if (!changed.length) return false;
  const entry = { status: req.status, by: actor?.name || "", at: nowIso(), note: `Details edited by admin (${changed.join(", ")})` };
  batch.set(doc(db, "requests", String(req.id)), { ...changes, updatedAt: nowIso(), history: arrayUnion(entry) }, { merge: true });

  const booked = req.status === "Approved" || req.status === "Completed";
  const timeMoved = ["dateNeeded", "timeStart", "timeEnd"].some((k) => changed.includes(k));
  if (booked && timeMoved) {
    const existing = new Set(patients.map((p) => String(p.id)));
    const oldSlot = slotOf(req);
    const newSlot = slotOf({ ...req, ...changes });
    (req.patients || []).forEach((p) => {
      if (!existing.has(String(p.id))) return;
      const ref = doc(db, "patients", String(p.id));
      // Two writes to the same document in one batch run in order: remove the old slot, then add the new one
      batch.update(ref, { bookedSlots: arrayRemove(oldSlot) });
      batch.update(ref, { bookedSlots: arrayUnion(newSlot) });
    });
  }
  await batch.commit();
  if (req.requesterId) {
    const c = { ...req, ...changes };
    await notify(req.requesterId, `An admin updated your request "${c.courseName}" — now ${c.dateNeeded}${c.timeStart ? ` ${c.timeStart}–${c.timeEnd || ""}` : ""}`, "requests");
  }
  return true;
};

export const deleteRequest = (id) => deleteDoc(doc(db, "requests", String(id)));

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */
export const notify = (userId, message, link = "") =>
  addDoc(collection(db, "notifications"), { userId: String(userId), message, link, date: nowIso(), read: false })
    .catch((e) => console.warn("notify failed", e));

// Users get their own; Admins also get the shared admin inbox.
export const subscribeToNotifications = ({ uid, isAdmin }, cb) => {
  const buckets = {};
  const emit = () => cb(Object.values(buckets).flat().sort((a, b) => (b.date || "").localeCompare(a.date || "")));
  const listen = (key) => onSnapshot(
    query(collection(db, "notifications"), where("userId", "==", key)),
    (snap) => { buckets[key] = snap.docs.map(withId); emit(); },
    () => { buckets[key] = []; emit(); }
  );
  const unsubs = [listen(uid)];
  if (isAdmin) unsubs.push(listen(ADMINS_INBOX));
  return () => unsubs.forEach((u) => u());
};

export const markNotificationsRead = async (list) => {
  const unread = list.filter((n) => !n.read);
  for (let i = 0; i < unread.length; i += 400) {
    const batch = writeBatch(db);
    unread.slice(i, i + 400).forEach((n) => batch.set(doc(db, "notifications", n.id), { read: true }, { merge: true }));
    await batch.commit();
  }
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
// "HH:MM" strings compare correctly as text. Missing times = whole day.
export const timesOverlap = (aStart, aEnd, bStart, bEnd) => {
  const s1 = aStart || "00:00", e1 = aEnd || "23:59", s2 = bStart || "00:00", e2 = bEnd || "23:59";
  return s1 < e2 && s2 < e1;
};

// Used by Cart and Requests to warn about double bookings
export const findConflicts = (patientList, date, timeStart, timeEnd, ignoreRequestId) =>
  patientList.flatMap((p) => (p.bookedSlots || [])
    .filter((s) => s.date === date && String(s.requestId) !== String(ignoreRequestId || "") && timesOverlap(timeStart, timeEnd, s.timeStart, s.timeEnd))
    .map((s) => ({ patient: p, slot: s })));
