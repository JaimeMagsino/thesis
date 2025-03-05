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
    forceUpdateTitle();
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
        <div id="citations-container" style="display: none;"></div>
    `;
    
    secondaryElement.prepend(citationControls);

    document.getElementById("citation-requests-btn").addEventListener("click", () => {
        switchTab("Citation Requests");
        loadCitationRequests();
    });
    document.getElementById("citations-btn").addEventListener("click", () => {
        switchTab("Citations");
        loadCitations();
    });
    document.getElementById("sort-options").addEventListener("change", (event) => sortCitations(event.target.value));

    // Automatically show the Citation Requests tab
    switchTab("Citation Requests");
    loadCitationRequests();
}

function switchTab(tabName) {
    document.getElementById("citation-title").textContent = tabName;
    document.getElementById("citation-requests-container").style.display = tabName === "Citation Requests" ? "block" : "none";
    document.getElementById("citations-container").style.display = tabName === "Citations" ? "block" : "none";
    forceUpdateTitle();
}

function loadCitationRequests() {
    const container = document.getElementById("citation-requests-container");
    container.innerHTML = "";

    const sampleData = [
        {
            username: "Researcher123",
            dateRequested: "2025-03-01",
            timestampStart: "00:01:30",
            timestampEnd: "00:02:00",
            reason: "Need credible source for this claim",
            status: "Pending"
        },
        {
            username: "Scholar789",
            dateRequested: "2025-03-02",
            timestampStart: "00:05:45",
            timestampEnd: "00:06:30",
            reason: "Requesting verification of statistics",
            status: "Pending"
        }
    ];

    sampleData.forEach(request => {
        const requestElement = document.createElement("div");
        requestElement.style.cssText = "border: 1px solid #ddd; padding: 10px; margin: 5px 0; background: #fff;";
        requestElement.innerHTML = `
            <p><strong>Username:</strong> ${request.username}</p>
            <p><strong>Date Requested:</strong> ${request.dateRequested}</p>
            <p><strong>Timestamp Start:</strong> ${request.timestampStart}</p>
            <p><strong>Timestamp End:</strong> ${request.timestampEnd}</p>
            <p><strong>Reason:</strong> ${request.reason}</p>
            <p><strong>Status:</strong> ${request.status}</p>
        `;
        container.appendChild(requestElement);
    });
}

function loadCitations() {
    const container = document.getElementById("citations-container");
    container.innerHTML = "";
    
    const sampleData = [
        {
            username: "Scholar456",
            datePosted: "2025-03-05",
            timestampStart: "00:03:15",
            timestampEnd: "00:04:00",
            reasonForCitation: "This claim lacks credible sources and needs verification.",
            likes: 15,
            dislikes: 2,
            source: "According to a study by Example University, this claim is unsubstantiated. Here's the link: https://example.com/source"
        },
        {
            username: "Researcher789",
            datePosted: "2025-03-06",
            timestampStart: "00:10:00",
            timestampEnd: "00:11:00",
            reasonForCitation: "The statistics mentioned here seem outdated.",
            likes: 8,
            dislikes: 1,
            source: "I found a more recent study that contradicts this claim. Check it out here: https://example.com/new-study"
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
            <p><strong>Reason for Citation:</strong> ${citation.reasonForCitation}</p>
            <p><strong>Likes:</strong> ${citation.likes}</p>
            <p><strong>Dislikes:</strong> ${citation.dislikes}</p>
            <p><strong>Source:</strong> ${citation.source}</p>
        `;
        container.appendChild(citationElement);
    });
}

function forceUpdateTitle() {
    const titleElement = document.getElementById("citation-title");
    if (titleElement) {
        titleElement.textContent = titleElement.textContent;
    }
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

const watchForTitle = setInterval(() => {
    const titleContainer = document.querySelector("ytd-watch-metadata");
    if (titleContainer) {
        clearInterval(watchForTitle);
        debouncedInsertBelowTitle();
        debouncedInsertCitationButtons();
    }
}, 500);
