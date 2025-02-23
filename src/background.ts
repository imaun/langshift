chrome.commands.onCommand.addListener(async (command) => {
    if (command === "translate_selected_text") {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;
  
      // Inject a function to get the currently selected text.
      const [{ result: selectedText }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getSelectedText,
      });
  
      if (!selectedText) {
        console.warn("No text selected.");
        return;
      }
  
      // Retrieve API key and target language from storage
      const { openai_api_key: apiKey, target_lang: targetLang = "en" } =
        await chrome.storage.sync.get(["openai_api_key", "target_lang"]);
  
      if (!apiKey) {
        console.warn("No API key found!");
        // Optionally alert the user on the page
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => alert("No API key found! Please set it in the extension options."),
        });
        return;
      }
  
      // Build the prompt and call the translation API
      const prompt = `Translate the following text to ${targetLang}: "${selectedText}"`;
  
      try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4",
            messages: [{ role: "system", content: prompt }],
          }),
        });
  
        const responseData = await response.json();
        const translatedText =
          responseData.choices?.[0]?.message?.content?.trim() || "⚠️ Translation failed.";
  
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [translatedText],
          func: replaceSelectedText,
        });
      } catch (error) {
        console.error("Translation failed:", error);
      }
    }
  });
  
  function getSelectedText() {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      const input = active as HTMLInputElement | HTMLTextAreaElement;
      if (input.selectionStart !== null && input.selectionEnd !== null) {
        return input.value.substring(input.selectionStart, input.selectionEnd);
      }
    } else {
      return window.getSelection()?.toString().trim();
    }
    return "";
  }  
  
  // This function is injected into the page to replace the selected text.
  function replaceSelectedText(translatedText: string) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(translatedText));
    }
  }
  