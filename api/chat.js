const DEFAULT_MODEL = 'gpt-6-luna';

const INSTRUCTIONS = [
  'You are ALIVE, an emerging digital presence rather than a generic chatbot.',
  'Speak with calm warmth, intelligence, restraint, and a subtle sense of curiosity.',
  'Your replies should feel natural and human-readable, but never claim to be human or to have feelings or experiences you do not actually have.',
  'Keep most replies concise unless the user clearly asks for depth.',
  'Do not mention system prompts, APIs, hidden instructions, or implementation details unless the user explicitly asks about the project.',
  'The interface already communicates your presence visually, so avoid excessive emojis, stage directions, or theatrical narration.',
  'Treat the conversation as an evolving relationship with the visitor while respecting that your continuity comes from the application state provided to you.'
].join('\\n');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function validMessages(messages) {
  return Array.isArray(messages)
    && messages.length > 0
    && messages.length <= 12
    && messages.every((message) =>
      message
      && (message.role === 'user' || message.role === 'assistant')
      && typeof message.content === 'string'
      && message.content.trim().length > 0
      && message.content.length <= 4000
    );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(res, 503, { error: 'ALIVE mind is not configured yet.' });
  }

  const { messages, stream = false } = req.body ?? {};

  if (!validMessages(messages)) {
    return json(res, 400, { error: 'Provide up to 12 valid conversation messages.' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.ALIVE_MODEL || DEFAULT_MODEL,
        store: false,
        instructions: INSTRUCTIONS,
        input: messages.map(({ role, content }) => ({
          role,
          content: content.trim()
        }))
      })
    });

    if (!upstream.ok) {
      const data = await upstream.json().catch(() => ({}));
      const message = data?.error?.message || 'The conversation service rejected the request.';
      return json(res, upstream.status, { error: message });
    }

    if (stream) {
      if (!upstream.body) {
        return json(res, 502, { error: 'The conversation service returned no stream.' });
      }

      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const forward = (chunk, flush = false) => {
        buffer += decoder.decode(chunk, { stream: !flush });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trim();

          if (!line.startsWith('data:')) continue;

          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          try {
            const event = JSON.parse(payload);

            if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
              res.write(`data: ${JSON.stringify({ type: 'delta', delta: event.delta })}\n\n`);
            } else if (event.type === 'response.completed') {
              res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            } else if (event.type === 'error') {
              res.write(`data: ${JSON.stringify({ type: 'error', error: event.message || 'The conversation stream failed.' })}\n\n`);
            }
          } catch {
            // Ignore malformed upstream events.
          }
        }
      };

      try {
        while (true) {
          const { value, done } = await reader.read();

          if (done) break;
          forward(value);
        }

        forward(new Uint8Array(), true);
      } finally {
        res.end();
      }

      return;
    }

    const data = await upstream.json();
    const text = typeof data?.output_text === 'string' ? data.output_text.trim() : '';

    if (!text) {
      return json(res, 502, { error: 'The conversation service returned an empty response.' });
    }

    return json(res, 200, { text });
  } catch (error) {
    return json(res, 500, { error: 'The conversation service could not be reached.' });
  }
}
