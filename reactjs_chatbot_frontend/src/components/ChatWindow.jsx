import React from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { GEMINI_API_KEY } from '../utils/env';

// PUBLIC_INTERFACE
export default function ChatWindow({
  messages,
  loading,
  typing,
  error,
  onRetry,
  onSend,
  canSend
}) {
  /** Central chat card with messages, error banner, and input. */
  const showInsecureWarning = Boolean(GEMINI_API_KEY);

  return (
    <section className="chat-card" aria-label="Chat window">
      <MessageList messages={messages} typing={typing} />

      {showInsecureWarning && (
        <div className="hint" role="note" aria-live="polite">
          Warning: A Gemini API key is configured in the frontend. This is insecure for production use. Prefer a backend proxy to keep credentials private.
        </div>
      )}

      {error && (
        <div className="error" role="alert" aria-live="assertive">
          <span>{error.message}</span>
          <div className="actions">
            <button className="btn-secondary" onClick={onRetry} aria-label="Retry sending message">Retry</button>
            <button
              className="btn-secondary"
              onClick={() => navigator.clipboard?.writeText(error.message || String(error))}
              aria-label="Copy error"
            >
              Copy error
            </button>
          </div>
        </div>
      )}
      <MessageInput onSend={onSend} disabled={loading || !canSend} />
    </section>
  );
}
