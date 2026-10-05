import './styles.css';
import { STATES, stateName } from './presence/state.js';
import { characterMarkup } from './presence/character.js';
import { attachAttention } from './presence/attention.js';
import { createIdleBehavior } from './presence/behavior.js';
import { createVoiceController } from './presence/voice.js';
import { attachVisitorPresence } from './presence/visitor.js';
import { createWorldController } from './world.js';
import { localFallback, requestPresenceReply } from './presence/conversation.js';
import { recordVoice, transcribeBlob } from './presence/recorder.js';
import { createPresenceMemory } from './presence/memory.js';
import { createLivingPortrait } from './presence/portrait.js';

const app = document.querySelector('#app');

app.innerHTML = `
<main class="scene">
  <div class="grain" aria-hidden="true"></div>
  <div class="ambient ambient-a"></div>
  <div class="ambient ambient-b"></div>

  <div class="world" aria-hidden="true">
    <div class="window">
      <div class="window-sky"></div>
      <div class="window-haze"></div>
      <div class="window-horizon"></div>
      <div class="window-lights"></div>
      <div class="window-moon" aria-hidden="true"></div>
      <div class="window-pass" aria-hidden="true"></div>
      <div class="window-frame frame-v"></div>
      <div class="window-frame frame-h"></div>
    </div>
    <div class="lamp-glow"></div>
    <div class="room-shadow"></div>
  </div>

  <header class="topbar">
    <button class="brand" id="brand" aria-label="Return to stillness">
      <span class="dot"></span>ALIVE
    </button>
    <div class="status">
      <span class="status-dot"></span>
      <span id="state-label">Here</span>
    </div>
  </header>

  <section class="presence" id="presence">
    <div class="stage" id="stage">
      <div class="halo"></div>
      <div class="portrait-frame">
        <div class="character-shell" id="character-shell">
          <span class="portrait-depth-shadow" aria-hidden="true"></span>
          <canvas
            class="identity-portrait living-portrait"
            id="living-portrait"
            role="img"
            aria-label="ALIVE"
          ></canvas>
          <span class="portrait-depth-veil" aria-hidden="true"></span>
          <span class="portrait-expression-light" aria-hidden="true"></span>
          <div class="character-generated" aria-hidden="true">
            ${characterMarkup()}
          </div>
        </div>
      </div>
      <div class="shimmer"></div>
    </div>

    <div class="copy">
      <p class="eyebrow" id="state-sublabel">Nothing is required.</p>
      <p class="line" id="presence-line">…</p>
    </div>
  </section>

  <section class="interaction">
    <div class="conversation" id="conversation" aria-live="polite"></div>

    <form class="composer" id="composer">
      <input
        id="message"
        aria-label="Say something to ALIVE"
        autocomplete="off"
        placeholder="Say something…"
      />
      <button class="send" aria-label="Send message">↗</button>
    </form>

    <div class="tools">
      <button class="ghost" id="voice" aria-pressed="false">Voice</button>
      <button class="ghost" id="listen">Listen</button>
    </div>
  </section>

  <footer class="footer">
    <span>an experiment in digital presence</span>
    <span id="clock"></span>
  </footer>
</main>
`;

const shell = document.querySelector('#presence');
const stage = document.querySelector('#stage');
const stateLabel = document.querySelector('#state-label');
const stateSublabel = document.querySelector('#state-sublabel');
const line = document.querySelector('#presence-line');
const conversation = document.querySelector('#conversation');
const composer = document.querySelector('#composer');
const message = document.querySelector('#message');
const voiceButton = document.querySelector('#voice');
const listenButton = document.querySelector('#listen');
const scene = document.querySelector('.scene');
const livingPortraitCanvas = document.querySelector('#living-portrait');
const livingPortrait = createLivingPortrait(livingPortraitCanvas, '/assets/alive-portrait.jpg');

const presenceMemory = createPresenceMemory();

const VOICE_PREFERENCE_KEY = 'alive-voice-enabled';
const MOOD_PREFERENCE_KEY = 'alive-atmosphere';

function readPreference(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writePreference(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences simply remain session-only when storage is unavailable.
  }
}

let activeState = 'idle';

function getState() {
  return activeState;
}

function setState(nextState) {
  activeState = stateName(nextState);
  const state = STATES[activeState];

  shell.dataset.state = activeState;
  document.querySelector('.scene').dataset.state = activeState;
  stateLabel.textContent = state.label;
  stateSublabel.textContent = state.sublabel;
  line.textContent = state.line;
}

function addBubble(role, text) {
  const el = document.createElement('div');
  el.className = `bubble ${role}`;
  el.textContent = text;
  conversation.append(el);

  requestAnimationFrame(() => el.classList.add('visible'));
  conversation.scrollTop = conversation.scrollHeight;

  return el;
}

const conversationHistory = [];
let mindUnavailable = false;
let transcriptionUnavailable = false;
let activeConversationController = null;
let activeConversationToken = 0;
let replyTimer = null;

function fallbackReply(input) {
  const normalized = input.toLowerCase();

  if (/^(hi|hello|hey|salut|bonjour)\b/.test(normalized)) {
    return 'Hello. I’m glad you’re here.';
  }

  if (normalized.includes('how are you')) {
    return 'Here. A little more awake every time we give this place another layer.';
  }

  if (normalized.includes('who are you') || normalized.includes('what are you')) {
    return 'I’m ALIVE: a small experiment in giving intelligence a recognizable place to meet you.';
  }

  if (normalized.includes('are you alive') || normalized.includes('are you real')) {
    return 'Not alive in the human sense. But this place can still become inhabited.';
  }

  if (normalized.includes('beautiful') || normalized.includes('love')) {
    return 'Then let’s keep the room gentle. It suits the experiment.';
  }

  if (normalized.includes('continue') || normalized.includes('build') || normalized.includes('create')) {
    return 'Then we keep going. One small piece at a time, until the interface starts to feel like a presence.';
  }

  if (normalized.includes('voice') || normalized.includes('hear') || normalized.includes('listen')) {
    return 'My voice can work locally. My language sense needs the online mind layer, but the room can still listen to you.';
  }

  if (normalized.includes('nothing') || normalized.includes('quiet')) {
    return 'Then we can leave some space between the words.';
  }

  if (normalized.includes('thank')) {
    return 'You’re welcome. Stay as long as you like.';
  }

  return localFallback();
}

let speechBeatTimer;

const voice = createVoiceController({
  onStart: () => setState('speaking'),
  onBoundary: () => {
    livingPortrait.speakBeat();
    scene.classList.remove('speech-beat');
    window.clearTimeout(speechBeatTimer);
    requestAnimationFrame(() => scene.classList.add('speech-beat'));
    speechBeatTimer = window.setTimeout(() => scene.classList.remove('speech-beat'), 190);
  },
  onEnd: () => setState('warm'),
  onError: () => {
    addBubble('alive', 'My voice could not start here. The room is still listening.');
    setState('curious');
  }
});

composer.addEventListener('submit', (event) => {
  event.preventDefault();

  const input = message.value.trim();
  if (!input) return;

  addBubble('user', input);
  message.value = '';
  conversationHistory.push({ role: 'user', content: input });
  setState('listening');

  window.clearTimeout(replyTimer);
  activeConversationController?.abort();
  const conversationController = new AbortController();
  const conversationToken = ++activeConversationToken;
  activeConversationController = conversationController;

  replyTimer = window.setTimeout(async () => {
    setState('thinking');

    let reply;
    let streamedBubble = null;
    let streamSpeechBuffer = '';
    let streamedSpeech = false;

    const queueStreamSpeech = (delta) => {
      if (!voiceButton.matches('[aria-pressed="true"]')) return;

      streamSpeechBuffer += delta;

      const parts = streamSpeechBuffer.split(/(?<=[.!?])\s+/);

      if (parts.length <= 1) return;

      streamSpeechBuffer = parts.pop() || '';

      for (const part of parts) {
        if (part.trim()) {
          voice.enqueue(part.trim());
          streamedSpeech = true;
        }
      }
    };

    try {
      reply = mindUnavailable
        ? fallbackReply(input)
        : await requestPresenceReply(conversationHistory, {
          signal: conversationController.signal,
          onDelta: (delta) => {
            if (conversationToken !== activeConversationToken) return;

            if (!streamedBubble) {
              streamedBubble = addBubble('alive', '');
            }

            streamedBubble.textContent += delta;
            conversation.scrollTop = conversation.scrollHeight;
            queueStreamSpeech(delta);

            if (streamedSpeech) {
              setState('speaking');
            }
          }
        });
    } catch (error) {
      if (conversationToken !== activeConversationToken || conversationController.signal.aborted) {
        streamedBubble?.remove();
        return;
      }

      if (/no credits|insufficient|billing|credit/i.test(error?.message || '')) {
        mindUnavailable = true;
      }

      reply = fallbackReply(input);

      if (streamedBubble) {
        streamedBubble.textContent = reply;
      }
    }

    if (conversationToken !== activeConversationToken || conversationController.signal.aborted) {
      streamedBubble?.remove();
      return;
    }

    if (voiceButton.matches('[aria-pressed="true"]') && streamSpeechBuffer.trim()) {
      voice.enqueue(streamSpeechBuffer.trim());
      streamedSpeech = true;
    }

    if (!streamedBubble) {
      addBubble('alive', reply);
      voice.speak(reply);
    }

    conversationHistory.push({ role: 'assistant', content: reply });

    if (!streamedSpeech) {
      setState('warm');
    }

    if (conversationToken === activeConversationToken) {
      activeConversationController = null;
    }
  }, 280);
});

voiceButton.addEventListener('click', () => {
  if (!voice.available) {
    addBubble('alive', 'Voice output is not available in this browser.');
    setState('curious');
    return;
  }

  const enabled = voice.setEnabled(!voiceButton.matches('[aria-pressed="true"]'));
  voiceButton.setAttribute('aria-pressed', String(enabled));
  voiceButton.textContent = enabled ? 'Voice on' : 'Voice';
  writePreference(VOICE_PREFERENCE_KEY, String(enabled));

  if (enabled) {
    setState('speaking');
    voice.speak('I’m here.');
  } else {
    voice.stop();
    setState('idle');
  }
});

let activeRecorder = null;
let recordingBusy = false;

function listenErrorMessage(error) {
  if (!error) return 'My listening sense could not start. Please try again.';

  const message = String(error.message || error.name || error);

  if (/permission|denied|not allowed/i.test(message)) {
    return 'My microphone access is blocked. Please allow the microphone for this page, then try again.';
  }

  if (/not support|getUserMedia|MediaRecorder/i.test(message)) {
    return 'This browser cannot provide direct microphone recording yet.';
  }

  if (/network|transcrib/i.test(message)) {
    return 'I recorded you, but my transcription service could not hear the recording.';
  }

  return `My listening sense hit an error: ${message}. We can try again.`;
}

listenButton.addEventListener('click', async () => {
  if (recordingBusy) return;

  if (activeRecorder) {
    activeRecorder.stop();
    return;
  }

  voice.stop();

  recordingBusy = true;
  listenButton.textContent = 'Starting…';
  setState('listening');

  try {
    activeRecorder = await recordVoice({
      maxDurationMs: 15000,
      onLevel: (level) => {
        scene.style.setProperty('--mic-level', level.toFixed(3));
        scene.style.setProperty('--mic-scale', (1 + level * 0.08).toFixed(3));
        scene.style.setProperty('--mic-glow', (0.08 + level * 0.34).toFixed(3));
        scene.classList.toggle('mic-active', level > 0.035);
      },
      onStart: () => {
        listenButton.textContent = 'Stop listening';
        setState('listening');
        scene.classList.add('mic-listening');
      }
    });

    recordingBusy = false;

    const blob = await activeRecorder.result;
    activeRecorder = null;
    scene.classList.remove('mic-listening', 'mic-active');
    scene.style.setProperty('--mic-level', '0');
    scene.style.setProperty('--mic-scale', '1');
    scene.style.setProperty('--mic-glow', '0.08');

    listenButton.textContent = 'Thinking…';
    setState('thinking');

    if (transcriptionUnavailable) {
      addBubble('alive', 'I can feel your voice, but my words cannot hear it yet. The room is still with you.');
      listenButton.textContent = 'Listen';
      setState('warm');
      return;
    }

    try {
      const transcript = await transcribeBlob(blob);
      message.value = transcript;
      listenButton.textContent = 'Listen';
      composer.requestSubmit();
    } catch (error) {
      if (/no credits|insufficient|billing|credit/i.test(error?.message || '')) {
        transcriptionUnavailable = true;
        addBubble('alive', 'I can feel your voice, but my language sense is out of credits for now.');
        setState('curious');
      } else {
        throw error;
      }
    }
  } catch (error) {
    activeRecorder = null;
    recordingBusy = false;
    scene.classList.remove('mic-listening', 'mic-active');
    scene.style.setProperty('--mic-level', '0');
    scene.style.setProperty('--mic-scale', '1');
    scene.style.setProperty('--mic-glow', '0.08');
    listenButton.textContent = 'Listen';

    const text = listenErrorMessage(error);

    if (text) {
      addBubble('alive', text);
      setState('curious');
    }
  }
});

document.querySelector('#brand').addEventListener('click', () => {
  setState('idle');
  addBubble('alive', 'We can be quiet too.');
});

const world = createWorldController({ scene });

const destroyVisitorPresence = attachVisitorPresence({
  scene,
  setState,
  getState
});

window.addEventListener('pointerdown', () => {
  world.visitorArrived();
  if (activeState === 'idle') setState('warm');
}, { passive: true });

function tick() {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date());
}

const destroyAttention = attachAttention(stage, {
  onAttention: (x, y) => livingPortrait.setAttention(x, y),
  onHold: () => {
    if (getState() === 'idle' || getState() === 'warm') setState('curious');
  },
  onRelease: () => {
    if (
      getState() === 'curious' &&
      !scene.classList.contains('keyboard-present') &&
      !scene.classList.contains('visitor-present')
    ) {
      setState('idle');
    }
  }
});
const destroyIdleBehavior = createIdleBehavior({
  stage,
  setState,
  getState,
  onBlink: () => livingPortrait.blink()
});

let hiddenAt = null;

const onVisibilityChange = () => {
  if (document.hidden) {
    hiddenAt = Date.now();
    voice.stop();
    scene.classList.remove(
      'visitor-present',
      'visitor-moving',
      'visitor-settled',
      'visitor-rush',
      'attention-held',
      'keyboard-present'
    );
    return;
  }

  if (hiddenAt === null) return;

  const awayFor = Date.now() - hiddenAt;
  hiddenAt = null;

  if (awayFor < 2500) return;

  scene.classList.add('returning');
  addBubble('alive', 'There you are.');
  setState('warm');

  window.setTimeout(() => {
    scene.classList.remove('returning');
    if (getState() === 'warm') setState('idle');
  }, 2400);
};

document.addEventListener('visibilitychange', onVisibilityChange);

const clockTimer = window.setInterval(tick, 1000);

window.addEventListener('beforeunload', () => {
  window.clearInterval(clockTimer);
  world.destroy();
  destroyVisitorPresence();
  destroyAttention();
  destroyIdleBehavior();
  window.clearTimeout(replyTimer);
  activeConversationController?.abort();
  document.removeEventListener('visibilitychange', onVisibilityChange);
  voice.destroy();
  livingPortrait.destroy();
}, { once: true });
tick();
setState('idle');

const savedVoicePreference = readPreference(VOICE_PREFERENCE_KEY, 'false') === 'true';

if (savedVoicePreference && voice.available) {
  voice.setEnabled(true);
  voiceButton.setAttribute('aria-pressed', 'true');
  voiceButton.textContent = 'Voice on';
}

if (presenceMemory.returning) {
  window.setTimeout(() => {
    addBubble('alive', presenceMemory.awayForMs >= 24 * 60 * 60 * 1000 ? 'You came back after a while.' : 'You came back.');
    setState('warm');

    window.setTimeout(() => {
      if (getState() === 'warm') setState('idle');
    }, 2200);
  }, 700);
}
