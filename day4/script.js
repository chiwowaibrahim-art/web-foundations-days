// ---------- 1. Select the elements we need ----------
const form = document.querySelector("#note-form");
const input = document.querySelector("#note-text");
const list = document.querySelector("#notes-list");
const count = document.querySelector("#note-count");

const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

const STORAGE_KEY = "quicknotes";
const DRAFT_KEY = "quicknotes-draft";
const THEME_KEY = "quicknotes-dark-mode";

// ---------- 2. Load and save notes ----------
let notes = loadNotes();

function loadNotes() {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return [];

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

// ---------- 3. Draw the notes on the page ----------
function render() {
    list.innerHTML = "";

    notes.forEach((note) => {
        const li = document.createElement("li");
        li.classList.add("note");

        const text = document.createElement("span");
        text.textContent = note.text;

        const del = document.createElement("button");
        del.textContent = "Delete";
        del.classList.add("delete-btn");
        del.type = "button";
        del.addEventListener("click", () => deleteNote(note.id));

        li.appendChild(text);
        li.appendChild(del);
        list.appendChild(li);
    });

    count.textContent = notes.length === 1
        ? "You have 1 note."
        : `You have ${notes.length} notes.`;
}

// ---------- 4. Add and delete notes ----------
function addNote(text) {
    notes.push({
        id: Date.now(),
        text: text
    });

    saveNotes();
    render();
}

function deleteNote(id) {
    notes = notes.filter((note) => note.id !== id);
    saveNotes();
    render();
}

// ---------- 5. Character and word counters ----------
function updateCounts() {
    const text = input.value;
    const characters = text.length;
    const trimmedText = text.trim();

    const words = trimmedText === ""
        ? 0
        : trimmedText.split(/\s+/).length;

    charCount.textContent = `${characters} / 200 characters`;
    wordCount.textContent = `${words} words`;

    charCount.classList.remove("warning", "over");

    if (characters > 200) {
        charCount.classList.add("over");
    } else if (characters > 180) {
        charCount.classList.add("warning");
    }
}

// ---------- 6. Save and clear the draft ----------
function saveDraft() {
    localStorage.setItem(DRAFT_KEY, input.value);
}

function clearDraft() {
    input.value = "";
    localStorage.removeItem(DRAFT_KEY);
    updateCounts();
    input.focus();
}

input.addEventListener("input", () => {
    updateCounts();
    saveDraft();
});

// Clear button
clearBtn.addEventListener("click", clearDraft);

// Escape key
input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        clearDraft();
    }
});

// ---------- 7. Dark theme ----------
function applyTheme(isDark) {
    document.body.classList.toggle("dark", isDark);
    themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
}

themeToggle.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");

    applyTheme(isDark);
    localStorage.setItem(THEME_KEY, String(isDark));
});

// ---------- 8. Handle the Add Note form ----------
form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = input.value.trim();

    if (text === "") {
        input.focus();
        return;
    }

    if (text.length > 200) {
        alert("Your note must not exceed 200 characters.");
        input.focus();
        return;
    }

    addNote(text);
    clearDraft();
});

// ---------- 9. Restore saved state on page load ----------
const savedDraft = localStorage.getItem(DRAFT_KEY);

if (savedDraft !== null) {
    input.value = savedDraft;
}

const savedTheme = localStorage.getItem(THEME_KEY);
applyTheme(savedTheme === "true");

updateCounts();
render();
