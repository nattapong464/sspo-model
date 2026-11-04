import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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

async function listUsers() {
  try {
    const snapshot = await getDocs(collection(db, "users"));
    console.log("=== Users in database ===");
    snapshot.forEach(doc => {
      const d = doc.data();
      console.log(`ID: ${doc.id} | username: ${d.username} | password: ${d.password} | role: ${d.role} | name: ${d.name}`);
    });
    console.log("=== Total:", snapshot.size, "users ===");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

listUsers();
