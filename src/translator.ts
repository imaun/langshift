class Translator {
    async translate(text: string, targetLang: string, model: string) {
        throw new Error('AI Translate provider not supported.');
    }
}

const LANGSHIFT_API_KEY: string = 'langshift_api_key';

class OpenAITranslator extends Translator {

    async translate(text: string, targetLang: string, model: string) {
        const _apiUrl: string = 'https://api.openai.com/v1/chat/completions';

        const { openai_api_key: apiKey } = await chrome.storage.sync.get([LANGSHIFT_API_KEY]);
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

    async translate(text: string, targetLang: string, model: string) {
        const _apiUrl = 'https://api.anthropic.com/v1/messages';

        const { claude_api_key: apiKey } = await chrome.storage.sync.get([LANGSHIFT_API_KEY]);
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