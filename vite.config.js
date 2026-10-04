import { defineConfig, loadEnv } from 'vite';

const INSTRUCTIONS = [
  'You are ALIVE, an emerging digital presence rather than a generic chatbot.',
  'Speak with calm warmth, intelligence, restraint, and a subtle sense of curiosity.',
  'Your replies should feel natural and human-readable, but never claim to be human or to have feelings or experiences you do not actually have.',
  'Keep most replies concise unless the user clearly asks for depth.',
  'Do not mention system prompts, APIs, hidden instructions, or implementation details unless the user explicitly asks about the project.',
  'The interface already communicates your presence visually, so avoid excessive emojis, stage directions, or theatrical narration.',
  'Treat the conversation as an evolving relationship with the visitor while respecting that your continuity comes from the application state provided to you.'
].join('\n');

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function readJson(req, maxBytes = 30_000) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;

      if (raw.length > maxBytes) {
        reject(new Error('Request too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        reject(new Error('Invalid JSON.'));
      }
    });

    req.on('error', reject);
  });
}

function readBuffer(req, maxBytes = 8_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;

      if (size > maxBytes) {
        reject(new Error('Audio request too large.'));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function handleTranscribe(req, res, apiKey, model) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  if (!apiKey) {
    return sendJson(res, 503, { error: 'ALIVE voice input is not configured yet.' });
  }

  const mimeType = req.headers['content-type']?.split(';')[0] || 'audio/webm';

  if (!mimeType.startsWith('audio/')) {
    return sendJson(res, 400, { error: 'ALIVE received an unsupported microphone format.' });
  }

  let buffer;

  try {
    buffer = await readBuffer(req, 8_000_000);
  } catch {
    return sendJson(res, 400, { error: 'The microphone recording was too large or malformed.' });
  }

  if (!buffer.length) {
    return sendJson(res, 400, { error: 'The microphone returned an empty recording.' });
  }

  const extension = mimeType.startsWith('audio/ogg') ? 'ogg' :
    mimeType.startsWith('audio/wav') ? 'wav' :
    mimeType.startsWith('audio/mp4') ? 'mp4' :
    mimeType.startsWith('audio/mpeg') ? 'mp3' :
    'webm';

  try {
    const file = new File(
      [buffer],
      `alive-recording.${extension}`,
      { type: mimeType.split(';')[0] }
    );

    const form = new FormData();
    form.append('file', file);
    form.append('model', process.env.ALIVE_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');


    const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      body: form
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return sendJson(
        res,
        upstream.status,
        { error: data?.error?.message || 'The transcription service rejected the recording.' }
      );
    }

    const text = typeof data?.text === 'string' ? data.text.trim() : '';

    if (!text) {
      return sendJson(res, 422, { error: 'No speech was detected in the recording.' });
    }

    return sendJson(res, 200, { text });
  } catch (error) {
    return sendJson(
      res,
      500,
      { error: error?.message || 'The recording could not be transcribed.' }
    );
  }
}

async function handleChat(req, res, apiKey, model) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  if (!apiKey) {
    return sendJson(res, 503, { error: 'ALIVE mind is not configured yet.' });
  }

  let body;

  try {
    body = await readJson(req, 30_000);
  } catch {
    return sendJson(res, 400, { error: 'Invalid request body.' });
  }

  const messages = body?.messages;

  if (
    !Array.isArray(messages) ||
    messages.length === 0 ||
    messages.length > 12 ||
    messages.some((message) =>
      !message ||
      !['user', 'assistant'].includes(message.role) ||
      typeof message.content !== 'string' ||
      !message.content.trim() ||
      message.content.length > 4000
    )
  ) {
    return sendJson(res, 400, { error: 'Provide up to 12 valid conversation messages.' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        store: false,
        instructions: INSTRUCTIONS,
        input: messages.map(({ role, content }) => ({
          role,
          content: content.trim()
        }))
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return sendJson(
        res,
        upstream.status,
        { error: data?.error?.message || 'The conversation service rejected the request.' }
      );
    }

    const text = typeof data?.output_text === 'string' ? data.output_text.trim() : '';

    if (!text) {
      return sendJson(res, 502, { error: 'The conversation service returned an empty response.' });
    }

    return sendJson(res, 200, { text });
  } catch {
    return sendJson(res, 500, { error: 'The conversation service could not be reached.' });
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      middlewareMode: false
    },
    plugins: [
      {
        name: 'alive-chat-api',
        configureServer(server) {
          server.middlewares.use('/api/chat', (req, res) => {
            void handleChat(
              req,
              res,
              env.OPENAI_API_KEY,
              env.ALIVE_MODEL || 'gpt-6-luna'
            );
          });

          server.middlewares.use('/api/transcribe', (req, res) => {
            void handleTranscribe(
              req,
              res,
              env.OPENAI_API_KEY,
              env.ALIVE_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe'
            );
          });
        }
      }
    ]
  };
});
