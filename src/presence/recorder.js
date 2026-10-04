export async function recordVoice({ onStart, onStop, onError, maxDurationMs = 12000 } = {}) {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    throw new Error('This browser does not support direct microphone recording.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    }
  });

  const mimeType =
    ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      .find((type) => MediaRecorder.isTypeSupported(type)) || '';

  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  let timer;

  const stopTracks = () => {
    stream.getTracks().forEach((track) => track.stop());
    window.clearTimeout(timer);
  };

  const promise = new Promise((resolve, reject) => {
    recorder.onstart = () => {
      onStart?.();
      timer = window.setTimeout(() => recorder.stop(), maxDurationMs);
    };

    recorder.ondataavailable = (event) => {
      if (event.data?.size) chunks.push(event.data);
    };

    recorder.onerror = (event) => {
      stopTracks();
      const error = event.error || new Error('Microphone recording failed.');
      onError?.(error);
      reject(error);
    };

    recorder.onstop = () => {
      stopTracks();
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      onStop?.(blob);
      resolve(blob);
    };

    try {
      recorder.start(250);
    } catch (error) {
      stopTracks();
      onError?.(error);
      reject(error);
    }
  });

  return {
    stop() {
      if (recorder.state !== 'inactive') recorder.stop();
    },
    result: promise
  };
}

export async function blobToBase64(blob) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read the recording.'));
    reader.readAsDataURL(blob);
  });

  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

export async function transcribeBlob(blob) {
  const base64 = await blobToBase64(blob);

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: base64,
      mimeType: blob.type || 'audio/webm'
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'Transcription failed.');
  }

  const text = typeof data?.text === 'string' ? data.text.trim() : '';
  if (!text) throw new Error('No speech was found in the recording.');

  return text;
}
