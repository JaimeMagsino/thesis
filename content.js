function insertBelowTitle() {
    const titleElement = document.querySelector("h1.style-scope.ytd-watch-metadata");

    if (!titleElement) return;

    if (document.getElementById("custom-extension-element")) return;

    const newElement = document.createElement("div");
    newElement.id = "custom-extension-element";
    newElement.style.cssText = "background-color: #f0f0f0; padding: 10px; margin-top: 5px;";

    newElement.innerHTML = `
        <h3>Citation Controls</h3>
        <button id="add-citation-btn">Add Citation</button>
        <button id="list-view-btn">List View</button>
        <div id="citation-form-container" style="display: none;"></div>
        <div id="list-view-container" style="display: none;"></div>
    `;

    titleElement.parentNode.insertBefore(newElement, titleElement.nextSibling);

    document.getElementById('add-citation-btn').addEventListener('click', () => toggleSection('citation-form-container'));
    document.getElementById('list-view-btn').addEventListener('click', () => toggleSection('list-view-container'));
}

function toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const isActive = section.style.display === "block";
    section.style.display = isActive ? "none" : "block";

    if (!isActive) {
        if (sectionId === 'citation-form-container' && section.innerHTML === "") {
            loadCitationForm(section);
        }

        if (sectionId === 'list-view-container' && section.innerHTML === "") {
            loadListView(section);
        }
    }
}

function loadCitationForm(container) {
    const url = chrome.runtime.getURL("youtube_extension_citation.html");

    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const addNewCitationBtn = doc.getElementById('add-citation-btn');
            const listViewBtn = doc.getElementById('list-view-btn');
            if (addNewCitationBtn) addNewCitationBtn.remove();
            if (listViewBtn) listViewBtn.remove();

            container.innerHTML = doc.body.innerHTML;

            const styleLink = document.createElement("link");
            styleLink.rel = "stylesheet";
            styleLink.href = chrome.runtime.getURL("youtube_extension_style.css");
            document.head.appendChild(styleLink);

            setupFormListeners();
        })
        .catch(error => console.error("Error loading citation form:", error));
}

function insertCitationButtons() {
    const secondaryElement = document.querySelector("div#secondary.style-scope.ytd-watch-flexy");
    
    if (!secondaryElement) return;
    
    if (document.getElementById("citation-controls")) return;
    
    const citationControls = document.createElement("div");
    citationControls.id = "citation-controls";
    citationControls.style.cssText = "background-color: #f8f9fa; padding: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; border-radius: 5px; flex-direction: column;";
    
    citationControls.innerHTML = `
        <div style="display: flex; gap: 10px;">
            <button id="citation-requests-btn">Citation Requests</button>
            <button id="citations-btn">Citations</button>
            <select id="sort-options">
                <option value="date">Sort by Date</option>
                <option value="rating">Sort by Highest Rated</option>
            </select>
        </div>
        <h3 id="citation-title">Citations</h3>
        <div id="citation-requests-container" style="display: none;"></div>
    `;
    
    secondaryElement.prepend(citationControls);

    document.getElementById("citation-requests-btn").addEventListener("click", () => {
        switchTab("Citation Requests");
        loadCitationRequests();
    });
    document.getElementById("citations-btn").addEventListener("click", () => switchTab("Citations"));
    document.getElementById("sort-options").addEventListener("change", (event) => sortCitations(event.target.value));
}

function switchTab(tabName) {
    document.getElementById("citation-title").textContent = tabName;
    document.getElementById("citation-requests-container").style.display = tabName === "Citation Requests" ? "block" : "none";
}

function loadCitationRequests() {
    const container = document.getElementById("citation-requests-container");
    container.innerHTML = "";
    
    const sampleData = [
        {
            username: "User123",
            datePosted: "2025-03-05",
            timestampStart: "00:01:30",
            timestampEnd: "00:02:00",
            reason: "Incorrect historical reference"
        }
    ];

    sampleData.forEach(citation => {
        const citationElement = document.createElement("div");
        citationElement.style.cssText = "border: 1px solid #ddd; padding: 10px; margin: 5px 0; background: #fff;";
        citationElement.innerHTML = `
            <p><strong>Username:</strong> ${citation.username}</p>
            <p><strong>Date Posted:</strong> ${citation.datePosted}</p>
            <p><strong>Timestamp Start:</strong> ${citation.timestampStart}</p>
            <p><strong>Timestamp End:</strong> ${citation.timestampEnd}</p>
            <p><strong>Reason:</strong> ${citation.reason}</p>
        `;
        container.appendChild(citationElement);
    });
}

function sortCitations(sortType) {
    console.log(`Sorting citations by: ${sortType}`);
}

function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const debouncedInsertBelowTitle = debounce(insertBelowTitle, 300);
const debouncedInsertCitationButtons = debounce(insertCitationButtons, 300);

const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
            if (!document.getElementById("custom-extension-element")) {
                debouncedInsertBelowTitle();
            }
            if (!document.getElementById("citation-controls")) {
                debouncedInsertCitationButtons();
            }
            break;
        }
    }
});

const watchForTitle = setInterval(() => {
    const titleContainer = document.querySelector("ytd-watch-metadata");
    if (titleContainer) {
        clearInterval(watchForTitle);
        observer.observe(titleContainer, { childList: true, subtree: true });
        debouncedInsertBelowTitle();
        debouncedInsertCitationButtons();
    }
}, 500);
