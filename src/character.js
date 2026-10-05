const ASSETS = {
  base: '/assets/alive-base.jpg',
  body: '/assets/alive-body.webp',
  face: '/assets/alive-face.webp',
  leftEye: '/assets/alive-eye-left-base.webp',
  rightEye: '/assets/alive-eye-right-base.webp',
  leftIris: '/assets/alive-iris-left.webp',
  rightIris: '/assets/alive-iris-right.webp',
  leftBrow: '/assets/alive-brow-left.webp',
  rightBrow: '/assets/alive-brow-right.webp',
  mouth: '/assets/alive-mouth.webp'
};

const POSITIONS = {
  base: [0, 0],
  body: [70, 450],
  face: [260, 110],
  leftEye: [370, 270],
  rightEye: [500, 275],
  leftIris: [370, 270],
  rightIris: [500, 275],
  leftBrow: [382, 270],
  rightBrow: [508, 270],
  mouth: [420, 405]
};

const LANDMARKS = {
  leftEye: [438, 326],
  rightEye: [563, 330]
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ALIVE layer: ${src}`));
    image.src = src;
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createLivingCharacter(canvas) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');

  let destroyed = false;
  let frameId = 0;
  let images = null;
  let loaded = false;
  let targetX = 0;
  let targetY = 0;
  let gazeX = 0;
  let gazeY = 0;
  let blink = 0;
  let blinkTarget = 0;
  let state = 'idle';
  let voicePulse = 0;
  let breathTime = Math.random() * Math.PI * 2;
  let width = 0;
  let height = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let skinLeft = [217, 161, 143];
  let skinRight = [205, 145, 131];

  const target = { smile: .08, brow: 0, head: 0, breath: 0 };
  const current = { smile: .08, brow: 0, head: 0, breath: 0 };

  const stateTargets = {
    idle: { smile: .08, brow: 0, head: 0, breath: 0 },
    attentive: { smile: .12, brow: .08, head: -.4, breath: .05 },
    listening: { smile: .08, brow: .04, head: -.7, breath: .12 },
    thinking: { smile: -.02, brow: -.16, head: .75, breath: -.04 },
    speaking: { smile: .14, brow: .02, head: .12, breath: .18 },
    warm: { smile: .28, brow: .02, head: .16, breath: .10 },
    curious: { smile: .16, brow: .34, head: -.7, breath: .14 },
    playful: { smile: .42, brow: .25, head: -1.0, breath: .20 }
  };

  function setState(next) {
    state = stateTargets[next] ? next : 'idle';
    Object.assign(target, stateTargets[state]);
  }

  function setAttention(x, y) {
    targetX = clamp(Number(x) || 0, -1, 1);
    targetY = clamp(Number(y) || 0, -1, 1);
  }

  function blinkNow() {
    if (destroyed) return;
    blinkTarget = 1;
    window.setTimeout(() => {
      if (!destroyed) blinkTarget = 0;
    }, 115);
  }

  function pulseVoice() {
    voicePulse = Math.min(1, voicePulse + .7);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = Math.max(1, Math.round(rect.width * dpr));
    const nextHeight = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }
    width = nextWidth;
    height = nextHeight;

    const aspect = 1020 / 842;
    const viewAspect = width / height;
    scale = viewAspect > aspect ? height / 842 : width / 1020;
    offsetX = (width - 1020 * scale) * .5;
    offsetY = (height - 842 * scale) * .5;
  }

  function drawLayer(name, dx = 0, dy = 0, sx = 1, sy = 1, rotation = 0, alpha = 1) {
    const image = images[name];
    if (!image) return;
    const [baseX, baseY] = POSITIONS[name];
    const x = offsetX + (baseX + dx) * scale;
    const y = offsetY + (baseY + dy) * scale;

    context.save();
    context.globalAlpha = alpha;
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(sx, sy);
    context.drawImage(image, 0, 0, image.naturalWidth * scale, image.naturalHeight * scale);
    context.restore();
  }

  function sampleSkinColors() {
    const sampler = document.createElement('canvas');
    sampler.width = images.base.naturalWidth;
    sampler.height = images.base.naturalHeight;
    const sampleContext = sampler.getContext('2d', { willReadFrequently: true });
    sampleContext.drawImage(images.base, 0, 0);

    const average = (cx, cy) => {
      const size = 24;
      const data = sampleContext.getImageData(cx - size / 2, cy - size / 2, size, size).data;
      let r = 0; let g = 0; let b = 0; let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const rr = data[i]; const gg = data[i + 1]; const bb = data[i + 2];
        if (rr > 55 && gg > 35 && bb > 30) {
          r += rr; g += gg; b += bb; count += 1;
        }
      }
      return count ? [Math.round(r / count), Math.round(g / count), Math.round(b / count)] : [215, 160, 143];
    };

    skinLeft = average(438, 346);
    skinRight = average(563, 350);
  }

  function drawClosedEye(cx, cy, skin) {
    const x = offsetX + cx * scale;
    const y = offsetY + cy * scale;
    const [r, g, b] = skin;

    context.save();
    context.translate(x, y);
    context.globalAlpha = Math.min(.96, blink);

    const gradient = context.createRadialGradient(0, -1 * scale, 5 * scale, 0, 0, 34 * scale);
    gradient.addColorStop(0, `rgba(${r + 8},${g + 8},${b + 8},.98)`);
    gradient.addColorStop(.72, `rgba(${r},${g},${b},.96)`);
    gradient.addColorStop(1, `rgba(${Math.max(0, r - 8)},${Math.max(0, g - 7)},${Math.max(0, b - 6)},.28)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.ellipse(0, 0, 37 * scale, 18 * scale, 0, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = 'rgba(71, 40, 38, .62)';
    context.lineWidth = Math.max(1.2, 1.9 * scale);
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(-25 * scale, 2 * scale);
    context.quadraticCurveTo(0, -5 * scale, 25 * scale, 2 * scale);
    context.stroke();
    context.restore();
  }

  function frame(timeMs) {
    if (destroyed) return;
    resize();

    gazeX += (targetX - gazeX) * .10;
    gazeY += (targetY - gazeY) * .10;
    blink += (blinkTarget - blink) * .40;
    voicePulse *= .90;

    for (const key of Object.keys(current)) {
      current[key] += (target[key] - current[key]) * .07;
    }

    const t = timeMs * .001;
    breathTime += .014;
    const breath = .5 + .5 * Math.sin(breathTime * .9);
    const headX = gazeX * 2.6 + current.head * .65;
    const headY = gazeY * 1.7;
    const bodyY = -breath * (1.0 + current.breath * .9);

    context.clearRect(0, 0, width, height);

    if (!loaded) {
      frameId = requestAnimationFrame(frame);
      return;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    drawLayer('base');
    drawLayer('body', 0, bodyY, 1, 1 + breath * .003);
    drawLayer('face', headX, headY, 1, 1, current.head * .0018);

    const eyeY = headY;
    const irisX = gazeX * 8.5 + headX;
    const irisY = gazeY * 5.2 + eyeY;
    const eyeScaleY = 1;

    drawLayer('leftEye', headX, eyeY, 1, eyeScaleY, 0, 1);
    drawLayer('rightEye', headX, eyeY, 1, eyeScaleY, 0, 1);
    drawLayer('leftIris', irisX, irisY, 1, 1, 0, 1);
    drawLayer('rightIris', irisX, irisY, 1, 1, 0, 1);

    const browLift = current.brow * -3.5 - gazeY * .7;
    drawLayer('leftBrow', headX * .78, eyeY + browLift, 1, 1, current.head * .0018, 1);
    drawLayer('rightBrow', headX * .78, eyeY + browLift, 1, 1, current.head * .0018, 1);

    const mouthOpen = state === 'speaking'
      ? Math.abs(Math.sin(t * 13.5)) * .045 + voicePulse * .026
      : voicePulse * .01;
    const mouthLift = -current.smile * 2.3;
    drawLayer('mouth', headX * .55, eyeY + mouthLift, 1 + current.smile * .018, 1 + mouthOpen, current.head * .001, 1);

    if (blink > .02) {
      drawClosedEye(LANDMARKS.leftEye[0] + headX, LANDMARKS.leftEye[1] + headY, skinLeft);
      drawClosedEye(LANDMARKS.rightEye[0] + headX, LANDMARKS.rightEye[1] + headY, skinRight);
    }

    frameId = requestAnimationFrame(frame);
  }

  Promise.all(Object.entries(ASSETS).map(async ([name, src]) => [name, await loadImage(src)]))
    .then((entries) => {
      if (destroyed) return;
      images = Object.fromEntries(entries);
      sampleSkinColors();
      loaded = true;
    })
    .catch((error) => console.error('[ALIVE] character asset error', error));

  frameId = requestAnimationFrame(frame);
  setState('idle');

  return {
    setAttention,
    setState,
    blink: blinkNow,
    speechPulse: pulseVoice,
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frameId);
    }
  };
}
