import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyAlOshVPN6AUyydLQXU6qTMnqtSgvyMyL4",
  authDomain:        "sabka-masti-bazaar-71333.firebaseapp.com",
  projectId:         "sabka-masti-bazaar-71333",
  storageBucket:     "sabka-masti-bazaar-71333.firebasestorage.app",
  messagingSenderId: "900715353126",
  appId:             "1:900715353126:web:8731f1cc0b6d04148ac2e7",
  measurementId:     "G-ERDM04M46P",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
