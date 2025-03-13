// youtube_extension_citation.js
import { db } from './firebase-init.js';
import { collection, addDoc, getDocs } from "firebase/firestore";

// Function to attach event listeners for forms
function setupFormListeners() {
    const form = document.getElementById('citation-form');
    if (form && !form.dataset.listener) {
        form.dataset.listener = "true"; // Prevent duplicate event listeners
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            const citationData = {
                title: form['citation-title'].value,
                timestampStart: form['timestamp1'].value,
                timestampEnd: form['timestamp2'].value,
                content: form['citation-content'].value,
                datePosted: new Date().toISOString()
            };
            try {
                await addDoc(collection(db, "citations"), citationData);
                alert('Citation Submitted!');
                form.reset();
            } catch (error) {
                console.error("Error adding citation: ", error);
            }
        });
    }

    const requestForm = document.getElementById('request-form');
    if (requestForm && !requestForm.dataset.listener) {
        requestForm.dataset.listener = "true"; // Prevent duplicate event listeners
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopImmediatePropagation();
            const requestData = {
                timestampStart: requestForm['request-timestamp1'].value,
                timestampEnd: requestForm['request-timestamp2'].value,
                reason: requestForm['request-reason'].value,
                dateRequested: new Date().toISOString()
            };
            try {
                await addDoc(collection(db, "citationRequests"), requestData);
                alert('Citation Request Submitted!');
                requestForm.reset();
            } catch (error) {
                console.error("Error adding citation request: ", error);
            }
        });
    }
}

// Function to load citations from Firestore
async function loadCitations() {
    const container = document.getElementById('citations-container');
    if (!container) return;

    const querySnapshot = await getDocs(collection(db, "citations"));
    container.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const citation = doc.data();
        const citationElement = document.createElement('div');
        citationElement.innerHTML = `
            <p><strong>Title:</strong> ${citation.title}</p>
            <p><strong>Start Timestamp:</strong> ${citation.timestampStart}</p>
            <p><strong>End Timestamp:</strong> ${citation.timestampEnd}</p>
            <p><strong>Content:</strong> ${citation.content}</p>
            <p><strong>Date Posted:</strong> ${citation.datePosted}</p>
        `;
        container.appendChild(citationElement);
    });
}

// Function to load citation requests from Firestore
async function loadCitationRequests() {
    const container = document.getElementById('citation-requests-container');
    if (!container) return;

    const querySnapshot = await getDocs(collection(db, "citationRequests"));
    container.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const request = doc.data();
        const requestElement = document.createElement('div');
        requestElement.innerHTML = `
            <p><strong>Start Timestamp:</strong> ${request.timestampStart}</p>
            <p><strong>End Timestamp:</strong> ${request.timestampEnd}</p>
            <p><strong>Reason:</strong> ${request.reason}</p>
            <p><strong>Date Requested:</strong> ${request.dateRequested}</p>
        `;
        container.appendChild(requestElement);
    });
}

// Run `setupFormListeners()` after the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    setupFormListeners();
    loadCitations();
    loadCitationRequests();
});