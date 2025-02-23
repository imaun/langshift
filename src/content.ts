const port = chrome.runtime.connect({ name: "content-script" });

let storedRange: Range | null = null;

document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selection && selection.rangeCount > 0) {
        // Save a clone of the current selection range
        storedRange = selection.getRangeAt(0).cloneRange();
        // Send the text for translation via the persistent port
        port.postMessage({ action: "translate", text: selectedText });
    }
});

// Listen for messages from the background script
port.onMessage.addListener((message) => {
    if (message.action === "replaceText" && storedRange) {
        storedRange.deleteContents();
        storedRange.insertNode(document.createTextNode(message.text));
        storedRange = null;
    }
});
