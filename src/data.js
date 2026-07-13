import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export const defaultPatientsData = [
  {
    id: 1,
    name: "Somchai Jaidee",
    deviceType: "Transtibial Prosthesis",
    disease: "Diabetes",
    inviteCount: 12,
    province: "Bangkok",
    phone: "081-234-5678",
    limitations: "Pain in the stump if walking over 2 hours",
    problems: "Frequent weight changes causing loose socket",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400&h=400",
    suitabilityLevel: "Excellent",
    suitabilityScore: 5
  },
  {
    id: 2,
    name: "Somying Raksangob",
    deviceType: "Ankle Foot Orthosis (AFO)",
    disease: "Stroke",
    inviteCount: 5,
    province: "Chiang Mai",
    phone: "089-876-5432",
    limitations: "Requires a caregiver at all times",
    problems: "Severe ankle spasticity in the morning",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=400",
    suitabilityLevel: "Good",
    suitabilityScore: 4
  }
];

export const defaultRequestsData = [
  {
    id: 1,
    requiredDeviceType: "Transtibial Prosthesis",
    dateNeeded: "2026-07-20",
    courseName: "PO301: Lower Limb Prosthetics I",
    requesterName: "Dr. Jiraporn",
    status: "Pending"
  }
];

export const defaultUsersData = [
  {
    id: 1,
    username: "admin",
    password: "password", 
    role: "Admin",
    name: "System Administrator"
  },
  {
    id: 2,
    username: "user",
    password: "password",
    role: "User",
    name: "Instructor Staff"
  }
];

export const initializeFirebaseData = async () => {
  const usersSnap = await getDocs(collection(db, "users"));
  if (usersSnap.empty) {
    const batch = writeBatch(db);
    defaultUsersData.forEach(user => {
      batch.set(doc(db, "users", user.id.toString()), user);
    });
    defaultPatientsData.forEach(patient => {
      batch.set(doc(db, "patients", patient.id.toString()), patient);
    });
    defaultRequestsData.forEach(req => {
      batch.set(doc(db, "requests", req.id.toString()), req);
    });
    await batch.commit();
  }
};

// Subscriptions
export const subscribeToPatients = (cb) => onSnapshot(collection(db, "patients"), snap => cb(snap.docs.map(d => d.data())));
export const subscribeToRequests = (cb) => onSnapshot(collection(db, "requests"), snap => cb(snap.docs.map(d => d.data())));
export const subscribeToUsers = (cb) => onSnapshot(collection(db, "users"), snap => cb(snap.docs.map(d => d.data())));
export const subscribeToNotifications = (cb) => onSnapshot(collection(db, "notifications"), snap => cb(snap.docs.map(d => d.data())));

// Operations
export const addPatient = async (patient) => await setDoc(doc(db, "patients", patient.id.toString()), patient);
export const updatePatient = async (id, data) => await setDoc(doc(db, "patients", id.toString()), data, { merge: true });
export const deletePatient = async (id) => await deleteDoc(doc(db, "patients", id.toString()));
export const importPatients = async (patientsArray) => {
  const batch = writeBatch(db);
  patientsArray.forEach(p => batch.set(doc(db, "patients", p.id.toString()), p));
  await batch.commit();
};

export const addRequest = async (req) => await setDoc(doc(db, "requests", req.id.toString()), req);
export const updateRequest = async (id, data) => await setDoc(doc(db, "requests", id.toString()), data, { merge: true });

export const addUser = async (user) => await setDoc(doc(db, "users", user.id.toString()), user);
export const updateUser = async (id, data) => await setDoc(doc(db, "users", id.toString()), data, { merge: true });

export const addNotification = async (notif) => await setDoc(doc(db, "notifications", notif.id.toString()), notif);
export const updateNotification = async (id, data) => await setDoc(doc(db, "notifications", id.toString()), data, { merge: true });
export const markAllNotificationsRead = async (userId, notifications) => {
  const batch = writeBatch(db);
  notifications.forEach(n => {
    if (n.userId === userId && !n.read) {
      batch.set(doc(db, "notifications", n.id.toString()), { read: true }, { merge: true });
    }
  });
  await batch.commit();
};
