document.addEventListener("DOMContentLoaded", () => {
    // Page Navigation
    const addCitationPage = document.getElementById('add-citation-page');
    const requestCitationPage = document.getElementById('request-citation-page');

    const addCitationBtn = document.getElementById('add-citation-btn');
    const requestCitationBtn = document.getElementById('request-citation-btn');

    if (addCitationBtn) {
        addCitationBtn.addEventListener('click', () => {
            addCitationPage.style.display = 'block';
            requestCitationPage.style.display = 'none';
        });
    }

    if (requestCitationBtn) {
        requestCitationBtn.addEventListener('click', () => {
            addCitationPage.style.display = 'none';
            requestCitationPage.style.display = 'block';
        });
    }

    // Form Submission
    const form = document.getElementById('citation-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Citation Submitted!');
            form.reset();
        });
    }
});
