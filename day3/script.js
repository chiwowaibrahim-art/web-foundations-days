// Starting notes data
let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" },
];

// 1. Search notes (case-insensitive)
function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}

console.log(searchNotes("milk"));
// Expected: [{ id: 1, text: "Buy milk and bread", category: "personal" }]

console.log(searchNotes("JAVASCRIPT"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("football"));
// Expected: []

// 2. Find the longest note 
function longestNote() {
    if (notes.length === 0) {
        return null;
    }

    let longest = notes[0];

    for (let i = 1; i < notes.length; i++) {
        if (notes[i].text.length > longest.text.length) {
            longest = notes[i];
        }
    }

    return longest;
}

// Tests
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

let savedNotes = notes;
notes = [];

console.log(longestNote());
// Expected: null

notes = savedNotes;

// 3. Count notes by category
function countByCategory() {
    let counts = {};

    for (let note of notes) {
        if (counts[note.category] === undefined) {
            counts[note.category] = 0;
        }

        counts[note.category]++;
    }

    return counts;
}

// Tests
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

savedNotes = notes;
notes = [];

console.log(countByCategory());
// Expected: {}

notes = savedNotes;

// 4. Get summary of notes
function getSummary() {
    const counts = countByCategory();
    const total = notes.length;

    const noteWord = total === 1 ? "note" : "notes";

    return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

// Tests
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

savedNotes = notes;
notes = [];

console.log(getSummary());
// Expected: "0 notes: 0 personal, 0 work, 0 study."

notes = savedNotes;

// 5. Check for duplicate notes
function isDuplicate(text) {
    return notes.some(note =>
        note.text.trim().toLowerCase() === text.trim().toLowerCase()
    );
}

// Tests
console.log(isDuplicate("BUY MILK AND BREAD"));
// Expected: true

console.log(isDuplicate("  Call mum  "));
// Expected: true

console.log(isDuplicate("Read a new book"));
// Expected: false

// 6. Add a new note with validation
function addNote(text, category) {
    const validCategories = ["personal", "work", "study"];

    if (typeof text !== "string") {
        console.log("Rejected: text must be a string.");
        return false;
    }

    const cleanText = text.trim();

    if (cleanText.length < 1 || cleanText.length > 200) {
        console.log("Rejected: note must contain 1-200 characters.");
        return false;
    }

    if (isDuplicate(cleanText)) {
        console.log("Rejected: this note already exists.");
        return false;
    }

    if (!validCategories.includes(category)) {
        console.log("Rejected: invalid category.");
        return false;
    }

    const newId = notes.length === 0
        ? 1
        : Math.max(...notes.map(note => note.id)) + 1;

    notes.push({
        id: newId,
        text: cleanText,
        category: category
    });

    console.log("Note added successfully.");
    return true;
}

// Tests
console.log(addNote("Prepare meeting agenda", "work"));
// Expected: "Note added successfully." then true

console.log(addNote("  PREPARE MEETING AGENDA  ", "work"));
// Expected: "Rejected: this note already exists." then false

console.log(addNote("", "personal"));
// Expected: "Rejected: note must contain 1-200 characters." then false

console.log(addNote("Read a book", "shopping"));
// Expected: "Rejected: invalid category." then false

console.log(addNote("Buy groceries", "personal"));
// Expected: "Note added successfully." then true

console.log(getSummary());
// Expected: "7 notes: 3 personal, 2 work, 2 study."
