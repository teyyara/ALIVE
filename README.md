# ALIVE

ALIVE is an experiment in giving an artificial intelligence a visual place to meet a human.

The repository is intentionally small at first. The goal is not a conventional chatbot UI. The goal is a **presence**: a recognizable visual identity with natural idle behavior, attention, expression, voice, and eventually a more embodied character and environment.

## Current foundation
- cinematic digital room
- feminine visual identity
- natural idle motion
- state model: idle, listening, curious, thinking, warm, playful, speaking
- pointer-aware parallax and sustained-attention response
- restrained portrait depth planes
- typing-aware room response
- optional browser voice output and direct microphone recording
- modular source layout ready for a layered 2.5D/3D body

## Development
```bash
npm install
npm run dev
```

## Philosophy
> Nothing should move merely because it can. Every movement should communicate something.

ALIVE should feel inhabited, not animated.


## Conversation mind

ALIVE can use the OpenAI Responses API through the server-side `/api/chat` boundary. The browser never receives the API key.

For local development:

1. Copy `.env.example` to `.env.local`.
2. Put your API key in `OPENAI_API_KEY`.
3. Keep `ALIVE_MODEL=gpt-6-luna` unless you choose another model available to your API project.
4. Restart `npm run dev`.

The server-side route uses `store: false` and receives only the recent conversation history from the current ALIVE session.

## Current experience

The first presence layer is now intentionally useful even without API credits. The browser handles pointer attention, subtle idle gaze drift, sustained attention, typing engagement, visitor presence, local microphone recording and level sensing, voice output, ambient response, and small local conversational fallbacks. Paid services are isolated behind server-side endpoints.

When API credits are unavailable, ALIVE stops retrying the paid mind/transcription path for the current session and remains responsive locally rather than becoming a broken shell.

The portrait asset in `public/assets/alive-portrait.jpg` is currently a temporary compressed delivery of the chosen identity. The high-quality source should replace it later without changing the identity itself.
