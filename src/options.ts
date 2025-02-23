const languages: { [key: string]: string } = {
    "en": "English",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "nl": "Dutch",
    "ru": "Russian",
    "zh": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "fa": "Persian (Farsi)",
    "hi": "Hindi",
    "tr": "Turkish",
    "el": "Greek",
    "he": "Hebrew",
    "th": "Thai",
    "pl": "Polish",
    "sv": "Swedish",
    "fi": "Finnish",
    "no": "Norwegian",
    "da": "Danish",
    "cs": "Czech",
    "hu": "Hungarian",
    "ro": "Romanian",
    "uk": "Ukrainian",
    "id": "Indonesian",
    "vi": "Vietnamese"
};

const languageSelect = document.getElementById("languageSelect") as HTMLSelectElement;
for (const [code, name] of Object.entries(languages)) {
    const option = document.createElement("option");
    option.value = code;
    option.textContent = name;
    languageSelect.appendChild(option);
}

chrome.storage.sync.get(["openai_api_key", "preferred_language"], (data) => {
    if (data.openai_api_key) {
        (document.getElementById("apiKey") as HTMLInputElement).value = data.openai_api_key;
    }
    if (data.preferred_language) {
        languageSelect.value = data.preferred_language;
    }
});

document.getElementById("save")?.addEventListener("click", () => {
    const apiKey = (document.getElementById("apiKey") as HTMLInputElement).value.trim();
    const selectedLanguage = languageSelect.value;

    chrome.storage.sync.set({ openai_api_key: apiKey, preferred_language: selectedLanguage }, () => {
        alert("Settings saved!");
    });
});

document.getElementById("clear")?.addEventListener("click", () => {
    chrome.storage.sync.remove(["openai_api_key", "preferred_language"], () => {
        alert("Settings cleared.");
    });
});
