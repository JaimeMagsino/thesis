// Wait for YouTube page to be ready
window.respondWithCitation = function(start, end, reason, title = '') {
    // Switch to citations tab first
    document.getElementById('citations-btn').click();
    
    // Show the add citation form by clicking the add button
    const addItemBtn = document.getElementById('add-item-btn');
    if (addItemBtn && document.getElementById('add-form-container').style.display === 'none') {
        addItemBtn.click();
    }
    
    // Load the citation form and populate it
    loadPage("youtube_extension_citation.html", "add-form-container", () => {
        const form = document.getElementById('citation-form');
        if (form) {
            // Get form field elements
            const titleField = form.querySelector('#citationTitle');
            const startField = form.querySelector('#timestampStart');
            const endField = form.querySelector('#timestampEnd');
            const descriptionField = form.querySelector('#description');
            const sourceField = form.querySelector('#source');

            // Set values if the fields exist
            if (titleField) titleField.value = title;
            if (startField) startField.value = start;
            if (endField) endField.value = end;
            if (descriptionField) descriptionField.value = reason;
            if (sourceField) sourceField.value = '';

            // Focus on title if empty, otherwise on description
            if (title) {
                descriptionField?.focus();
            } else {
                titleField?.focus();
            }

            initializeCitationForm();
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
                ccDiv.style.top = '10%'; // Position % relative to the top of the container; adjust as needed
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

function insertBelowTitle() {
    // This function is no longer needed as we're removing the controls from below title
    return;
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
            <h3 id="citation-title" class="section-title">Citations</h3>
        </div>
        <div class="header-actions">
            <button id="add-item-btn" class="add-btn">+ Add Citation</button>
            <div class="sort-container">
                <button class="sort-button">
                    <span class="sort-icon">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                        <path d="M21,6H3V5h18V6z M15,11H3v1h12V11z M9,17H3v1h6V17z" fill="currentColor"></path>
                    </svg>
                    </span>
                    <span class="sort-text">Sort by</span>
                    <span class="sort-caret">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                            <path d="M7 10l5 5 5-5z" fill="currentColor"></path>
                        </svg>
                    </span>
                </button>
                <div class="sort-menu" style="display: none;">
                    <button class="sort-menu-item" data-value="upvotes">
                        <span class="sort-menu-text">Most Upvoted</span>
                        <span class="sort-check">✓</span>
                    </button>
                    <button class="sort-menu-item" data-value="recent">
                        <span class="sort-menu-text">Newest first</span>
                    </button>
                </div>
            </div>
        </div>
        <div id="add-form-container" style="display: none;"></div>
        <div id="citations-container"></div>
        <div id="citation-requests-container"></div>
    `;
    
    secondaryElement.prepend(citationControls);

    // Set initial state and load citations
    const citationsBtn = document.getElementById('citations-btn');
    citationsBtn.classList.add('active');
    document.getElementById('citations-container').style.display = 'block';
    document.getElementById('citation-requests-container').style.display = 'none';
    loadCitations(); // Load citations immediately

    // Add event listeners for tab buttons
    document.getElementById('citation-requests-btn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('citations-btn').classList.remove('active');
        document.getElementById('citation-title').textContent = 'Citation Requests';
        document.getElementById('citations-container').style.display = 'none';
        document.getElementById('citation-requests-container').style.display = 'block';
        document.getElementById('add-item-btn').textContent = '+ Add Request';
        // Close form when switching tabs
        document.getElementById('add-form-container').style.display = 'none';
        loadCitationRequests();
    });

    document.getElementById('citations-btn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('citation-requests-btn').classList.remove('active');
        document.getElementById('citation-title').textContent = 'Citations';
        document.getElementById('citations-container').style.display = 'block';
        document.getElementById('citation-requests-container').style.display = 'none';
        document.getElementById('add-item-btn').textContent = '+ Add Citation';
        // Close form when switching tabs
        document.getElementById('add-form-container').style.display = 'none';
        loadCitations();
    });

    // Add event listeners for add button
    document.getElementById('add-item-btn').addEventListener('click', () => {
        const formContainer = document.getElementById('add-form-container');
        const isRequestsTab = document.getElementById('citation-requests-container').style.display === 'block';
        
        if (formContainer.style.display === 'none') {
            formContainer.style.display = 'block';
            if (isRequestsTab) {
                loadPage("youtube_extension_request.html", "add-form-container", () => {
                    initializeRequestForm();
                });
            } else {
                loadPage("youtube_extension_citation.html", "add-form-container", () => {
                    initializeCitationForm();
                });
            }
        } else {
            formContainer.style.display = 'none';
        }
    });

    // Handle sort button click
    const sortButton = document.querySelector('.sort-button');
    const sortMenu = document.querySelector('.sort-menu');
    sortButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = sortMenu.style.display === 'block';
        sortMenu.style.display = isVisible ? 'none' : 'block';
        sortButton.classList.toggle('active');
    });

    // Handle sort menu item clicks
    sortMenu.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.sort-menu-item');
        if (menuItem) {
            const value = menuItem.dataset.value;
            currentSortOption = value;
            sortMenu.querySelectorAll('.sort-menu-item').forEach(item => {
                item.innerHTML = `
                    <span class="sort-menu-text">${item.dataset.value === 'upvotes' ? 'Most Upvoted' : 'Newest first'}</span>
                    ${item.dataset.value === value ? '<span class="sort-check">✓</span>' : ''}
                `;
            });
            sortMenu.style.display = 'none';
            sortButton.classList.remove('active');
            const citationsContainer = document.getElementById('citations-container');
            const requestsContainer = document.getElementById('citation-requests-container');
            if (citationsContainer.style.display === 'block') {
                loadCitations();
            } else if (requestsContainer.style.display === 'block') {
                loadCitationRequests();
            }
        }
    });

    // Close sort menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sort-container')) {
            sortMenu.style.display = 'none';
            sortButton.classList.remove('active');
        }
    });

    // Initialize the record button functionality
    setupRecordButtons();
}

// Setup Record Buttons to toggle recording and capture timestamps
function setupRecordButtons() {
    const playerControls = document.querySelector('.ytp-right-controls');
    if (!playerControls || document.querySelector('.record-start-btn')) return;

    // Create start record button
    const startRecordBtn = document.createElement('button');
    startRecordBtn.className = 'ytp-button record-start-btn';
    startRecordBtn.title = 'Start Recording';
    startRecordBtn.innerHTML = `
        <svg height="100%" viewBox="0 0 36 36" width="100%">
            <circle cx="18" cy="18" r="10" fill="#ff0000"/>
        </svg>
    `;

    // Create end record button (initially hidden)
    const endRecordBtn = document.createElement('button');
    endRecordBtn.className = 'ytp-button record-end-btn';
    endRecordBtn.title = 'End Recording';
    endRecordBtn.style.display = 'none';
    endRecordBtn.innerHTML = `
        <svg height="100%" viewBox="0 0 36 36" width="100%">
            <path d="M 13 13 L 23 23 M 13 23 L 23 13" stroke="#ff0000" stroke-width="2"/>
        </svg>
    `;

    let recordStartTime = null;

    startRecordBtn.addEventListener('click', () => {
        recordStartTime = player.currentTime;
        startRecordBtn.style.display = 'none';
        endRecordBtn.style.display = '';
        startRecordBtn.classList.add('recording-active');
    });

    endRecordBtn.addEventListener('click', () => {
        const recordEndTime = player.currentTime;
        startRecordBtn.style.display = '';
        endRecordBtn.style.display = 'none';
        startRecordBtn.classList.remove('recording-active');
        
        if (recordStartTime !== null && recordEndTime > recordStartTime) {
            addRecordedSegment(recordStartTime, recordEndTime);
        }
        recordStartTime = null;
    });

    // Insert buttons before the autoplay button
    const autoplayBtn = playerControls.querySelector('.ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"]');
    if (autoplayBtn) {
        playerControls.insertBefore(endRecordBtn, autoplayBtn);
        playerControls.insertBefore(startRecordBtn, endRecordBtn);
    } else {
        playerControls.appendChild(endRecordBtn);
        playerControls.appendChild(startRecordBtn);
    }
}

// Function to create and manage recorded segments panel
function setupRecordedSegmentsPanel() {
    // Create panel if it doesn't exist
    let panel = document.querySelector('.recorded-segments-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'recorded-segments-panel collapsed';
        panel.innerHTML = `
            <button class="toggle-btn">◀</button>
            <div class="panel-content">
                <h3>Recorded Segments</h3>
                <div class="segments-container"></div>
            </div>
        `;
        document.body.appendChild(panel);

        // Setup toggle button
        const toggleBtn = panel.querySelector('.toggle-btn');
        toggleBtn.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
            toggleBtn.textContent = panel.classList.contains('collapsed') ? '▶' : '◀';
        });
    }
    return panel;
}

// Function to add a new recorded segment
function addRecordedSegment(startTime, endTime) {
    const panel = setupRecordedSegmentsPanel();
    const container = panel.querySelector('.segments-container');
    const segment = document.createElement('div');
    segment.className = 'recorded-segment';
    
    const formattedStart = formatTime(Math.floor(startTime));
    const formattedEnd = formatTime(Math.floor(endTime));
    
    segment.innerHTML = `
        <div class="time-range">${formattedStart} - ${formattedEnd}</div>
        <div class="actions">
            <button class="cite-btn">Add Citation</button>
            <button class="request-btn">Add Request</button>
            <button class="delete-btn">Delete</button>
        </div>
    `;

    // Add event listeners
    segment.querySelector('.time-range').addEventListener('click', () => {
        player.currentTime = startTime;
    });

    segment.querySelector('.cite-btn').addEventListener('click', () => {
        document.getElementById('citations-btn').click();
        document.getElementById('add-item-btn').click();
        // Wait for form to load
        setTimeout(() => {
            const form = document.getElementById('citation-form');
            if (form) {
                form.timestampStart.value = formattedStart;
                form.timestampEnd.value = formattedEnd;
                form.citationTitle.focus();
                console.log('Citation form loaded with start:', formattedStart, 'and end:', formattedEnd);
                initializeCitationForm();
            } else {
                console.error("Citation form not found!");
            }
        }, 100);
        // Collapse panel to show form
        panel.classList.add('collapsed');
        const toggleBtn = document.querySelector('.toggle-btn');
        if (toggleBtn) toggleBtn.textContent = '▶';
    });

    segment.querySelector('.request-btn').addEventListener('click', () => {
        document.getElementById('citation-requests-btn').click();
        document.getElementById('add-item-btn').click();
        // Wait for form to load
        setTimeout(() => {
            const form = document.getElementById('request-form');
            if (form) {
                form.timestampStart.value = formattedStart;
                form.timestampEnd.value = formattedEnd;
                form.reason.focus();
                console.log('Request form loaded with start:', formattedStart, 'and end:', formattedEnd);
            } else {
                console.error("Request form not found!");
            }
        }, 100);
        // Collapse panel to show form
        panel.classList.add('collapsed');
        const toggleBtn = document.querySelector('.toggle-btn');
        if (toggleBtn) toggleBtn.textContent = '▶';
    });

    segment.querySelector('.delete-btn').addEventListener('click', () => {
        segment.remove();
    });

    container.appendChild(segment);
    panel.classList.remove('collapsed');
    const toggleBtn = document.querySelector('.toggle-btn');
    if (toggleBtn) toggleBtn.textContent = '◀';
}

// Utility function to format seconds into HH:MM:SS
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [hrs, mins, secs]
      .map(v => v < 10 ? "0" + v : v)
      .join(":");
}

// Function to show quick-action buttons for Citation and Request tasks
function showQuickTaskButtons(startTime, endTime) {
    // Create or clear a container for the quick task buttons
    let quickTaskContainer = document.getElementById('quick-task-container');
    if (!quickTaskContainer) {
        quickTaskContainer = document.createElement('div');
        quickTaskContainer.id = 'quick-task-container';
        quickTaskContainer.style.marginTop = '10px';
        // Append the container to the citation controls container
        const citationControls = document.getElementById('citation-controls');
        if (citationControls) {
            citationControls.appendChild(quickTaskContainer);
        } else {
            console.error('Citation controls container not found!');
            return;
        }
    } else {
        quickTaskContainer.innerHTML = '';
    }
    
    // Create the Citation quick task button
    const citationQuickBtn = document.createElement('button');
    citationQuickBtn.textContent = 'Citation';
    citationQuickBtn.className = 'action-btn';
    citationQuickBtn.addEventListener('click', () => {
        // Switch to the Citation tab by simulating a click
        const citationsTab = document.getElementById('citations-btn');
        if (citationsTab) {
            citationsTab.click();
        } else {
            console.error('Citations tab button not found!');
        }
        
        // Ensure the form container is visible
        const formContainer = document.getElementById('add-form-container');
        if (formContainer) {
            formContainer.style.display = 'block';
        } else {
            console.error('Form container not found!');
        }
        
        // Load the citation form and pre-fill the timestamps
        loadPage("youtube_extension_citation.html", "add-form-container", () => {
            const form = document.getElementById('citation-form');
            if (form) {
                form.timestampStart.value = startTime;
                form.timestampEnd.value = endTime;
                form.citationTitle.focus();
                console.log('Citation form loaded with start:', startTime, 'and end:', endTime);
                initializeCitationForm();
            } else {
                console.error("Citation form not found!");
            }
        });
        quickTaskContainer.innerHTML = '';
    });
    
    // Create the Request quick task button
    const requestQuickBtn = document.createElement('button');
    requestQuickBtn.textContent = 'Request';
    requestQuickBtn.className = 'action-btn';
    requestQuickBtn.addEventListener('click', () => {
        // Switch to the Citation Requests tab by simulating a click
        const requestsTab = document.getElementById('citation-requests-btn');
        if (requestsTab) {
            requestsTab.click();
        } else {
            console.error('Citation Requests tab button not found!');
        }
        
        // Ensure the form container is visible
        const formContainer = document.getElementById('add-form-container');
        if (formContainer) {
            formContainer.style.display = 'block';
        } else {
            console.error('Form container not found!');
        }
        
        // Load the request form and pre-fill the timestamps
        loadPage("youtube_extension_request.html", "add-form-container", () => {
            const form = document.getElementById('request-form');
            if (form) {
                form.timestampStart.value = startTime;
                form.timestampEnd.value = endTime;
                form.reason.focus();
                console.log('Request form loaded with start:', startTime, 'and end:', endTime);
            } else {
                console.error("Request form not found!");
            }
        });
        quickTaskContainer.innerHTML = '';
    });
    
    // Append both buttons to the quick task container
    quickTaskContainer.appendChild(citationQuickBtn);
    quickTaskContainer.appendChild(requestQuickBtn);
}

function init() {
    insertCitationButtons();
    observeTheaterMode();
    
    // Initialize forms if they exist
    const citationForm = document.getElementById('citation-form');
    if (citationForm) {
        initializeCitationForm();
    }
    const requestForm = document.getElementById('request-form');
    if (requestForm) {
        initializeRequestForm();
    }
}

// Function to initialize citation form
async function initializeCitationForm() {
    console.log('Initializing citation form...');
    await setupAnonymousCheckbox();
    
    // Re-check if the form exists after async operation
    const form = document.getElementById('citation-form');
    if (form) {
        console.log('Setting up citation form listeners');
        setupFormListeners();
    } else {
        console.log('Citation form not found after initialization');
    }
}

// Function to initialize request form
async function initializeRequestForm() {
    console.log('Initializing request form...');
    // Removed anonymous checkbox from request form
    // await setupAnonymousCheckbox();
    
    // Re-check if the form exists after async operation
    const form = document.getElementById('request-form');
    if (form) {
        console.log('Setting up request form listeners');
        setupFormListeners();
    } else {
        console.log('Request form not found after initialization');
    }
}

// Function to get YouTube username
async function getYouTubeUsername() {
    try {
        // Try to get the handle from ytd-topbar-menu-button-renderer which contains account info
        const accountInfo = document.querySelector('ytd-topbar-menu-button-renderer');
        if (!accountInfo) {
            console.log('Account info element not found - user likely not logged in');
            return null;
        }

        // Access YouTube's internal API through the element
        if (accountInfo.__data && accountInfo.__data.data) {
            const accountData = accountInfo.__data.data;
            if (accountData.channelHandle) {
                console.log('Found user handle from YouTube API:', accountData.channelHandle);
                return accountData.channelHandle.startsWith('@') ? 
                    accountData.channelHandle : 
                    `@${accountData.channelHandle}`;
            }
        }

        // Method 2: Try to get from the page without opening menu
        const possibleElements = [
            document.querySelector("ytd-guide-entry-renderer[line-end-style='handle'] #guide-entry-title"),
            document.querySelector('yt-formatted-string#channel-handle'),
            document.querySelector('[id="channel-handle"]')
        ];

        for (const element of possibleElements) {
            if (element && element.textContent) {
                const handle = element.textContent.trim();
                if (handle.startsWith('@')) {
                    console.log('Found user handle from page:', handle);
                    return handle;
                }
            }
        }

        // Method 3 (Last Resort): Quick menu open/close
        console.log('Attempting quick menu open to get handle...');
        const avatarButton = document.querySelector('ytd-masthead button#avatar-btn');
        if (!avatarButton) return null;

        let foundHandle = null;
        
        try {
            // Create a promise that will resolve when we find the handle
            const handlePromise = new Promise((resolve) => {
                let timeoutId;
                
                const observer = new MutationObserver((mutations, obs) => {
                    const menuHandle = document.querySelector('ytd-active-account-header-renderer yt-formatted-string#channel-handle');
                    if (menuHandle && menuHandle.textContent) {
                        const handle = menuHandle.textContent.trim();
                        if (handle.startsWith('@')) {
                            clearTimeout(timeoutId);
                            obs.disconnect();
                            resolve(handle);
                        }
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: false,
                    characterData: false
                });

                // Set a very short timeout
                timeoutId = setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, 300); // 300ms maximum wait

                // Click to open
                avatarButton.click();
            });

            foundHandle = await handlePromise;
        } finally {
            // Always ensure menu is closed, even if there was an error
            const isMenuOpen = document.querySelector('ytd-popup-container tp-yt-iron-dropdown[focused]');
            if (isMenuOpen) {
                avatarButton.click();
            }
        }

        if (foundHandle) {
            console.log('Found user handle from quick menu open:', foundHandle);
            return foundHandle;
        }

        console.log('Could not find user handle');
        return null;
    } catch (error) {
        console.error('Error getting YouTube username:', error);
        return null;
    }
}

// Function to setup the anonymous checkbox visibility
async function setupAnonymousCheckbox() {
    const anonymousGroup = document.getElementById('anonymous-group');
    if (!anonymousGroup) {
        console.log('Anonymous checkbox group not found');
        return;
    }

    const username = await getYouTubeUsername();
    console.log('Username detection result:', username);
    
    if (username) {
        console.log('Showing anonymous checkbox for logged-in user');
        anonymousGroup.style.display = 'block';
    } else {
        console.log('Hiding anonymous checkbox for anonymous user');
        anonymousGroup.style.display = 'none';
    }
}

// Start initialization
waitForDependencies();

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
                // Get video duration
                const videoDuration = Math.floor(player.duration);
                if (!videoDuration) {
                    throw new Error('Could not determine video duration. Please try again.');
                }

                // Validate timestamps
                const startTime = form.timestampStart.value;
                const endTime = form.timestampEnd.value;
                const { startSeconds, endSeconds } = validateTimestamps(startTime, endTime, videoDuration);
                
                // Get username based on checkbox state
                const username = await getYouTubeUsername();
                const anonymousCheckbox = document.getElementById('anonymous');
                const isAnonymous = !username || (anonymousCheckbox && anonymousCheckbox.checked);
                
                const citationData = {
                    videoId,
                    citationTitle: form.citationTitle.value.trim(),
                    timestampStart: startTime,
                    timestampEnd: endTime,
                    description: form.description.value.trim(),
                    source: form.source.value.trim(),
                    username: isAnonymous ? 'Anonymous' : username,
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
                alert(error.message || 'Error adding citation. Please try again.');
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
                // Get video duration
                const videoDuration = Math.floor(player.duration);
                if (!videoDuration) {
                    throw new Error('Could not determine video duration. Please try again.');
                }

                // Validate timestamps
                const startTime = requestForm.timestampStart.value;
                const endTime = requestForm.timestampEnd.value;
                const { startSeconds, endSeconds } = validateTimestamps(startTime, endTime, videoDuration);
                
                const requestData = {
                    videoId,
                    title: requestForm.title.value.trim(),
                    timestampStart: startTime,
                    timestampEnd: endTime,
                    reason: requestForm.reason.value.trim(),
                    username: 'Anonymous',
                    dateAdded: new Date().toISOString(),
                    voteScore: 0
                };

                const response = await chrome.runtime.sendMessage({
                    type: 'addRequest',
                    data: requestData
                });

                if (response.success) {
                    alert('Citation request submitted successfully!');
                    requestForm.reset();
                    loadCitationRequests();
                } else {
                    throw new Error(response.error);
                }
            } catch (error) {
                console.error("Error submitting citation request:", error);
                alert(error.message || 'Error submitting request. Please try again.');
            }
        });
    }
}

// Function to validate timestamps
function validateTimestamps(startTime, endTime, videoDuration) {
    const timestampRegex = /^([0-5][0-9]):([0-5][0-9]):([0-5][0-9])$/;
    
    // Check format
    if (!timestampRegex.test(startTime) || !timestampRegex.test(endTime)) {
        throw new Error('Please enter timestamps in the format HH:MM:SS (e.g., 00:15:30)');
    }

    // Convert timestamps to seconds
    const startSeconds = startTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
    const endSeconds = endTime.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
    
    // Check if start is before end
    if (startSeconds >= endSeconds) {
        throw new Error('Start timestamp must be less than end timestamp');
    }

    // Check if end timestamp exceeds video duration
    if (endSeconds > videoDuration) {
        const durationFormatted = formatTime(Math.floor(videoDuration));
        throw new Error(`End timestamp cannot exceed video duration (${durationFormatted})`);
    }

    return { startSeconds, endSeconds };
}

// Handle voting on requests
async function handleRequestVote(requestId, voteType) {
    const videoId = new URLSearchParams(window.location.search).get('v');
    const voteControls = document.querySelector(`.vote-controls[data-request-id="${requestId}"]`);
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
                        const citationElement = createCitationElement(citation, userVotes[citation.id] || null);
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
    
    if (citations.length === 0) {
        const noCitations = document.createElement('p');
        noCitations.textContent = 'No citations found for this video.';
        fragment.appendChild(noCitations);
    } else {
        citations.forEach(citation => {
            let citationElement;
            
            // Reuse existing element if available
            if (existingElements.has(citation.id)) {
                citationElement = existingElements.get(citation.id);
                existingElements.delete(citation.id);
            } else {
                citationElement = createCitationElement(citation, userVotes[citation.id] || null);
            }

            fragment.appendChild(citationElement);
        });
    }

    // Remove any remaining old elements
    existingElements.forEach(element => element.remove());

    // Clear and update container
    container.innerHTML = '';
    container.appendChild(fragment);
    updateHighlighting();
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
                try {
                    const dateA = new Date(a.dateAdded);
                    const dateB = new Date(b.dateAdded);
                    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
                        console.error('Invalid date values:', { 
                            itemA: { id: a.id, dateAdded: a.dateAdded },
                            itemB: { id: b.id, dateAdded: b.dateAdded }
                        });
                        return 0;
                    }
                    return dateB.getTime() - dateA.getTime();
                } catch (error) {
                    console.error('Error comparing dates:', error);
                    return 0;
                }
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

async function loadCitationRequests() {
    const container = document.getElementById("citation-requests-container");
    if (!container) {
        console.log("Citation requests container not found");
        return;
    }

    const videoId = new URLSearchParams(window.location.search).get('v');
    console.log("Loading citation requests for video:", videoId);
    
    try {
        // Get requests and user votes in parallel, using same message types as citations
        const [requestsResponse, votesResponse] = await Promise.all([
            chrome.runtime.sendMessage({
                type: 'getCitationRequests',
                videoId: videoId
            }),
            chrome.runtime.sendMessage({
                type: 'getUserVotes',
                videoId: videoId,
                itemType: 'request'
            })
        ]);

        if (!requestsResponse.success) {
            throw new Error(requestsResponse.error);
        }

        const requests = requestsResponse.requests || [];
        console.log('Received requests from backend:', requests); // Debug log for request data
        
        // Validate dateAdded fields
        requests.forEach(request => {
            if (!request.dateAdded) {
                console.warn('Request missing dateAdded:', request);
                request.dateAdded = new Date().toISOString(); // Add fallback date
            }
            try {
                const date = new Date(request.dateAdded);
                if (isNaN(date.getTime())) {
                    console.warn('Invalid dateAdded value:', request.dateAdded);
                    request.dateAdded = new Date().toISOString(); // Fix invalid date
                }
            } catch (error) {
                console.error('Error parsing dateAdded:', error);
                request.dateAdded = new Date().toISOString(); // Fix error case
            }
        });

        userVotes = votesResponse.success ? votesResponse.votes : {};
        
        // Sort the requests before updating the DOM
        const sortedRequests = sortItems(requests, currentSortOption, 'request');
        
        // Only update DOM if container is visible and data has changed
        if (container.style.display !== 'none' && JSON.stringify(sortedRequests) !== JSON.stringify(currentRequests)) {
            currentRequests = sortedRequests;
            updateRequestsList(currentRequests, container);
        }
    } catch (error) {
        console.error("Error loading citation requests:", error);
        if (container.style.display === 'block') {
            container.innerHTML = '<p>Error loading citation requests: ' + error.message + '</p>';
        }
    }
}

async function handleVote(itemId, voteType, itemType = 'citation') {
    try {
        const videoId = new URLSearchParams(window.location.search).get('v');
        if (!videoId) {
            throw new Error('Video ID not found');
        }

        const response = await chrome.runtime.sendMessage({
            type: 'updateVotes',
            itemId,
            voteType,
            itemType,
            videoId
        });

        if (!response.success) {
            throw new Error(response.error);
        }

        // Update UI based on response
        const voteControls = document.querySelector(`[data-${itemType}-id="${itemId}"]`);
        if (voteControls) {
            const upvoteBtn = voteControls.querySelector('.upvote-btn');
            const downvoteBtn = voteControls.querySelector('.downvote-btn');
            const scoreElement = voteControls.querySelector('.vote-score');

            // Update vote buttons
            upvoteBtn.classList.toggle('active', response.newVote === 'up');
            downvoteBtn.classList.toggle('active', response.newVote === 'down');

            // Update vote score
            if (scoreElement) {
                scoreElement.textContent = response.newScore;
            }

            // Update local vote state
            userVotes[itemId] = response.newVote;

            // Resort items if needed
            if (currentSortOption === 'upvotes') {
                if (itemType === 'citation') {
                    loadCitations();
                } else {
                    loadCitationRequests();
                }
            }
        }
    } catch (error) {
        console.error(`Error updating ${itemType} vote:`, error);
    }
}

// Add event listener for respond button
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('respond-btn')) {
        const button = e.target;
        window.respondWithCitation(
            button.dataset.start,
            button.dataset.end,
            `Response to request: ${button.dataset.reason || ''}`,
            button.dataset.title || ''
        );
    }
});

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

function showAddForm(isRequestsTab) {
    const formContainer = document.getElementById('add-form-container');
    formContainer.innerHTML = `
        <form id="add-form">
            <div class="form-group">
                <input type="text" id="title-input" class="form-input" placeholder="${isRequestsTab ? 'Request Title' : 'Citation Title'}" required>
            </div>
            ${!isRequestsTab ? `
            <div class="form-group">
                <input type="text" id="author-input" class="form-input" placeholder="Author" required>
            </div>
            <div class="form-check">
                <input type="checkbox" id="anonymous-check" class="form-checkbox">
                <label for="anonymous-check">Post as Anonymous</label>
            </div>
            ` : ''}
            <div class="form-group">
                <textarea id="reason-input" class="form-textarea" placeholder="${isRequestsTab ? 'Reason for Request' : 'Description'}" required></textarea>
            </div>
            <div class="form-group">
                <input type="text" id="source-input" class="form-input" placeholder="Source URL" required>
            </div>
            <div class="form-actions">
                <button type="button" id="cancel-btn" class="cancel-btn">Cancel</button>
                <button type="submit" class="submit-btn">${isRequestsTab ? 'Submit Request' : 'Add Citation'}</button>
            </div>
        </form>
    `;

    formContainer.style.display = 'block';
    
    // Add event listeners
    document.getElementById('cancel-btn').addEventListener('click', () => {
        formContainer.style.display = 'none';
    });
    
    document.getElementById('add-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitForm(isRequestsTab);
    });
}

// Function to initialize the extension
async function initializeExtension() {
    // Remove any existing citation controls first
    const existingControls = document.getElementById('citation-controls');
    if (existingControls) {
        existingControls.remove();
    }

    // Wait for the secondary element to be available
    const checkForSecondary = setInterval(() => {
        const secondaryElement = document.querySelector("div#secondary.style-scope.ytd-watch-flexy");
        if (secondaryElement) {
            clearInterval(checkForSecondary);
            // Check again before inserting to prevent race conditions
            if (!document.getElementById('citation-controls')) {
                insertCitationButtons();
                setupSortingFunctionality();
            }
        }
    }, 1000);
}

// Call initialize only on YouTube navigation
document.addEventListener('yt-navigate-finish', initializeExtension);

function createCitationElement(citation, userVote) {
    const citationElement = document.createElement("div");
    citationElement.className = "citation-item";
    citationElement.dataset.start = parseTimestamp(citation.timestampStart);
    citationElement.dataset.end = parseTimestamp(citation.timestampEnd);
    
    console.log('Creating citation element with data:', citation);
    
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
        <p><strong>Description:</strong> ${citation.description}</p>
        ${citation.source ? `<p><strong>Source:</strong> <a href="${citation.source}" target="_blank">${citation.source}</a></p>` : ''}
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

    // Add vote event listeners
    const voteControls = citationElement.querySelector('.vote-controls');
    const upvoteBtn = voteControls.querySelector('.upvote-btn');
    const downvoteBtn = voteControls.querySelector('.downvote-btn');

    upvoteBtn.addEventListener('click', () => handleVote(citation.id, 'up'));
    downvoteBtn.addEventListener('click', () => handleVote(citation.id, 'down'));

    return citationElement;
}

function updateCitationsList(citations, container) {
    if (!container) return;

    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    if (citations.length === 0) {
        const noCitations = document.createElement('p');
        noCitations.textContent = 'No citations found for this video.';
        fragment.appendChild(noCitations);
    } else {
        citations.forEach(citation => {
            const citationElement = createCitationElement(citation, userVotes[citation.id] || null);
            fragment.appendChild(citationElement);
        });
    }

    container.appendChild(fragment);
}

// Add CSS for highlighting and recorded segments panel
const style = document.createElement('style');
style.textContent = `
    /* Recorded Segments Panel */
    .recorded-segments-panel {
        position: fixed;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        z-index: 9999;
        display: flex;
        transition: transform 0.3s ease;
    }
    
    .recorded-segments-panel .toggle-btn {
        width: 24px;
        height: 60px;
        background: rgba(33, 33, 33, 0.95);
        border: none;
        color: white;
        cursor: pointer;
        border-radius: 4px 0 0 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        flex-shrink: 0;
        z-index: 2;
    }
    
    .recorded-segments-panel .panel-content {
        background: rgba(33, 33, 33, 0.95);
        border-radius: 4px 0 0 4px;
        padding: 10px;
        width: 300px;
        max-height: 80vh;
        overflow-y: auto;
        color: white;
        margin-left: -4px; /* Overlap with toggle button to avoid gap */
    }
    
    .recorded-segments-panel.collapsed {
        transform: translate(300px, -50%);
    }
    
    .recorded-segments-panel.collapsed .toggle-btn {
        transform: translateX(-100%);
    }
    
    .recorded-segments-panel h3 {
        margin: 0 0 10px 0;
        font-size: 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        padding-bottom: 5px;
        color: #fff;
        font-weight: 500;
    }
    
    .recorded-segment {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 8px;
        margin-bottom: 8px;
        font-size: 14px;
    }
    
    .recorded-segment .time-range {
        color: #fff;
        text-decoration: none;
        cursor: pointer;
        font-weight: 500;
    }
    
    .recorded-segment .time-range:hover {
        text-decoration: underline;
        color: #1a73e8;
    }
    
    .recorded-segment .actions {
        margin-top: 5px;
        display: flex;
        gap: 5px;
    }
    
    .recorded-segment .actions button {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 3px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
        flex: 1;
    }
    
    .recorded-segment .actions button:hover {
        background: rgba(255, 255, 255, 0.1);
    }
`;
document.head.appendChild(style);

// Update highlighting every second
setInterval(updateHighlighting, 500);

// Function to update the requests list
function updateRequestsList(requests, container) {
    if (!container) return;
    
    // Clear existing content
    container.innerHTML = '';
    const fragment = document.createDocumentFragment();

    if (!requests || requests.length === 0) {
        const noRequests = document.createElement('p');
        noRequests.textContent = 'No citation requests available.';
        noRequests.className = 'no-items-message';
        fragment.appendChild(noRequests);
        container.appendChild(fragment);
        return;
    }

    requests.forEach(request => {
        const requestElement = createRequestElement(request);
        fragment.appendChild(requestElement);
    });

    container.appendChild(fragment);
}

// Function to create a request element
function createRequestElement(request) {
    const requestElement = document.createElement("div");
    requestElement.className = "citation-item";
    requestElement.dataset.start = parseTimestamp(request.timestampStart);
    requestElement.dataset.end = parseTimestamp(request.timestampEnd);
    requestElement.dataset.requestId = request.id;
    
    requestElement.innerHTML = `
        <p><strong>Title:</strong> ${request.title || ''}</p>
        <p><strong>Time Range:</strong> 
            <a href="#" class="timestamp-link" data-time="${parseTimestamp(request.timestampStart)}">${request.timestampStart}</a> - 
            <a href="#" class="timestamp-link" data-time="${parseTimestamp(request.timestampEnd)}">${request.timestampEnd}</a>
        </p>
        <p><strong>Requested by:</strong> ${request.username}</p>
        <p><strong>Date:</strong> ${new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date(request.dateAdded))}</p>
        <p><strong>Description:</strong> ${request.reason || ''}</p>
        <div class="request-controls">
            <div class="vote-controls" data-request-id="${request.id}">
                <button class="upvote-btn ${request.userVote === 'up' ? 'voted' : ''}" title="Upvote">
                    <span class="arrow">▲</span>
                </button>
                <span class="vote-score">${request.voteScore || 0}</span>
                <button class="downvote-btn ${request.userVote === 'down' ? 'voted' : ''}" title="Downvote">
                    <span class="arrow">▼</span>
                </button>
            </div>
            <button class="respond-btn" title="Respond with Citation" data-start="${request.timestampStart}" data-end="${request.timestampEnd}" data-reason="${request.reason || ''}" data-title="${request.title || ''}">
                Respond
            </button>
        </div>
    `;

    // Add click handlers for timestamp links
    requestElement.querySelectorAll('.timestamp-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const time = parseInt(e.target.dataset.time);
            if (player && !isNaN(time)) {
                player.currentTime = time;
                player.play();
            }
        });
    });

    // Add event listeners for voting buttons
    const upvoteBtn = requestElement.querySelector('.upvote-btn');
    const downvoteBtn = requestElement.querySelector('.downvote-btn');
    const respondBtn = requestElement.querySelector('.respond-btn');

    upvoteBtn.addEventListener('click', () => handleVote(request.id, 'up', 'request'));
    downvoteBtn.addEventListener('click', () => handleVote(request.id, 'down', 'request'));
    respondBtn.addEventListener('click', (e) => {
        console.log('Request data:', request); 
        const button = e.target;
        window.respondWithCitation(
            button.dataset.start,
            button.dataset.end,
            `Response to request: ${button.dataset.reason || ''}`,
            button.dataset.title || ''
        );
    });

    return requestElement;
}

// Function to handle request actions (accept/reject)
async function handleRequestAction(requestId, action) {
    try {
        const response = await chrome.runtime.sendMessage({
            type: action === 'accept' ? 'acceptCitationRequest' : 'rejectCitationRequest',
            data: { requestId }
        });

        if (response.success) {
            // Refresh the requests list
            loadCitationRequests();
            // Show success message
            alert(`Citation request ${action}ed successfully`);
        } else {
            alert(`Failed to ${action} citation request. Please try again.`);
        }
    } catch (error) {
        console.error(`Error ${action}ing citation request:`, error);
        alert(`An error occurred while ${action}ing the citation request. Please try again.`);
    }
}

// Update highlighting function to trigger resort when highlighting changes
function updateHighlighting() {
    const player = document.querySelector('video');
    if (!player) return;

    const currentTime = player.currentTime;
    const citationsContainer = document.getElementById("citations-container");
    const requestsContainer = document.getElementById("citation-requests-container");

    let needsResorting = false;

    // Update citations highlighting
    if (citationsContainer && citationsContainer.style.display !== 'none') {
        citationsContainer.querySelectorAll('.citation-item').forEach(citation => {
            const start = parseInt(citation.dataset.start);
            const end = parseInt(citation.dataset.end);
            const wasHighlighted = citation.classList.contains('active-citation');
            const isHighlighted = currentTime >= start && currentTime <= end;
            
            if (isHighlighted !== wasHighlighted) {
                citation.classList.toggle('active-citation', isHighlighted);
                needsResorting = true;
            }
        });

        // Resort citations if highlighting changed
        if (needsResorting) {
            const citations = Array.from(citationsContainer.querySelectorAll('.citation-item'));
            citations.sort((a, b) => {
                const aHighlighted = a.classList.contains('active-citation');
                const bHighlighted = b.classList.contains('active-citation');
                
                if (aHighlighted && !bHighlighted) return -1;
                if (!aHighlighted && bHighlighted) return 1;
                
                // If both are highlighted or both are not, maintain original order
                const aStart = parseInt(a.dataset.start);
                const bStart = parseInt(b.dataset.start);
                return aStart - bStart;
            });

            // Clear and reappend in new order
            const fragment = document.createDocumentFragment();
            citations.forEach(citation => fragment.appendChild(citation));
            citationsContainer.innerHTML = '';
            citationsContainer.appendChild(fragment);
        }
    }

    // Update requests highlighting
    if (requestsContainer && requestsContainer.style.display !== 'none') {
        let requestsNeedResorting = false;
        requestsContainer.querySelectorAll('.citation-item').forEach(request => {
            const start = parseInt(request.dataset.start);
            const end = parseInt(request.dataset.end);
            const wasHighlighted = request.classList.contains('active-citation');
            const isHighlighted = currentTime >= start && currentTime <= end;
            
            if (isHighlighted !== wasHighlighted) {
                request.classList.toggle('active-citation', isHighlighted);
                requestsNeedResorting = true;
            }
        });

        // Resort requests if highlighting changed
        if (requestsNeedResorting) {
            const requests = Array.from(requestsContainer.querySelectorAll('.citation-item'));
            requests.sort((a, b) => {
                const aHighlighted = a.classList.contains('active-citation');
                const bHighlighted = b.classList.contains('active-citation');
                
                if (aHighlighted && !bHighlighted) return -1;
                if (!aHighlighted && bHighlighted) return 1;
                
                // If both are highlighted or both are not, maintain original order
                const aStart = parseInt(a.dataset.start);
                const bStart = parseInt(b.dataset.start);
                return aStart - bStart;
            });

            // Clear and reappend in new order
            const fragment = document.createDocumentFragment();
            requests.forEach(request => fragment.appendChild(request));
            requestsContainer.innerHTML = '';
            requestsContainer.appendChild(fragment);
        }
    }
}
