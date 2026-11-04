import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc } from "firebase/firestore";

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

async function promoteAdmin() {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    let found = false;
    
    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      if (data.username === 'admin') {
        console.log("Found admin user, updating role to Admin...");
        await updateDoc(doc(db, "users", userDoc.id), {
          role: "Admin"
        });
        found = true;
      }
    }
    
    if (!found) {
      console.log("User 'admin' not found in database.");
    } else {
      console.log("Successfully updated admin user!");
    }
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

promoteAdmin();
