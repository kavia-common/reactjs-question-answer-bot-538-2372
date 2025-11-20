import React from 'react';

// PUBLIC_INTERFACE
export default function Header({ theme, onToggleTheme }) {
  /** Renders the top header with title, subtitle, and theme toggle button. */
  const nextTheme = theme === 'light' ? 'dark' : 'light';
  return (
    <header className="container header" role="banner">
      <div className="header-title">
        <h1 aria-label="Application Title">ReactJS Q&A Chatbot</h1>
        <p aria-label="Application Subtitle">Ask questions about React — powered by Gemini</p>
      </div>
      <button
        type="button"
        className="theme-toggle-btn"
        onClick={onToggleTheme}
        aria-label={`Switch to ${nextTheme} mode`}
      >
        {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
      </button>
    </header>
  );
}
