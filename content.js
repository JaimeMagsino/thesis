function insertBelowTitle() {
    const titleElement = document.querySelector("h1.style-scope.ytd-watch-metadata");

    if (!titleElement) return; // Exit if title doesn't exist yet

    // Ensure only one instance is added
    if (document.getElementById("custom-extension-element")) return;

    const url = chrome.runtime.getURL("content.html");
    console.log("Attempting to fetch content from:", url);
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch content.html");
            }
            return response.text();
        })
        .then(html => {
            const newElement = document.createElement("div");
            newElement.id = "custom-extension-element"; // Unique ID
            newElement.innerHTML = html;
            newElement.style.cssText = "margin-top: 5px;"; // Custom styling

            titleElement.parentNode.insertBefore(newElement, titleElement.nextSibling);

            // Disconnect the observer after inserting the element
            observer.disconnect();
        })
        .catch(error => console.error("Error loading content.html:", error));
}

// Debounce function to limit how often insertBelowTitle is called
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// Debounced version of insertBelowTitle
const debouncedInsertBelowTitle = debounce(insertBelowTitle, 300);

// MutationObserver to watch for changes in the title container
const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList' && !document.getElementById("custom-extension-element")) {
            debouncedInsertBelowTitle();
            break; // Exit the loop once the element is inserted
        }
    }
});

// Wait for the YouTube title container to appear
const watchForTitle = setInterval(() => {
    const titleContainer = document.querySelector("ytd-watch-metadata");
    if (titleContainer) {
        clearInterval(watchForTitle); // Stop checking once found
        observer.observe(titleContainer, { childList: true, subtree: true });
        debouncedInsertBelowTitle(); // Run once immediately
    }
}, 500);
