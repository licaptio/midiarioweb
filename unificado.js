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

    notes.forEach(note => {
      const div = document.createElement('div');
      div.className = 'note-card';
      div.innerHTML = `<strong>${note.author}</strong><br><small>${note.date} ${note.time}</small>`;
      div.onclick = () => showNoteModal(note); // Cambio clave aquí
      container.appendChild(div);
    });

  } catch (error) {
    console.error("Error al cargar notas activas:", error);
  }
}

// Versión a CONSERVAR (mejorada)
function showNoteModal(note) {
  if (!note) return;  // Validación añadida
  
  const modal = document.createElement('div');
  modal.className = 'note-modal';
  
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${note.author || 'Anónimo'}</h3>  <!-- Valor por defecto -->
      <p style="white-space: pre-wrap;">${note.content || ''}</p>  <!-- Valores seguros -->
      <small>${note.date || ''} ${note.time || ''}</small>
      <div class="modal-actions">
        <button class="modal-edit" onclick="editNote('${note.id}'); closeModal()">Editar</button>
        <button class="modal-archive" onclick="toggleArchive('${note.id}', ${note.archived || false})">
          ${note.archived ? 'Desarchivar' : 'Archivar'}
        </button>
        <button class="modal-close" onclick="closeModal()">Cerrar</button>
      </div>
    </div>
  `;
  
  modal.onclick = (e) => e.target === modal && closeModal();
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
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

// [...] (todo tu código existente hasta onAuthStateChanged)

// 1. FUNCIONES NUEVAS MEJORADAS (añade esto justo antes de las exportaciones window)
// --------------------------------------------------
async function editNote(id) {
  try {
    const noteRef = doc(db, "notas", id);
    const noteSnap = await getDoc(noteRef);
    
    if (noteSnap.exists()) {
      const note = noteSnap.data();
      document.getElementById('author').value = note.author;
      document.getElementById('content').value = note.content;
      currentlyEditingId = id;
      showSection('menu');
      window.scrollTo(0, 0); // Para asegurar que se vea el formulario
    }
  } catch (error) {
    console.error("Error al editar nota:", error);
    alert("Error al cargar la nota para editar");
  }
}

async function toggleArchive(id, currentlyArchived) {
  try {
    const noteRef = doc(db, "notas", id);
    await updateDoc(noteRef, {
      archived: !currentlyArchived
    });
    renderNotes(false);
    renderNotes(true);
    renderNoteSummaries();
    if (document.querySelector('.note-modal')) {
      closeModal();
    }
  } catch (error) {
    console.error("Error al archivar/desarchivar nota:", error);
    alert("Error al cambiar el estado de la nota");
  }
}

function closeModal() {
  const modal = document.querySelector('.note-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
}

// --------------------------------------------------

// 2. EXPORTACIÓN DE FUNCIONES (solo este bloque, elimina el duplicado)
window.login = login;
window.register = register;
window.logout = logout;
window.saveNote = saveNote;
window.showSection = showSection;
window.editNote = editNote;
window.toggleArchive = toggleArchive;
window.deleteNote = deleteNote;
window.showNoteModal = showNoteModal;
window.closeModal = closeModal; 	 