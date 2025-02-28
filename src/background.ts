chrome.alarms.create("keep_alive", { periodInMinutes: 4 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keep_alive") {
    console.log("Keeping service worker alive");
  }
});

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "translate_selected_text") {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return;
  
      const [{ result: selectedText }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getSelectedText,
      });
  
      if (!selectedText) {
        console.warn("No text selected.");
        return;
      }
  
      const { openai_api_key: apiKey, target_lang: targetLang = "en" } =
        await chrome.storage.sync.get(["openai_api_key", "target_lang"]);
  
      if (!apiKey) {
        console.warn("No API key found!");
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => alert("No API key found! Please set it in the extension options."),
        });
        return;
      }
  
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
  
  function triggerInputEvent(element: HTMLElement) {
    const event = new Event('input', { bubbles: true });
    element.dispatchEvent(event);
  }
  
  function replaceSelectedText(translatedText: string) {
    const active = document.activeElement;
  
    if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
      const input = active as HTMLInputElement | HTMLTextAreaElement;
      if (input.selectionStart !== null && input.selectionEnd !== null) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = input.value.substring(0, start) + translatedText + input.value.substring(end);
        input.selectionStart = input.selectionEnd = start + translatedText.length;
        triggerInputEvent(input);
      }
    } else if (active && active instanceof HTMLElement && active.isContentEditable) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(translatedText);
        range.insertNode(textNode);

        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        active.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } else {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(translatedText));
      }
    }
  }
  

  