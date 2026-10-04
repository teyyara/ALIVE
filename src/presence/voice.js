export function createVoiceController({ onStart, onEnd, onError }) {
  let enabled = false;
  let voices = [];
  let selectedVoice = null;

  const available = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const preferredVoicePatterns = [
    /samantha/i,
    /victoria/i,
    /karen/i,
    /ava/i,
    /aria/i,
    /jenny/i,
    /zira/i,
    /google.*female/i,
    /microsoft.*female/i,
    /female/i
  ];

  function loadVoices() {
    if (!available) return;

    voices = window.speechSynthesis.getVoices();

    const english = voices.filter((voice) => /^en(-|_)/i.test(voice.lang));
    selectedVoice =
      english.find((voice) => preferredVoicePatterns.some((pattern) => pattern.test(voice.name))) ||
      english.find((voice) => /natural|neural|premium|enhanced/i.test(voice.name)) ||
      english[0] ||
      voices[0] ||
      null;
  }

  if (available) {
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled && available) window.speechSynthesis.cancel();
    return enabled;
  }

  function speak(text) {
    if (!enabled || !available || !text?.trim()) return false;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = 0.94;
      utterance.pitch = 1.08;
      utterance.volume = 0.92;
      utterance.lang = 'en-US';

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang || 'en-US';
      }

      utterance.onstart = () => onStart?.();
      utterance.onend = () => onEnd?.();
      utterance.onerror = (event) => onError?.(event);

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (error) {
      onError?.(error);
      return false;
    }
  }

  function stop() {
    if (available) window.speechSynthesis.cancel();
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
    stop,
    destroy
  };
}
