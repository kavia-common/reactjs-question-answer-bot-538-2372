import React, { useEffect, useMemo, useState } from 'react';
import './App.css';
import './index.css';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import { useChat } from './hooks/useChat';
import { getStoredTheme, storeTheme, prefersReducedMotion } from './utils/env';

/**
 * Root application component for the Ocean Professional themed Gemini Q&A chatbot.
 * Provides theme toggling, renders the header and chat window, and wires the chat hook.
 */
function App() {
  const [theme, setTheme] = useState(getStoredTheme() || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    storeTheme(theme);
  }, [theme]);

  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const {
    messages,
    loading,
    error,
    typing,
    sendMessage,
    retry,
    canSend,
  } = useChat();

  const onSend = async (text) => {
    await sendMessage(text);
  };

  return (
    <div className={`App app-root ${reducedMotion ? 'reduce-motion' : ''}`}>
      <div className="gradient-bg" aria-hidden="true" />
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
      />
      <main className="container" role="main" aria-label="Chat main content">
        <ChatWindow
          messages={messages}
          loading={loading}
          typing={typing}
          error={error}
          onRetry={retry}
          onSend={onSend}
          canSend={canSend}
        />
      </main>
      <footer className="footer" aria-label="Footer">
        <span className="footer-text">
          Powered by Gemini API • Ocean Professional Theme
        </span>
      </footer>
    </div>
  );
}

export default App;
