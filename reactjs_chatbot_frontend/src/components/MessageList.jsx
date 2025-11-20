import React, { useEffect, useRef } from 'react';

// Minimal markdown renderer for basic cases (bold, inline code, fenced code)
function renderMarkdown(text) {
  if (!text) return null;

  // fenced code blocks ```lang\ncode```
  const fenced = [];
  const parts = String(text).split(/```/);
  parts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      // code block
      fenced.push({ type: 'code', content: part.trim() });
    } else {
      // normal text with inline transforms
      fenced.push({ type: 'text', content: part });
    }
  });

  const transformInline = (s) => {
    // bold **text**
    let nodes = [];
    const splitBold = s.split(/\*\*(.*?)\*\*/g);
    splitBold.forEach((seg, i) => {
      if (i % 2 === 1) {
        nodes.push(<strong key={`b-${i}`}>{seg}</strong>);
      } else {
        // inline code `x`
        const inline = [];
        const splitCode = seg.split(/`(.*?)`/g);
        splitCode.forEach((cg, ci) => {
          if (ci % 2 === 1) {
            inline.push(
              <code key={`c-${i}-${ci}`}>{cg}</code>
            );
          } else {
            inline.push(<span key={`t-${i}-${ci}`}>{cg}</span>);
          }
        });
        nodes.push(<React.Fragment key={`seg-${i}`}>{inline}</React.Fragment>);
      }
    });
    return nodes;
  };

  return fenced.map((blk, i) => {
    if (blk.type === 'code') {
      return (
        <pre key={`pre-${i}`} aria-label="Code block">
          <code>{blk.content}</code>
        </pre>
      );
    }
    // paragraphs by double newline
    const paras = blk.content.split(/\n{2,}/g);
    return paras.map((p, pi) => (
      <p key={`p-${i}-${pi}`}>{transformInline(p)}</p>
    ));
  });
}

// PUBLIC_INTERFACE
export default function MessageList({ messages, typing }) {
  /** Scrolls to bottom on new messages and renders each bubble. */
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  return (
    <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions">
      {messages.map((m) => (
        <div key={m.id} className={`message ${m.role}`}>
          {m.role === 'assistant' && (
            <div className="avatar" aria-hidden="true">G</div>
          )}
          <div className="bubble">
            {renderMarkdown(m.content)}
          </div>
        </div>
      ))}
      {typing && (
        <div className="typing" aria-live="polite" aria-label="Assistant is typing">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
