import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyAgenY6jwOGfUg4SQ7qvO3JQll4mcDbWNc",
  authDomain: "elsafty-store.firebaseapp.com",
  projectId: "elsafty-store",
  storageBucket: "elsafty-store.firebasestorage.app",
  messagingSenderId: "186970346408",
  appId: "1:186970346408:web:27fd2eea85bcf56af7039d",
  measurementId: "G-QM2NMPHG1P"
};


const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);

export const auth = getAuth(app);


export default app;