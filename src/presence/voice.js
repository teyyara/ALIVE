export function createVoiceController({ onStart, onEnd }) {
  let enabled = false;

  const available = 'speechSynthesis' in window;

  function setEnabled(value) {
    enabled = Boolean(value);
    return enabled;
  }

  function speak(text) {
    if (!enabled || !available) return false;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.94;
    utterance.pitch = 1.04;
    utterance.volume = 0.9;
    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    window.speechSynthesis.speak(utterance);
    return true;
  }

  return { available, setEnabled, speak };
}
