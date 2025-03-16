import { createTranslator } from "./translator";

chrome.alarms.create("keep_alive", { periodInMinutes: 4 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "keep_alive") {
    console.log("Keeping service worker alive");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "ping") {
      console.log("Service worker is active");
      sendResponse({ status: "alive" });
    }
});

async function translateText(text: string, targetLang: string, provider: string): Promise<string | null> {
    const translator = createTranslator(provider);
    try {
        return await translator.translate(text, targetLang, ''); // Empty string for default model
    } catch (error) {
        console.error(`Translation failed with ${provider}:`, error);
        return null;
    }
}

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

        // Get settings from storage
        const { target_lang: targetLang = "en", ai_provider = "openai" } =
            await chrome.storage.sync.get(["target_lang", "ai_provider"]);

        // Get the translation
        const translatedText = await translateText(selectedText, targetLang, ai_provider);

        if (!translatedText) {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => alert("Translation failed! Please check your API key and settings."),
            });
            return;
        }

        // Replace the text on the page
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            args: [translatedText],
            func: replaceSelectedText,
        });
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
  

  