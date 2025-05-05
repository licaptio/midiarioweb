// 🔒 Código completo con cierre automático de sesión y persistencia limitada a la sesión del navegador
let currentlyEditingId = null;

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC2eHO_hugzqyoYcu3CUiVhc0CS2HjDFWY",
  authDomain: "midiarioweb-c7de6.firebaseapp.com",
  projectId: "midiarioweb-c7de6",
  storageBucket: "midiarioweb-c7de6.appspot.com",
  messagingSenderId: "26488528874",
  appId: "1:26488528874:web:8ee15bbdc497b28cf69c93"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence);

// Resto del código permanece igual (omitido por brevedad)...

// Agrega al final del archivo, fuera de cualquier función:
window.addEventListener('beforeunload', async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Error al cerrar sesión automáticamente:", error);
  }
});