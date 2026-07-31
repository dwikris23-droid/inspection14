import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRbtLQ8cDw936hT7-jd0RZWQoOA1-cI8U",
  authDomain: "fabricaops.firebaseapp.com",
  projectId: "fabricaops",
  storageBucket: "fabricaops.firebasestorage.app",
  messagingSenderId: "756784408812",
  appId: "1:756784408812:web:378924ce02f5d82f861dc9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
