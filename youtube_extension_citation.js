/* // Function to attach event listeners for forms
function setupFormListeners() {
    const form = document.getElementById('citation-form');
    if (form && !form.dataset.listener) {
        form.dataset.listener = "true"; // Prevent duplicate event listeners
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Citation Submitted!');
            form.reset();
        });
    }

    const requestForm = document.getElementById('request-form');
    if (requestForm && !requestForm.dataset.listener) {
        requestForm.dataset.listener = "true"; // Prevent duplicate event listeners
        requestForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Citation Request Submitted!');
            requestForm.reset();
        });
    }
}

// Run `setupFormListeners()` after the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    setupFormListeners();
}); */

// youtube-extension-citation.js
import { database, ref, push, set, get, onValue } from "./firebase-init.js";

document.addEventListener("DOMContentLoaded", function () {
    setupCitationForm();
    fetchCitations();
});

function setupCitationForm() {
    const form = document.getElementById("citation-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        
        const timestampStart = document.getElementById("timestamp1").value;
        const timestampEnd = document.getElementById("timestamp2").value;
        const reason = document.getElementById("citation-content").value;
        const videoUrl = window.location.href; // Get the current YouTube video URL

        if (!timestampStart || !timestampEnd || !reason) {
            alert("Please fill out all fields.");
            return;
        }

        // Reference to Firebase database
        const citationsRef = ref(database, "citations");
        
        // Push new citation to database
        push(citationsRef, {
            timestampStart,
            timestampEnd,
            reason,
            videoUrl,
            dateSubmitted: new Date().toISOString()
        }).then(() => {
            alert("Citation added successfully!");
            form.reset();
        }).catch((error) => {
            console.error("Error adding citation:", error);
        });
    });
}

function fetchCitations() {
    const citationsRef = ref(database, "citations");

    onValue(citationsRef, (snapshot) => {
        const citationsContainer = document.getElementById("citations-container");
        if (!citationsContainer) return;

        citationsContainer.innerHTML = "";

        const citations = snapshot.val();
        if (!citations) {
            citationsContainer.innerHTML = "<p>No citations available.</p>";
            return;
        }

        Object.values(citations).forEach((citation) => {
            const citationElement = document.createElement("div");
            citationElement.innerHTML = `
                <p><strong>Timestamp Start:</strong> ${citation.timestampStart}</p>
                <p><strong>Timestamp End:</strong> ${citation.timestampEnd}</p>
                <p><strong>Reason:</strong> ${citation.reason}</p>
                <p><strong>Video:</strong> <a href="${citation.videoUrl}" target="_blank">${citation.videoUrl}</a></p>
            `;
            citationsContainer.appendChild(citationElement);
        });
    });
}
