import { useCallback, useEffect, useRef, useState } from 'react';
import { askQuestion } from '../services/geminiClient';
import { flags } from '../utils/env';

const MAX_INPUT = 4000;

/**
 * Tiny rule-based preprocessor map.
 * - Keys are canonical forms to match against user input after trim+lowercase.
 * - Values are the assistant's fixed reply.
 * Extend this object to add more instant replies.
 */
const RULES = {
  'hi': 'hello',
  'hello': 'hello',
  'hey': 'hello',
  'good': 'fine',
};

// PUBLIC_INTERFACE
export function useChat() {
  /**
   * Manages chat messages, loading state, errors, typing indicator, and sending messages.
   * Messages are of shape: {id, role: 'user'|'assistant'|'system', content, createdAt}
   */
  const [messages, setMessages] = useState(() => ([
    {
      id: 'sys-1',
      role: 'system',
      content: 'You are Gemini, a helpful assistant specialized in React. Keep answers concise with examples.',
      createdAt: Date.now(),
    }
  ]));
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(null);

  const lastUserMessageRef = useRef(null);
  const inflightRef = useRef({ cancel: null });

  const canSend = !loading;

  useEffect(() => {
    return () => {
      if (inflightRef.current.cancel) {
        inflightRef.current.cancel();
      }
    };
  }, []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_INPUT) {
      setError(new Error(`Message too long (${trimmed.length}/${MAX_INPUT}). Please shorten it.`));
      return;
    }
    if (loading) return;

    setError(null);

    // Normalize for rule matching
    const canonical = trimmed.toLowerCase();

    // push user message immediately
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: Date.now(),
    };
    lastUserMessageRef.current = userMsg;
    setMessages((prev) => [...prev, userMsg]);

    // Rule-based shortcut: if matched, append assistant reply and skip backend
    if (Object.prototype.hasOwnProperty.call(RULES, canonical)) {
      const reply = RULES[canonical];
      const assistantMsg = {
        id: `a-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return; // Do not call the API
    }

    // Otherwise, proceed with normal flow to backend
    setLoading(true);
    setTyping(true);

    // prepare assistant placeholder for streaming
    const assistantId = `a-${Date.now() + 1}`;
    let partial = '';

    const onDelta = (chunk) => {
      partial += chunk || '';
      setMessages((prev) => {
        // if assistant already exists as last, update; otherwise append
        const copy = [...prev];
        const idx = copy.findIndex((m) => m.id === assistantId);
        if (idx === -1) {
          copy.push({ id: assistantId, role: 'assistant', content: partial, createdAt: Date.now() });
        } else {
          copy[idx] = { ...copy[idx], content: partial };
        }
        return copy;
      });
    };

    try {
      const controller = new AbortController();
      inflightRef.current.cancel = () => controller.abort();

      const resp = await askQuestion(trimmed, { history: messages }, onDelta, controller.signal);

      if (!resp || typeof resp.text !== 'string') {
        throw new Error('Empty response from assistant.');
      }

      // If we did not stream, append final message now
      if (!flags.streamingUsedLast) {
        setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: resp.text, createdAt: Date.now() }]);
      } else {
        // we streamed; ensure final text matches collected partial
        if (partial && resp.text && partial !== resp.text) {
          setMessages((prev) => {
            const copy = [...prev];
            const idx = copy.findIndex((m) => m.id === assistantId);
            if (idx >= 0) copy[idx] = { ...copy[idx], content: resp.text };
            return copy;
          });
        }
      }
    } catch (e) {
      // show friendly error with configuration hint if thrown by client
      setError(e);
    } finally {
      setTyping(false);
      setLoading(false);
      inflightRef.current.cancel = null;
      flags.streamingUsedLast = false;
    }
  }, [loading, messages]);

  const retry = useCallback(async () => {
    const last = lastUserMessageRef.current;
    if (last?.content) {
      await sendMessage(last.content);
    }
  }, [sendMessage]);

  return { messages: messages.filter(m => m.role !== 'system'), loading, typing, error, sendMessage, retry, canSend };
}
