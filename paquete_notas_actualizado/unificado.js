
// 🔁 ARCHIVO: unificado.js
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
  onAuthStateChanged
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

function showSection(id) {
  const sections = ['menu', 'activas', 'archivadas'];
  sections.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    section.style.display = (sectionId === id) ? 'flex' : 'none';
  });

  if (id === 'activas') renderNotes(false);
  if (id === 'archivadas') renderNotes(true);
  if (id === 'menu') renderNoteSummaries();
}

async function saveNote() {
  const author = document.getElementById('author').value.trim() || 'Anonimo';
  const content = document.getElementById('content').value.trim();
  if (!content) return alert("Contenido vacio");

  const now = new Date();

  try {
    if (currentlyEditingId) {
      const noteRef = doc(db, "notas", currentlyEditingId);
      await updateDoc(noteRef, {
        author,
        content,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        timestamp: now.toISOString()
      });
      alert("Nota actualizada en Firebase");
      currentlyEditingId = null;
    } else {
      const note = {
        author,
        content,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        timestamp: now.toISOString(),
        archived: false
      };
      await addDoc(collection(db, "notas"), note);
      alert("Nota guardada en Firebase");
    }

    document.getElementById('author').value = '';
    document.getElementById('content').value = '';
    renderNoteSummaries();

  } catch (error) {
    console.error("Error al guardar nota:", error);
  }
}

async function renderNoteSummaries() {
  const container = document.getElementById('notes-summary-container');
  container.innerHTML = '';

  try {
    const querySnapshot = await getDocs(collection(db, "notas"));
    const notes = [];
    const promises = [];

    querySnapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (!data.archived) {
        if (!data.timestamp) {
          const date = data.date || '2000-01-01';
          const time = data.time || '00:00:00';
          const fixedTimestamp = new Date(`${date} ${time}`).toISOString();
          const updatePromise = updateDoc(doc(db, "notas", docSnap.id), { timestamp: fixedTimestamp });
          data.timestamp = fixedTimestamp;
          promises.push(updatePromise);
        }
        notes.push({ ...data, id: docSnap.id });
      }
    });

    await Promise.all(promises);

    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    notes.forEach(note => {
      const div = document.createElement('div');
      div.className = 'note-card';
      div.innerHTML = `<strong>${note.author}</strong><br><small>${note.date} ${note.time}</small>`;
      div.onclick = () => window.location.href = `verNota.html?id=${note.id}`;
      container.appendChild(div);
    });

  } catch (error) {
    console.error("Error al cargar notas activas:", error);
  }
}

async function renderNotes(archived) {
  const container = document.getElementById(archived ? 'archived-notes-container' : 'active-notes-container');
  container.innerHTML = '';

  try {
    const querySnapshot = await getDocs(collection(db, "notas"));
    const notes = [];
    const promises = [];

    querySnapshot.forEach(docSnap => {
      const note = { ...docSnap.data(), id: docSnap.id };
      if (note.archived === archived) {
        if (!note.timestamp) {
          const date = note.date || '2000-01-01';
          const time = note.time || '00:00:00';
          const fixedTimestamp = new Date(`${date} ${time}`).toISOString();
          const updatePromise = updateDoc(doc(db, "notas", docSnap.id), { timestamp: fixedTimestamp });
          note.timestamp = fixedTimestamp;
          promises.push(updatePromise);
        }
        notes.push(note);
      }
    });

    await Promise.all(promises);

    notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    notes.forEach(note => {
      const card = document.createElement('div');
      card.className = 'note-card';
      card.innerHTML = `
        <h3>${note.author}</h3>
        <p>${note.content}</p>
        <small>${note.date} ${note.time}</small><br>
        <button onclick="editNote('${note.id}')">Editar</button>
        <button onclick="toggleArchive('${note.id}', ${archived})">${archived ? 'Desarchivar' : 'Archivar'}</button>
        <button onclick="deleteNote('${note.id}')">Eliminar</button>
      `;
      container.appendChild(card);
    });

  } catch (error) {
    console.error("Error al renderizar notas:", error);
  }
}
