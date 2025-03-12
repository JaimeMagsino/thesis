import { db } from './firebase-init.js';
import { collection, getDocs } from "firebase/firestore";
//import { setupFormListeners } from './formUtils.js';

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

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "addCitation") {
      addCitation(message.data)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("Error adding citation: ", error);
          sendResponse({ success: false });
        });
      return true; // Indicates that the response will be sent asynchronously
    }
  
    if (message.action === "addCitationRequest") {
      addCitationRequest(message.data)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          console.error("Error adding citation request: ", error);
          sendResponse({ success: false });
        });
      return true; // Indicates that the response will be sent asynchronously
    }
  });
  
  // Function to add a citation to Firestore
  async function addCitation(citationData) {
    try {
      const docRef = await addDoc(collection(db, "citations"), citationData);
      console.log("Document written with ID: ", docRef.id);
      return docRef.id; // Return the ID of the newly added document
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error; // Propagate the error for handling
    }
  }
  
  // Function to add a citation request to Firestore
  async function addCitationRequest(requestData) {
    try {
      const docRef = await addDoc(collection(db, "requests"), requestData);
      console.log("Document written with ID: ", docRef.id);
      return docRef.id; // Return the ID of the newly added document
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error; // Propagate the error for handling
    }
  }

  // Function to fetch all citations from Firestore
async function fetchCitations() {
    try {
      const querySnapshot = await getDocs(collection(db, "citations"));
      const citations = [];
      querySnapshot.forEach((doc) => {
        citations.push({ id: doc.id, ...doc.data() });
      });
      return citations;
    } catch (error) {
      console.error("Error fetching documents: ", error);
      throw error; // Propagate the error for handling
    }
  }
  
  // Function to fetch all citation requests from Firestore
  async function fetchCitationRequests() {
    try {
      const querySnapshot = await getDocs(collection(db, "requests"));
      const requests = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() });
      });
      return requests;
    } catch (error) {
      console.error("Error fetching documents: ", error);
      throw error; // Propagate the error for handling
    }
  }


// Function to attach event listeners for forms
function setupFormListeners() {
  const form = document.getElementById('citation-form');
  if (form && !form.dataset.listener) {
    form.dataset.listener = "true"; // Prevent duplicate event listeners
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form data
      const citationData = {
        title: form['citation-title'].value,
        startTimestamp: form['timestamp1'].value,
        endTimestamp: form['timestamp2'].value,
        content: form['citation-content'].value,
        datePosted: new Date().toISOString()
      };

      try {
        // Send a message to the content script to add the citation
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "addCitation",
            data: citationData
          }, (response) => {
            if (response && response.success) {
              alert('Citation Submitted!');
              form.reset();
            } else {
              alert('Error submitting citation. Please try again.');
            }
          });
        });
      } catch (error) {
        console.error("Error submitting citation: ", error);
        alert('Error submitting citation. Please try again.');
      }
    });
  }

  const requestForm = document.getElementById('request-form');
  if (requestForm && !requestForm.dataset.listener) {
    requestForm.dataset.listener = "true"; // Prevent duplicate event listeners
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Get form data
      const requestData = {
        startTimestamp: requestForm['request-timestamp1'].value,
        endTimestamp: requestForm['request-timestamp2'].value,
        reason: requestForm['request-reason'].value,
        dateRequested: new Date().toISOString()
      };

      try {
        // Send a message to the content script to add the citation request
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "addCitationRequest",
            data: requestData
          }, (response) => {
            if (response && response.success) {
              alert('Citation Request Submitted!');
              requestForm.reset();
            } else {
              alert('Error submitting citation request. Please try again.');
            }
          });
        });
      } catch (error) {
        console.error("Error submitting citation request: ", error);
        alert('Error submitting citation request. Please try again.');
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

// Updated loadCitationRequests() function to fetch data from Firestore
async function loadCitationRequests() {
    let container = document.getElementById('citation-requests-container');
  
    // Create the container if it doesn't exist
    if (!container) {
      container = document.createElement("div");
      container.id = "citation-requests-container";
      container.style.cssText = "margin-top: 10px;"; // Add any necessary styles
      const secondaryElement = document.querySelector("div#secondary.style-scope.ytd-watch-flexy");
      if (secondaryElement) {
        secondaryElement.prepend(container); // Append it to the desired location
      }
    }
  
    container.innerHTML = ""; // Clear the container before updating
  
    try {
      // Fetch citation requests from Firestore
      const requests = await fetchCitationRequests();
  
      // Display each citation request
      requests.forEach((request) => {
        const requestElement = document.createElement("div");
        requestElement.style.cssText = `
          border: 1px solid #ddd; 
          padding: 10px; 
          margin: 5px 0; 
          background: #fff; 
        `;
        requestElement.innerHTML = `
          <p><strong>Start Timestamp:</strong> ${request.startTimestamp}</p>
          <p><strong>End Timestamp:</strong> ${request.endTimestamp}</p>
          <p><strong>Reason:</strong> ${request.reason}</p>
          <p><strong>Date Requested:</strong> ${request.dateRequested}</p>
        `;
        container.appendChild(requestElement);
      });
    } catch (error) {
      console.error("Error loading citation requests: ", error);
    }
  }

// Helper function to check if a request is within the current timestamp range
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

// Updated loadCitations() function to fetch data from Firestore
async function loadCitations() {
    let container = document.getElementById('citations-container');

    // Create the container if it doesn't exist
    if (!container) {
        container = document.createElement("div");
        container.id = "citations-container";
        container.style.cssText = "margin-top: 10px;"; // Add any necessary styles
        const secondaryElement = document.querySelector("div#secondary.style-scope.ytd-watch-flexy");
        if (secondaryElement) {
        secondaryElement.prepend(container); // Append it to the desired location
        }
    }

    container.innerHTML = ""; // Clear the container before updating

    try {
        // Fetch citations from Firestore
        const citations = await fetchCitations();

        // Display each citation
        citations.forEach((citation) => {
        const citationElement = document.createElement("div");
        citationElement.style.cssText = `
            border: 1px solid #ddd; 
            padding: 10px; 
            margin: 5px 0; 
            background: #fff; 
        `;
        citationElement.innerHTML = `
            <p><strong>Title:</strong> ${citation.title}</p>
            <p><strong>Start Timestamp:</strong> ${citation.startTimestamp}</p>
            <p><strong>End Timestamp:</strong> ${citation.endTimestamp}</p>
            <p><strong>Content:</strong> ${citation.content}</p>
            <p><strong>Date Posted:</strong> ${citation.datePosted}</p>
        `;
        container.appendChild(citationElement);
        });
    } catch (error) {
        console.error("Error loading citations: ", error);
    }
}

// Update the setInterval to call the async functions
setInterval(async () => {
    await loadCitationRequests();
    await loadCitations();
  }, 5000); // Updates every 5 seconds

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
