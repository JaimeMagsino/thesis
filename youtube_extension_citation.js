document.addEventListener("DOMContentLoaded", () => {
    // Select the form and fields
    const citationForm = document.getElementById("citation-form");
    const titleInput = document.getElementById("citation-title");
    const startTimestampInput = document.getElementById("timestamp1");
    const endTimestampInput = document.getElementById("timestamp2");
    const contentInput = document.getElementById("citation-content");

    // Form submission event listener
    if (citationForm) {
        citationForm.addEventListener("submit", (event) => {
            event.preventDefault();
            
            const citationData = {
                title: titleInput.value,
                startTimestamp: startTimestampInput.value,
                endTimestamp: endTimestampInput.value,
                content: contentInput.value,
            };

            console.log("Citation Created:", citationData);
            alert("Citation Created Successfully!");
            
            // Reset form after submission
            citationForm.reset();
        });
    }
});
