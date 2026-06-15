/**
 * Hard Deterministic UX Engine & Pure View Projection Layer
 */

// 1. Safe Structural Initialization With LocalStorage Persistence Sync
const STORAGE_KEY = "sticky-board-notes";
const loadPersistedData = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
        console.error("Storage state corruption detected, initializing clean array layout.", e);
        return [];
    }
};

let BoardState = {
    notes: loadPersistedData(),
    mode: "IDLE",
    activeNoteId: null,
    buffer: "",
    error: "NONE"
};

// Tracking snapshot reference to prevent DOM thrashing loops on buffer updates
let renderedNotesSnapshot = "";

// 2. Pure Utilities
function getWordCount(text) {
    const clean = text.trim();
    return clean === "" ? 0 : clean.split(/\s+/).length;
}

// 3. Stateless Reactive Projection View = f(State)
function projectView() {
    const canvas = document.getElementById("notes-canvas");
    const overlay = document.getElementById("workspace-overlay");
    const title = document.getElementById("workspace-title");
    const textarea = document.getElementById("workspace-buffer");
    const errEmpty = document.getElementById("error-banner-empty");
    const errLimit = document.getElementById("error-banner-limit");

    if (!canvas || !overlay || !title || !textarea || !errEmpty || !errLimit) return;

    // Structural Render Optimization Guard: Only repaint grid when contents or sorting arrays change
    const currentSnapshot = JSON.stringify(BoardState.notes.map(n => ({ id: n.id, text: n.text, up: n.updatedAt })));
    
    if (renderedNotesSnapshot !== currentSnapshot) {
        canvas.innerHTML = "";
        
        // Sorting resolution targeting: (updatedAt || createdAt)
        [...BoardState.notes]
            .sort((a, b) => {
                const timeA = a.updatedAt || a.createdAt;
                const timeB = b.updatedAt || b.createdAt;
                return timeB - timeA;
            })
            .forEach(note => {
                const card = document.createElement("div");
                card.className = "sticky-note-card";
                
                const targetTimestamp = note.updatedAt || note.createdAt;
                const dateStr = new Date(targetTimestamp).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                });
                
                const prefixLabel = note.updatedAt ? "Edited" : "Created";

                card.innerHTML = `
                    <div class="note-body"></div>
                    <div class="note-footer">
                        <span class="note-timestamp">${prefixLabel}: ${dateStr}</span>
                        <div class="note-actions">
                            <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${note.id}">Edit</button>
                            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${note.id}">Delete</button>
                        </div>
                    </div>
                `;
                card.querySelector(".note-body").textContent = note.text;
                canvas.appendChild(card);
            });
        
        renderedNotesSnapshot = currentSnapshot;
    }

    // Workspace modal sync processing 
    if (BoardState.mode === "CREATE_EDITING" || BoardState.mode === "EDITING") {
        overlay.classList.remove("hidden");
        title.textContent = BoardState.mode === "CREATE_EDITING" ? "Create New Note" : "Edit Note";
        
        // Fix Caret Desync Loop: Safely align input values without throwing cursor indexes
        if (textarea.value !== BoardState.buffer) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = BoardState.buffer;
            textarea.setSelectionRange(start, end);
        }
    } else {
        overlay.classList.add("hidden");
        textarea.value = "";
    }

    // Diagnostic visibility status projections
    errEmpty.classList.toggle("hidden", BoardState.error !== "EMPTY_TEXT");
    errLimit.classList.toggle("hidden", BoardState.error !== "WORD_LIMIT_EXCEEDED");
}

// 4. Reactive Effect Processing Infrastructure (Sprint 3 Hook Ready)
function runEffects(previousState, currentState) {
    if (JSON.stringify(previousState.notes) !== JSON.stringify(currentState.notes)) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentState.notes));
        } catch (e) {
            console.error("Failed to commit state payload transaction to localStorage channel:", e);
        }
    }
}

// 5. Deterministic State Transition Matrix Engine
function dispatch(eventType, payload = {}) {
    // Generate immutable state snapshot prior to mutation execution boundaries
    const previousState = JSON.parse(JSON.stringify(BoardState));

    switch (eventType) {
        case "CREATE_NOTE":
            if (BoardState.mode === "IDLE") {
                BoardState.mode = "CREATE_EDITING";
                BoardState.activeNoteId = null;
                BoardState.buffer = "";
                BoardState.error = "NONE";
            }
            break;

        case "EDIT_NOTE":
            if (BoardState.mode === "IDLE") {
                const target = BoardState.notes.find(n => n.id === payload.id);
                if (target) {
                    BoardState.mode = "EDITING";
                    BoardState.activeNoteId = payload.id;
                    BoardState.buffer = target.text;
                    BoardState.error = "NONE";
                }
            }
            break;

        case "BUFFER_UPDATE":
            if (BoardState.mode === "CREATE_EDITING" || BoardState.mode === "EDITING") {
                BoardState.buffer = payload.text;
                if (getWordCount(BoardState.buffer) > 50) {
                    BoardState.error = "WORD_LIMIT_EXCEEDED";
                } else {
                    BoardState.error = "NONE";
                }
            }
            break;

        case "CANCEL":
            if (BoardState.mode === "CREATE_EDITING" || BoardState.mode === "EDITING") {
                BoardState.mode = "IDLE";
                BoardState.activeNoteId = null;
                BoardState.buffer = "";
                BoardState.error = "NONE";
            }
            break;

        case "SAVE":
            if (BoardState.mode === "CREATE_EDITING" || BoardState.mode === "EDITING") {
                const cleanText = BoardState.buffer.trim();
                const wordCount = getWordCount(BoardState.buffer);

                if (cleanText === "") {
                    BoardState.error = "EMPTY_TEXT";
                    break;
                }
                if (wordCount > 50) {
                    BoardState.error = "WORD_LIMIT_EXCEEDED";
                    break;
                }

                if (BoardState.mode === "CREATE_EDITING") {
                    BoardState.notes.push({
                        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
                        text: BoardState.buffer,
                        createdAt: Date.now(),
                        updatedAt: null // Explicit initialization tracking lifecycle properties
                    });
                } else if (BoardState.mode === "EDITING") {
                    BoardState.notes = BoardState.notes.map(note =>
                        note.id === BoardState.activeNoteId 
                            ? { ...note, text: BoardState.buffer, updatedAt: Date.now() } // Preserving createdAt natively
                            : note
                    );
                }

                BoardState.mode = "IDLE";
                BoardState.activeNoteId = null;
                BoardState.buffer = "";
                BoardState.error = "NONE";
            }
            break;

        case "DELETE_NOTE":
            BoardState.notes = BoardState.notes.filter(note => note.id !== payload.id);
            if (BoardState.activeNoteId === payload.id) {
                BoardState.mode = "IDLE";
                BoardState.activeNoteId = null;
                BoardState.buffer = "";
                BoardState.error = "NONE";
            }
            break;
    }
    
    // Cycle synchronization sequence loop locks
    projectView();
    runEffects(previousState, BoardState);
}

// 6. Global Event Attaching Execution Management
document.addEventListener("DOMContentLoaded", () => {
    // Top levels selectors
    document.getElementById("action-create")?.addEventListener("click", () => dispatch("CREATE_NOTE"));
    document.getElementById("action-cancel")?.addEventListener("click", () => dispatch("CANCEL"));
    document.getElementById("action-save")?.addEventListener("click", () => dispatch("SAVE"));
    document.getElementById("workspace-buffer")?.addEventListener("input", (e) => dispatch("BUFFER_UPDATE", { text: e.target.value }));
    
    const overlay = document.getElementById("workspace-overlay");
    overlay?.addEventListener("click", (e) => {
        if (e.target === overlay) dispatch("CANCEL");
    });

    // Clean Keyboard Escape Handling for Accessible Modals
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && (BoardState.mode === "CREATE_EDITING" || BoardState.mode === "EDITING")) {
            dispatch("CANCEL");
        }
    });

    // Sprint 2: High Scalability Canvas Event Delegation 
    document.getElementById("notes-canvas")?.addEventListener("click", (e) => {
        const actionButton = e.target.closest("button[data-action]");
        if (!actionButton) return;
        
        const action = actionButton.getAttribute("data-action");
        const noteId = actionButton.getAttribute("data-id");
        
        if (action === "edit") {
            dispatch("EDIT_NOTE", { id: noteId });
        } else if (action === "delete") {
            dispatch("DELETE_NOTE", { id: noteId });
        }
    });

    // Execute Initial Board Core Projection Frame
    projectView();
});
