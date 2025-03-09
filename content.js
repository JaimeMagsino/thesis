function insertBelowTitle() {
    const titleElement = document.querySelector("h1.style-scope.ytd-watch-metadata");

    if (!titleElement) return;
    if (document.getElementById("custom-extension-element")) return;

    const newElement = document.createElement("div");
    newElement.id = "custom-extension-element";
    newElement.style.cssText = "background-color: #f0f0f0; padding: 10px; margin-top: 5px;";

    newElement.innerHTML = `
        <h3>Citation Controls</h3>
        <button id="add-citation-btn" class="tab-btn active">Add Citation</button>
        <button id="request-citation-btn" class="tab-btn">Request for Citation</button>
        
        <div id="citation-container"></div>
    `;

    titleElement.parentNode.insertBefore(newElement, titleElement.nextSibling);

    // Load "Add Citation" by default
    loadPage("youtube_extension_citation.html", "citation-container");

    // Add event listeners for tab switching
    document.getElementById('add-citation-btn').addEventListener('click', () => {
        loadPage("youtube_extension_citation.html", "citation-container");
    });

    document.getElementById('request-citation-btn').addEventListener('click', () => {
        loadPage("youtube_extension_request.html", "citation-container");
    });
}



// Function to switch between Add Citation and Request for Citation
function showPage(sectionId, buttonId) {
    const allSections = document.querySelectorAll("#citation-container > div");

    allSections.forEach(section => {
        section.style.display = "none";
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = "block";
    }

    // Update active button styling
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById(buttonId).classList.add("active");
}


function loadPage(url, containerId) {
    fetch(chrome.runtime.getURL(url))
        .then(response => response.text())
        .then(html => {
            document.getElementById(containerId).innerHTML = html;

            // Inject CSS dynamically
            const styleLink = document.createElement("link");
            styleLink.rel = "stylesheet";
            styleLink.href = chrome.runtime.getURL("youtube_extension_style.css");
            document.head.appendChild(styleLink);

            // Setup form listeners
            setupFormListeners();
        })
        .catch(error => console.error("Error loading citation form:", error));
}

function setupFormListeners() {
    const form = document.getElementById('citation-form');
    if (form && !form.dataset.listener) {
        form.dataset.listener = "true";
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Citation Submitted!');
            form.reset();
        });
    }

    const requestForm = document.getElementById('request-form');
    if (requestForm && !requestForm.dataset.listener) {
        requestForm.dataset.listener = "true";
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Citation Request Submitted!');
            requestForm.reset();
        });
    }
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
                <option value="rating">Sort by Highest Rated</option>
                <option value="date">Sort by Date</option>
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

function getCurrentVideoTimestamp() {
    const video = document.querySelector("video");
    return video ? video.currentTime : 0;
}


function loadCitationRequests() {
    const container = document.getElementById("citation-requests-container");
    container.innerHTML = "";

    const currentTimestamp = getCurrentVideoTimestamp();

    const sampleRequests = [
        {
            username: "UserA",
            dateRequested: "2025-03-07",
            timestampStart: "00:00:30",
            timestampEnd: "00:01:00",
            reason: "Fact-check needed on historical claim",
            youtubeLink: "https://youtube.com/watch?v=sample1"
        },
        {
            username: "UserB",
            dateRequested: "2025-03-07",
            timestampStart: "00:00:35",
            timestampEnd: "00:03:00",
            reason: "Verify scientific statement",
            youtubeLink: "https://youtube.com/watch?v=sample2"
        },
        {
            username: "UserC",
            dateRequested: "2025-03-07",
            timestampStart: "00:00:20",
            timestampEnd: "00:06:00",
            reason: "Check source for political statement",
            youtubeLink: "https://youtube.com/watch?v=sample3"
        }
    ];

    // Sort by most recent timestampStart, prioritizing those within the timestamp range
    sampleRequests.sort((a, b) => {
        const aStart = timeToSeconds(a.timestampStart);
        const bStart = timeToSeconds(b.timestampStart);
        const aInRange = isInTimestampRange(a);
        const bInRange = isInTimestampRange(b);

        // Prioritize in-range timestamps, then sort by most recent start time
        if (aInRange && !bInRange) return -1;
        if (!aInRange && bInRange) return 1;
        return bStart - aStart; // Sort by most recent timestampStart
    });

    sampleRequests.forEach(request => {
        const requestElement = document.createElement("div");
        requestElement.style.cssText = `
            border: 1px solid #ddd; 
            padding: 10px; 
            margin: 5px 0; 
            background: ${isInTimestampRange(request) ? '#fffae6' : '#fff'}; 
        `;
        requestElement.innerHTML = `
            <p><strong>Username:</strong> ${request.username}</p>
            <p><strong>Date Requested:</strong> ${request.dateRequested}</p>
            <p><strong>Timestamp Start:</strong> ${request.timestampStart}</p>
            <p><strong>Timestamp End:</strong> ${request.timestampEnd}</p>
            <p><strong>Reason:</strong> ${request.reason}</p>
            <p><strong>Video:</strong> <a href="${request.youtubeLink}" target="_blank">${request.youtubeLink}</a></p>
            <button class="cite-btn">Cite</button>
        `;

        const citeButton = requestElement.querySelector(".cite-btn");
        citeButton.addEventListener("click", () => handleCitationRequest(request));

        container.appendChild(requestElement);
    });
}

// Helper function to check if a request is within the current timestamp range
function isInTimestampRange(request) {
    const currentTimestamp = getCurrentVideoTimestamp();
    const startTime = timeToSeconds(request.timestampStart);
    const endTime = timeToSeconds(request.timestampEnd);
    return currentTimestamp >= startTime && currentTimestamp <= endTime;
}


// Helper function to check if a request is within the current timestamp
function isInTimestampRange(request) {
    const currentTimestamp = getCurrentVideoTimestamp();
    const startTime = timeToSeconds(request.timestampStart);
    const endTime = timeToSeconds(request.timestampEnd);
    return currentTimestamp >= startTime && currentTimestamp <= endTime;
}



function timeToSeconds(time) {
    const parts = time.split(":").map(Number);
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
}




function handleCitationRequest(request) {
    console.log("Citation Request Selected:", request);

    // Switch to "Add Citation" tab
    document.getElementById("add-citation-btn").click(); 

   
    setTimeout(() => {
        const startTimestampField = document.getElementById("timestamp1");
        const endTimestampField = document.getElementById("timestamp2");
        const citationContentField = document.getElementById("citation-content");

        if (startTimestampField) startTimestampField.value = request.timestampStart;
        if (endTimestampField) endTimestampField.value = request.timestampEnd;
        if (citationContentField) citationContentField.value = `Reason: ${request.reason}`;
    }, 300); 
}


function loadCitations() {
    const container = document.getElementById("citations-container");
    container.innerHTML = "";

    const currentTimestamp = getCurrentVideoTimestamp();

    const sampleCitations = [
        {
            username: "Scholar456",
            datePosted: "2025-03-05",
            timestampStart: "00:00:15",
            timestampEnd: "00:04:00",
            reasonForCitation: "This claim lacks credible sources and needs verification.",
            likes: 15,
            dislikes: 2,
            citationSource: "https://example.com/source",
            youtubeLink: "https://youtube.com/watch?v=sample2"
        },
        {
            username: "Researcher789",
            datePosted: "2025-03-06",
            timestampStart: "00:00:30",
            timestampEnd: "00:02:00",
            reasonForCitation: "Statistical data needs verification.",
            likes: 10,
            dislikes: 3,
            citationSource: "https://example.com/data",
            youtubeLink: "https://youtube.com/watch?v=sample3"
        },
        {
            username: "Expert101",
            datePosted: "2025-03-07",
            timestampStart: "00:00:20",
            timestampEnd: "00:06:30",
            reasonForCitation: "Claim is misleading, needs context.",
            likes: 25,
            dislikes: 1,
            citationSource: "https://example.com/context",
            youtubeLink: "https://youtube.com/watch?v=sample4"
        }
    ];

    // Sort by most recent timestampStart, prioritizing those within the timestamp range
    sampleCitations.sort((a, b) => {
        const aStart = timeToSeconds(a.timestampStart);
        const bStart = timeToSeconds(b.timestampStart);
        const aInRange = isInTimestampRange(a);
        const bInRange = isInTimestampRange(b);

        // Prioritize in-range citations, then sort by most recent start time
        if (aInRange && !bInRange) return -1;
        if (!aInRange && bInRange) return 1;
        return bStart - aStart; // Sort by most recent timestampStart
    });

    sampleCitations.forEach(citation => {
        const citationElement = document.createElement("div");
        citationElement.style.cssText = `
            border: 1px solid #ddd; 
            padding: 10px; 
            margin: 5px 0; 
            background: ${isInTimestampRange(citation) ? '#fffae6' : '#fff'}; 
        `;
        citationElement.innerHTML = `
            <p><strong>Username:</strong> ${citation.username}</p>
            <p><strong>Date Posted:</strong> ${citation.datePosted}</p>
            <p><strong>Timestamp Start:</strong> ${citation.timestampStart}</p>
            <p><strong>Timestamp End:</strong> ${citation.timestampEnd}</p>
            <p><strong>Reason for Citation:</strong> ${citation.reasonForCitation}</p>
            <p><strong>Likes:</strong> ${citation.likes}</p>
            <p><strong>Dislikes:</strong> ${citation.dislikes}</p>
            <p><strong>Source:</strong> <a href="${citation.citationSource}" target="_blank">${citation.citationSource}</a></p>
            <p><strong>Video:</strong> <a href="${citation.youtubeLink}" target="_blank">${citation.youtubeLink}</a></p>
        `;

        container.appendChild(citationElement);
    });
}

setInterval(() => {
    loadCitationRequests();
    loadCitations();
}, 1000); // Updates every 1 seconds


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
