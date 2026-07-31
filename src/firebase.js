import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRbtLQ8cDw936hT7-jd0RZWQoOA1-cI8U",
  authDomain: "fabricaops.firebaseapp.com",
  projectId: "fabricaops",
  storageBucket: "fabricaops.firebasestorage.app",
  messagingSenderId: "756784408812",
  appId: "1:756784408812:web:fd3e4fe11f95f455861dc9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
