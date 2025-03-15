import { Constants } from './constants';

class Translator {
    async translate(text: string, targetLang: string, model: string): Promise<string | null> {
        throw new Error('AI Translate provider not supported.');
    }
}

class OpenAITranslator extends Translator {

    async translate(text: string, targetLang: string, model: string): Promise<string | null> {
        const _apiUrl: string = 'https://api.openai.com/v1/chat/completions';

        const { openai_api_key: apiKey } = await chrome.storage.sync.get([Constants.OPENAI_API_KEY]);
        if(!apiKey) {
            console.warn('⚠️ No OpenAI API key found.')
            return null;
        }

        const prompt = `Translate the following text to ${targetLang}: \"${text}\"`;

        try {
            const response = await fetch(_apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: model || 'gpt-4',
                    messages: [{ role: 'system', content: prompt }]
                }),
            });

            const data = await response.json();

            return data.choices?.[0]?.message?.content?.trim() || "⚠️ Translation failed.";
        } catch(error) {
            console.error("OpenAI Translation failed:", error);
            return null;
        }
    }
}

class ClaudeTranslator extends Translator {

    async translate(text: string, targetLang: string, model: string): Promise<string | null> {
        const _apiUrl = 'https://api.anthropic.com/v1/messages';

        const { claude_api_key: apiKey } = await chrome.storage.sync.get([Constants.CLAUDE_API_KEY]);
        if(!apiKey) {
            console.warn('⚠️ No Calude API key found.');
            return null;
        }

        const prompt = `Translate the following text to ${targetLang}: \"${text}\"`;

        try {
            const response = await fetch(_apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: model || "claude-2",
                    messages: [{ role: "user", content: prompt }],
                }),
            });

            const data = await response.json();

            return data.content?.[0]?.text?.trim() || "⚠️ Translation failed.";
        } catch(error) {
            console.error("Claude Translation failed:", error);
            return null;
        }
    }
}

class GeminiTranslator extends Translator {

    async translate(text: string, targetLang: string, model: string): Promise<string | null> {
        const { gemini_api_key: apiKey } = await chrome.storage.sync.get([Constants.GEMINI_API_KEY]);

        if(!apiKey) {
            console.warn('⚠️ No Gemini API key found.');
            return null;
        }

        const _apiUrl = 'https://generativelanguage.googleapis.com/v1/models/' + (model || 'gemini-pro') + ":generateText?key=" + apiKey;
        const Prompt = `Translate the following text to ${targetLang}: \"${text}\"`;

        try {
            const response = await fetch(_apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: { text: prompt },
                }),
            });

            const data = await response.json();

            return data.candidates?.[0]?.output?.trim() || "⚠️ Translation failed.";
        } catch(error) {
            console.error("Gemini Translation failed:", error);
            return null;
        }
    }
}