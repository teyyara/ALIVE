const FALLBACKS = [
  'I’m listening. The deeper conversation layer is not connected yet, but I’m still here.',
  'I heard you. For now my responses are small; the real mind is the next layer.',
  'Stay with me. I’m still becoming more than the interface around this conversation.'
];

let fallbackIndex = 0;

export function localFallback() {
  const reply = FALLBACKS[fallbackIndex % FALLBACKS.length];
  fallbackIndex += 1;
  return reply;
}

async function parseStream(response, onDelta) {
  if (!response.body) throw new Error('The conversation stream was empty.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let complete = '';

  const consume = (chunk, flush = false) => {
    buffer += decoder.decode(chunk, { stream: !flush });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line.startsWith('data:')) continue;

      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      const event = JSON.parse(payload);

      if (event.type === 'delta' && typeof event.delta === 'string') {
        complete += event.delta;
        onDelta?.(event.delta);
      }

      if (event.type === 'error') {
        throw new Error(event.error || 'The conversation stream failed.');
      }
    }
  };

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;
    consume(value);
  }

  consume(new Uint8Array(), true);

  if (!complete.trim()) throw new Error('The conversation stream returned no text.');

  return complete.trim();
}

export async function requestPresenceReply(history, { signal, onDelta } = {}) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: history.slice(-12),
      stream: true
    }),
    signal
  });

  if (!response.ok) {
    let reason = 'Conversation service unavailable.';

    try {
      const data = await response.json();
      reason = data?.error || reason;
    } catch {
      // Keep the generic fallback when the server does not return JSON.
    }

    throw new Error(reason);
  }

  if (!response.headers.get('Content-Type')?.includes('text/event-stream')) {
    const data = await response.json();
    const text = typeof data?.text === 'string' ? data.text.trim() : '';

    if (!text) throw new Error('The conversation service returned no text.');
    onDelta?.(text);
    return text;
  }

  return parseStream(response, onDelta);
}
