let currentlyEditingId = null;

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
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
  storageBucket: "midiarioweb-c7de6.firebasestorage.app",
  messagingSenderId: "26488528874",
  appId: "1:26488528874:web:8ee15bbdc497b28cf69c93"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

function showSection(id) {
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  document.getElementById(id).classList.add('active');
  if (id === 'activas') renderNotes(false);
  if (id === 'archivadas') renderNotes(true);
  if (id === 'menu') renderNoteSummaries();
}

async function saveNote() {
  const author = document.getElementById('author').value.trim() || 'Anónimo';
  const content = document.getElementById('content').value.trim();
  if (!content) return alert("Contenido vacío");

  const note = {
    id: Date.now(),
    author,
    content,
    date: new Date().toLocaleDateString(),
    time: new Date().toLocaleTimeString(),
    archived: false
  };

try {
    if (currentlyEditingId) {
      const noteRef = doc(db, "notas", currentlyEditingId);
      await updateDoc(noteRef, {
        author,
        content,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      });
      alert("Nota actualizada en Firebase");
      currentlyEditingId = null;
    } else {
      const note = {
        author,
        content,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
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
    querySnapshot.forEach(docSnap => {
      const note = docSnap.data();
      if (!note.archived) {
        const div = document.createElement('div');
        div.className = 'note-card';
        div.innerHTML = `<strong>${note.author}</strong><br><small>${note.date} ${note.time}</small>`;
        div.onclick = () => {
          showSection('activas');
        };
        container.appendChild(div);
      }
    });
  } catch (error) {
    console.error("Error al cargar notas:", error);
  }
}

async function renderNotes(archived) {
  const container = document.getElementById(archived ? 'archived-notes-container' : 'active-notes-container');
  container.innerHTML = '';

  try {
    const querySnapshot = await getDocs(collection(db, "notas"));
    querySnapshot.forEach(docSnap => {
      const note = { ...docSnap.data(), id: docSnap.id };
      if (note.archived === archived) {
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
      }
    });
  } catch (error) {
    console.error("Error al renderizar notas:", error);
  }
}

async function editNote(id) {
  try {
    const docRef = doc(db, "notas", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const note = docSnap.data();
      if (confirm("¿Deseas editar esta nota?")) {
        currentlyEditingId = id;
        document.getElementById('author').value = note.author;
        document.getElementById('content').value = note.content;
        showSection('menu');
        window.scrollTo(0, 0);
      }
    } else {
      alert("Nota no encontrada.");
    }
  } catch (error) {
    console.error("Error al cargar la nota:", error);
  }
}

async function toggleArchive(id, wasArchived) {
  try {
    const noteRef = doc(db, "notas", id);
    await updateDoc(noteRef, {
      archived: !wasArchived
    });
    renderNotes(!wasArchived);
  } catch (error) {
    console.error("Error al archivar/desarchivar:", error);
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

// Escucha si el usuario está logueado
onAuthStateChanged(auth, user => {
  if (user) {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    renderNoteSummaries();
  } else {
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('app').style.display = 'none';
  }
});

window.login = login;
window.register = register;
window.logout = logout;
window.saveNote = saveNote;
window.showSection = showSection;