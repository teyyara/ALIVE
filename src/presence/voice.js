export function createVoiceController({ onStart, onEnd, onError }) {
  let enabled = false;
  let voices = [];
  let selectedVoice = null;

  const available = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  function loadVoices() {
    if (!available) return;
    voices = window.speechSynthesis.getVoices();
    selectedVoice =
      voices.find((voice) => /^en(-|_)/i.test(voice.lang) && /natural|neural|premium|enhanced/i.test(voice.name)) ||
      voices.find((voice) => /^en(-|_)/i.test(voice.lang)) ||
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
      utterance.pitch = 1.04;
      utterance.volume = 0.92;
      utterance.lang = 'en-US';
      if (selectedVoice) utterance.voice = selectedVoice;
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
    if (available) window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }

  return { available, setEnabled, speak, stop, destroy };
}
