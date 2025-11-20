# ReactJS Q&A Chatbot Frontend (Gemini)

A single‑page chat UI using the Ocean Professional theme to ask questions about ReactJS. Integrates with a backend Gemini proxy via REST and optionally WebSocket streaming — no extra frontend dependencies.

## Quick Start

1) Install and start:
- npm install
- npm start
App runs on http://localhost:3000

2) Configure backend endpoint:
Create a .env file at project root (same folder as package.json) with:

REACT_APP_API_BASE=http://localhost:8080/api
# Optional websocket for streaming
REACT_APP_WS_URL=ws://localhost:8080/ws
# Optional flags (comma OR JSON object). Example enables streaming:
REACT_APP_FEATURE_FLAGS=streaming
# Or enable experiments globally (also enables streaming attempt if WS present)
REACT_APP_EXPERIMENTS_ENABLED=true

Notes:
- If neither REACT_APP_API_BASE nor REACT_APP_BACKEND_URL is set, the app will show a clear configuration hint when you try to send a message.
- REST default path used by the client is `${REACT_APP_API_BASE}/ask`. Backend should respond with JSON: { "text": "<assistant answer>" }.
- WebSocket streaming expects messages of shape: {type:"delta", data:"..."}, and a final {type:"done"} (or a single {text:"..."}).

## UI and UX

- Ocean Professional theme with #2563EB primary and #F59E0B accents, rounded corners, subtle shadows, gradient background.
- Accessible: buttons have aria‑labels, role attributes present, keyboard send (Enter) and new line (Shift+Enter).
- Responsive: mobile friendly layout, sticky input, smooth scrolling, respects prefers‑reduced‑motion.
- Markdown-lite support for bold, inline code, and fenced code blocks.

## Files Overview

- src/App.js: root app, theme handling, header and chat composition.
- src/components/Header.jsx: title, subtitle, theme toggle.
- src/components/ChatWindow.jsx: message list + input + error display.
- src/components/MessageList.jsx: bubbles, markdown-lite, typing indicator.
- src/components/MessageInput.jsx: input with keyboard handling.
- src/hooks/useChat.js: messages state, loading, error, typing, send/retry, cleanup.
- src/services/geminiClient.js: REST with optional WS streaming support via native fetch/WebSocket.
- src/utils/env.js: env parsing, flags, theme preference, reduced motion.
- src/App.css & src/index.css: Ocean Professional styles.

## Environment Variables

- REACT_APP_API_BASE: Base REST URL (e.g., http://localhost:8080/api). Used for POST ${API_BASE || '/api'}/ask
- REACT_APP_BACKEND_URL: Fallback base when API_BASE not set
- REACT_APP_WS_URL: Optional WebSocket URL for streaming responses
- REACT_APP_FEATURE_FLAGS: Comma list or JSON object; include "streaming" to allow WS streaming
- REACT_APP_EXPERIMENTS_ENABLED: true/false to enable experimental features globally
- REACT_APP_NODE_ENV: environment indicator (production/dev)

Example .env:
REACT_APP_API_BASE=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080/ws
REACT_APP_FEATURE_FLAGS=streaming
REACT_APP_EXPERIMENTS_ENABLED=true

## Predefined Replies (Rule-based)

A lightweight rule-based preprocessor is included to respond instantly to certain exact inputs without calling the backend. Matching is:
- Case-insensitive
- Trimmed (leading/trailing whitespace ignored)
- Exact string match against a small built-in map

Current built-in rules:
- "hi" | "hello" | "hey" -> "hello"
- "good" -> "fine"

How to extend:
1. Open src/hooks/useChat.js.
2. Locate the RULES object near the top of the file.
3. Add new entries where the key is the canonical input (lowercased string) and the value is the assistant reply, for example:
   // 'how are you' -> 'I’m doing great!'
   'how are you': "I'm doing great!",
4. Save; the UI will hot reload in development.

Notes:
- For multi-word phrases, match the exact trimmed, lowercased phrase.
- For more complex patterns (e.g., regex, startsWith), consider expanding the preprocessor logic in sendMessage before the backend call.

## Tests

If you see a test referencing the default CRA text, update assertions to the new header text "ReactJS Q&A Chatbot".

## Development Tips

- No API keys should be in the frontend; backend must handle Gemini credentials.
- The UI shows a friendly error if the API base is not configured or request fails.
- Copy button is available on errors to aid debugging.
