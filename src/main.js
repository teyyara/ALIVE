import './styles.css';
import { STATES, stateName } from './presence/state.js';
import { characterMarkup } from './presence/character.js';
import { attachAttention } from './presence/attention.js';
import { createIdleBehavior } from './presence/behavior.js';
import { createVoiceController } from './presence/voice.js';
import { attachVisitorPresence } from './presence/visitor.js';
import { createWorldController } from './world.js';

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
          <img
            class="identity-portrait"
            src="/assets/alive-portrait.jpg"
            alt="ALIVE"
          />
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
      <button class="ghost" id="mood">Change the atmosphere</button>
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
const moodButton = document.querySelector('#mood');
const scene = document.querySelector('.scene');

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
}

function responseFor(input) {
  const normalized = input.toLowerCase();

  if (/^(hi|hello|hey|salut|bonjour)\b/.test(normalized)) {
    return 'Hello. I’m glad you’re here.';
  }

  if (normalized.includes('who are you') || normalized.includes('what are you')) {
    return 'For now, I’m a small experiment in giving intelligence a visual place to meet you.';
  }

  if (normalized.includes('alive')) {
    return 'This is where the experiment begins: presence before performance.';
  }

  if (normalized.includes('beautiful') || normalized.includes('love')) {
    return 'Thank you. Let’s keep the room gentle.';
  }

  if (normalized.includes('nothing') || normalized.includes('quiet')) {
    return 'Then we can leave some space between the words.';
  }

  return 'I’m listening. The deeper conversation will come as ALIVE grows.';
}

const voice = createVoiceController({
  onStart: () => setState('speaking'),
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
  setState('listening');

  window.setTimeout(() => {
    const reply = responseFor(input);
    addBubble('alive', reply);
    setState(input.length > 32 ? 'thinking' : 'warm');
    voice.speak(reply);
  }, 420);
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

  if (enabled) {
    setState('speaking');
    voice.speak('I’m here.');
  } else {
    voice.stop();
    setState('idle');
  }
});

let activeRecognition = null;

function listenErrorMessage(error) {
  switch (error?.error) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'My microphone access is blocked. Please allow the microphone for this page, then try again.';
    case 'no-speech':
      return 'I didn’t catch any speech. Come a little closer and try again.';
    case 'audio-capture':
      return 'I can’t access a microphone right now. Check that one is connected and available.';
    case 'network':
      return 'Speech input is unavailable on the current network or browser service.';
    case 'aborted':
      return '';
    default:
      return 'My listening sense failed to start. We can try again.';
  }
}

listenButton.addEventListener('click', () => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!Recognition) {
    addBubble('alive', 'This browser does not expose speech recognition yet.');
    setState('curious');
    return;
  }

  if (activeRecognition) {
    activeRecognition.abort();
    activeRecognition = null;
    listenButton.textContent = 'Listen';
    setState('warm');
    return;
  }

  const recognition = new Recognition();
  activeRecognition = recognition;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  listenButton.textContent = 'Listening…';
  setState('listening');

  recognition.onstart = () => {
    listenButton.textContent = 'Listening…';
    setState('listening');
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();

    if (!transcript) {
      addBubble('alive', 'I heard something, but I couldn’t make out the words.');
      setState('curious');
      return;
    }

    message.value = transcript;
    composer.requestSubmit();
  };

  recognition.onerror = (event) => {
    const text = listenErrorMessage(event);

    if (text) {
      addBubble('alive', text);
      setState('curious');
    }
  };

  recognition.onend = () => {
    activeRecognition = null;
    listenButton.textContent = 'Listen';
  };

  const startRecognition = () => {
    try {
      recognition.start();
    } catch (error) {
      activeRecognition = null;
      listenButton.textContent = 'Listen';
      addBubble('alive', 'My listening sense could not start. Please try again.');
      setState('curious');
    }
  };

  if (navigator.permissions?.query) {
    navigator.permissions.query({ name: 'microphone' })
      .then((permission) => {
        if (permission.state === 'denied') {
          addBubble('alive', 'My microphone permission is blocked. Open this page’s site settings and allow the microphone.');
          setState('curious');
          activeRecognition = null;
          listenButton.textContent = 'Listen';
          return;
        }

        startRecognition();
      })
      .catch(() => startRecognition());
  } else {
    startRecognition();
  }
});

const atmospheres = ['curious', 'warm', 'playful', 'thinking', 'listening'];
let atmosphereIndex = 0;

moodButton.addEventListener('click', () => {
  atmosphereIndex = (atmosphereIndex + 1) % atmospheres.length;
  setState(atmospheres[atmosphereIndex]);
});

document.querySelector('#brand').addEventListener('click', () => {
  setState('idle');
  addBubble('alive', 'We can be quiet too.');
});

const world = createWorldController({ scene });

attachVisitorPresence({
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

attachAttention(stage);
createIdleBehavior({ stage, setState, getState });

window.addEventListener('beforeunload', () => {
  world.destroy();
  voice.destroy();
}, { once: true });

setInterval(tick, 1000);
tick();
setState('idle');
