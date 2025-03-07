document.addEventListener("DOMContentLoaded", () => {
    // Page Navigation
    const addCitationPage = document.getElementById('add-citation-page');
    const listViewPage = document.getElementById('list-view-page');

    const addCitationBtn = document.getElementById('add-citation-btn');
    const listViewBtn = document.getElementById('list-view-btn');

    if (addCitationBtn) {
        addCitationBtn.addEventListener('click', () => {
            addCitationPage.style.display = 'block';
            listViewPage.style.display = 'none';
        });
    }

    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            addCitationPage.style.display = 'none';
            listViewPage.style.display = 'block';
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
