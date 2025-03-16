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
        const videoElement = document.querySelector("video");
        if (titleContainer && videoElement) {
            clearInterval(checkPage);
            player = videoElement;
            setupTimeTracking();
            setupVideoChangeTracking();
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
                <option value="likes">Sort by Likes</option>
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

    // Add event listener for sort options
    document.getElementById('sort-options').addEventListener('change', async (e) => {
        currentSortOption = e.target.value;
        // Reload citations when sorting by likes
        if (currentSortOption === 'likes') {
            const videoId = new URLSearchParams(window.location.search).get('v');
            if (videoId) {
                try {
                    const response = await chrome.runtime.sendMessage({
                        type: 'getCitations',
                        videoId: videoId
                    });
                    if (response.success) {
                        currentCitations = response.citations || [];
                    }
                } catch (error) {
                    console.error("Error reloading citations:", error);
                }
            }
        }
        // Refresh the current view
        if (document.getElementById('citation-requests-container').style.display === 'none') {
            loadCitations();
        } else {
            loadCitationRequests();
        }
    });

    // Set initial sort option to 'likes'
    document.getElementById('sort-options').value = 'likes';
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

        const requests = response.requests;
        
        // Only update DOM if container is visible and data has changed
        if (container.style.display !== 'none' && JSON.stringify(requests) !== JSON.stringify(currentRequests)) {
            currentRequests = sortItems(requests, currentSortOption, 'request');
            requestAnimationFrame(() => {
                container.innerHTML = '';
                const fragment = document.createDocumentFragment();
                
                if (requests.length === 0) {
                    const noCitations = document.createElement('p');
                    noCitations.textContent = 'No citation requests yet.';
                    fragment.appendChild(noCitations);
                } else {
                    requests.forEach(request => {
                        const citationElement = document.createElement("div");
                        citationElement.className = "citation-request";
                        citationElement.dataset.start = parseTimestamp(request.timestampStart);
                        citationElement.dataset.end = parseTimestamp(request.timestampEnd);
                        citationElement.style.cssText = `
                            border: 1px solid #ddd;
                            padding: 10px;
                            margin: 10px 0;
                            border-radius: 5px;
                            background-color: #f8f9fa;
                            transition: background-color 0.3s;
                        `;
                        
                        citationElement.innerHTML = `
                            <p><strong>Timestamp:</strong> ${request.timestampStart} - ${request.timestampEnd}</p>
                            <p><strong>Reason:</strong> ${request.reason}</p>
                            <p><strong>Requested by:</strong> ${request.username}</p>
                            <p><strong>Date:</strong> ${new Intl.DateTimeFormat('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            }).format(new Date(request.timestamp))}</p>
                            <button class="respond-btn" data-start="${request.timestampStart}" data-end="${request.timestampEnd}" data-reason="${request.reason.replace(/'/g, "\\'")}">
                                Respond with Citation
                            </button>
                        `;
                        
                        fragment.appendChild(citationElement);
                    });
                }

                container.appendChild(fragment);
                updateHighlighting(); // Re-apply highlighting after update
            });
        }
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
        // Get citations and user votes in parallel
        const [citationsResponse, votesResponse] = await Promise.all([
            chrome.runtime.sendMessage({
                type: 'getCitations',
                videoId: videoId
            }),
            chrome.runtime.sendMessage({
                type: 'getUserVotes',
                videoId: videoId
            })
        ]);

        if (!citationsResponse.success) {
            throw new Error(citationsResponse.error);
        }

        const citations = citationsResponse.citations || [];
        userVotes = votesResponse.success ? votesResponse.votes : {};
        
        // Sort the citations before updating the DOM
        const sortedCitations = sortItems(citations, currentSortOption, 'citation');
        
        // Only update DOM if container is visible and data has changed
        if (container.style.display !== 'none' && JSON.stringify(sortedCitations) !== JSON.stringify(currentCitations)) {
            currentCitations = sortedCitations;

            requestAnimationFrame(() => {
                container.innerHTML = '';
                const fragment = document.createDocumentFragment();
                
                if (sortedCitations.length === 0) {
                    const noCitations = document.createElement('p');
                    noCitations.textContent = 'No citations found for this video.';
                    fragment.appendChild(noCitations);
                } else {
                    sortedCitations.forEach(citation => {
                        const citationElement = document.createElement("div");
                        citationElement.className = "citation-item";
                        citationElement.dataset.start = parseTimestamp(citation.timestampStart);
                        citationElement.dataset.end = parseTimestamp(citation.timestampEnd);
                        citationElement.style.cssText = `
                            border: 1px solid #ddd;
                            padding: 10px;
                            margin-bottom: 10px;
                            border-radius: 5px;
                            background-color: white;
                            transition: background-color 0.3s;
                        `;

                        const userVote = userVotes[citation.id] || null;
                        
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
                            <div class="vote-controls" data-citation-id="${citation.id}">
                                <button class="vote-btn like-btn ${userVote === 'like' ? 'active' : ''}" 
                                        title="${userVote === 'like' ? 'Remove like' : 'Like'}">
                                    <span class="vote-icon">👍</span>
                                    <span class="vote-count">${citation.likes || 0}</span>
                                </button>
                                <button class="vote-btn dislike-btn ${userVote === 'dislike' ? 'active' : ''}" 
                                        title="${userVote === 'dislike' ? 'Remove dislike' : 'Dislike'}">
                                    <span class="vote-icon">👎</span>
                                    <span class="vote-count">${citation.dislikes || 0}</span>
                                </button>
                            </div>
                        `;

                        // Add vote event listeners
                        const voteControls = citationElement.querySelector('.vote-controls');
                        const likeBtn = voteControls.querySelector('.like-btn');
                        const dislikeBtn = voteControls.querySelector('.dislike-btn');

                        likeBtn.addEventListener('click', () => handleVote(citation.id, 'like'));
                        dislikeBtn.addEventListener('click', () => handleVote(citation.id, 'dislike'));
                        
                        fragment.appendChild(citationElement);
                    });
                }

                container.appendChild(fragment);
                updateHighlighting(); // Re-apply highlighting after update
            });
        }
    } catch (error) {
        console.error("Error loading citations:", error);
        if (!container.hasChildNodes()) {
            container.innerHTML = '<p>Error loading citations. Please try again later.</p>';
        }
    }
    loadCitationRequests();
}

// Handle voting on citations
async function handleVote(citationId, voteType) {
    const videoId = new URLSearchParams(window.location.search).get('v');
    const voteControls = document.querySelector(`.vote-controls[data-citation-id="${citationId}"]`);
    const likeBtn = voteControls.querySelector('.like-btn');
    const dislikeBtn = voteControls.querySelector('.dislike-btn');
    const likeCount = likeBtn.querySelector('.vote-count');
    const dislikeCount = dislikeBtn.querySelector('.vote-count');

    // Get current vote counts
    let likes = parseInt(likeCount.textContent);
    let dislikes = parseInt(dislikeCount.textContent);

    // Get previous vote
    const previousVote = userVotes[citationId];

    // Update counts and UI based on the vote
    if (voteType === 'like') {
        if (previousVote === 'like') {
            // Unlike
            likes--;
            likeBtn.classList.remove('active');
            likeBtn.title = 'Like';
            userVotes[citationId] = null;
        } else {
            // Like
            likes++;
            likeBtn.classList.add('active');
            likeBtn.title = 'Remove like';
            if (previousVote === 'dislike') {
                // Remove previous dislike
                dislikes--;
                dislikeBtn.classList.remove('active');
                dislikeBtn.title = 'Dislike';
            }
            userVotes[citationId] = 'like';
        }
    } else {
        if (previousVote === 'dislike') {
            // Remove dislike
            dislikes--;
            dislikeBtn.classList.remove('active');
            dislikeBtn.title = 'Dislike';
            userVotes[citationId] = null;
        } else {
            // Dislike
            dislikes++;
            dislikeBtn.classList.add('active');
            dislikeBtn.title = 'Remove dislike';
            if (previousVote === 'like') {
                // Remove previous like
                likes--;
                likeBtn.classList.remove('active');
                likeBtn.title = 'Like';
            }
            userVotes[citationId] = 'dislike';
        }
    }

    // Update the displayed counts
    likeCount.textContent = likes;
    dislikeCount.textContent = dislikes;

    try {
        // Send update to background script
        const response = await chrome.runtime.sendMessage({
            type: 'updateCitationVotes',
            videoId,
            citationId,
            votes: { likes, dislikes },
            userVote: userVotes[citationId]
        });

        if (!response.success) {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error('Error updating votes:', error);
        // Revert UI changes on error
        loadCitations();
    }
}

// Cache for current data to prevent unnecessary updates
let currentCitations = [];
let currentRequests = [];
let userVotes = {};
let currentSortOption = 'likes'; // Default to likes for citations

// Add sort function
function sortItems(items, sortBy, itemType = 'citation') {
    if (!Array.isArray(items)) {
        console.error('sortItems received non-array:', items);
        return [];
    }
    
    // Use timestamp as default for requests, likes for citations
    if (!sortBy) {
        sortBy = itemType === 'request' ? 'timestamp' : 'likes';
    }
    
    return [...items].sort((a, b) => {
        switch(sortBy) {
            case 'timestamp':
                return new Date(b.dateAdded || b.timestamp) - new Date(a.dateAdded || a.timestamp);
            case 'likes':
                const likesA = parseInt(a.likes || 0);
                const likesB = parseInt(b.likes || 0);
                return likesB - likesA;
            default:
                return 0;
        }
    });
}

function forceUpdateTitle() {
    const titleElement = document.getElementById("citation-title");
    if (titleElement) {
        titleElement.style.display = 'none';
        setTimeout(() => titleElement.style.display = 'block', 0);
    }
}

// Track video player and current time
let player = null;
let currentTime = 0;
let currentVideoId = null;

function setupTimeTracking() {
    if (!player) return;
    
    player.addEventListener('timeupdate', () => {
        currentTime = player.currentTime;
        updateHighlighting();
    });
}

function setupVideoChangeTracking() {
    // Listen for YouTube's navigation events
    window.addEventListener('yt-navigate-start', () => {
        console.log("YouTube navigation started");
    });

    window.addEventListener('yt-navigate-finish', () => {
        const newVideoId = new URLSearchParams(window.location.search).get('v');
        if (newVideoId && newVideoId !== currentVideoId) {
            console.log("Video changed to:", newVideoId);
            currentVideoId = newVideoId;
            // Reset current time
            currentTime = 0;
            // Wait for a short moment to ensure the new video player is ready
            setTimeout(() => {
                // Find the new video player
                const newPlayer = document.querySelector("video");
                if (newPlayer) {
                    player = newPlayer;
                    setupTimeTracking();
                }
                // Update lists for new video
                loadCitationRequests();
                loadCitations();
            }, 500);
        }
    });

    // Also check for initial video ID
    currentVideoId = new URLSearchParams(window.location.search).get('v');
}

function updateHighlighting() {
    const citationsContainer = document.getElementById("citations-container");
    const requestsContainer = document.getElementById("citation-requests-container");
    
    // Update citations highlighting
    if (citationsContainer && citationsContainer.style.display !== 'none') {
        citationsContainer.querySelectorAll('.citation-item').forEach(citation => {
            const start = Number(citation.dataset.start);
            const end = Number(citation.dataset.end);
            if (currentTime >= start && currentTime <= end) {
                citation.classList.add('active-citation');
            } else {
                citation.classList.remove('active-citation');
            }
        });
    }
    
    // Update citation requests highlighting
    if (requestsContainer && requestsContainer.style.display !== 'none') {
        requestsContainer.querySelectorAll('.citation-request').forEach(request => {
            const start = Number(request.dataset.start);
            const end = Number(request.dataset.end);
            if (currentTime >= start && currentTime <= end) {
                request.classList.add('active-citation');
            } else {
                request.classList.remove('active-citation');
            }
        });
    }
}

function parseTimestamp(timestamp) {
    const parts = timestamp.split(':').reverse();
    let seconds = 0;
    for (let i = 0; i < parts.length; i++) {
        seconds += parseInt(parts[i]) * Math.pow(60, i);
    }
    return seconds;
}

// Update citation requests and citations periodically with longer interval
setInterval(() => {
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (videoId) {
        loadCitationRequests();
        loadCitations();
    }
}, 30000); // Updates every 30 seconds instead of 5 seconds
