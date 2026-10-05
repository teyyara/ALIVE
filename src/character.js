const ASSETS = {
  portrait: '/assets/alive-clean-portrait.webp',
  leftEye: '/assets/alive-eye-left-base.webp',
  rightEye: '/assets/alive-eye-right-base.webp',
  leftIris: '/assets/alive-iris-left.webp',
  rightIris: '/assets/alive-iris-right.webp'
};

const DESIGN_WIDTH = 1020;
const DESIGN_HEIGHT = 842;

const EYES = {
  left: { x: 438, y: 326, boxX: 406, boxY: 300 },
  right: { x: 563, y: 330, boxX: 531, boxY: 304 }
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ALIVE asset: ${src}`));
    image.src = src;
  });
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createLivingCharacter(canvas) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('ALIVE requires Canvas 2D.');

  let destroyed = false;
  let raf = 0;
  let assets = null;
  let loaded = false;

  let targetGazeX = 0;
  let targetGazeY = 0;
  let gazeX = 0;
  let gazeY = 0;

  let blink = 0;
  let blinkTarget = 0;
  let blinkTimer = 0;

  let state = 'idle';
  let breathTime = Math.random() * Math.PI * 2;
  let gazeTimer = 0;
  let settleTimer = 0;
  let settleX = 0;
  let settleY = 0;
  let settleTargetX = 0;
  let settleTargetY = 0;

  let voicePulse = 0;

  const stateTargets = {
    idle: { smile: 0, thought: 0 },
    attentive: { smile: .02, thought: 0 },
    listening: { smile: .01, thought: -.02 },
    thinking: { smile: -.01, thought: .12 },
    speaking: { smile: .03, thought: 0 },
    warm: { smile: .10, thought: -.01 },
    curious: { smile: .04, thought: -.05 },
    playful: { smile: .16, thought: -.04 }
  };

  const expression = { smile: 0, thought: 0 };
  const expressionTarget = { smile: 0, thought: 0 };

  function setState(next) {
    state = stateTargets[next] ? next : 'idle';
    Object.assign(expressionTarget, stateTargets[state]);
  }

  function setAttention(x, y) {
    targetGazeX = clamp(Number(x) || 0, -1, 1);
    targetGazeY = clamp(Number(y) || 0, -1, 1);
  }

  function blinkNow() {
    if (destroyed) return;

    blinkTarget = 1;
    window.clearTimeout(blinkTimer);
    blinkTimer = window.setTimeout(() => {
      blinkTarget = 0;
    }, 105);
  }

  function speechPulse() {
    voicePulse = Math.min(1, voicePulse + .78);
  }

  function scheduleGaze() {
    window.clearTimeout(gazeTimer);
    if (destroyed || document.hidden) return;

    gazeTimer = window.setTimeout(() => {
      settleTargetX = (Math.random() * 2 - 1) * .12;
      settleTargetY = (Math.random() * 2 - 1) * .07;
      scheduleGaze();
    }, 4300 + Math.random() * 6200);
  }

  function scheduleSettle() {
    window.clearTimeout(settleTimer);
    if (destroyed || document.hidden) return;

    settleTimer = window.setTimeout(() => {
      if (Math.abs(targetGazeX) < .06 && Math.abs(targetGazeY) < .06) {
        settleTargetX = (Math.random() * 2 - 1) * .9;
        settleTargetY = (Math.random() * 2 - 1) * .35;
      }

      scheduleSettle();
    }, 6500 + Math.random() * 6500);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const viewAspect = width / height;
    const imageAspect = DESIGN_WIDTH / DESIGN_HEIGHT;

    const scale = viewAspect > imageAspect
      ? height / DESIGN_HEIGHT
      : width / DESIGN_WIDTH;

    return {
      width,
      height,
      scale,
      offsetX: (width - DESIGN_WIDTH * scale) * .5,
      offsetY: (height - DESIGN_HEIGHT * scale) * .5
    };
  }

  function mapDesignToCanvas(x, y, layout) {
    return [
      layout.offsetX + x * layout.scale,
      layout.offsetY + y * layout.scale
    ];
  }

  function drawPortrait(layout, breath) {
    const image = assets.portrait;

    const maxY = Math.min(DESIGN_HEIGHT, 520);
    const startBreathY = 438;
    const amplitude = (breath - .5) * 4.4;

    ctx.save();
    ctx.beginPath();
    ctx.rect(layout.offsetX, layout.offsetY, DESIGN_WIDTH * layout.scale, DESIGN_HEIGHT * layout.scale);
    ctx.clip();

    for (let y = 0; y < DESIGN_HEIGHT; y += 2) {
      const local = clamp((y - startBreathY) / (maxY - startBreathY), 0, 1);
      const weight = local * local * (3 - 2 * local);
      const displacement = -amplitude * weight;

      const sy = Math.max(0, Math.min(DESIGN_HEIGHT - 2, y - displacement));
      const dy = y;

      ctx.drawImage(
        image,
        0,
        sy * image.naturalHeight / DESIGN_HEIGHT,
        image.naturalWidth,
        2 * image.naturalHeight / DESIGN_HEIGHT,
        layout.offsetX,
        layout.offsetY + dy * layout.scale,
        DESIGN_WIDTH * layout.scale,
        2 * layout.scale
      );
    }

    ctx.restore();
  }

  function drawEyeBase(image, eye, layout) {
    if (!image) return;

    const x = layout.offsetX + eye.boxX * layout.scale;
    const y = layout.offsetY + eye.boxY * layout.scale;

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(
      image,
      x,
      y,
      image.naturalWidth * layout.scale,
      image.naturalHeight * layout.scale
    );
    ctx.restore();
  }

  function drawIris(image, eye, gaze, layout) {
    if (!image) return;

    const baseSize = 44;
    const irisX = eye.x + gaze.x * 11.5;
    const irisY = eye.y + gaze.y * 6.4;

    const x = layout.offsetX + (irisX - baseSize / 2) * layout.scale;
    const y = layout.offsetY + (irisY - baseSize / 2) * layout.scale;
    const size = baseSize * layout.scale;

    ctx.save();
    ctx.globalAlpha = 1 - blink * .99;
    ctx.drawImage(image, x, y, size, size);
    ctx.restore();
  }

  function drawBlinkLid(eye, layout) {
    if (blink <= .01) return;

    const [x, y] = mapDesignToCanvas(eye.x, eye.y + 2, layout);

    ctx.save();
    ctx.globalAlpha = Math.min(.84, blink);

    const gradient = ctx.createRadialGradient(
      x,
      y - 3 * layout.scale,
      1,
      x,
      y,
      23 * layout.scale
    );

    gradient.addColorStop(0, 'rgba(223,170,145,.94)');
    gradient.addColorStop(.72, 'rgba(205,142,123,.86)');
    gradient.addColorStop(1, 'rgba(174,108,95,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
      x,
      y,
      30 * layout.scale,
      13 * layout.scale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.strokeStyle = 'rgba(70,40,38,.54)';
    ctx.lineWidth = Math.max(1, 1.4 * layout.scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 22 * layout.scale, y + 2 * layout.scale);
    ctx.quadraticCurveTo(
      x,
      y - 3 * layout.scale,
      x + 22 * layout.scale,
      y + 2 * layout.scale
    );
    ctx.stroke();

    ctx.restore();
  }

  function frame(timeMs) {
    if (destroyed) return;

    const layout = resize();

    gazeX += (targetGazeX - gazeX) * .16;
    gazeY += (targetGazeY - gazeY) * .16;
    settleX += (settleTargetX - settleX) * .022;
    settleY += (settleTargetY - settleY) * .022;
    blink += (blinkTarget - blink) * .36;
    voicePulse *= .90;

    expression.smile += (expressionTarget.smile - expression.smile) * .075;
    expression.thought += (expressionTarget.thought - expression.thought) * .075;

    const t = timeMs * .001;
    breathTime += .014;

    const breath = .5 + .5 * Math.sin(breathTime * .92);
    const effectiveX = Math.abs(targetGazeX) > .06 ? gazeX : gazeX * .45 + settleX;
    const effectiveY = Math.abs(targetGazeY) > .06 ? gazeY : gazeY * .45 + settleY;

    ctx.clearRect(0, 0, layout.width, layout.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (!loaded) {
      raf = requestAnimationFrame(frame);
      return;
    }

    drawPortrait(layout, breath);

    drawEyeBase(assets.leftEye, EYES.left, layout);
    drawEyeBase(assets.rightEye, EYES.right, layout);

    drawIris(assets.leftIris, EYES.left, {
      x: effectiveX,
      y: effectiveY
    }, layout);

    drawIris(assets.rightIris, EYES.right, {
      x: effectiveX,
      y: effectiveY
    }, layout);

    if (blink > .01) {
      drawBlinkLid(EYES.left, layout);
      drawBlinkLid(EYES.right, layout);
    }

    raf = requestAnimationFrame(frame);
  }

  Promise.all(
    Object.entries(ASSETS).map(async ([name, src]) => [name, await loadImage(src)])
  )
    .then((entries) => {
      if (destroyed) return;
      assets = Object.fromEntries(entries);
      loaded = true;
    })
    .catch((error) => {
      console.error('[ALIVE] character assets', error);
    });

  raf = requestAnimationFrame(frame);
  scheduleGaze();
  scheduleSettle();

  return {
    setAttention,
    setState,
    blink: blinkNow,
    speechPulse,

    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(blinkTimer);
      window.clearTimeout(gazeTimer);
      window.clearTimeout(settleTimer);
    }
  };
}
