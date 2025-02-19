function insertBelowTitle() {
    const titleElement = document.querySelector("h1.style-scope.ytd-watch-metadata");

    if (!titleElement) return; // Exit if title doesn't exist yet

    // Ensure only one instance is added
    if (document.getElementById("custom-extension-element")) return;

    const newElement = document.createElement("div");
    newElement.id = "custom-extension-element";
    newElement.style.cssText = "background-color: #f0f0f0; padding: 10px; margin-top: 5px;";

    // Add "Add Citation" and "List View" buttons side by side
    newElement.innerHTML = `
        <h3>Citation Controls</h3>
        <button id="add-citation-btn">Add Citation</button>
        <button id="list-view-btn">List View</button>
        <div id="citation-form-container" style="display: none;"></div>
        <div id="list-view-container" style="display: none;"></div>
    `;

    titleElement.parentNode.insertBefore(newElement, titleElement.nextSibling);

    // Add listeners for buttons
    document.getElementById('add-citation-btn').addEventListener('click', () => toggleSection('citation-form-container'));
    document.getElementById('list-view-btn').addEventListener('click', () => toggleSection('list-view-container'));
}

// Function to toggle visibility of sections
function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    section.style.display = section.style.display === "none" ? "block" : "none";

    if (sectionId === 'citation-form-container' && section.innerHTML === "") {
        loadCitationForm(section);
    }

    if (sectionId === 'list-view-container' && section.innerHTML === "") {
        loadListView(section);
    }
}

// Load the citation form
function loadCitationForm(container) {
    const url = chrome.runtime.getURL("youtube_extension_citation.html");

    fetch(url)
        .then(response => response.text())
        .then(html => {
            // Remove extra buttons from the loaded HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Remove "Add a New Citation" and "List View" buttons
            const addNewCitationBtn = doc.getElementById('add-citation-btn');
            const listViewBtn = doc.getElementById('list-view-btn');
            if (addNewCitationBtn) addNewCitationBtn.remove();
            if (listViewBtn) listViewBtn.remove();

            container.innerHTML = doc.body.innerHTML;
            setupFormListeners();
        })
        .catch(error => console.error("Error loading citation form:", error));
}

// Placeholder for loading list view
function loadListView(container) {
    container.innerHTML = `<h3>Citation List View</h3><p>This will display all added citations.</p>`;
}

// Add listeners to the form elements
function setupFormListeners() {
    const form = document.getElementById('citation-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Citation Submitted!');
            form.reset();
        });
    }
}

// Debounce function
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedInsertBelowTitle = debounce(insertBelowTitle, 300);

// MutationObserver to watch for changes
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && !document.getElementById("custom-extension-element")) {
            debouncedInsertBelowTitle();
            break;
        }
    }
});

// Wait for the YouTube title container to appear
const watchForTitle = setInterval(() => {
    const titleContainer = document.querySelector("ytd-watch-metadata");
    if (titleContainer) {
        clearInterval(watchForTitle);
        observer.observe(titleContainer, { childList: true, subtree: true });
        debouncedInsertBelowTitle();
    }
}, 500);
