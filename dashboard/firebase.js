// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzd8px2K4HdV-wOyEbRIxY9m0_mw-efIo",
  authDomain: "guajiramonuments.firebaseapp.com",
  projectId: "guajiramonuments",
  storageBucket: "guajiramonuments.firebasestorage.app",
  messagingSenderId: "253633397828",
  appId: "1:253633397828:web:e5f8796a1827c20487a811",
  measurementId: "G-RBGNB8GC9W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
