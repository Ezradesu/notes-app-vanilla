class CustomButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const text = this.getAttribute("text");
    const color = this.getAttribute("color");

    this.shadowRoot.innerHTML = `
      <style>
        .custom-btn {
          background-color: ${color};
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: opacity 0.2s;
          font-weight: bold;
          font-family: "Jua", sans-serif;
        }
        .custom-btn:hover {
          opacity: 0.8;
        }
      </style>
      <button class="custom-btn">
        ${text}
      </button>
    `;
  }

  setupEventListeners() {
    const button = this.shadowRoot.querySelector(".custom-btn");
    button.addEventListener("click", () => {
      // Memunculkan form modal
      const formModal = document.createElement("note-form");
      document.body.appendChild(formModal);
    });
  }
}
customElements.define("custom-button", CustomButton);

class NoteForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          padding: 24px;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          margin-top: 0;
          color: #333;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        label {
          font-family: "Jua", sans-serif;
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }
        
        input, textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 16px;
        }
        
        textarea {
          height: 120px;
          resize: vertical;
        }
        
        .button-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
        }
        
        .cancel-btn {
          background-color: white;
          color: black;
          border: black solid 1px;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-family: "Jua", sans-serif;
          font-size: 14px;
        }
        
        .submit-btn {
          background-color: black;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-family: "Jua", sans-serif;
          font-size: 14px;
          font-weight: bold;
        }
        
        .cancel-btn:hover, .submit-btn:hover {
          opacity: 0.9;
        }
      </style>
      
      <div class="modal-overlay">
        <div class="modal-content">
          <h2>Tambah Catatan Baru</h2>
          <form id="note-form">
            <div class="form-group">
              <label for="title">Judul</label>
              <input type="text" id="title" name="title" required>
            </div>
            <div class="form-group">
              <label for="body">Konten</label>
              <textarea id="body" name="body" required></textarea>
            </div>
            <div class="button-group">
              <button type="button" class="cancel-btn">Batal</button>
              <button type="submit" class="submit-btn">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector("#note-form");
    const cancelButton = this.shadowRoot.querySelector(".cancel-btn");

    cancelButton.addEventListener("click", () => {
      this.remove(); // Menghapus form modal
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = this.shadowRoot.querySelector("#title").value;
      const body = this.shadowRoot.querySelector("#body").value;

      try {
        const response = await fetch(
          "https://notes-api.dicoding.dev/v2/notes",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title, body }),
          }
        );

        if (response.ok) {
          // Trigger custom event untuk refresh data
          const noteAddedEvent = new CustomEvent("note-added", {
            bubbles: true,
            composed: true, // Agar event bisa keluar dari shadow DOM
          });
          this.dispatchEvent(noteAddedEvent);

          this.remove(); // Menghapus form modal
        } else {
          alert("Gagal menambahkan catatan");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Terjadi kesalahan saat menambahkan catatan");
      }
    });
  }
}
customElements.define("note-form", NoteForm);

class NotesContainer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.notes = [];
  }

  connectedCallback() {
    this.fetchNotes();
  }

  async fetchNotes() {
    this.shadowRoot.innerHTML = `
      <style>
        .container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 16px;
        }
        
        @media (min-width: 640px) {
          .container {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (min-width: 768px) {
          .container {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .loading {
          grid-column: 1 / -1;
          text-align: center;
          padding: 16px;
          font-family: "Jua", sans-serif;
        }
        
        .error {
          grid-column: 1 / -1;
          text-align: center;
          padding: 16px;
          color: red;
          font-family: "Jua", sans-serif;
        }
      </style>
      
      <div class="container">
        <div class="loading">Loading...</div>
      </div>
    `;

    try {
      const endpoint =
        this.getAttribute("archived") === "true"
          ? "https://notes-api.dicoding.dev/v2/notes/archived"
          : "https://notes-api.dicoding.dev/v2/notes";

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.status !== "success") {
        throw new Error(result.message || "Failed to fetch notes");
      }

      this.notes = result.data;
      this.render();
    } catch (error) {
      this.shadowRoot.innerHTML = `
        <style>
          .container {
            display: grid;
            grid-template-columns: 1fr;
            gap: 50px;
            margin-top: 16px;
          }
          
          .error {
            grid-column: 1 / -1;
            text-align: center;
            padding: 16px;
            color: red;
            font-family: "Jua", sans-serif;
          }
        </style>
        
        <div class="container">
          <div class="error">Error: ${error.message}</div>
        </div>
      `;
    }
  }

  render() {
    const container = document.createElement("div");
    container.className = "container";

    const style = document.createElement("style");
    style.textContent = `
      .container {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 16px;
      }
      
      @media (min-width: 640px) {
        .container {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (min-width: 768px) {
        .container {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      
      .empty {
        grid-column: 1 / -1;
        text-align: center;
        padding: 16px;
        font-family: "Jua", sans-serif;
      }
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);

    if (this.notes.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty";
      emptyMessage.textContent = "Tidak ada catatan.";
      container.appendChild(emptyMessage);
      return;
    }

    this.notes.forEach((note) => {
      const noteCard = document.createElement("note-card");
      noteCard.setAttribute("id", note.id);
      noteCard.setAttribute("title", note.title);
      noteCard.setAttribute("body", note.body);
      noteCard.setAttribute("createdAt", note.createdAt);
      noteCard.setAttribute("archived", note.archived.toString());
      container.appendChild(noteCard);
    });
  }

  refresh() {
    this.fetchNotes();
  }
}
customElements.define("notes-container", NotesContainer);

class NoteCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const id = this.getAttribute("id");
    const title = this.getAttribute("title") || "Untitled";
    const body = this.getAttribute("body") || "No content";
    const createdAt = new Date(this.getAttribute("createdAt")) || new Date();
    const archived = this.getAttribute("archived") === "true";

    this.shadowRoot.innerHTML = `
      <style>
        .note-card {
          background: white;
          box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 16px;
          position: relative;
          display: flex;
          flex-direction: column;
          border: 1px solid #d1d5db;
          height: auto;
          font-family: "Jua", sans-serif;
        }
        
        .note-content {
          flex-grow: 1;
        }
        
        h3 {
          margin-top: 0;
          margin-bottom: 8px;
          padding-right: 24px;
          word-break: break-word;
        }
        
        .note-body {
          margin-bottom: 16px;
          word-break: break-word;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }
        
        .note-meta {
          font-size: 12px;
          color: #6b7280;
          margin-top: auto;
        }
        
        .button-container {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
        }
        
        .archive-btn {
          background-color: #4b5563;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          font-family: "Jua", sans-serif;
          font-size: 12px;
          cursor: pointer;
        }
        
        .delete-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          color: gray;
          font-size: 20px;
        }
        
        .delete-btn:hover {
          color: red;
        }
        
        .archive-btn:hover {
          opacity: 0.9;
        }
        
        .status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          margin-bottom: 8px;
        }
        
        .status-active {
          background-color: #10b981;
          color: white;
        }
        
        .status-archived {
          background-color: #6b7280;
          color: white;
        }
      </style>
      
      <div class="note-card">
        <button class="delete-btn" aria-label="Delete note">&times;</button>
        
        <div class="note-content">
          <span class="status ${
            archived ? "status-archived" : "status-active"
          }">
            ${archived ? "Archived" : "Active"}
          </span>
          <h3>${title}</h3>
          <div class="note-body">${body}</div>
        </div>
        
        <div class="note-meta">
          <div>ID: ${id}</div>
          <div>Created: ${createdAt.toLocaleString()}</div>
        </div>
        
        <div class="button-container">
          <button class="archive-btn">
            ${archived ? "Unarchive" : "Archive"}
          </button>
        </div>
      </div>
    `;

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    const deleteBtn = this.shadowRoot.querySelector(".delete-btn");
    const archiveBtn = this.shadowRoot.querySelector(".archive-btn");
    const id = this.getAttribute("id");
    const archived = this.getAttribute("archived") === "true";

    deleteBtn.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this note?")) {
        try {
          const response = await fetch(
            `https://notes-api.dicoding.dev/v2/notes/${id}`,
            {
              method: "DELETE",
            }
          );

          if (response.ok) {
            this.dispatchEvent(
              new CustomEvent("note-deleted", {
                bubbles: true,
                composed: true,
              })
            );
          } else {
            alert("Failed to delete note.");
          }
        } catch (error) {
          console.error("Error deleting note:", error);
          alert("An error occurred while deleting the note.");
        }
      }
    });

    archiveBtn.addEventListener("click", async () => {
      const endpoint = archived
        ? `https://notes-api.dicoding.dev/v2/notes/${id}/unarchive`
        : `https://notes-api.dicoding.dev/v2/notes/${id}/archive`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
        });

        if (response.ok) {
          this.dispatchEvent(
            new CustomEvent("note-archived", {
              bubbles: true,
              composed: true,
              detail: { archived: !archived },
            })
          );
        } else {
          alert(`Failed to ${archived ? "unarchive" : "archive"} note.`);
        }
      } catch (error) {
        console.error(
          `Error ${archived ? "unarchiving" : "archiving"} note:`,
          error
        );
        alert(
          `An error occurred while ${
            archived ? "unarchiving" : "archiving"
          } the note.`
        );
      }
    });
  }
}
customElements.define("note-card", NoteCard);

// iniloding

class LoadingIndicator extends HTMLElement {
  constructor() {
    super();

    // Create shadow root
    this.attachShadow({ mode: "open" });

    // Create CSS
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 20px;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #000;
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;

    // Create spinner element
    const spinner = document.createElement("div");
    spinner.classList.add("spinner");

    // Attach to shadow DOM
    this.shadowRoot.append(style, spinner);
  }
}

// Define the custom element
customElements.define("loading-indicator", LoadingIndicator);
