function insertBelowTitle() {
    const titleElement = document.querySelector("h1.style-scope.ytd-watch-metadata");
    if (titleElement && !document.getElementById("custom-extension-element")) {
        const newElement = document.createElement("div");
        newElement.id = "custom-extension-element";
        newElement.innerHTML = `<div style="background: yellow; padding: 10px;">
            This is a custom message below the title!
        </div>`;
        newElement.style.cssText = "font-size: 16px; color: red; margin-top: 5px;";
        titleElement.parentNode.insertBefore(newElement, titleElement.nextSibling);
    }
}

const observer = new MutationObserver(insertBelowTitle);
observer.observe(document.body, { childList: true, subtree: true });

insertBelowTitle();
