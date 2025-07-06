// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database"; // Import getDatabase for RTDB!
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCBCNd5ieRKbFVU-DDgMR6U3-MAkDu_nY",
  authDomain: "ahookandyarn-72da1.firebaseapp.com",
  databaseURL: "https://ahookandyarn-72da1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ahookandyarn-72da1",
  storageBucket: "ahookandyarn-72da1.firebasestorage.app",
  messagingSenderId: "172709503948",
  appId: "1:172709503948:web:f9aa3d663b8619c3587369"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const database = getDatabase(app);
export const auth = getAuth(app);