import "./customElement.js";
import "./styles.css";
let notes = JSON.parse(localStorage.getItem("notes")) || [];

function showLoading() {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.classList.remove("hidden");
  }
}

function hideLoading() {
  const loadingElement = document.getElementById("loading");
  if (loadingElement) {
    loadingElement.classList.add("hidden");
  }
}

async function fetchNotes() {
  showLoading();
  try {
    // Implementasi fetchNotes
    console.log("Fetching notes...");
    const response = await fetch("https://notes-api.dicoding.dev/v2/notes");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching notes:", error);
  } finally {
    hideLoading();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  fetchNotes();
});

function saveNotes() {
  localStorage.setItem("notes", JSON.stringify(notes));
}

function renderNotes(notes) {
  const notesContainer = document.getElementById("notes-container");
  if (notesContainer) {
    notesContainer.innerHTML = "";

    notes.forEach((note) => {
      const noteElement = document.createElement("note-card");
      noteElement.setAttribute("id", note.id);
      noteElement.setAttribute("title", note.title);
      noteElement.setAttribute("body", note.body);
      noteElement.setAttribute("createdAt", note.createdAt);
      noteElement.setAttribute("archived", note.archived);

      notesContainer.appendChild(noteElement);
    });
  } else {
    console.error("Element with ID 'notes-container' not found.");
  }
}

document.addEventListener("note-added", () => {
  fetchNotes(); // Memanggil fungsi untuk memperbarui daftar catatan
});

document.addEventListener("DOMContentLoaded", () => {
  fetchNotes(); // Error terjadi di sini karena fetchNotes belum didefinisikan
});

function addNote() {
  const title = document
    .getElementById("title")
    .querySelector("input")
    .value.trim();
  const body = document
    .getElementById("body")
    .querySelector("input")
    .value.trim();

  if (!title || !body) return alert("Pastikan judul dan isi catatan diisi");

  const newNote = {
    id: `${Date.now()}`,
    title,
    body,
    createdAt: new Date().toISOString(),
    archived: false,
  };

  notes.unshift(newNote);
  saveNotes();
  renderNotes();
  toggleForm();
}

function deleteNote(id) {
  notes = notes.filter((note) => note.id !== id);
  saveNotes();
  renderNotes();
}

function updateNote(id, title, body) {
  const note = notes.find((n) => n.id === id);
  if (note) {
    note.title = title;
    note.body = body;
    saveNotes();
  }
}

function toggleForm() {
  document.getElementById("note-form").classList.toggle("hidden");
}

const noteForm = document.getElementById("note-form");

noteForm.addEventListener("noteAdded", (event) => {
  notes.unshift(event.detail);
  saveNotes();
  renderNotes();
  toggleForm();
});

noteForm.addEventListener("closeForm", () => {
  toggleForm();
});

renderNotes();

document.addEventListener("DOMContentLoaded", () => {
  // Event listeners untuk refresh notes ketika ada perubahan
  document.addEventListener("note-added", () => {
    const notesContainers = document.querySelectorAll("notes-container");
    notesContainers.forEach((container) => container.refresh());
  });

  document.addEventListener("note-deleted", () => {
    const notesContainers = document.querySelectorAll("notes-container");
    notesContainers.forEach((container) => container.refresh());
  });

  document.addEventListener("note-archived", () => {
    const notesContainers = document.querySelectorAll("notes-container");
    notesContainers.forEach((container) => container.refresh());
  });
});
