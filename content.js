let quickRecordState = {
    start: null,
    end: null
};

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
            form.citationTitle.focus();
        }
    });
};

window.respondWithCitationRequest = function(start, end, reason) {
    // Switch to Request Citation tab and load the request form
    document.getElementById('request-citation-btn').classList.add('active');
    document.getElementById('add-citation-btn').classList.remove('active');
    loadPage("youtube_extension_request.html", "citation-container", () => {
        const form = document.getElementById('request-form');
        if (form) {
            form.timestampStart.value = start;
            form.timestampEnd.value = end;
            form.reason.value = reason;
            form.focus(); // Focus on the form so the user can enter details
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

// Function to check if theater mode is active
function isTheaterMode() {
    const player = document.querySelector('ytd-watch-flexy');
    return player && player.hasAttribute('theater');
}

// Callback function for MutationObserver
function mutationCallback(mutationsList) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'theater') {
            if (isTheaterMode()) {
                console.log('Theater mode activated');

                const playerContainer = document.querySelector('#ytd-player');
                const ccDiv = document.querySelector("#citation-controls");
                playerContainer.appendChild(ccDiv); // appendChild moves the existing element
                ccDiv.style.position = 'absolute';
                ccDiv.style.top = '30%'; // Position % relative to the top of the container; adjust as needed
                ccDiv.style.right = '0';
                ccDiv.style.zIndex = '999'; // High z-index so it floats above everything else
            } else {
                console.log('Theater mode deactivated');
                
                const ccDiv = document.querySelector("#citation-controls");
                ccDiv.removeAttribute('style');
                const secondaryElement = document.querySelector("div#secondary.style-scope.ytd-watch-flexy");
                secondaryElement.insertBefore(ccDiv, secondaryElement.firstChild); // insertBefore moves the existing element
            }
        }
    }
}

function observeTheaterMode() {
    const observer = new MutationObserver(mutationCallback);

    // Start observing the player element for attribute changes
    const playerElement = document.querySelector('ytd-watch-flexy');
    if (playerElement) {
        observer.observe(playerElement, { attributes: true });
    }
}

function init() {
    insertBelowTitle();
    insertCitationButtons();
    migrateCitationsToNewFormat();
    console.log("Extension initialized");
    observeTheaterMode();
}

// Start initialization
waitForDependencies();

// Helper function to display a custom modal dialog for quick record choice
function showQuickRecordChoiceDialog() {
    return new Promise((resolve) => {
        // Create overlay div
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '9999';

        // Create dialog div
        const dialog = document.createElement('div');
        dialog.style.backgroundColor = 'white';
        dialog.style.padding = '20px';
        dialog.style.borderRadius = '5px';
        dialog.style.textAlign = 'center';
        dialog.innerHTML = `<p>Choose an action:</p>`;

        // Create buttons
        const citationBtn = document.createElement('button');
        citationBtn.textContent = 'Citation';
        citationBtn.style.marginRight = '10px';

        const requestBtn = document.createElement('button');
        requestBtn.textContent = 'Request';

        // Append buttons to dialog, then dialog to overlay
        dialog.appendChild(citationBtn);
        dialog.appendChild(requestBtn);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Event listeners for buttons
        citationBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('citation');
        });
        requestBtn.addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve('request');
        });
    });
}

function insertBelowTitle() {
    const titleElement = document.querySelector("h1.style-scope.ytd-watch-metadata");
    console.log("Attempting to insert below title");

    if (!titleElement) {
        console.log("Title element not found");
        return;
    }
    // If the custom extension element already exists, we could optionally update it
    // or reattach the quick-record event listener.
    let customElement = document.getElementById("custom-extension-element");
    if (!customElement) {
        customElement = document.createElement("div");
        customElement.id = "custom-extension-element";
        customElement.className = "custom-extension-element";

        customElement.innerHTML = `
            <div class="header-container">
                <h3>Citation Controls</h3>
            </div>
            <button id="add-citation-btn" class="tab-btn active">Add Citation</button>
            <button id="request-citation-btn" class="tab-btn">Request for Citation</button>
            <button id="quick-record-btn" class="tab-btn">Record Citation</button>
            <div id="citation-container"></div>
        `;
        titleElement.parentNode.insertBefore(customElement, titleElement.nextSibling);
        console.log("Extension element inserted");
    }
    
    // Attach event listeners
    const addCitationBtn = document.getElementById('add-citation-btn');
    const requestCitationBtn = document.getElementById('request-citation-btn');
    const quickRecordBtn = document.getElementById('quick-record-btn');

    if (addCitationBtn) {
        addCitationBtn.addEventListener('click', () => {
            addCitationBtn.classList.add('active');
            requestCitationBtn.classList.remove('active');
            loadPage("youtube_extension_citation.html", "citation-container");
        });
    }
    
    if (requestCitationBtn) {
        requestCitationBtn.addEventListener('click', () => {
            addCitationBtn.classList.remove('active');
            requestCitationBtn.classList.add('active');
            loadPage("youtube_extension_request.html", "citation-container");
        });
    }
    
    // Safely attach the Quick Record button listener
    if (quickRecordBtn) {
        quickRecordBtn.addEventListener('click', async () => {
            // Ensure the video player is available
            if (!player) {
                alert("Video player not found.");
                return;
            }
            const currentTimeSec = Math.floor(player.currentTime);
            const formattedTime = formatTimestamp(currentTimeSec);

            // If no start is recorded, record start timestamp
            if (quickRecordState.start === null) {
                quickRecordState.start = formattedTime;
                quickRecordBtn.textContent = `Start Recorded: ${formattedTime} – Click again to record end`;
            } else {
                // Record end timestamp
                quickRecordState.end = formattedTime;
                // Validate: end must be later than start
                if (timeToSeconds(quickRecordState.end) <= timeToSeconds(quickRecordState.start)) {
                    alert("End time must be later than start time. Please try again.");
                    quickRecordState.end = null;
                    return;
                }
                
                // Show custom dialog for choice
                const choice = await showQuickRecordChoiceDialog();
                if (choice === 'citation') {
                    window.respondWithCitation(quickRecordState.start, quickRecordState.end, "");
                } else if (choice === 'request') {
                    window.respondWithCitationRequest(quickRecordState.start, quickRecordState.end, "");
                }
                
                // Reset state and button text
                quickRecordState = { start: null, end: null };
                quickRecordBtn.textContent = "Quick Record Citation";
            }
        });
    } else {
        console.error("Quick Record button not found!");
    }
}

// Convert seconds to HH:MM:SS
function formatTimestamp(totalSeconds) {
    const pad = (num) => num.toString().padStart(2, '0');
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Convert HH:MM:SS to seconds
function timeToSeconds(timeStr) {
    return timeStr.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
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
            
            // Validate timestamp format
            const timestampRegex = /^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$/;
            const startTime = form.timestampStart.value;
            const endTime = form.timestampEnd.value;

            if (!timestampRegex.test(startTime) || !timestampRegex.test(endTime)) {
                alert('Please enter timestamps in the format HH:MM:SS (e.g., 00:15:30)');
                return;
            }

            // Compare timestamps
            const startSeconds = startTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const endSeconds = endTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);

            if (startSeconds >= endSeconds) {
                alert('Start timestamp must be less than end timestamp');
                return;
            }
            
            try {
                const citationData = {
                    videoId,
                    citationTitle: form.citationTitle.value,
                    timestampStart: startTime,
                    timestampEnd: endTime,
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
            
            // Validate timestamp format
            const timestampRegex = /^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$/;
            const startTime = requestForm.timestampStart.value;
            const endTime = requestForm.timestampEnd.value;

            if (!timestampRegex.test(startTime) || !timestampRegex.test(endTime)) {
                alert('Please enter timestamps in the format HH:MM:SS (e.g., 00:15:30)');
                return;
            }

            // Compare timestamps
            const startSeconds = startTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
            const endSeconds = endTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);

            if (startSeconds >= endSeconds) {
                alert('Start timestamp must be less than end timestamp');
                return;
            }
            
            try {
                // Get current timestamp in ISO format
                const currentTime = new Date().toISOString();
                
                const requestData = {
                    videoId,
                    timestampStart: startTime,
                    timestampEnd: endTime,
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

// Handle voting on requests
async function handleRequestVote(requestId, voteType) {
    const videoId = new URLSearchParams(window.location.search).get('v');
    const voteControls = document.querySelector(`.request-vote-controls[data-request-id="${requestId}"]`);
    const voteScoreElement = voteControls.querySelector('.vote-score');
    const upvoteBtn = voteControls.querySelector('.upvote-btn');
    const downvoteBtn = voteControls.querySelector('.downvote-btn');

    // Get current vote score
    let voteScore = parseInt(voteScoreElement.textContent);

    // Get previous vote
    const storageKey = `request_votes_${videoId}`;
    const userVotes = await new Promise(resolve => {
        chrome.storage.local.get(storageKey, (result) => {
            resolve(result[storageKey] || {});
        });
    });
    const previousVote = userVotes[requestId];

    // Update score and UI based on the vote
    if (voteType === 'up') {
        if (previousVote === 'up') {
            // Remove upvote
            voteScore--;
            upvoteBtn.classList.remove('active');
            upvoteBtn.title = 'Upvote';
            userVotes[requestId] = null;
        } else {
            // Upvote
            voteScore++;
            if (previousVote === 'down') {
                // Remove previous downvote
                voteScore++;
            }
            upvoteBtn.classList.add('active');
            downvoteBtn.classList.remove('active');
            upvoteBtn.title = 'Remove upvote';
            downvoteBtn.title = 'Downvote';
            userVotes[requestId] = 'up';
        }
    } else {
        if (previousVote === 'down') {
            // Remove downvote
            voteScore++;
            downvoteBtn.classList.remove('active');
            downvoteBtn.title = 'Downvote';
            userVotes[requestId] = null;
        } else {
            // Downvote
            voteScore--;
            if (previousVote === 'up') {
                // Remove previous upvote
                voteScore--;
            }
            downvoteBtn.classList.add('active');
            upvoteBtn.classList.remove('active');
            downvoteBtn.title = 'Downvote';
            upvoteBtn.title = 'Upvote';
            userVotes[requestId] = 'down';
        }
    }

    // Update the displayed score
    voteScoreElement.textContent = voteScore;

    try {
        // Send update to background script
        const response = await chrome.runtime.sendMessage({
            type: 'updateRequestVotes',
            videoId,
            requestId,
            voteValue: voteScore,
            userVote: userVotes[requestId]
        });

        if (!response.success) {
            throw new Error(response.error);
        }
    } catch (error) {
        console.error('Error updating votes:', error);
        // Revert UI changes on error
        loadCitationRequests();
    }
}

function insertCitationButtons() {
    const secondaryElement = document.querySelector("div#secondary.style-scope.ytd-watch-flexy");
    if (!secondaryElement) {
        console.log("Secondary element not found");
        return;
    }
    
    const citationControls = document.createElement("div");
    citationControls.id = "citation-controls";
    citationControls.className = "citation-controls";
    
    citationControls.innerHTML = `
        <div class="button-container">
            <button id="citation-requests-btn">Citation Requests</button>
            <button id="citations-btn">Citations</button>
        </div>
        <div id="citation-title-container" class="header-container">
            <h3 id="citation-title">Citations</h3>
        </div>
        <div id="citation-requests-container" class="requests-container"></div>
        <div id="citations-container" class="citations-container"></div>
    `;
    
    secondaryElement.prepend(citationControls);

    // Create and add sort select immediately
    const titleContainer = document.getElementById('citation-title-container');
    const sortSelect = createSortSelect();
    titleContainer.appendChild(sortSelect);
    sortSelect.value = currentSortOption;

    // Add event listeners for tab switching
    document.getElementById('citation-requests-btn').addEventListener('click', () => {
        document.getElementById('citations-container').style.display = 'none';
        document.getElementById('citation-requests-container').style.display = 'block';
        document.getElementById('citation-title').textContent = 'Citation Requests';
        loadCitationRequests();
    });

    document.getElementById('citations-btn').addEventListener('click', () => {
        document.getElementById('citation-requests-container').style.display = 'none';
        document.getElementById('citations-container').style.display = 'block';
        document.getElementById('citation-title').textContent = 'Citations';
        loadCitations();
    });

    // Add event listener for sort options
    sortSelect.addEventListener('change', (e) => {
        currentSortOption = e.target.value;
        const citationsContainer = document.getElementById('citations-container');
        const requestsContainer = document.getElementById('citation-requests-container');
        
        if (citationsContainer.style.display === 'block') {
            loadCitations();
        } else if (requestsContainer.style.display === 'block') {
            loadCitationRequests();
        }
    });

    // Load initial content
    document.getElementById('citations-container').style.display = 'block';
    loadCitations();
}

function createSortSelect() {
    const sortSelect = document.createElement('select');
    sortSelect.className = 'sort-select';
    sortSelect.innerHTML = `
        <option value="upvotes">Most Upvoted</option>
        <option value="recent">Sort by Recent</option>
    `;
    return sortSelect;
}

async function loadCitationRequests() {
    const container = document.getElementById("citation-requests-container");
    if (!container) {
        console.log("Citation requests container not found");
        return;
    }

    const videoId = new URLSearchParams(window.location.search).get('v');
    
    try {
        const [response, votesResponse] = await Promise.all([
            chrome.runtime.sendMessage({
                type: 'getRequests',
                videoId
            }),
            new Promise(resolve => {
                chrome.storage.local.get(`request_votes_${videoId}`, (result) => {
                    resolve(result[`request_votes_${videoId}`] || {});
                });
            })
        ]);

        if (!response.success) {
            throw new Error(response.error);
        }

        const requests = response.requests;
        const userVotes = votesResponse;
        
        // Attach user votes to requests for consistent rendering
        const requestsWithVotes = requests.map(request => ({
            ...request,
            userVote: userVotes[request.id] || null
        }));

        // Only update if data has changed
        if (JSON.stringify(requestsWithVotes) !== JSON.stringify(currentRequests)) {
            currentRequests = sortItems(requestsWithVotes, currentSortOption, 'request');
            updateRequestsList(currentRequests, container);
        }
    } catch (error) {
        console.error("Error loading citation requests:", error);
        if (container.style.display === 'block') {
            container.innerHTML = '<p>Error loading citation requests: ' + error.message + '</p>';
        }
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
                        
                        const userVote = userVotes[citation.id] || null;
                        
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
                                <button class="vote-btn upvote-btn ${userVote === 'up' ? 'active' : ''}" 
                                        title="${userVote === 'up' ? 'Remove upvote' : 'Upvote'}">
                                    <span class="vote-icon">▲</span>
                                </button>
                                <span class="vote-score">${citation.voteScore || 0}</span>
                                <button class="vote-btn downvote-btn ${userVote === 'down' ? 'active' : ''}" 
                                        title="${userVote === 'down' ? 'Remove downvote' : 'Downvote'}">
                                    <span class="vote-icon">▼</span>
                                </button>
                            </div>
                        `;

                        // Add vote event listeners
                        const voteControls = citationElement.querySelector('.vote-controls');
                        const upvoteBtn = voteControls.querySelector('.upvote-btn');
                        const downvoteBtn = voteControls.querySelector('.downvote-btn');

                        upvoteBtn.addEventListener('click', () => handleVote(citation.id, 'up'));
                        downvoteBtn.addEventListener('click', () => handleVote(citation.id, 'down'));
                        
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
    const voteScoreElement = voteControls.querySelector('.vote-score');
    const upvoteBtn = voteControls.querySelector('.upvote-btn');
    const downvoteBtn = voteControls.querySelector('.downvote-btn');

    // Get current vote score
    let voteScore = parseInt(voteScoreElement.textContent);

    // Get previous vote
    const previousVote = userVotes[citationId];

    // Update score and UI based on the vote
    if (voteType === 'up') {
        if (previousVote === 'up') {
            // Remove upvote
            voteScore--;
            upvoteBtn.classList.remove('active');
            upvoteBtn.title = 'Upvote';
            userVotes[citationId] = null;
        } else {
            // Upvote
            voteScore++;
            if (previousVote === 'down') {
                // Remove previous downvote
                voteScore++;
            }
            upvoteBtn.classList.add('active');
            downvoteBtn.classList.remove('active');
            upvoteBtn.title = 'Remove upvote';
            downvoteBtn.title = 'Downvote';
            userVotes[citationId] = 'up';
        }
    } else {
        if (previousVote === 'down') {
            // Remove downvote
            voteScore++;
            downvoteBtn.classList.remove('active');
            downvoteBtn.title = 'Downvote';
            userVotes[citationId] = null;
        } else {
            // Downvote
            voteScore--;
            if (previousVote === 'up') {
                // Remove previous upvote
                voteScore--;
            }
            downvoteBtn.classList.add('active');
            upvoteBtn.classList.remove('active');
            downvoteBtn.title = 'Downvote';
            upvoteBtn.title = 'Upvote';
            userVotes[citationId] = 'down';
        }
    }

    // Update the displayed score
    voteScoreElement.textContent = voteScore;

    try {
        // Send update to background script
        const response = await chrome.runtime.sendMessage({
            type: 'updateCitationVotes',
            videoId,
            citationId,
            voteValue: voteScore,
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

// Helper function to update citations list
function updateCitationsList(citations, container) {
    if (!container) return;
    
    // Create a map of existing citation elements
    const existingElements = new Map();
    Array.from(container.children).forEach(child => {
        if (child.classList.contains('citation-item')) {
            const citationId = child.querySelector('.vote-controls')?.dataset.citationId;
            if (citationId) existingElements.set(citationId, child);
        }
    });
    
    if (citations.length === 0) {
        container.innerHTML = '<p>No citations found for this video.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    citations.forEach(citation => {
        let citationElement;
        
        // Reuse existing element if available
        if (existingElements.has(citation.id)) {
            citationElement = existingElements.get(citation.id);
            existingElements.delete(citation.id);
        } else {
            citationElement = document.createElement("div");
            citationElement.className = "citation-item";
        }

        citationElement.dataset.start = parseTimestamp(citation.timestampStart);
        citationElement.dataset.end = parseTimestamp(citation.timestampEnd);
        
        const userVote = userVotes[citation.id] || null;
        
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
                <button class="vote-btn upvote-btn ${userVote === 'up' ? 'active' : ''}" 
                        title="${userVote === 'up' ? 'Remove upvote' : 'Upvote'}">
                    <span class="vote-icon">▲</span>
                </button>
                <span class="vote-score">${citation.voteScore || 0}</span>
                <button class="vote-btn downvote-btn ${userVote === 'down' ? 'active' : ''}" 
                        title="${userVote === 'down' ? 'Remove downvote' : 'Downvote'}">
                    <span class="vote-icon">▼</span>
                </button>
            </div>
        `;

        // Re-add event listeners
        const voteControls = citationElement.querySelector('.vote-controls');
        const upvoteBtn = voteControls.querySelector('.upvote-btn');
        const downvoteBtn = voteControls.querySelector('.downvote-btn');

        upvoteBtn.addEventListener('click', () => handleVote(citation.id, 'up'));
        downvoteBtn.addEventListener('click', () => handleVote(citation.id, 'down'));
        
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

        fragment.appendChild(citationElement);
    });

    // Remove any remaining old elements
    existingElements.forEach(element => element.remove());

    // Clear and update container
    container.innerHTML = '';
    container.appendChild(fragment);
    updateHighlighting();
}

// Helper function to update requests list
function updateRequestsList(requests, container) {
    if (!container) return;
    
    const fragment = document.createDocumentFragment();
    
    if (requests.length === 0) {
        const noRequests = document.createElement('p');
        noRequests.textContent = 'No citation requests yet.';
        fragment.appendChild(noRequests);
    } else {
        requests.forEach(request => {
            const requestElement = document.createElement("div");
            requestElement.className = "citation-request";
            requestElement.dataset.start = parseTimestamp(request.timestampStart);
            requestElement.dataset.end = parseTimestamp(request.timestampEnd);
            
            // Check if request should be highlighted
            const start = Number(requestElement.dataset.start);
            const end = Number(requestElement.dataset.end);
            const isHighlighted = currentTime >= start && currentTime <= end;
            if (isHighlighted) {
                requestElement.classList.add('active-citation');
            }

            requestElement.innerHTML = `
                <div class="request-content">
                    <strong>Time Range:</strong>
                    <span class="time-range">
                        <a href="#" class="timestamp-link" data-time="${start}">${request.timestampStart}</a>
                        -
                        <a href="#" class="timestamp-link" data-time="${end}">${request.timestampEnd}</a>
                    </span>
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
                    <div class="request-vote-controls" data-request-id="${request.id}">
                        <button class="vote-btn upvote-btn ${request.userVote === 'up' ? 'active' : ''}" 
                                title="${request.userVote === 'up' ? 'Remove upvote' : 'Upvote'}">
                            <span class="vote-icon">▲</span>
                        </button>
                        <span class="vote-score">${request.voteScore || 0}</span>
                        <button class="vote-btn downvote-btn ${request.userVote === 'down' ? 'active' : ''}" 
                                title="${request.userVote === 'down' ? 'Remove downvote' : 'Downvote'}">
                            <span class="vote-icon">▼</span>
                        </button>
                    </div>
                </div>
                <button class="respond-btn" 
                        data-start="${request.timestampStart}" 
                        data-end="${request.timestampEnd}" 
                        data-reason="${request.reason.replace(/"/g, '&quot;')}">
                    Respond with Citation
                </button>
            `;

            // Add timestamp click handlers
            requestElement.querySelectorAll('.timestamp-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    seekToTime(Number(link.dataset.time));
                });
            });

            // Add vote event listeners
            const voteControls = requestElement.querySelector('.request-vote-controls');
            const upvoteBtn = voteControls.querySelector('.upvote-btn');
            const downvoteBtn = voteControls.querySelector('.downvote-btn');

            upvoteBtn.addEventListener('click', () => handleRequestVote(request.id, 'up'));
            downvoteBtn.addEventListener('click', () => handleRequestVote(request.id, 'down'));

            fragment.appendChild(requestElement);
        });
    }

    // Only update if container is visible and content has changed
    if (container.style.display === 'block') {
        const currentContent = container.innerHTML;
        const newContent = document.createElement('div');
        newContent.appendChild(fragment.cloneNode(true));
        
        if (currentContent !== newContent.innerHTML) {
            container.innerHTML = '';
            container.appendChild(fragment);
        }
    }
}

// Update highlighting function to trigger resort when highlighting changes
function updateHighlighting() {
    const citationsContainer = document.getElementById("citations-container");
    const requestsContainer = document.getElementById("citation-requests-container");
    
    let needsResorting = false;

    // Update citations highlighting
    if (citationsContainer && citationsContainer.style.display === 'block') {
        citationsContainer.querySelectorAll('.citation-item').forEach(citation => {
            const start = Number(citation.dataset.start);
            const end = Number(citation.dataset.end);
            const wasHighlighted = citation.classList.contains('active-citation');
            const isHighlighted = currentTime >= start && currentTime <= end;
            
            if (isHighlighted !== wasHighlighted) {
                citation.classList.toggle('active-citation', isHighlighted);
                needsResorting = true;
            }
        });

        if (needsResorting) {
            const sortedCitations = sortItems(currentCitations, currentSortOption, 'citation');
            updateCitationsList(sortedCitations, citationsContainer);
        }
    }
    
    // Update citation requests highlighting
    needsResorting = false;
    if (requestsContainer && requestsContainer.style.display === 'block') {
        requestsContainer.querySelectorAll('.citation-request').forEach(request => {
            const start = Number(request.dataset.start);
            const end = Number(request.dataset.end);
            const wasHighlighted = request.classList.contains('active-citation');
            const isHighlighted = currentTime >= start && currentTime <= end;
            
            if (isHighlighted !== wasHighlighted) {
                request.classList.toggle('active-citation', isHighlighted);
                needsResorting = true;
            }
        });

        if (needsResorting) {
            const sortedRequests = sortItems(currentRequests, currentSortOption, 'request');
            updateRequestsList(sortedRequests, requestsContainer);
        }
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
}, 250); // Wait 250ms after the last call before executing

// Track video player and current time
let player = null;
let currentTime = 0;
let currentVideoId = null;

function setupTimeTracking() {
    const video = document.querySelector('video');
    if (!video) return;

    let lastTime = -1;
    const checkTime = () => {
        const newTime = Math.floor(video.currentTime);
        if (newTime !== lastTime) {
            lastTime = newTime;
            currentTime = newTime;
            requestAnimationFrame(updateHighlighting);
        }
        requestAnimationFrame(checkTime);
    };

    requestAnimationFrame(checkTime);
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

function parseTimestamp(timestamp) {
    const parts = timestamp.split(':').reverse();
    let seconds = 0;
    for (let i = 0; i < parts.length; i++) {
        seconds += parseInt(parts[i]) * Math.pow(60, i);
    }
    return seconds;
}

function seekToTime(seconds) {
    const video = document.querySelector('video');
    if (video) {
        video.currentTime = seconds;
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

// Cache for current data to prevent unnecessary updates
let currentCitations = [];
let currentRequests = [];
let userVotes = {};
let currentSortOption = 'upvotes'; // Default to upvotes for citations

// Add sort function
function sortItems(items, sortBy, itemType = 'citation') {
    if (!items || !Array.isArray(items)) return [];
    
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
        switch (sortBy) {
            case 'upvotes':
                return (b.voteScore || 0) - (a.voteScore || 0);
            case 'recent':
                return new Date(b.timestamp || b.dateAdded) - new Date(a.timestamp || a.dateAdded);
            default:
                return 0;
        }
    };

    // Sort each group separately
    const sortedHighlighted = highlighted.sort(sortFunction);
    const sortedNormal = normal.sort(sortFunction);

    // Return highlighted items first, followed by normal items
    return [...sortedHighlighted, ...sortedNormal];
}

function forceUpdateTitle() {
    const titleElement = document.getElementById("citation-title");
    if (titleElement) {
        titleElement.style.display = 'none';
        setTimeout(() => titleElement.style.display = 'block', 0);
    }
}

async function migrateCitationsToNewFormat() {
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (!videoId) return;

    try {
        const response = await chrome.runtime.sendMessage({
            type: 'migrateAllCitations',
            videoId
        });

        if (response.success) {
            console.log(`Successfully migrated ${response.migratedCount} citations`);
            // Refresh the citations list
            loadCitations();
        } else {
            console.error('Migration failed:', response.error);
        }
    } catch (error) {
        console.error('Error during migration:', error);
    }
}

// Add event listener for respond button
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('respond-btn')) {
        const start = e.target.dataset.start;
        const end = e.target.dataset.end;
        const reason = e.target.dataset.reason;
        window.respondWithCitation(start, end, reason);
    }
});
