let currentlyEditingId = null;

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,  // 👈 este te falta
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
  const author = document.getElementById('author').value.trim() || 'Anónimo';
  const content = document.getElementById('content').value.trim();
  if (!content) return alert("Contenido vacío");

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

    querySnapshot.forEach(docSnap => {
      const note = { ...docSnap.data(), id: docSnap.id };
      if (!note.archived) {
        notes.push(note);
      }
    });

    notes.sort((a, b) => {
      const timeA = new Date(a.timestamp || `${a.date} ${a.time}`);
      const timeB = new Date(b.timestamp || `${b.date} ${b.time}`);
      return timeB - timeA;
    });

    // ✅ Mostrar resumen correctamente
    notes.forEach(note => {
      const div = document.createElement('div');
      div.className = 'note-card';
      div.innerHTML = `<strong>${note.author}</strong><br><small>${note.date} ${note.time}</small>`;
      div.onclick = () => openModal(note);
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

    querySnapshot.forEach(docSnap => {
      const note = { ...docSnap.data(), id: docSnap.id };
      if (note.archived === archived) {
        notes.push(note);
      }
    });

    // 🟢 Ordenar por timestamp descendente
    notes.sort((a, b) => {
      const timeA = new Date(a.timestamp || `${a.date} ${a.time}`);
      const timeB = new Date(b.timestamp || `${b.date} ${b.time}`);
      return timeB - timeA;
    });

    // Mostrar las notas ordenadas
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





async function deleteNote(id) {
  if (!confirm("¿Eliminar esta nota?")) return;

  try {
    await deleteDoc(doc(db, "notas", id));
    renderNotes(true);
    renderNotes(false);
  } catch (error) {
    console.error("Error al eliminar nota:", error);
  }
}

renderNoteSummaries();

async function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // ✅ MOSTRAR LA APP
    showSection('menu');
  } catch (error) {
    alert("Error al iniciar sesión: " + error.message);
  }
}


async function register() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Usuario registrado correctamente");
  } catch (error) {
    alert("Error al registrar: " + error.message);
  }
}

async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    alert("Error al cerrar sesión: " + error.message);
  }
}

onAuthStateChanged(auth, user => {
  const loginWrapper = document.getElementById('login-wrapper');
  const appSection = document.getElementById('app');

  if (user) {
    loginWrapper.style.display = 'none';
    appSection.style.display = 'block';
    document.body.style.backgroundImage = 'none'; // quitar fondo al entrar
    renderNoteSummaries();
showSection('menu');
  } else {
    loginWrapper.style.display = 'flex';
    appSection.style.display = 'none';
    document.body.style.backgroundImage = "url('PICUTRE.avif')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundPosition = "center center";
  }
});


window.login = login;
window.register = register;
window.logout = logout;
window.saveNote = saveNote;
window.showSection = showSection;
window.editNote = editNote;
window.toggleArchive = toggleArchive;
window.deleteNote = deleteNote;

function openModal(note) {
  document.getElementById('modal-note-author').textContent = note.author;
  document.getElementById('modal-note-content').textContent = note.content;
  document.getElementById('modal-note-time').textContent = `${note.date} ${note.time}`;
  document.getElementById('note-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('note-modal').style.display = 'none';
}

window.openModal = openModal;
window.closeModal = closeModal;
// Asocia el botón de cerrar modal después de que cargue el documento
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('close-button');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn')?.addEventListener('click', login);
  document.getElementById('register-btn')?.addEventListener('click', register);
});
