// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, set, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSuWLxctEynm9L38kNZR9-GatCQHTb5l0",
  authDomain: "oee-maintenance.firebaseapp.com",
  databaseURL: "https://oee-maintenance-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "oee-maintenance",
  storageBucket: "oee-maintenance.firebasestorage.app",
  messagingSenderId: "337441676863",
  appId: "1:337441676863:web:667a338de299027839628a",
  measurementId: "G-6D5Q7JYW05"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, push, onValue, set, remove };