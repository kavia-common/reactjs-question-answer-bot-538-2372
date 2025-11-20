import { API_BASE, WS_URL, flags, isDev } from '../utils/env';

/**
 * PUBLIC_INTERFACE
 * askQuestion sends a prompt to the backend Gemini proxy.
 * - If WS_URL and streaming experiment enabled, attempts WebSocket streaming and emits partial tokens via onDelta.
 * - Otherwise performs a REST POST to `${API_BASE || '/api'}/ask`.
 * Returns: Promise<{ text: string }>
 */
export async function askQuestion(prompt, context = {}, onDelta, signal) {
  if (!prompt || !prompt.trim()) {
    return { text: '' };
  }

  // Optional WebSocket streaming mode
  const wantStreaming = !!WS_URL && (flags.experimentsEnabled || flags.featureFlags.streaming);
  if (wantStreaming) {
    try {
      flags.streamingUsedLast = true;
      const wsUrl = new URL(WS_URL);
      wsUrl.searchParams.set('prompt', prompt);
      if (context && Object.keys(context).length > 0) {
        wsUrl.searchParams.set('context', encodeURIComponent(JSON.stringify(context)));
      }

      const final = await streamViaWebSocket(wsUrl.toString(), onDelta, signal);
      return { text: final };
    } catch (err) {
      // fallback to REST if WS fails
      if (isDev) {
        // eslint-disable-next-line no-console
        console.warn('WebSocket streaming failed, falling back to REST:', err);
      }
      flags.streamingUsedLast = false;
    }
  }

  // REST path
  const base = API_BASE || '';
  if (!base) {
    throw new Error('API is not configured. Please set REACT_APP_API_BASE or REACT_APP_BACKEND_URL in your .env, or provide a proxy at /api.');
  }
  const url = `${base.replace(/\/+$/,'')}/ask`;

  const controller = new AbortController();
  const compositeSignal = mergeAbortSignals(signal, controller.signal);
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, context }),
      signal: compositeSignal,
    });
    if (!res.ok) {
      const body = await safeJson(res);
      throw new Error(body?.error || `Request failed with status ${res.status}`);
    }
    const data = await res.json();
    return { text: data?.text ?? '' };
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

function streamViaWebSocket(url, onDelta, signal) {
  return new Promise((resolve, reject) => {
    let closed = false;
    let finalText = '';

    let ws;

    try {
      ws = new WebSocket(url);
    } catch (e) {
      reject(e);
      return;
    }

    const cleanup = () => {
      if (closed) return;
      closed = true;
      try { ws.close(); } catch {}
      if (signal) signal.removeEventListener?.('abort', onAbort);
    };

    const onAbort = () => {
      cleanup();
      reject(new Error('Streaming aborted.'));
    };

    if (signal) {
      if (signal.aborted) return onAbort();
      signal.addEventListener('abort', onAbort);
    }

    ws.onopen = () => {
      // connected
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'delta') {
          finalText += msg.data || '';
          onDelta?.(msg.data || '');
        } else if (msg.type === 'done') {
          cleanup();
          resolve(finalText);
        } else if (typeof msg.text === 'string') {
          // support simple {text}
          finalText = msg.text;
          cleanup();
          resolve(finalText);
        }
      } catch {
        // assume raw text
        const data = String(ev.data || '');
        finalText += data;
        onDelta?.(data);
      }
    };
    ws.onerror = (e) => {
      cleanup();
      reject(new Error('WebSocket error occurred.'));
    };
    ws.onclose = () => {
      cleanup();
      if (!finalText) {
        // if closed without any data, consider error to fallback
        reject(new Error('WebSocket closed without data.'));
      } else {
        resolve(finalText);
      }
    };
  });
}
