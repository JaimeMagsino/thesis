// Wait for YouTube page to be ready
window.respondWithCitation = function(start, end, reason) {
    // Switch to Add Citation tab and load the form
    document.getElementById('add-citation-btn').classList.add('active');
    document.getElementById('request-citation-btn').classList.remove('active');
    loadPage("youtube_extension_citation.html", "citation-container", () => {
        // This callback runs after the form is loaded
        const form = document.getElementById('citation-form');
        if (form) {
            form.timestampStart.value = start;
            form.timestampEnd.value = end;
            form.description.value = `Response to request: ${reason}`;
            form.source.focus();
        }
    });
};

function waitForDependencies() {
    const checkPage = setInterval(() => {
        const titleContainer = document.querySelector("ytd-watch-metadata");
        if (titleContainer) {
            clearInterval(checkPage);
            init();
            console.log("YouTube page ready, initializing extension");
        }
    }, 100);
}

function init() {
    insertBelowTitle();
    insertCitationButtons();
    console.log("Extension initialized");
}

// Start initialization
waitForDependencies();

function insertBelowTitle() {
    const titleElement = document.querySelector("h1.style-scope.ytd-watch-metadata");
    console.log("Attempting to insert below title");

    if (!titleElement) {
        console.log("Title element not found");
        return;
    }
    if (document.getElementById("custom-extension-element")) {
        console.log("Extension element already exists");
        return;
    }

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
    console.log("Extension element inserted");

    // Load "Add Citation" by default
    loadPage("youtube_extension_citation.html", "citation-container");

    // Add event listeners for tab switching
    document.getElementById('add-citation-btn').addEventListener('click', () => {
        document.getElementById('add-citation-btn').classList.add('active');
        document.getElementById('request-citation-btn').classList.remove('active');
        loadPage("youtube_extension_citation.html", "citation-container");
    });

    document.getElementById('request-citation-btn').addEventListener('click', () => {
        document.getElementById('add-citation-btn').classList.remove('active');
        document.getElementById('request-citation-btn').classList.add('active');
        loadPage("youtube_extension_request.html", "citation-container");
    });
}

function loadPage(url, containerId, callback = null) {
    fetch(chrome.runtime.getURL(url))
        .then(response => response.text())
        .then(html => {
            document.getElementById(containerId).innerHTML = html;
            setupFormListeners();
            if (callback) callback();
        })
        .catch(error => console.error("Error loading form:", error));
}

async function setupFormListeners() {
    const form = document.getElementById('citation-form');
    if (form && !form.dataset.listener) {
        form.dataset.listener = "true";
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const videoId = new URLSearchParams(window.location.search).get('v');
            
            try {
                const citationData = {
                    videoId,
                    source: form.source.value,
                    timestampStart: form.timestampStart.value,
                    timestampEnd: form.timestampEnd.value,
                    description: form.description.value,
                    username: 'Anonymous', // Replace with actual user authentication
                    dateAdded: new Date().toISOString()
                };
                
                const response = await chrome.runtime.sendMessage({
                    type: 'addCitation',
                    data: citationData
                });

                if (response.success) {
                    alert('Citation added successfully!');
                    form.reset();
                    loadCitations();
                } else {
                    throw new Error(response.error);
                }
            } catch (error) {
                console.error("Error adding citation:", error);
                alert('Error adding citation. Please try again.');
            }
        });
    }

    const requestForm = document.getElementById('request-form');
    if (requestForm && !requestForm.dataset.listener) {
        requestForm.dataset.listener = "true";
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const videoId = new URLSearchParams(window.location.search).get('v');
            
            try {
                // Get current timestamp in ISO format
                const currentTime = new Date().toISOString();
                
                const requestData = {
                    videoId,
                    timestampStart: requestForm.timestampStart.value,
                    timestampEnd: requestForm.timestampEnd.value,
                    reason: requestForm.reason.value,
                    username: 'Anonymous',
                    timestamp: currentTime // Use consistent timestamp field name
                };

                console.log('Submitting request with data:', requestData);
                
                const response = await chrome.runtime.sendMessage({
                    type: 'addRequest',
                    data: requestData
                });

                if (response.success) {
                    alert('Citation request submitted successfully!');
                    requestForm.reset();
                    // Refresh the requests list if it's visible
                    const requestsContainer = document.getElementById('citation-requests-container');
                    if (requestsContainer) {
                        loadCitationRequests();
                    }
                } else {
                    throw new Error(response.error);
                }
            } catch (error) {
                console.error("Error submitting citation request:", error);
                alert('Error submitting request. Please try again.');
            }
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
                <option value="timestamp">Sort by Date</option>
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

async function loadCitationRequests() {
    const container = document.getElementById("citation-requests-container");
    if (!container) {
        console.log("Citation requests container not found");
        return;
    }

    const videoId = new URLSearchParams(window.location.search).get('v');
    
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'getRequests',
            videoId
        });

        if (!response.success) {
            throw new Error(response.error);
        }

        currentRequests = response.requests;
        console.log('Received requests:', currentRequests);
        
        container.innerHTML = currentRequests.length === 0 
            ? '<p>No citation requests yet.</p>'
            : currentRequests.map(request => {
                console.log('Processing request:', request);
                // Safely format the date with fallback
                let formattedDate;
                try {
                    const date = new Date(request.timestamp);
                    if (isNaN(date.getTime())) {
                        console.error('Invalid date from timestamp:', request.timestamp);
                        formattedDate = 'Date not available';
                    } else {
                        formattedDate = new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }).format(date);
                    }
                } catch (error) {
                    console.error('Error formatting date:', error);
                    formattedDate = 'Date not available';
                }

                return `
                    <div class="citation-request" style="border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px; background-color: #f8f9fa;">
                        <p><strong>Timestamp:</strong> ${request.timestampStart} - ${request.timestampEnd}</p>
                        <p><strong>Reason:</strong> ${request.reason}</p>
                        <p><strong>Requested by:</strong> ${request.username}</p>
                        <p><strong>Date:</strong> ${formattedDate}</p>
                        <button class="respond-btn" data-start="${request.timestampStart}" data-end="${request.timestampEnd}" data-reason="${request.reason.replace(/'/g, "\\'")}">
                            Respond with Citation
                        </button>
                    </div>
                `;
            }).join('');
        
        // Attach click event listeners to all "Respond with Citation" buttons
        container.querySelectorAll('.respond-btn').forEach(button => {
            button.addEventListener('click', () => {
                const start = button.getAttribute('data-start');
                const end = button.getAttribute('data-end');
                const reason = button.getAttribute('data-reason');
                respondWithCitation(start, end, reason);
            });
        });

    } catch (error) {
        console.error("Error loading citation requests:", error);
        container.innerHTML = '<p>Error loading citation requests: ' + error.message + '</p>';
    }
}

async function loadCitations() {
    const container = document.getElementById("citations-container");
    if (!container) {
        console.log("Citations container not found");
        return;
    }

    const videoId = new URLSearchParams(window.location.search).get('v');
    console.log("Loading citations for video:", videoId);

    try {
        const response = await chrome.runtime.sendMessage({
            type: 'getCitations',
            videoId: videoId
        });

        if (!response.success) {
            throw new Error(response.error);
        }

        const citations = response.citations || [];
        
        // Check if data has changed
        if (JSON.stringify(citations) === JSON.stringify(currentCitations)) {
            return; // No changes, skip update
        }
        currentCitations = citations;
        
        // Create new content
        const fragment = document.createDocumentFragment();
        
        if (citations.length === 0) {
            const noCitations = document.createElement('p');
            noCitations.textContent = 'No citations found for this video.';
            fragment.appendChild(noCitations);
        } else {
            citations.forEach(citation => {
                const citationElement = document.createElement("div");
                citationElement.style.cssText = `
                    border: 1px solid #ddd;
                    padding: 10px;
                    margin-bottom: 10px;
                    border-radius: 5px;
                    background-color: white;
                `;
                
                citationElement.innerHTML = `
                    <p><strong>Source:</strong> ${citation.source}</p>
                    <p><strong>Time Range:</strong> ${citation.timestampStart} - ${citation.timestampEnd}</p>
                    <p><strong>Added by:</strong> ${citation.username}</p>
                    <p><strong>Date Added:</strong> ${new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }).format(new Date(citation.dateAdded))}</p>
                    <p>${citation.description}</p>
                `;
                
                fragment.appendChild(citationElement);
            });
        }

        // Only update DOM if container is visible
        if (container.style.display !== 'none') {
            requestAnimationFrame(() => {
                container.innerHTML = '';
                container.appendChild(fragment);
            });
        }
    } catch (error) {
        console.error("Error loading citations:", error);
        if (!container.hasChildNodes()) {
            container.innerHTML = '<p>Error loading citations. Please try again later.</p>';
        }
    }
}

// Cache for current data to prevent unnecessary updates
let currentCitations = [];
let currentRequests = [];

function forceUpdateTitle() {
    const titleElement = document.getElementById("citation-title");
    if (titleElement) {
        titleElement.style.display = 'none';
        setTimeout(() => titleElement.style.display = 'block', 0);
    }
}

// Update citation requests and citations periodically with longer interval
setInterval(() => {
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (videoId) {
        loadCitationRequests();
        loadCitations();
    }
}, 30000); // Updates every 30 seconds instead of 5 seconds
