import React, { useEffect, useRef, useState } from 'react';

// PUBLIC_INTERFACE
export default function MessageInput({ onSend, disabled }) {
  /** Sticky input area with textarea and send button. */
  const [value, setValue] = useState('');
  const textRef = useRef(null);

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue('');
    await onSend(trimmed);
    textRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) handleSend();
    }
  };

  return (
    <div className="input-area" role="form" aria-label="Message input area">
      <textarea
        ref={textRef}
        className="textarea"
        placeholder="Ask a question about React..."
        aria-label="Type your message"
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
      />
      <button
        type="button"
        className="send-btn"
        onClick={handleSend}
        disabled={disabled || value.trim().length === 0}
        aria-label="Send message"
      >
        ➤ Send
      </button>
    </div>
  );
}
