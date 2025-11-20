# ReactJS Q&A Chatbot Frontend (Gemini)

A single‑page chat UI using the Ocean Professional theme to ask questions about ReactJS.

Now supports two modes:
- Backend proxy (recommended): Call your own backend to keep credentials safe.
- Direct Gemini from the browser (insecure, for local demos only): The app can call Google Gemini REST with model `gemini-2.0-flash` if you place `REACT_APP_GEMINI_API_KEY` in the frontend `.env`.

Security warning:
- Placing API keys in the frontend exposes them to users. Do not use this in production. Prefer a backend proxy.

## Quick Start

1) Install and start:
- npm install
- npm start  
App runs on http://localhost:3000

2) Choose a connection mode:

A) Recommended: Backend proxy
- Create a .env at the project root (same folder as package.json) with:
```
REACT_APP_API_BASE=http://localhost:8080/api
# Optional websocket for streaming
REACT_APP_WS_URL=ws://localhost:8080/ws
# Optional flags (comma OR JSON object). Example enables streaming:
REACT_APP_FEATURE_FLAGS=streaming
# Or enable experiments globally (also enables streaming attempt if WS present)
REACT_APP_EXPERIMENTS_ENABLED=true
```

Notes for proxy mode:
- Previous REST path used by the client was `${REACT_APP_API_BASE || '/api'}/ask`. If you keep a backend, ensure it returns JSON like: `{ "text": "<assistant answer>" }`.
- WS streaming expects messages of shape: `{type:"delta", data:"..."}`, and a final `{type:"done"}` (or a single `{text:"..."}).

B) Direct Gemini from the frontend (INSECURE: demo/dev only)
- In your `.env`, add:
```
REACT_APP_GEMINI_API_KEY=your_google_api_key_here
```
- The UI will display a warning banner indicating the insecurity of this setup.
- When present, the frontend will call Google Gemini REST directly at:
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- No streaming is performed in this mode; the full answer is returned at once.

If `REACT_APP_GEMINI_API_KEY` is missing and you attempt to send a message (with no rule-based match), the app will throw a clear error instructing you to add the key or use a proxy.

## UI and UX

- Ocean Professional theme with #2563EB primary and #F59E0B accents, rounded corners, subtle shadows, gradient background.
- Accessible: buttons have aria‑labels, role attributes present, keyboard send (Enter) and new line (Shift+Enter).
- Responsive: mobile friendly layout, sticky input, smooth scrolling, respects prefers‑reduced‑motion.
- Markdown-lite support for bold, inline code, and fenced code blocks.
- If `REACT_APP_GEMINI_API_KEY` is set, a warning banner appears in the chat card indicating the insecure nature of direct frontend API key usage.

## Files Overview

- public/index.html: CRA root HTML with <div id="root"></div>.
- src/App.js: root app, theme handling, header and chat composition.
- src/components/Header.jsx: title, subtitle, theme toggle.
- src/components/ChatWindow.jsx: message list + input + error display + insecure-use warning when key is present.
- src/components/MessageList.jsx: bubbles, markdown-lite, typing indicator.
- src/components/MessageInput.jsx: input with keyboard handling.
- src/hooks/useChat.js: messages state, loading, error, typing, send/retry, cleanup, and rule-based quick replies.
- src/services/geminiClient.js: Direct REST calls to Gemini `gemini-2.0-flash`. No backend proxy required when key is present.
- src/utils/env.js: env parsing, flags, theme preference, reduced motion, and Gemini key validation helper.
- src/App.css & src/index.css: Ocean Professional styles.

## Environment Variables

- REACT_APP_GEMINI_API_KEY: If present, the app will call Gemini directly from the browser (insecure for production). When missing, calling Gemini will throw a clear error.
- REACT_APP_API_BASE: (legacy/proxy) Base REST URL for your proxy (e.g., http://localhost:8080/api).
- REACT_APP_BACKEND_URL: Fallback base when API_BASE not set.
- REACT_APP_WS_URL: Optional WebSocket URL for streaming responses (proxy mode only).
- REACT_APP_FEATURE_FLAGS: Comma list or JSON object; include "streaming" to allow WS streaming (proxy mode).
- REACT_APP_EXPERIMENTS_ENABLED: true/false to enable experimental features globally.
- REACT_APP_NODE_ENV: environment indicator (production/dev).

Example .env (direct Gemini demo):
```
REACT_APP_GEMINI_API_KEY=your_google_api_key_here
```

Example .env (proxy mode):
```
REACT_APP_API_BASE=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080/ws
REACT_APP_FEATURE_FLAGS=streaming
REACT_APP_EXPERIMENTS_ENABLED=true
```

## Predefined Replies (Rule-based)

A lightweight rule-based preprocessor is included to respond instantly to certain exact inputs without calling Gemini. Matching is:
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
- For more complex patterns (e.g., regex, startsWith), consider expanding the preprocessor logic in sendMessage before the Gemini call.

## Tests

- Run with: npm test
- The test checks for the header and the "ReactJS Q&A Chatbot" title.

## Development Tips

- WARNING: Frontend API keys are insecure. Prefer the backend proxy in any production environment.
- The UI shows a friendly error if the key is missing (direct mode) or if a request fails.
- Copy button is available on errors to aid debugging.
