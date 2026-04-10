import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Paste your Firebase project credentials here.
const firebaseConfig = {
  apiKey: "AIzaSyBlBJSAbphDldd9IV-3idILEpvAhzzl-rc",
  authDomain: "first-ea8d1.firebaseapp.com",
  projectId: "first-ea8d1",
  storageBucket: "first-ea8d1.firebasestorage.app",
  messagingSenderId: "787485827792",
  appId: "1:787485827792:web:064c0a4b0ea62ef88cb4d5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
