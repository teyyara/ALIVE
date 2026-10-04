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

export async function requestPresenceReply(history, { signal } = {}) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: history.slice(-12) }),
    signal
  });

  if (!response.ok) {
    let reason = 'Conversation service unavailable.';
    try {
      const data = await response.json();
      reason = data?.error || reason;
    } catch {
      // Keep the original fallback when the server does not return JSON.
    }
    throw new Error(reason);
  }

  const data = await response.json();
  const text = typeof data?.text === 'string' ? data.text.trim() : '';

  if (!text) throw new Error('The conversation service returned no text.');
  return text;
}
