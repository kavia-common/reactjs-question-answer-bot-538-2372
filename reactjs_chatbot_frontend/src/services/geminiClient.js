import { flags, isDev, GEMINI_API_KEY, ensureGeminiKeyOrThrow } from '../utils/env';

/**
 * PUBLIC_INTERFACE
 * askQuestion sends a prompt directly to Google Gemini (gemini-2.0-flash) using REST.
 * - Preserves rule-based quick replies at the hook level; this function is called only if no rule matched.
 * - No WebSocket streaming here; emits a single onDelta once with the full text for compatibility.
 * Returns: Promise<{ text: string }>
 *
 * Security note: This directly uses a client-side API key which is insecure for production.
 */
export async function askQuestion(prompt, context = {}, onDelta, signal) {
  if (!prompt || !prompt.trim()) {
    return { text: '' };
  }

  // Enforce presence of the Gemini API key in the frontend env.
  ensureGeminiKeyOrThrow();

  // Build payload for Gemini generateContent REST API.
  // Docs: POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=API_KEY
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const sysMsg = Array.isArray(context?.history)
    ? context.history.find((m) => m.role === 'system')
    : null;

  const systemInstruction = sysMsg?.content || 'You are Gemini, a helpful assistant specialized in React. Keep answers concise with examples.';

  const contents = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  const body = {
    contents,
    systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.6,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 2048,
      // candidateCount: 1, // default is fine
    },
    // safetySettings: [...] // keep defaults for now
  };

  const controller = new AbortController();
  const compositeSignal = mergeAbortSignals(signal, controller.signal);
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: compositeSignal,
    });

    if (!res.ok) {
      const errBody = await safeJson(res);
      const msg =
        errBody?.error?.message ||
        errBody?.error ||
        `Gemini request failed with status ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();

    // Extract text from Gemini response
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || '').join('') ||
      data?.text ||
      '';

    if (!text) {
      throw new Error('Empty response from Gemini.');
    }

    // Emit once to keep onDelta contract usable (non-streaming)
    if (typeof onDelta === 'function') {
      try {
        onDelta(text);
        flags.streamingUsedLast = true; // mark so the caller doesn't re-append
      } catch (e) {
        if (isDev) {
          // eslint-disable-next-line no-console
          console.warn('onDelta callback failed:', e);
        }
      }
    }

    return { text };
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('The request timed out. Please try again.');
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}

function safeJson(res) {
  return res.json().catch(() => ({}));
}

function mergeAbortSignals(signalA, signalB) {
  if (!signalA) return signalB;
  if (!signalB) return signalA;
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (signalA.aborted || signalB.aborted) {
    controller.abort();
  } else {
    signalA.addEventListener('abort', onAbort);
    signalB.addEventListener('abort', onAbort);
  }
  return controller.signal;
}
