const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Map([
  ['audio/webm', 'audio.webm'],
  ['audio/webm;codecs=opus', 'audio.webm'],
  ['audio/ogg', 'audio.ogg'],
  ['audio/ogg;codecs=opus', 'audio.ogg'],
  ['audio/wav', 'audio.wav'],
  ['audio/mpeg', 'audio.mp3'],
  ['audio/mp4', 'audio.mp4']
]);

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function validAudio(audio, mimeType) {
  return typeof audio === 'string'
    && audio.length > 0
    && audio.length <= Math.ceil(MAX_AUDIO_BYTES * 1.4)
    && ALLOWED_MIME_TYPES.has(mimeType);
}

function decodeBase64(base64) {
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length > MAX_AUDIO_BYTES) {
    throw new Error('Recording is too large.');
  }

  return buffer;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return json(res, 503, { error: 'ALIVE voice input is not configured yet.' });
  }

  const { audio, mimeType = 'audio/webm' } = req.body ?? {};

  if (!validAudio(audio, mimeType)) {
    return json(res, 400, { error: 'Provide a supported microphone recording.' });
  }

  try {
    const buffer = decodeBase64(audio);
    const file = new File(
      [buffer],
      ALLOWED_MIME_TYPES.get(mimeType) || 'audio.webm',
      { type: mimeType.split(';')[0] }
    );

    const form = new FormData();
    form.append('file', file);
    form.append('model', process.env.ALIVE_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');
    form.append('language', 'en');

    const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return json(
        res,
        upstream.status,
        { error: data?.error?.message || 'The transcription service rejected the recording.' }
      );
    }

    const text = typeof data?.text === 'string' ? data.text.trim() : '';

    if (!text) {
      return json(res, 422, { error: 'No speech was detected in the recording.' });
    }

    return json(res, 200, { text });
  } catch {
    return json(res, 500, { error: 'The recording could not be transcribed.' });
  }
}
