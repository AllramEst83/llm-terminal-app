## 80s Terminal Chatbot

This project reimagines a late-20th-century terminal—glowing phosphor text, chunky borders, and all, but layers it with a modern conversational AI experience. The goal is to capture that nostalgic boot-screen vibe while letting today’s LLM-backed workflows shine, giving developers a playground where retro aesthetics meet contemporary intelligence.

### Features

- **Retro terminal UI**: 80s-style boot-screen look and feel.
- **Conversational AI**: Backed by Google Gemini via the `@google/genai` SDK.
- **Multi-panel layout**: Terminal sessions, messages, and supporting UI components.

### Tech stack

- **Frontend**: React + TypeScript
- **Build tooling**: Vite
- **Styling**: Tailwind CSS (via `@tailwindcss/postcss`)

### Run locally

**Prerequisites:** Node.js and a Gemini API key.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in `.env.local` to your Gemini API key.
3. Run the app:
   ```bash
   npm run dev
   ```

### Contributing

Contributions are welcome. See `CONTRIBUTING.md` for details on how to report issues, suggest features, and open pull requests.

### License

This project is licensed under the MIT License. You are free to use, modify, and distribute it, provided you retain the copyright
and permission notice as attribution to the original author. See `LICENSE` for the full text.
