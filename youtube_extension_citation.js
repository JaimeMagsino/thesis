// Function to attach event listeners for forms
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

    document.getElementById("citation-container")?.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-citation")) {
            const videoId = new URLSearchParams(window.location.search).get('v');
            const docId = event.target.dataset.id;
            deleteCitation(videoId, docId);
        }
    });

    document.getElementById("citation-requests-container")?.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-request")) {
            const videoId = new URLSearchParams(window.location.search).get('v');
            const docId = event.target.dataset.id;
            deleteRequest(videoId, docId);
        }
    });
});