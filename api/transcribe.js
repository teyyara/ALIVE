const MAX_AUDIO_BYTES = 3.5 * 1024 * 1024;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
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
      buffer = Buffer.from(audio, 'base64');
    } else if (audio instanceof Uint8Array) {
      buffer = Buffer.from(audio);
    } else {
      throw new Error('No microphone recording was received.');
    }

    if (!buffer.length) {
      throw new Error('The microphone returned an empty recording.');
    }

    if (buffer.length > MAX_AUDIO_BYTES) {
      throw new Error('Recording is too large.');
    }

    const extension =
      mimeType.startsWith('audio/ogg') ? 'ogg' :
      mimeType.startsWith('audio/wav') ? 'wav' :
      mimeType.startsWith('audio/mp4') ? 'mp4' :
      mimeType.startsWith('audio/mpeg') ? 'mp3' :
      'webm';

    const file = new File(
      [buffer],
      `alive-recording.${extension}`,
      { type: mimeType }
    );

    const form = new FormData();
    form.append(
      'file',
      file,
      `alive-recording.${extension}`
    );
    form.append(
      'model',
      process.env.ALIVE_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe'
    );

    const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: form
    });

    const data = await upstream.json().catch(() => ({}));

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
