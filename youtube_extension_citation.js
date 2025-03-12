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

/* // Function to attach event listeners for forms
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
} */

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

// Run `setupFormListeners()` after the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  setupFormListeners();
});