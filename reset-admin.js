import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYdEZ7KHFRNuP1sqVCoz6lTBLbnkj_ZhI",
  authDomain: "sspo-model.firebaseapp.com",
  projectId: "sspo-model",
  storageBucket: "sspo-model.firebasestorage.app",
  messagingSenderId: "1079450879392",
  appId: "1:1079450879392:web:69ffcbc6648650eb4910c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function resetAdmin() {
  try {
    // Force create/overwrite admin account
    const adminUser = {
      id: 1,
      username: "admin",
      password: "admin1234",
      name: "Administrator",
      role: "Admin"
    };
    await setDoc(doc(db, "users", "1"), adminUser);
    console.log("Admin account created/reset successfully!");
    console.log("Username: admin");
    console.log("Password: admin1234");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

resetAdmin();
