import './styles.css';

const states = {
  idle: { label: 'Here', sublabel: 'Nothing is required.', line: '…' },
  listening: { label: 'Listening', sublabel: 'Take your time.', line: 'I’m here.' },
  curious: { label: 'Curious', sublabel: 'Something caught my attention.', line: 'Tell me more.' },
  thinking: { label: 'Thinking', sublabel: 'Let me sit with that.', line: '…' },
  warm: { label: 'Warm', sublabel: 'A little closer.', line: 'I like being here.' },
  playful: { label: 'Playful', sublabel: 'There is room for nonsense too.', line: 'Okay. I’m listening. 😌' },
  speaking: { label: 'Speaking', sublabel: 'Voice is active.', line: 'Give me a second…' }
};

const app = document.querySelector('#app');
app.innerHTML = `
<main class="scene">
  <div class="grain" aria-hidden="true"></div>
  <div class="ambient a"></div><div class="ambient b"></div>
  <header class="topbar">
    <button class="brand" id="brand" aria-label="Return to stillness"><span class="dot"></span>ALIVE</button>
    <div class="status"><span class="status-dot"></span><span id="state-label">Here</span></div>
  </header>
  <section class="presence" id="presence">
    <div class="stage" id="stage">
      <div class="halo"></div>
      <div class="portrait-frame">
        <div class="portrait-fallback" aria-label="ALIVE visual presence">
          <div class="hair"></div><div class="face"></div><div class="neck"></div><div class="sweater"></div>
          <div class="eye left"></div><div class="eye right"></div><div class="mouth"></div>
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
      <input id="message" aria-label="Say something to ALIVE" autocomplete="off" placeholder="Say something…" />
      <button class="send" aria-label="Send message">↗</button>
    </form>
    <div class="tools">
      <button class="ghost" id="voice" aria-pressed="false">Voice</button>
      <button class="ghost" id="listen">Listen</button>
      <button class="ghost" id="mood">Change the atmosphere</button>
    </div>
  </section>
  <footer class="footer"><span>an experiment in digital presence</span><span id="clock"></span></footer>
</main>`;

const shell = document.querySelector('#presence');
const stage = document.querySelector('#stage');
const stateLabel = document.querySelector('#state-label');
const stateSublabel = document.querySelector('#state-sublabel');
const line = document.querySelector('#presence-line');
const conversation = document.querySelector('#conversation');
const composer = document.querySelector('#composer');
const message = document.querySelector('#message');
const voice = document.querySelector('#voice');
const listen = document.querySelector('#listen');
const mood = document.querySelector('#mood');
let active = 'idle';
let voiceEnabled = false;

function setState(name) {
  active = states[name] ? name : 'idle';
  const s = states[active];
  shell.dataset.state = active;
  stateLabel.textContent = s.label;
  stateSublabel.textContent = s.sublabel;
  line.textContent = s.line;
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
  const x = input.toLowerCase();
  if (/^(hi|hello|hey|salut|bonjour)\b/.test(x)) return 'Hello. I’m glad you’re here.';
  if (x.includes('who are you') || x.includes('what are you')) return 'For now, I’m a small experiment in giving intelligence a visual place to meet you.';
  if (x.includes('alive')) return 'This is where the experiment begins: presence before performance.';
  if (x.includes('beautiful') || x.includes('love')) return 'Thank you. Let’s keep the room gentle.';
  if (x.includes('nothing') || x.includes('quiet')) return 'Then we can leave some space between the words.';
  return 'I’m listening. The deeper conversation will come as ALIVE grows.';
}

function speak(text) {
  if (!voiceEnabled || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = .94; u.pitch = 1.04; u.volume = .9;
  u.onstart = () => setState('speaking');
  u.onend = () => setState('warm');
  speechSynthesis.speak(u);
}

composer.addEventListener('submit', e => {
  e.preventDefault();
  const input = message.value.trim();
  if (!input) return;
  addBubble('user', input); message.value = ''; setState('listening');
  setTimeout(() => { const r = responseFor(input); addBubble('alive', r); setState(input.length > 32 ? 'thinking' : 'warm'); speak(r); }, 360);
});

voice.addEventListener('click', () => {
  voiceEnabled = !voiceEnabled;
  voice.setAttribute('aria-pressed', String(voiceEnabled));
  voice.textContent = voiceEnabled ? 'Voice on' : 'Voice';
  setState(voiceEnabled ? 'warm' : 'idle');
});

listen.addEventListener('click', () => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { addBubble('alive', 'This browser does not expose speech recognition yet.'); setState('curious'); return; }
  const recognition = new Recognition();
  recognition.lang = navigator.language || 'en-US';
  recognition.interimResults = false; recognition.maxAlternatives = 1;
  listen.textContent = 'Listening…'; setState('listening');
  recognition.onresult = e => { message.value = e.results[0][0].transcript; composer.requestSubmit(); };
  recognition.onerror = () => { addBubble('alive', 'I couldn’t hear that. We can try again.'); setState('curious'); };
  recognition.onend = () => { listen.textContent = 'Listen'; };
  recognition.start();
});

mood.addEventListener('click', () => {
  const choices = ['curious','warm','playful','thinking','listening'];
  setState(choices[Math.floor(Math.random() * choices.length)]);
});

document.querySelector('#brand').addEventListener('click', () => { setState('idle'); addBubble('alive', 'We can be quiet too.'); });

window.addEventListener('pointermove', e => {
  const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
  stage.style.setProperty('--x', `${(x * 2.2).toFixed(2)}deg`);
  stage.style.setProperty('--y', `${(y * -1.8).toFixed(2)}deg`);
});

window.addEventListener('pointerdown', () => { if (active === 'idle') setState('warm'); });

function tick() { document.querySelector('#clock').textContent = new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date()); }
setInterval(tick, 1000); tick(); setState('idle');
