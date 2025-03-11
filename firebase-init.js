// firebase-init.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCIDK7Cgkowx_nRKKFLbIq-ZJAE02ARwdQ",
  authDomain: "thesis-yt-ext.firebaseapp.com",
  databaseURL: "https://thesis-yt-ext-default-rtdb.firebaseio.com",
  projectId: "thesis-yt-ext",
  storageBucket: "thesis-yt-ext.firebasestorage.app",
  messagingSenderId: "270194258853",
  appId: "1:270194258853:web:3e100e51c753ab669c6e4c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database, ref, push, set, get, onValue };