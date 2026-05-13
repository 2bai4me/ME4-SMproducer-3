/**
 * LLM Client – Provider-abstrahierte API-Calls für LLM-Dienste.
 *
 * Unterstützt OpenAI-kompatible APIs (Moonshot/Kimi, DeepSeek, LM Studio, etc.)
 * Liest API-Keys und Provider-Konfiguration aus der globalen DB.
 *
 * Verwendete Modelle:
 *   - Moonshot AI International: kimi-k2-0905-preview (128k context)
 *   - DeepSeek: deepseek-chat (128k context)
 *
 * @module llm/client
 */

const DEFAULT_TIMEOUT_MS = 30_000; // 30 Sekunden (F-UB01)

/**
 * LLM-Client mit Provider-Konfiguration aus der globalen DB.
 */
export class LLMClient {
  /**
   * @param {import('better-sqlite3').Database} globalDB – Die globale Datenbank
   */
  constructor(globalDB) {
    this.db = globalDB;
  }

  /**
   * Aktiven LLM-Provider aus der DB lesen.
   * @returns {{ provider: string, apiKey: string, endpoint: string, model: string } | null}
   */
  getActiveProvider() {
    try {
      const row = this.db.prepare(
        "SELECT * FROM llm_providers WHERE is_active = 1 ORDER BY position LIMIT 1"
      ).get();

      if (row) {
        return {
          provider: row.provider,
          apiKey: row.api_key,
          endpoint: row.endpoint,
          model: this._defaultModelForProvider(row.provider),
        };
      }

      // Fallback: Ersten Provider mit API-Key nehmen
      const any = this.db.prepare(
        "SELECT * FROM llm_providers WHERE api_key != '' ORDER BY position LIMIT 1"
      ).get();

      if (any) {
        return {
          provider: any.provider,
          apiKey: any.api_key,
          endpoint: any.endpoint,
          model: this._defaultModelForProvider(any.provider),
        };
      }

      return null;
    } catch (err) {
      console.error('[LLM] Fehler beim Lesen des Providers:', err.message);
      return null;
    }
  }

  /**
   * Standard-Modell pro Provider.
   */
  _defaultModelForProvider(provider) {
    const models = {
      'moonshot': 'kimi-k2-0905-preview',
      'kimi': 'kimi-k2-0905-preview',
      'deepseek': 'deepseek-chat',
      'openai': 'gpt-4o-mini',
      'lmstudio': 'local-model',
      'lm-studio': 'local-model',
    };
    return models[provider?.toLowerCase()] || 'kimi-k2-0905-preview';
  }

  /**
   * Standard-Endpunkt pro Provider.
   */
  _defaultEndpoint(provider) {
    const endpoints = {
      'moonshot': 'https://api.moonshot.ai/v1',
      'kimi': 'https://api.moonshot.ai/v1',
      'deepseek': 'https://api.deepseek.com/v1',
      'openai': 'https://api.openai.com/v1',
      'lmstudio': 'http://localhost:1234/v1',
      'lm-studio': 'http://localhost:1234/v1',
    };
    return endpoints[provider?.toLowerCase()] || 'https://api.moonshot.ai/v1';
  }

  /**
   * Führe einen Chat-Completion-Call aus.
   *
   * @param {object} options
   * @param {string} options.systemPrompt – System-Prompt
   * @param {string} options.userPrompt – User-Prompt
   * @param {object} [options.overrides] – Provider/Model/Key überschreiben
   * @returns {Promise<string>} – Antwort-Text des LLM
   */
  async chat({ systemPrompt, userPrompt, overrides = {} }) {
    const provider = overrides.provider
      ? { provider: overrides.provider, apiKey: overrides.apiKey, endpoint: overrides.endpoint, model: overrides.model }
      : this.getActiveProvider();

    if (!provider || !provider.apiKey) {
      throw new Error(
        'Kein LLM-Provider konfiguriert. Bitte konfigurieren Sie einen Provider in den globalen Einstellungen.' +
        ' (F-UB06)'
      );
    }

    const endpoint = provider.endpoint || this._defaultEndpoint(provider.provider);
    const model = provider.model || this._defaultModelForProvider(provider.provider);
    const apiKey = provider.apiKey;

    const baseUrl = endpoint.replace(/\/+$/, '');
    const url = `${baseUrl}/chat/completions`;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            `API-Key für ${provider.provider} ungültig. Bitte aktualisieren Sie den Key in den globalen Einstellungen. (F-UB06)`
          );
        }
        throw new Error(
          `LLM-API-Fehler (${response.status}): ${errBody.slice(0, 300)}`
        );
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error(
          'Prompt konnte nicht generiert werden. Bitte überprüfen Sie die ausgewählten Kriterien. (F-UB03)'
        );
      }

      const content = data.choices[0]?.message?.content || '';

      if (!content || content.trim().length === 0) {
        throw new Error(
          'Prompt konnte nicht generiert werden. Bitte überprüfen Sie die ausgewählten Kriterien. (F-UB03)'
        );
      }

      return content;
    } catch (err) {
      clearTimeout(timeout);

      if (err.name === 'AbortError') {
        throw new Error(
          'LLM-Anfrage Timeout (30s). Der Dienst ist nicht erreichbar. Bitte versuchen Sie es erneut. (F-UB01)'
        );
      }

      throw err;
    }
  }

  /**
   * Strukturierte JSON-Antwort vom LLM anfordern.
   * @param {object} options – wie chat(), plus:
   * @param {object} options.jsonSchema – Beschreibung des erwarteten JSON-Schemas (im Prompt)
   * @returns {Promise<object>} – Geparstes JSON
   */
  async chatJSON({ systemPrompt, userPrompt, jsonSchema, overrides = {} }) {
    const schemaHint = jsonSchema
      ? `\n\nANTWORTE AUSSCHLIESSLICH MIT VALIDEM JSON. Format: ${jsonSchema}`
      : '\n\nANTWORTE AUSSCHLIESSLICH MIT VALIDEM JSON.';

    const fullUserPrompt = (userPrompt || '') + schemaHint;

    const response = await this.chat({
      systemPrompt: (systemPrompt || '') + '\nDu bist ein JSON-Generator. Antworte ausschließlich mit gültigem JSON, keine Erklärungen.',
      userPrompt: fullUserPrompt,
      overrides,
    });

    // Versuche JSON zu parsen
    try {
      // Entferne mögliche Markdown-Code-Blöcke
      let cleaned = response.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '');
        cleaned = cleaned.replace(/\n?```\s*$/, '');
      }
      return JSON.parse(cleaned);
    } catch (parseErr) {
      // Fallback: versuche JSON aus dem Text zu extrahieren
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (_) {
          throw new Error('LLM-Antwort konnte nicht als JSON geparst werden. (F-UB03)');
        }
      }
      throw new Error('LLM-Antwort enthielt kein gültiges JSON. (F-UB03)');
    }
  }
}

/**
 * Convenience-Factory: Erstellt einen LLMClient aus der globalen DB.
 * @param {import('better-sqlite3').Database} globalDB
 * @returns {LLMClient}
 */
export function createLLMClient(globalDB) {
  return new LLMClient(globalDB);
}
