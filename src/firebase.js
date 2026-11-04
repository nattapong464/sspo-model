// Firebase setup: Firestore (database) + Authentication (login)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";

// The web config is public by design. Data is protected by Firestore Security Rules
// (see firestore.rules), not by hiding this key.
const firebaseConfig = {
  apiKey: "AIzaSyDYdEZ7KHFRNuP1sqVCoz6lTBLbnkj_ZhI",
  authDomain: "sspo-model.firebaseapp.com",
  projectId: "sspo-model",
  storageBucket: "sspo-model.firebasestorage.app",
  messagingSenderId: "1079450879392",
  appId: "1:1079450879392:web:69ffcbc6648650eb4910c5",
  measurementId: "G-N7NRKVDXVB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Stay signed in after refreshing / reopening the browser
setPersistence(auth, browserLocalPersistence).catch(() => {});
