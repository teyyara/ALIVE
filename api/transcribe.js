const MAX_AUDIO_BYTES = 3.5 * 1024 * 1024;
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

  const mimeType = req.headers['content-type']?.split(';')[0] || 'audio/webm';
  const audio = req.body;

  let buffer;

  try {
    if (Buffer.isBuffer(audio)) {
      buffer = audio;
    } else if (typeof audio === 'string') {
      buffer = decodeBase64(audio);
    } else if (audio instanceof Uint8Array) {
      buffer = Buffer.from(audio);
    } else {
      throw new Error('No microphone recording was received.');
    }

    if (buffer.length > MAX_AUDIO_BYTES) {
      throw new Error('Recording is too large.');
    }
    const file = new File(
      [buffer],
      ALLOWED_MIME_TYPES.get(mimeType) || 'audio.webm',
      { type: mimeType.split(';')[0] }
    );

    const form = new FormData();
    form.append('file', file);
    form.append('model', process.env.ALIVE_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe');


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
  } catch (error) {
    return json(
      res,
      500,
      { error: error?.message || 'The recording could not be transcribed.' }
    );
  }
}
