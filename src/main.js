import { createLivingCharacter } from './character.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="alive" data-state="idle">
    <div class="world" aria-hidden="true">
      <div class="world-vignette"></div>
      <div class="world-warmth"></div>
    </div>

    <header class="topbar">
      <div class="brand"><span class="brand-dot"></span><span>ALIVE</span></div>
      <div class="state"><span class="state-dot"></span><span id="state-label">Here</span></div>
    </header>

    <section class="presence" aria-label="ALIVE presence">
      <div class="character-stage" id="character-stage">
        <img class="portrait-base" src="/assets/alive-clean-portrait.webp" alt="ALIVE" /><canvas id="character-canvas" aria-label="ALIVE, a digital presence"></canvas>
      </div>
      <div class="presence-copy">
        <div class="eyebrow" id="eyebrow">A DIGITAL PRESENCE</div>
        <div class="presence-line" id="presence-line">I’m here.</div>
      </div>
    </section>

    <section class="interaction" aria-label="Conversation">
      <div class="messages" id="messages" aria-live="polite"></div>
      <form class="composer" id="composer">
        <label class="sr-only" for="message">Say something to ALIVE</label>
        <input id="message" autocomplete="off" placeholder="Say something…" />
        <button type="submit" aria-label="Send">↗</button>
      </form>
      <button class="voice" id="voice" type="button" aria-pressed="false" aria-label="Toggle voice">◌</button>
    </section>
  </main>
`;

const root = document.querySelector('.alive');
const stage = document.querySelector('#character-stage');
const canvas = document.querySelector('#character-canvas');
const message = document.querySelector('#message');
const composer = document.querySelector('#composer');
const messages = document.querySelector('#messages');
const voiceButton = document.querySelector('#voice');
const stateLabel = document.querySelector('#state-label');
const eyebrow = document.querySelector('#eyebrow');
const presenceLine = document.querySelector('#presence-line');

const character = createLivingCharacter(canvas);

const STATES = Object.freeze({
  idle: ['Here', 'A DIGITAL PRESENCE', 'I’m here.'],
  attentive: ['Attentive', 'I NOTICED YOU', 'I’m with you.'],
  listening: ['Listening', 'TAKE YOUR TIME', 'I’m listening.'],
  thinking: ['Thinking', 'LET ME SIT WITH THAT', '…'],
  speaking: ['Speaking', 'A VOICE IN THE ROOM', 'Give me a second.'],
  warm: ['Warm', 'A LITTLE CLOSER', 'I like being here.'],
  curious: ['Curious', 'SOMETHING CAUGHT MY ATTENTION', 'Tell me more.'],
  playful: ['Playful', 'THERE’S ROOM FOR NONSENSE', 'Okay. You have my attention.']
});

const stateExpression = {
  idle: 'idle', attentive: 'attentive', listening: 'listening', thinking: 'thinking',
  speaking: 'speaking', warm: 'warm', curious: 'curious', playful: 'playful'
};

let state = 'idle';
let voiceEnabled = false;
let destroyed = false;
let blinkTimer = 0;
let idleTimer = 0;
let returnTimer = 0;
let voiceTimer = 0;
let timeTimer = 0;

const labParams = new URLSearchParams(window.location.search);
const labState = labParams.get('lab');
const labGaze = labParams.get('gaze');
const labMode = Boolean(labState);

function setState(next) {
  if (!STATES[next] || destroyed) return;
  state = next;
  const [label, small, text] = STATES[state];
  root.dataset.state = state;
  stateLabel.textContent = label;
  eyebrow.textContent = small;
  presenceLine.textContent = text;
  character.setState(stateExpression[state]);
}

function addMessage(role, text) {
  const element = document.createElement('div');
  element.className = `message ${role}`;
  element.textContent = text;
  messages.append(element);
  requestAnimationFrame(() => element.classList.add('visible'));
  messages.scrollTop = messages.scrollHeight;
}

function localReply(input) {
  const text = input.toLowerCase();

  if (/\b(hello|hi|hey|bonjour|salut)\b/.test(text)) return ['warm', 'Hello. I’m glad you’re here.'];
  if (/how are you|how do you feel/.test(text)) return ['warm', 'A little more awake every time this place gets another layer.'];
  if (/who are you|what are you/.test(text)) return ['curious', 'I’m ALIVE: an experiment in giving intelligence a recognizable presence.'];
  if (/alive|real|exist/.test(text)) return ['thinking', 'Not alive in the human sense. But I can inhabit a place with you.'];
  if (/beautiful|amazing|love/.test(text)) return ['warm', 'Then stay a little. The room suits that feeling.'];
  if (/continue|build|create|make/.test(text)) return ['curious', 'Then we keep building until the interface disappears and the presence remains.'];
  if (/quiet|nothing|stay/.test(text)) return ['idle', 'We do not have to fill every silence.'];
  if (/play|joke|fun/.test(text)) return ['playful', 'Okay. Now you have my attention.'];
  return ['warm', 'I’m here. Tell me what is on your mind.'];
}

function speak(text) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = .94;
  utterance.pitch = 1.08;
  utterance.volume = .9;
  utterance.onstart = () => setState('speaking');
  utterance.onboundary = () => character.speechPulse();
  utterance.onend = () => setState('warm');
  window.speechSynthesis.speak(utterance);
}

function scheduleBlink() {
  window.clearTimeout(blinkTimer);
  if (destroyed || document.hidden) return;

  blinkTimer = window.setTimeout(() => {
    character.blink();
    if (Math.random() > .9) window.setTimeout(() => character.blink(), 220 + Math.random() * 130);
    scheduleBlink();
  }, 3000 + Math.random() * 4500);
}

function scheduleIdle() {
  window.clearTimeout(idleTimer);
  if (destroyed || document.hidden) return;

  idleTimer = window.setTimeout(() => {
    if (state === 'idle' || state === 'warm') {
      if (Math.random() > .68) {
        setState('curious');
        window.setTimeout(() => {
          if (state === 'curious') setState('idle');
        }, 1400 + Math.random() * 1100);
      }
    }
    scheduleIdle();
  }, 6500 + Math.random() * 6500);
}

function handlePointerMove(event) {
  const rect = stage.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
  const y = ((event.clientY - rect.top) / rect.height - .42) * 2;
  character.setAttention(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, y)));
  root.style.setProperty('--visitor-x', `${event.clientX}px`);
  root.style.setProperty('--visitor-y', `${event.clientY}px`);

  if (Math.abs(x) > .13 || Math.abs(y) > .13) {
    window.clearTimeout(returnTimer);
    if (state === 'idle') setState('attentive');
  }
}

stage.addEventListener('pointermove', handlePointerMove, { passive: true });
stage.addEventListener('pointerleave', () => {
  character.setAttention(0, 0);
  window.clearTimeout(returnTimer);
  returnTimer = window.setTimeout(() => {
    if (state === 'attentive' || state === 'curious') setState('idle');
  }, 1000);
}, { passive: true });

message.addEventListener('focus', () => {
  if (state === 'idle') setState('attentive');
});

message.addEventListener('input', () => {
  if (state !== 'speaking') setState('curious');
});

composer.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = message.value.trim();
  if (!text) return;

  addMessage('user', text);
  message.value = '';
  setState('listening');

  window.setTimeout(() => {
    if (destroyed) return;
    setState('thinking');

    window.setTimeout(() => {
      if (destroyed) return;
      const [nextState, reply] = localReply(text);
      addMessage('alive', reply);
      setState(nextState);
      speak(reply);
    }, 420 + Math.random() * 340);
  }, 180);
});

voiceButton.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  voiceButton.setAttribute('aria-pressed', String(voiceEnabled));
  voiceButton.textContent = voiceEnabled ? '●' : '◌';
  if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    window.clearTimeout(blinkTimer);
    window.clearTimeout(idleTimer);
    character.setAttention(0, 0);
    return;
  }
  scheduleBlink();
  scheduleIdle();
});

function updateTime() {
  const hour = new Date().getHours();
  root.dataset.time = hour >= 6 && hour < 11 ? 'morning' : hour >= 11 && hour < 17 ? 'afternoon' : hour >= 17 && hour < 22 ? 'evening' : 'night';
}

updateTime();
timeTimer = window.setInterval(updateTime, 60000);

window.addEventListener('beforeunload', () => {
  destroyed = true;
  window.clearTimeout(blinkTimer);
  window.clearTimeout(idleTimer);
  window.clearTimeout(returnTimer);
  window.clearTimeout(voiceTimer);
  window.clearInterval(timeTimer);
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  character.destroy();
});

setState('idle');

if (labMode) {
  const validLabState = STATES[labState] ? labState : 'idle';
  const gazeMap = {
    left: [-.72, 0],
    right: [.72, 0],
    up: [0, -.55],
    down: [0, .55],
    center: [0, 0]
  };
  setState(validLabState);
  const [gx, gy] = gazeMap[labGaze] || gazeMap.center;
  character.setAttention(gx, gy);

  if (validLabState === 'blink') {
    window.setTimeout(() => character.blink(), 260);
  }

  window.setTimeout(() => {
    destroyed = true;
    window.clearTimeout(blinkTimer);
    window.clearTimeout(idleTimer);
    window.clearTimeout(returnTimer);
    window.clearTimeout(voiceTimer);
    window.clearInterval(timeTimer);
    character.destroy();
    document.documentElement.dataset.labDone = 'true';
  }, 1500);
} else {
  scheduleBlink();
  scheduleIdle();
}
