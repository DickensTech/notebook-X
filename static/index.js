document.querySelectorAll(".flash-message").forEach((message) => {
    const dismiss = () => {
        message.classList.add("is-dismissing");
        window.setTimeout(() => message.remove(), 220);
    };

    message.querySelector(".flash-dismiss").addEventListener("click", dismiss);
    window.setTimeout(dismiss, 5000);
});

document.querySelectorAll(".password-toggle").forEach((toggle) => {
    const password = document.getElementById(toggle.getAttribute("aria-controls"));

    toggle.addEventListener("click", () => {
        const isVisible = password.type === "text";
        password.type = isVisible ? "password" : "text";
        toggle.setAttribute("aria-pressed", String(!isVisible));
        toggle.setAttribute("aria-label", `${isVisible ? "Show" : "Hide"} password`);
    });
});

const noteGrid = document.querySelector("#notes-grid");

if (noteGrid) {
    const starterNotes = [
        {
            id: "starter-work",
            title: "A few things for this week",
            content: "Finish the homepage refresh, send the project update, and make time for a proper coffee break.",
            category: "work",
            createdAt: "2026-10-06T09:30:00.000Z"
        },
        {
            id: "starter-personal",
            title: "Weekend ideas",
            content: "Take a long walk somewhere new, try that little bakery on the corner, and finally pick up a book.",
            category: "personal",
            createdAt: "2026-10-05T14:15:00.000Z"
        },
        {
            id: "starter-ideas",
            title: "Things I want to learn",
            content: "Get more comfortable with drawing, explore a new recipe each month, and keep collecting small ideas.",
            category: "ideas",
            createdAt: "2026-10-04T11:00:00.000Z"
        },
        {
            id: "starter-planning",
            title: "A gentler morning",
            content: "Leave the phone for later. Open the window, make something warm, and write down one thing to focus on.",
            category: "planning",
            createdAt: "2026-10-02T08:00:00.000Z"
        }
    ];
    const grid = noteGrid;
    const count = document.querySelector("#note-count");
    const resultCount = document.querySelector("#result-count");
    const searchInput = document.querySelector("#note-search");
    const emptyState = document.querySelector("#empty-state");
    const form = document.querySelector("#note-form");
    const titleInput = document.querySelector("#note-title");
    const contentInput = document.querySelector("#note-content");
    const categoryInput = document.querySelector("#note-category");
    const pageHeading = document.querySelector("#notes-heading");
    const filterButtons = document.querySelectorAll(".sidebar-item[data-filter]");
    const notesUrl = grid.dataset.notesUrl;
    let activeFilter = "all";
    let editingNoteId = null;
    let notes = starterNotes.map((note) => ({ ...note, isSample: true }));

    const storageMessage = document.createElement("p");
    storageMessage.className = "storage-note";
    storageMessage.setAttribute("role", "alert");
    storageMessage.hidden = true;
    document.querySelector(".notes-area").append(storageMessage);

    const requestNotes = async (url, options) => {
        const requestOptions = options || {};
        const method = (requestOptions.method || "GET").toUpperCase();
        const headers = { ...(requestOptions.headers || {}) };
        if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
            headers["X-CSRFToken"] = form.querySelector('input[name="csrf_token"]').value;
        }
        const response = await fetch(url, { ...requestOptions, headers });
        const result = response.status === 204 ? {} : await response.json();
        if (!response.ok) {
            throw new Error(result.error || "The notes request could not be completed.");
        }
        return result;
    };

    const showNotesError = (message, error) => {
        storageMessage.hidden = false;
        storageMessage.textContent = message;
        console.error(message, error);
    };

    const loadNotes = async () => {
        try {
            const result = await requestNotes(notesUrl);
            if (!Array.isArray(result.notes)) {
                throw new Error("The notes response was not in the expected format.");
            }
            notes = [
                ...starterNotes.map((note) => ({ ...note, isSample: true })),
                ...result.notes.map((note) => ({ ...note, isSample: false }))
            ];
            storageMessage.hidden = true;
            renderNotes();
        } catch (error) {
            showNotesError("Your saved notes could not be loaded. Please refresh to try again.", error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return "Just now";
        return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
    };

    const createNoteCard = (note) => {
        const card = document.createElement("article");
        card.className = "note-card";
        card.dataset.category = note.category;

        const header = document.createElement("div");
        header.className = "note-card-top";
        const category = document.createElement("span");
        category.className = "note-category";
        const dot = document.createElement("span");
        dot.className = "category-dot";
        dot.setAttribute("aria-hidden", "true");
        category.append(dot, document.createTextNode(note.category[0].toUpperCase() + note.category.slice(1)));
        if (note.isSample) {
            const sampleLabel = document.createElement("span");
            sampleLabel.className = "note-source";
            sampleLabel.textContent = "Sample";
            category.append(sampleLabel);
        }

        const date = document.createElement("time");
        date.className = "note-date";
        date.dateTime = note.createdAt;
        date.textContent = formatDate(note.createdAt);
        header.append(category, date);

        const heading = document.createElement("h3");
        heading.textContent = note.title;
        const content = document.createElement("p");
        content.textContent = note.content;

        const footer = document.createElement("div");
        footer.className = "note-card-footer";
        const readingTime = document.createElement("span");
        readingTime.className = "note-reading-time";
        const minutes = Math.max(1, Math.ceil(note.content.trim().split(/\s+/).filter(Boolean).length / 200));
        readingTime.textContent = `${minutes} min read`;
        footer.append(readingTime);
        if (!note.isSample) {
            const actions = document.createElement("div");
            actions.className = "note-actions";

            const editButton = document.createElement("button");
            editButton.className = "edit-note";
            editButton.type = "button";
            editButton.textContent = "Edit";
            editButton.setAttribute("aria-label", `Edit note: ${note.title}`);
            editButton.addEventListener("click", () => {
                editingNoteId = note.id;
                titleInput.value = note.title;
                contentInput.value = note.content;
                categoryInput.value = note.category;
                form.querySelector('button[type="submit"]').textContent = "Save changes";
                form.hidden = false;
                titleInput.focus();
                form.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });

            const removeButton = document.createElement("button");
            removeButton.className = "delete-note";
            removeButton.type = "button";
            removeButton.textContent = "Delete";
            removeButton.setAttribute("aria-label", `Delete note: ${note.title}`);
            removeButton.addEventListener("click", async () => {
                removeButton.disabled = true;
                try {
                    await requestNotes(`${notesUrl}/${note.id}`, { method: "DELETE" });
                    notes = notes.filter((item) => item.id !== note.id);
                    if (editingNoteId === note.id) {
                        editingNoteId = null;
                        form.reset();
                        form.hidden = true;
                        form.querySelector('button[type="submit"]').textContent = "Save note";
                    }
                    storageMessage.hidden = true;
                    renderNotes();
                } catch (error) {
                    removeButton.disabled = false;
                    showNotesError("Your note could not be deleted. Please try again.", error);
                }
            });
            actions.append(editButton, removeButton);
            footer.append(actions);
        }
        card.append(header, heading, content, footer);
        return card;
    };

    const renderNotes = () => {
        const query = searchInput.value.trim().toLocaleLowerCase();
        const filteredNotes = notes.filter((note) => {
            const matchesFilter = activeFilter === "all" || note.category === activeFilter;
            const matchesSearch = `${note.title} ${note.content} ${note.category}`.toLocaleLowerCase().includes(query);
            return matchesFilter && matchesSearch;
        });

        grid.replaceChildren(...filteredNotes.map(createNoteCard));
        count.textContent = String(notes.length);
        resultCount.textContent = `${filteredNotes.length} ${filteredNotes.length === 1 ? "note" : "notes"}`;
        emptyState.hidden = filteredNotes.length > 0;
        pageHeading.textContent = activeFilter === "all"
            ? "All notes"
            : `${activeFilter[0].toUpperCase()}${activeFilter.slice(1)} notes`;
    };

    const openComposer = () => {
        editingNoteId = null;
        form.reset();
        form.querySelector('button[type="submit"]').textContent = "Save note";
        form.hidden = false;
        titleInput.focus();
        form.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    document.querySelector("#new-note-button").addEventListener("click", openComposer);
    document.querySelector("#empty-new-note").addEventListener("click", openComposer);
    document.querySelector("#cancel-note-button").addEventListener("click", () => {
        form.reset();
        form.hidden = true;
        editingNoteId = null;
        form.querySelector('button[type="submit"]').textContent = "Save note";
    });
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        if (!title || !content) return;
        const saveButton = form.querySelector('button[type="submit"]');
        saveButton.disabled = true;
        try {
            const result = await requestNotes(
                editingNoteId === null ? notesUrl : `${notesUrl}/${editingNoteId}`,
                {
                    method: editingNoteId === null ? "POST" : "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        content,
                        category: categoryInput.value
                    })
                }
            );
            if (editingNoteId === null) {
                notes.unshift({ ...result.note, isSample: false });
            } else {
                notes = notes.map((note) =>
                    note.id === editingNoteId ? { ...result.note, isSample: false } : note
                );
            }
            storageMessage.hidden = true;
            form.reset();
            form.hidden = true;
            editingNoteId = null;
            saveButton.textContent = "Save note";
            activeFilter = "all";
            filterButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.filter === activeFilter));
            renderNotes();
        } catch (error) {
            showNotesError(error.message || "Your note could not be saved. Please try again.", error);
        } finally {
            saveButton.disabled = false;
        }
    });
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;
            filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
            renderNotes();
        });
    });
    searchInput.addEventListener("input", renderNotes);
    document.addEventListener("keydown", (event) => {
        const target = event.target;
        const isTyping = target instanceof HTMLElement &&
            (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
        if (event.key === "/" && !isTyping) {
            event.preventDefault();
            searchInput.focus();
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "n") {
            event.preventDefault();
            openComposer();
        }
    });

    renderNotes();
    loadNotes();
}

const signupForm = document.querySelector("#signup-form");

if (signupForm) {
    const password = document.querySelector("#password1");
    const confirmPassword = document.querySelector("#password2");
    const strength = document.querySelector("#password-strength");
    const strengthLabel = document.querySelector("#password-strength-label");
    const strengthNames = ["", "Weak", "Fair", "Good", "Strong"];

    const updatePasswordStrength = () => {
        const value = password.value;
        if (!value) {
            strength.dataset.strength = "0";
            strengthLabel.textContent = "Enter a password to check its strength.";
            return;
        }

        const characterTypes = [
            /[a-z]/.test(value),
            /[A-Z]/.test(value),
            /\d/.test(value),
            /[^A-Za-z0-9]/.test(value)
        ].filter(Boolean).length;
        const score = Number(value.length >= 8) +
            Number(value.length >= 12) +
            Number(characterTypes >= 3);

        strength.dataset.strength = String(score + 1);
        strengthLabel.textContent = `${strengthNames[score + 1]} password`;
    };

    const validatePasswordMatch = () => {
        confirmPassword.setCustomValidity(
            confirmPassword.value && confirmPassword.value !== password.value
                ? "Passwords do not match."
                : ""
        );
    };

    password.addEventListener("input", () => {
        updatePasswordStrength();
        validatePasswordMatch();
    });
    confirmPassword.addEventListener("input", validatePasswordMatch);
}

/* --- Accessible font-size controls --- */
(() => {
    const STORAGE_KEY = "notespace-font-scale";
    const html = document.documentElement;
    const btnInc = document.getElementById("increase-font");
    const btnDec = document.getElementById("decrease-font");

    const applyMode = (mode) => {
        html.classList.remove("ui-large", "ui-xlarge");
        if (mode === "large") html.classList.add("ui-large");
        if (mode === "xlarge") html.classList.add("ui-xlarge");
        try { localStorage.setItem(STORAGE_KEY, mode || "normal"); } catch (e) { /* ignore */ }
    };

    // initialize from storage
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === "large" || saved === "xlarge") applyMode(saved);
    } catch (e) { /* ignore */ }

    if (btnInc) {
        btnInc.addEventListener("click", () => {
            // cycle normal -> large -> xlarge
            const current = localStorage.getItem(STORAGE_KEY);
            if (current === "large") applyMode("xlarge");
            else applyMode("large");
        });
    }

    if (btnDec) {
        btnDec.addEventListener("click", () => {
            // cycle xlarge -> large -> normal
            const current = localStorage.getItem(STORAGE_KEY);
            if (current === "xlarge") applyMode("large");
            else applyMode(null);
        });
    }
})();
