export async function recordVoice({ onStart, onStop, onError, onLevel, maxDurationMs = 12000 } = {}) {
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
  let silenceTimer;
  let audioContext;
  let analyser;
  let levelFrame;
  let heardSpeech = false;
  let noiseFloor = 0.012;
  let noiseSamples = 0;

  try {
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Uint8Array(analyser.fftSize);

    const readLevel = () => {
      analyser.getByteTimeDomainData(data);

      let sum = 0;

      for (let index = 0; index < data.length; index += 1) {
        const normalized = (data[index] - 128) / 128;
        sum += normalized * normalized;
      }

      const rms = Math.sqrt(sum / data.length);
      const level = Math.min(1, rms * 3.6);

      if (!heardSpeech && noiseSamples < 36) {
        noiseFloor = noiseFloor * 0.92 + level * 0.08;
        noiseSamples += 1;
      }

      onLevel?.(level);

      const speechThreshold = Math.max(0.045, Math.min(0.12, noiseFloor + 0.028));

      if (level > speechThreshold) {
        heardSpeech = true;
        window.clearTimeout(silenceTimer);
      } else if (heardSpeech) {
        window.clearTimeout(silenceTimer);
        silenceTimer = window.setTimeout(() => {
          if (recorder.state !== 'inactive') recorder.stop();
        }, 1400);
      }

      levelFrame = window.requestAnimationFrame(readLevel);
    };

    readLevel();
  } catch {
    audioContext = null;
    analyser = null;
  }

  const stopTracks = () => {
    window.cancelAnimationFrame(levelFrame);
    onLevel?.(0);
    stream.getTracks().forEach((track) => track.stop());
    window.clearTimeout(timer);
    window.clearTimeout(silenceTimer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageHide);
    audioContext?.close().catch(() => {});
  };

  const onVisibilityChange = () => {
    if (document.hidden && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const onPageHide = () => {
    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
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

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

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

export async function transcribeBlob(blob) {
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': blob.type || 'audio/webm'
    },
    body: blob
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || 'Transcription failed.');
  }

  const text = typeof data?.text === 'string' ? data.text.trim() : '';
  if (!text) throw new Error('No speech was found in the recording.');

  return text;
}
