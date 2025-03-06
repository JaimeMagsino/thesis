// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import firebase from "firebase/compat/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

//DB references
var ytbExtensionDB = firebase.database().ref('ytb_ext');
