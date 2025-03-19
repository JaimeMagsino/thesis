// Wait for YouTube page to be ready
window.respondWithCitation = function(start, end, reason) {
    // Switch to Add Citation tab and load the form
    document.getElementById('add-citation-btn').classList.add('active');
    document.getElementById('add-request-btn').classList.remove('active');
    loadPage("youtube_extension_citation.html", "modal-container", () => {
        // This callback runs after the form is loaded
        const form = document.getElementById('citation-form');
        if (form) {
            form.timestampStart.value = start;
            form.timestampEnd.value = end;
            form.description.value = `Response to request: ${reason}`;
            form.citationTitle.focus();
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
    insertCitationButtons();
    migrateCitationsToNewFormat();
    console.log("Extension initialized");
}

// Track video player and current time
let player = null;
let currentTime = 0;
let currentVideoId = null;
let currentCitations = [];
let currentRequests = [];
let userVotes = {};
let currentSortOption = 'likes'; // Default to likes for citations

function setupTimeTracking() {
    if (!player) return;
    
    player.addEventListener('timeupdate', () => {
        currentTime = player.currentTime;
        updateHighlighting();
        
        // Only trigger resort if there are active items
        const hasActiveItems = document.querySelectorAll('.active-citation').length > 0;
        if (hasActiveItems) {
            debouncedSortAndUpdate();
        }
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

// Update highlighting function
function updateHighlighting() {
    const citationsContainer = document.getElementById("citations-container");
    const requestsContainer = document.getElementById("citation-requests-container");
    
    // Update citations highlighting
    if (citationsContainer && citationsContainer.style.display !== 'none') {
        citationsContainer.querySelectorAll('.citation-item').forEach(citation => {
            const start = Number(citation.dataset.start);
            const end = Number(citation.dataset.end);
            const wasHighlighted = citation.classList.contains('active-citation');
            const isNowHighlighted = currentTime >= start && currentTime <= end;
            
            if (isNowHighlighted !== wasHighlighted) {
                if (isNowHighlighted) {
                    citation.classList.add('active-citation');
                    citation.style.borderColor = '#4CAF50';
                    citation.style.backgroundColor = '#E8F5E9';
                    citation.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                } else {
                    citation.classList.remove('active-citation');
                    citation.style.borderColor = '#ddd';
                    citation.style.backgroundColor = 'white';
                    citation.style.boxShadow = 'none';
                }
            }
        });
    }
    
    // Update citation requests highlighting
    if (requestsContainer && requestsContainer.style.display !== 'none') {
        requestsContainer.querySelectorAll('.citation-request').forEach(request => {
            const start = Number(request.dataset.start);
            const end = Number(request.dataset.end);
            const wasHighlighted = request.classList.contains('active-citation');
            const isNowHighlighted = currentTime >= start && currentTime <= end;
            
            if (isNowHighlighted !== wasHighlighted) {
                if (isNowHighlighted) {
                    request.classList.add('active-citation');
                    request.style.borderColor = '#2196F3';
                    request.style.backgroundColor = '#E3F2FD';
                    request.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                } else {
                    request.classList.remove('active-citation');
                    request.style.borderColor = '#ddd';
                    request.style.backgroundColor = '#f8f9fa';
                    request.style.boxShadow = 'none';
                }
            }
        });
    }
}

// Debounce function to limit the frequency of updates
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced version of the sort and update function
const debouncedSortAndUpdate = debounce(() => {
    const citationsContainer = document.getElementById("citations-container");
    const requestsContainer = document.getElementById("citation-requests-container");
    
    if (citationsContainer && citationsContainer.style.display !== 'none') {
        const sortedCitations = sortItems(currentCitations, currentSortOption, 'citation');
        updateCitationsList(sortedCitations, citationsContainer);
    }
    
    if (requestsContainer && requestsContainer.style.display !== 'none') {
        const sortedRequests = sortItems(currentRequests, currentSortOption, 'request');
        updateRequestsList(sortedRequests, requestsContainer);
    }
}, 250);

// Helper function to create citation element
function createCitationElement(citation, userVote) {
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
    
    citationElement.innerHTML = `
        <p><strong>Title:</strong> ${citation.citationTitle}</p>
        <p><strong>Time Range:</strong> 
            <a href="#" class="timestamp-link" data-time="${parseTimestamp(citation.timestampStart)}">${citation.timestampStart}</a> - 
            <a href="#" class="timestamp-link" data-time="${parseTimestamp(citation.timestampEnd)}">${citation.timestampEnd}</a>
        </p>
        <p><strong>Added by:</strong> ${citation.username}</p>
        <p><strong>Date:</strong> ${new Intl.DateTimeFormat('en-US', {
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
    
    // Add click handlers for timestamp links
    citationElement.querySelectorAll('.timestamp-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const time = parseInt(e.target.dataset.time);
            if (player && !isNaN(time)) {
                player.currentTime = time;
                player.play();
            }
        });
    });

    return citationElement;
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
            likes--;
            likeBtn.classList.remove('active');
            likeBtn.title = 'Like';
            userVotes[citationId] = null;
        } else {
            likes++;
            likeBtn.classList.add('active');
            likeBtn.title = 'Remove like';
            if (previousVote === 'dislike') {
                dislikes--;
                dislikeBtn.classList.remove('active');
                dislikeBtn.title = 'Dislike';
            }
            userVotes[citationId] = 'like';
        }
    } else {
        if (previousVote === 'dislike') {
            dislikes--;
            dislikeBtn.classList.remove('active');
            dislikeBtn.title = 'Dislike';
            userVotes[citationId] = null;
        } else {
            dislikes++;
            dislikeBtn.classList.add('active');
            dislikeBtn.title = 'Remove dislike';
            if (previousVote === 'like') {
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
        loadCitations(); // Revert UI changes on error
    }
}

// Sort items function
function sortItems(items, sortBy, itemType = 'citation') {
    if (!Array.isArray(items)) {
        console.error('sortItems received non-array:', items);
        return [];
    }
    
    // Use timestamp as default for requests, likes for citations
    if (!sortBy) {
        sortBy = itemType === 'request' ? 'timestamp' : 'likes';
    }

    // Helper function to check if an item is currently highlighted
    const isHighlighted = (item) => {
        const start = parseTimestamp(item.timestampStart);
        const end = parseTimestamp(item.timestampEnd);
        return currentTime >= start && currentTime <= end;
    };
    
    // Split items into highlighted and non-highlighted
    const highlighted = items.filter(isHighlighted);
    const normal = items.filter(item => !isHighlighted(item));
    
    // Sort function for both groups
    const sortFunction = (a, b) => {
        switch(sortBy) {
            case 'timestamp':
                const dateA = new Date(a.dateAdded || a.timestamp).getTime();
                const dateB = new Date(b.dateAdded || b.timestamp).getTime();
                return dateB - dateA;
            case 'likes':
                const likesA = parseInt(a.likes || 0);
                const likesB = parseInt(b.likes || 0);
                return likesB - likesA;
            default:
                return 0;
        }
    };

    // Sort each group separately
    const sortedHighlighted = highlighted.sort(sortFunction);
    const sortedNormal = normal.sort(sortFunction);

    // Combine the groups with highlighted items first
    return [...sortedHighlighted, ...sortedNormal];
}

function parseTimestamp(timestamp) {
    const parts = timestamp.split(':').reverse();
    let seconds = 0;
    for (let i = 0; i < parts.length; i++) {
        seconds += parseInt(parts[i]) * Math.pow(60, i);
    }
    return seconds;
}

function insertCitationButtons() {
    const secondaryElement = document.querySelector("div#secondary.style-scope.ytd-watch-flexy");
    
    if (!secondaryElement) return;
    if (document.getElementById("citation-controls")) return;
    
    const citationControls = document.createElement("div");
    citationControls.id = "citation-controls";
    citationControls.style.cssText = "background-color: #f8f9fa; padding: 10px; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; border-radius: 5px; flex-direction: column;";
    
    citationControls.innerHTML = `
        <div style="display: flex; gap: 10px; flex-direction: column; width: 100%;">
            <div style="display: flex; gap: 10px; justify-content: space-between;">
                <div style="display: flex; gap: 10px;">
                    <button id="citation-requests-btn">Citation Requests</button>
                    <button id="citations-btn">Citations</button>
                </div>
                <select id="sort-options">
                    <option value="timestamp">Sort by Date</option>
                    <option value="likes">Sort by Likes</option>
                </select>
            </div>
            <div id="citation-requests-section" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 id="citation-title-requests" style="margin: 0;">Citation Requests</h3>
                    <button id="add-request-btn" class="action-btn">Request Citation</button>
                </div>
                <div id="citation-requests-container"></div>
            </div>
            <div id="citations-section" style="display: none;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h3 id="citation-title-citations" style="margin: 0;">Citations</h3>
                    <button id="add-citation-btn" class="action-btn">Add Citation</button>
                </div>
                <div id="citations-container"></div>
            </div>
        </div>
    `;
    
    secondaryElement.prepend(citationControls);

    // Add event listeners for the new buttons
    document.getElementById("add-citation-btn").addEventListener("click", () => {
        const modalContent = `
            <div class="modal-content">
                <h2>Add Citation</h2>
                <form id="citation-form" novalidate>
                    <div class="form-group">
                        <label for="citationTitle">Title:</label>
                        <input type="text" id="citationTitle" name="citationTitle" required>
                    </div>
                    <div class="form-group">
                        <label for="timestampStart">Start Time (HH:MM:SS):</label>
                        <input type="text" id="timestampStart" name="timestampStart" required 
                               placeholder="00:00:00" pattern="^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$">
                        <small class="help-text">Enter time in format: hours:minutes:seconds (e.g., 00:05:30)</small>
                        <div class="error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="timestampEnd">End Time (HH:MM:SS):</label>
                        <input type="text" id="timestampEnd" name="timestampEnd" required 
                               placeholder="00:00:00" pattern="^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$">
                        <small class="help-text">Enter time in format: hours:minutes:seconds (e.g., 00:05:30)</small>
                        <div class="error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="description">Description:</label>
                        <textarea id="description" name="description" required></textarea>
                    </div>
                    <button type="submit">Submit Citation</button>
                </form>
            </div>
        `;
        
        // Create and show modal
        const modalContainer = createModal(modalContent);
        
        // Set up timestamp validation
        const startInput = modalContainer.querySelector('#timestampStart');
        const endInput = modalContainer.querySelector('#timestampEnd');
        setupTimestampValidation(startInput);
        setupTimestampValidation(endInput);
        
        // Set up form submission
        const form = modalContainer.querySelector('#citation-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous error messages
            form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            
            try {
                const startTime = form.timestampStart.value;
                const endTime = form.timestampEnd.value;
                
                // Validate timestamps
                if (!startTime || !endTime) {
                    throw new Error('Both start and end times are required');
                }
                
                if (!isValidTimeFormat(startTime)) {
                    const errorEl = form.querySelector('#timestampStart + .help-text + .error-message');
                    errorEl.textContent = 'Invalid time format. Use HH:MM:SS (e.g., 00:05:30)';
                    return;
                }
                
                if (!isValidTimeFormat(endTime)) {
                    const errorEl = form.querySelector('#timestampEnd + .help-text + .error-message');
                    errorEl.textContent = 'Invalid time format. Use HH:MM:SS (e.g., 00:05:30)';
                    return;
                }
                
                // Validate start time is less than end time
                const startSeconds = startTime.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0);
                const endSeconds = endTime.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0);
                
                if (startSeconds >= endSeconds) {
                    const errorEl = form.querySelector('#timestampEnd + .help-text + .error-message');
                    errorEl.textContent = 'End time must be greater than start time';
                    return;
                }
                
                const videoId = new URLSearchParams(window.location.search).get('v');
                const citationData = {
                    videoId,
                    citationTitle: form.citationTitle.value,
                    timestampStart: startTime,
                    timestampEnd: endTime,
                    description: form.description.value,
                    username: 'Anonymous',
                    dateAdded: new Date().toISOString()
                };
                
                const response = await chrome.runtime.sendMessage({
                    type: 'addCitation',
                    data: citationData
                });

                if (response.success) {
                    alert('Citation added successfully!');
                    modalContainer.remove();
                    loadCitations();
                } else {
                    throw new Error(response.error || 'Failed to add citation');
                }
            } catch (error) {
                console.error("Error adding citation:", error);
                alert('Error: ' + error.message);
            }
        });
    });

    document.getElementById("add-request-btn").addEventListener("click", () => {
        const modalContent = `
            <div class="modal-content">
                <h2>Request Citation</h2>
                <form id="request-form" novalidate>
                    <div class="form-group">
                        <label for="timestampStart">Start Time (HH:MM:SS):</label>
                        <input type="text" id="timestampStart" name="timestampStart" required 
                               placeholder="00:00:00" pattern="^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$">
                        <small class="help-text">Enter time in format: hours:minutes:seconds (e.g., 00:05:30)</small>
                        <div class="error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="timestampEnd">End Time (HH:MM:SS):</label>
                        <input type="text" id="timestampEnd" name="timestampEnd" required 
                               placeholder="00:00:00" pattern="^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$">
                        <small class="help-text">Enter time in format: hours:minutes:seconds (e.g., 00:05:30)</small>
                        <div class="error-message"></div>
                    </div>
                    <div class="form-group">
                        <label for="reason">Reason:</label>
                        <textarea id="reason" name="reason" required></textarea>
                    </div>
                    <button type="submit">Submit Request</button>
                </form>
            </div>
        `;
        
        // Create and show modal
        const modalContainer = createModal(modalContent);
        
        // Set up timestamp validation
        const startInput = modalContainer.querySelector('#timestampStart');
        const endInput = modalContainer.querySelector('#timestampEnd');
        setupTimestampValidation(startInput);
        setupTimestampValidation(endInput);
        
        // Set up form submission
        const form = modalContainer.querySelector('#request-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous error messages
            form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            
            try {
                const startTime = form.timestampStart.value;
                const endTime = form.timestampEnd.value;
                
                // Validate timestamps
                if (!startTime || !endTime) {
                    throw new Error('Both start and end times are required');
                }
                
                if (!isValidTimeFormat(startTime)) {
                    const errorEl = form.querySelector('#timestampStart + .help-text + .error-message');
                    errorEl.textContent = 'Invalid time format. Use HH:MM:SS (e.g., 00:05:30)';
                    return;
                }
                
                if (!isValidTimeFormat(endTime)) {
                    const errorEl = form.querySelector('#timestampEnd + .help-text + .error-message');
                    errorEl.textContent = 'Invalid time format. Use HH:MM:SS (e.g., 00:05:30)';
                    return;
                }
                
                // Validate start time is less than end time
                const startSeconds = startTime.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0);
                const endSeconds = endTime.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0);
                
                if (startSeconds >= endSeconds) {
                    const errorEl = form.querySelector('#timestampEnd + .help-text + .error-message');
                    errorEl.textContent = 'End time must be greater than start time';
                    return;
                }
                
                const videoId = new URLSearchParams(window.location.search).get('v');
                const requestData = {
                    videoId,
                    timestampStart: startTime,
                    timestampEnd: endTime,
                    reason: form.reason.value,
                    username: 'Anonymous',
                    timestamp: new Date().toISOString()
                };
                
                const response = await chrome.runtime.sendMessage({
                    type: 'addRequest',
                    data: requestData
                });

                if (response.success) {
                    alert('Citation request submitted successfully!');
                    modalContainer.remove();
                    loadCitationRequests();
                } else {
                    throw new Error(response.error || 'Failed to submit request');
                }
            } catch (error) {
                console.error("Error submitting request:", error);
                alert('Error: ' + error.message);
            }
        });
    });

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
    document.getElementById('sort-options').addEventListener('change', (e) => {
        currentSortOption = e.target.value;
        const citationsContainer = document.getElementById('citations-container');
        const requestsContainer = document.getElementById('citation-requests-container');
        
        // Update the current view immediately without reloading
        if (citationsContainer.style.display !== 'none') {
            const sortedCitations = sortItems(currentCitations, currentSortOption, 'citation');
            updateCitationsList(sortedCitations, citationsContainer);
        } else if (requestsContainer.style.display !== 'none') {
            const sortedRequests = sortItems(currentRequests, currentSortOption, 'request');
            updateRequestsList(sortedRequests, requestsContainer);
        }
    });

    // Set initial sort option to 'likes'
    document.getElementById('sort-options').value = 'likes';
}

// Helper function to update citations list
function updateCitationsList(citations, container) {
    if (!container) return;

    requestAnimationFrame(() => {
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        if (citations.length === 0) {
            const noCitations = document.createElement('p');
            noCitations.textContent = 'No citations yet.';
            noCitations.style.textAlign = 'center';
            noCitations.style.color = '#666';
            noCitations.style.padding = '20px';
            fragment.appendChild(noCitations);
        } else {
            citations.forEach(citation => {
                const citationElement = createCitationElement(citation, userVotes[citation.id]);
                fragment.appendChild(citationElement);
            });
        }

        container.appendChild(fragment);
        updateHighlighting();
    });
}

// Helper function to update requests list
function updateRequestsList(requests, container) {
    if (!container) return;

    requestAnimationFrame(() => {
        container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        if (requests.length === 0) {
            const noRequests = document.createElement('p');
            noRequests.textContent = 'No citation requests yet.';
            noRequests.style.textAlign = 'center';
            noRequests.style.color = '#666';
            noRequests.style.padding = '20px';
            fragment.appendChild(noRequests);
        } else {
            requests.forEach(request => {
                const requestElement = document.createElement("div");
                requestElement.className = "citation-request";
                requestElement.dataset.start = parseTimestamp(request.timestampStart);
                requestElement.dataset.end = parseTimestamp(request.timestampEnd);
                requestElement.style.cssText = `
                    border: 1px solid #ddd;
                    padding: 10px;
                    margin: 10px 0;
                    border-radius: 5px;
                    background-color: #f8f9fa;
                    transition: background-color 0.3s;
                `;
                
                requestElement.innerHTML = `
                    <div class="request-content">
                        <strong>Time Range:</strong>
                        <span class="time-range">${request.timestampStart} - ${request.timestampEnd}</span>
                        <strong>Requested by:</strong>
                        <span>${request.username}</span>
                        <strong>Date:</strong>
                        <span>${new Intl.DateTimeFormat('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }).format(new Date(request.timestamp))}</span>
                        <div class="description-area">${request.reason}</div>
                    </div>
                    <button class="respond-btn" data-start="${request.timestampStart}" data-end="${request.timestampEnd}" data-reason="${request.reason.replace(/'/g, "\\'")}">
                        Respond
                    </button>
                `;
                
                fragment.appendChild(requestElement);
            });
        }

        container.appendChild(fragment);
        updateHighlighting();
    });
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

        if (!response || !response.success) {
            throw new Error(response ? response.error : 'Failed to load requests');
        }

        const requests = response.requests || [];
        
        // Only update DOM if container is visible and data has changed
        if (container.style.display !== 'none' && JSON.stringify(requests) !== JSON.stringify(currentRequests)) {
            currentRequests = sortItems(requests, currentSortOption, 'request');
            requestAnimationFrame(() => {
                container.innerHTML = '';
                const fragment = document.createDocumentFragment();
                
                if (requests.length === 0) {
                    const noCitations = document.createElement('p');
                    noCitations.textContent = 'No citation requests yet.';
                    noCitations.style.textAlign = 'center';
                    noCitations.style.color = '#666';
                    noCitations.style.padding = '20px';
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
                            <div class="request-content">
                                <strong>Time Range:</strong>
                                <span class="time-range">${request.timestampStart} - ${request.timestampEnd}</span>
                                <strong>Requested by:</strong>
                                <span>${request.username}</span>
                                <strong>Date:</strong>
                                <span>${new Intl.DateTimeFormat('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                }).format(new Date(request.timestamp))}</span>
                                <div class="description-area">${request.reason}</div>
                            </div>
                            <button class="respond-btn" data-start="${request.timestampStart}" data-end="${request.timestampEnd}" data-reason="${request.reason.replace(/'/g, "\\'")}">
                                Respond
                            </button>
                        `;
                        
                        fragment.appendChild(citationElement);
                    });
                }

                container.appendChild(fragment);
                updateHighlighting();
            });
        }
    } catch (error) {
        console.error("Error loading citation requests:", error);
        container.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">Error loading citation requests: ${error.message}</p>`;
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
                videoId
            }),
            chrome.runtime.sendMessage({
                type: 'getUserVotes',
                videoId
            })
        ]);

        if (!citationsResponse || !citationsResponse.success) {
            throw new Error(citationsResponse ? citationsResponse.error : 'Failed to load citations');
        }

        const citations = citationsResponse.citations || [];
        const userVotes = votesResponse && votesResponse.success ? votesResponse.votes : {};
        
        if (container.style.display !== 'none' && JSON.stringify(citations) !== JSON.stringify(currentCitations)) {
            currentCitations = sortItems(citations, currentSortOption, 'citation');
            requestAnimationFrame(() => {
                container.innerHTML = '';
                const fragment = document.createDocumentFragment();
                
                if (citations.length === 0) {
                    const noCitations = document.createElement('p');
                    noCitations.textContent = 'No citations yet.';
                    noCitations.style.textAlign = 'center';
                    noCitations.style.color = '#666';
                    noCitations.style.padding = '20px';
                    fragment.appendChild(noCitations);
                } else {
                    citations.forEach(citation => {
                        const citationElement = createCitationElement(citation, userVotes[citation.id]);
                        fragment.appendChild(citationElement);
                    });
                }

                container.appendChild(fragment);
                updateHighlighting();
            });
        }
    } catch (error) {
        console.error("Error loading citations:", error);
        container.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">Error loading citations: ${error.message}</p>`;
    }
}

function switchTab(tabName) {
    // Update section visibility
    document.getElementById("citation-requests-section").style.display = tabName === "Citation Requests" ? "block" : "none";
    document.getElementById("citations-section").style.display = tabName === "Citations" ? "block" : "none";
    
    // Update button states
    document.getElementById("citation-requests-btn").classList.toggle("active", tabName === "Citation Requests");
    document.getElementById("citations-btn").classList.toggle("active", tabName === "Citations");
    
    forceUpdateTitle();
}

// Update citation requests and citations periodically
setInterval(() => {
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (videoId) {
        loadCitationRequests();
        loadCitations();
    }
}, 30000);

// Start initialization
waitForDependencies();

// Helper function to validate timestamps
function validateTimestamps(startTime, endTime) {
    const timeRegex = /^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$/;
    let errors = [];
    
    if (!timeRegex.test(startTime)) {
        errors.push('Start time must be in format HH:MM:SS (e.g., 00:05:30)');
    }
    
    if (!timeRegex.test(endTime)) {
        errors.push('End time must be in format HH:MM:SS (e.g., 00:05:30)');
    }
    
    if (errors.length > 0) {
        throw new Error(errors.join('\n'));
    }
    
    // Convert timestamps to seconds for comparison
    const startSeconds = startTime.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0);
    const endSeconds = endTime.split(':').reduce((acc, time) => (60 * acc) + parseInt(time), 0);
    
    if (startSeconds >= endSeconds) {
        throw new Error('Start time must be less than end time');
    }
    
    return true;
}

// Helper function to validate time format
function isValidTimeFormat(time) {
    const timeRegex = /^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$/;
    return timeRegex.test(time);
}

// Helper function to add custom validation messages for timestamp inputs
function setupTimestampValidation(input) {
    input.addEventListener('invalid', (e) => {
        e.preventDefault();
        input.setCustomValidity('Please enter time in format HH:MM:SS (e.g., 00:05:30)');
    });
    
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        if (!value) {
            input.setCustomValidity('Time is required');
        } else if (!isValidTimeFormat(value)) {
            input.setCustomValidity('Please enter time in format HH:MM:SS (e.g., 00:05:30)');
        } else {
            input.setCustomValidity('');
        }
    });
}

function createModal(content) {
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    `;

    // Add modal content
    modalContainer.innerHTML = `
        <div class="modal" style="
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        ">
            <button class="close-modal" style="
                position: absolute;
                right: 10px;
                top: 10px;
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                padding: 5px;
            ">&times;</button>
            ${content}
        </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .modal-content {
            padding: 20px;
        }
        .modal-content h2 {
            margin-bottom: 20px;
            color: #333;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #555;
        }
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .form-group textarea {
            min-height: 100px;
            resize: vertical;
        }
        button[type="submit"] {
            background-color: #065fd4;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            font-size: 16px;
            margin-top: 10px;
        }
        button[type="submit"]:hover {
            background-color: #0056b3;
        }
        .help-text {
            color: #666;
            font-size: 12px;
            margin-top: 4px;
            display: block;
        }
        .error-message {
            color: #dc3545;
            font-size: 12px;
            margin-top: 4px;
            display: block;
        }
    `;
    document.head.appendChild(style);

    // Add to document
    document.body.appendChild(modalContainer);

    // Add close button functionality
    const closeBtn = modalContainer.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modalContainer.remove();
    });

    // Close modal when clicking outside
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            modalContainer.remove();
        }
    });

    return modalContainer;
}
