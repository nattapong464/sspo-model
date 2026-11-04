import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";

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
const db = getFirestore(app);

async function testWrite() {
  try {
    const newUser = { id: 999, username: 'testuser', password: 'testpassword', name: 'Test User', role: 'User' };
    await setDoc(doc(db, "users", newUser.id.toString()), newUser);
    console.log("Success");
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
}

testWrite();
