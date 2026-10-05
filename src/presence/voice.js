export function createVoiceController({ onStart, onEnd, onError }) {
  let enabled = false;
  let voices = [];
  let selectedVoice = null;
  let queue = [];
  let speaking = false;

  const available = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const preferredVoicePatterns = [
    /samantha/i,
    /victoria/i,
    /karen/i,
    /ava/i,
    /aria/i,
    /jenny/i,
    /zira/i,
    /susan/i,
    /hazel/i,
    /google.*female/i,
    /microsoft.*female/i,
    /female/i
  ];

  const maleVoicePatterns = [
    /david/i,
    /mark/i,
    /george/i,
    /daniel/i,
    /alex/i,
    /male/i
  ];

  function loadVoices() {
    if (!available) return;

    voices = window.speechSynthesis.getVoices();

    const english = voices.filter((voice) => /^en(-|_)/i.test(voice.lang));

    selectedVoice =
      english.find((voice) => preferredVoicePatterns.some((pattern) => pattern.test(voice.name))) ||
      english.find((voice) =>
        /natural|neural|premium|enhanced/i.test(voice.name) &&
        !maleVoicePatterns.some((pattern) => pattern.test(voice.name))
      ) ||
      english.find((voice) => !maleVoicePatterns.some((pattern) => pattern.test(voice.name))) ||
      english[0] ||
      voices[0] ||
      null;
  }

  function pump() {
    if (!enabled || !available || speaking || queue.length === 0) return;

    const text = queue.shift();

    try {
      speaking = true;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.94;
      utterance.pitch = 1.1;
      utterance.volume = 0.92;
      utterance.lang = selectedVoice?.lang || 'en-US';

      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onstart = () => onStart?.();
      utterance.onend = () => {
        speaking = false;

        if (queue.length > 0) {
          pump();
        } else {
          onEnd?.();
        }
      };
      utterance.onerror = (event) => {
        speaking = false;
        queue = [];
        onError?.(event);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      speaking = false;
      queue = [];
      onError?.(error);
    }
  }

  if (available) {
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  function setEnabled(value) {
    enabled = Boolean(value);

    if (!enabled && available) {
      window.speechSynthesis.cancel();
      queue = [];
      speaking = false;
    }

    if (enabled) pump();
    return enabled;
  }

  function speak(text) {
    if (!enabled || !available || !text?.trim()) return false;

    if (available) window.speechSynthesis.cancel();

    queue = [text.trim()];
    speaking = false;
    pump();
    return true;
  }

  function enqueue(text) {
    if (!enabled || !available || !text?.trim()) return false;

    queue.push(text.trim());
    pump();
    return true;
  }

  function stop() {
    if (available) window.speechSynthesis.cancel();
    queue = [];
    speaking = false;
  }

  function destroy() {
    stop();

    if (available) {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    }
  }

  return {
    available,
    setEnabled,
    speak,
    enqueue,
    stop,
    destroy
  };
}
