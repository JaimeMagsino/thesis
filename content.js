function insertBelowTitle() {
    const titleElement = document.querySelector("h1.style-scope.ytd-watch-metadata");

    if (!titleElement) return; // Exit if title doesn't exist yet

    // Ensure only one instance is added
    if (document.getElementById("custom-extension-element")) return;

    const newElement = document.createElement("div");
    newElement.id = "custom-extension-element";
    newElement.style.cssText = "background-color: #f0f0f0; padding: 10px; margin-top: 5px;";

    // Add the "Add Citation" button and a hidden form container
    newElement.innerHTML = `
        <h3>Add a Citation</h3>
        <button id="add-citation-btn">Add Citation</button>
        <div id="citation-form-container" style="display: none;"></div>
    `;

    titleElement.parentNode.insertBefore(newElement, titleElement.nextSibling);

    // Add listener for the button to load the form inline
    document.getElementById('add-citation-btn').addEventListener('click', () => {
        const formContainer = document.getElementById('citation-form-container');
        if (formContainer.innerHTML === "") {
            loadCitationForm(formContainer);
        }
        formContainer.style.display = formContainer.style.display === "none" ? "block" : "none";
    });
}

// Function to load the form from youtube_extension_citation.html
function loadCitationForm(container) {
    const url = chrome.runtime.getURL("youtube_extension_citation.html");

    fetch(url)
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;

            // Add form behavior (submit, toggle views, etc.)
            setupFormListeners();
        })
        .catch(error => console.error("Error loading citation form:", error));
}

// Add listeners to the form elements
function setupFormListeners() {
    // Form Submission
    const form = document.getElementById('citation-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Citation Submitted!');
            form.reset();
        });
    }

    // Page Navigation (if you have tabs for List View, etc.)
    const addCitationBtn = document.getElementById('add-citation-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    if (addCitationBtn) {
        addCitationBtn.addEventListener('click', () => {
            document.getElementById('add-citation-page').style.display = 'block';
            document.getElementById('list-view-page').style.display = 'none';
        });
    }

    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            document.getElementById('add-citation-page').style.display = 'none';
            document.getElementById('list-view-page').style.display = 'block';
        });
    }
}

// Debounce function to limit how often insertBelowTitle is called
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Debounced version of insertBelowTitle
const debouncedInsertBelowTitle = debounce(insertBelowTitle, 300);

// MutationObserver to watch for changes in the title container
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && !document.getElementById("custom-extension-element")) {
            debouncedInsertBelowTitle();
            break; // Exit the loop once the element is inserted
        }
    }
});

// Wait for the YouTube title container to appear
const watchForTitle = setInterval(() => {
    const titleContainer = document.querySelector("ytd-watch-metadata");
    if (titleContainer) {
        clearInterval(watchForTitle); // Stop checking once found
        observer.observe(titleContainer, { childList: true, subtree: true });
        debouncedInsertBelowTitle(); // Run once immediately
    }
}, 500);
