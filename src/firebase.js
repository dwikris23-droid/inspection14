import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAPfyqOdy8-KyNridJQa370rcZNA_7bGUw",
  authDomain: "opsfabrica-452ba.firebaseapp.com",
  projectId: "opsfabrica-452ba",
  storageBucket: "opsfabrica-452ba.firebasestorage.app",
  messagingSenderId: "609304735460",
  appId: "1:609304735460:web:119f7ab2f15bec4f81c6f1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
