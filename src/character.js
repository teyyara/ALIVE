const ASSETS = {
  body: '/assets/alive-body.webp',
  face: '/assets/alive-face.webp',
  leftEye: '/assets/alive-eye-left-base.webp',
  rightEye: '/assets/alive-eye-right-base.webp',
  leftIris: '/assets/alive-iris-left.webp',
  rightIris: '/assets/alive-iris-right.webp',
  leftBrow: '/assets/alive-brow-left.webp',
  rightBrow: '/assets/alive-brow-right.webp',
  mouth: '/assets/alive-mouth.webp',
  closedLeft: '/assets/alive-closed-left.webp',
  closedRight: '/assets/alive-closed-right.webp'
};

const POSITIONS = {
  body: [70, 450],
  face: [260, 110],
  leftEye: [370, 270],
  rightEye: [500, 275],
  leftIris: [370, 270],
  rightIris: [500, 275],
  leftBrow: [382, 270],
  rightBrow: [508, 270],
  mouth: [420, 405],
  closedLeft: [405, 326],
  closedRight: [531, 331]
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
  let autonomousX = 0;
  let autonomousY = 0;
  let stateGazeX = 0;
  let stateGazeY = 0;
  let autonomousTimer = 0;
  let blink = 0;
  let blinkTarget = 0;
  let state = 'idle';
  let voicePulse = 0;
  let breathTime = Math.random() * Math.PI * 2;
  let headSettleX = 0;
  let headSettleY = 0;
  let settleTargetX = 0;
  let settleTargetY = 0;
  let settleTimer = 0;
  let width = 0;
  let height = 0;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

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

  const stateGazeBias = {
    idle: [0, 0],
    attentive: [0, -0.02],
    listening: [0, 0],
    thinking: [-0.10, -0.08],
    speaking: [0, 0],
    warm: [0.02, 0],
    curious: [0.05, -0.04],
    playful: [0.08, -0.01]
  };

  function setState(next) {
    state = stateTargets[next] ? next : 'idle';
    Object.assign(target, stateTargets[state]);
    [stateGazeX, stateGazeY] = stateGazeBias[state] || [0, 0];
  }

  function setAttention(x, y) {
    targetX = clamp(Number(x) || 0, -1, 1);
    targetY = clamp(Number(y) || 0, -1, 1);
  }

  function scheduleAutonomousGaze() {
    if (destroyed) return;
    autonomousTimer = window.setTimeout(() => {
      if (destroyed) return;

      autonomousX = (Math.random() * 2 - 1) * .22;
      autonomousY = (Math.random() * 2 - 1) * .14;
      scheduleAutonomousGaze();
    }, 4200 + Math.random() * 5200);
  }

  function scheduleHeadSettle() {
    if (destroyed) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      settleTargetX = (Math.random() * 2 - 1) * .65;
      settleTargetY = (Math.random() * 2 - 1) * .28;
      scheduleHeadSettle();
    }, 5200 + Math.random() * 6200);
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
    context.drawImage(
      image,
      0,
      0,
      image.naturalWidth * scale,
      image.naturalHeight * scale
    );
    context.restore();
  }



  function frame(timeMs) {
    if (destroyed) return;
    resize();

    const activeX = Math.abs(targetX) > .06 || Math.abs(targetY) > .06;
    const desiredX = activeX
      ? targetX * .92 + stateGazeX * .08
      : autonomousX + stateGazeX;
    const desiredY = activeX
      ? targetY * .92 + stateGazeY * .08
      : autonomousY + stateGazeY;

    const eyeEase = activeX ? .17 : .105;
    gazeX += (desiredX - gazeX) * eyeEase;
    gazeY += (desiredY - gazeY) * eyeEase;
    headSettleX += (settleTargetX - headSettleX) * .025;
    headSettleY += (settleTargetY - headSettleY) * .025;
    blink += (blinkTarget - blink) * .40;
    voicePulse *= .90;

    for (const key of Object.keys(current)) {
      current[key] += (target[key] - current[key]) * .07;
    }

    const t = timeMs * .001;
    breathTime += .014;
    const breath = .5 + .5 * Math.sin(breathTime * .9);
    const featureX = gazeX * 0.85 + current.head * .12 + headSettleX * .20;
    const featureY = gazeY * 0.55 + headSettleY * .14;
    const breathPhase = breathTime * .9;
    const leftShoulder = Math.sin(breathPhase) * .9;
    const rightShoulder = Math.sin(breathPhase + .18) * .9;
    const bodyY = -breath * (1.0 + current.breath * .9);

    context.clearRect(0, 0, width, height);

    if (!loaded) {
      frameId = requestAnimationFrame(frame);
      return;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    drawLayer('body', 0, bodyY, 1, 1 + breath * .003, 0, 1);
    drawLayer('face', headX, headY, 1, 1, current.head * .0032 + (headSettleX * .0007), 1, 510, 400);

    const eyeY = featureY;
    const irisX = gazeX * 7.2 + featureX;
    const irisY = gazeY * 4.4 + eyeY;

    const lidCompression = state === 'thinking' ? .985 : state === 'listening' ? .992 : 1;
    drawLayer('leftEye', 0, 0, 1, lidCompression, 0, 1);
    drawLayer('rightEye', 0, 0, 1, lidCompression, 0, 1);
    const irisScale = state === 'curious' ? 1.012 : state === 'thinking' ? .996 : 1;
    drawLayer('leftIris', irisX, irisY, irisScale, irisScale, 0, 1);
    drawLayer('rightIris', irisX, irisY, irisScale, irisScale, 0, 1);

    const browLift = current.brow * -3.5 - gazeY * .7;
    drawLayer('leftBrow', featureX * .78 + leftShoulder * .05, browLift + eyeY, 1, 1, current.head * .002, 1);
    drawLayer('rightBrow', featureX * .78 + rightShoulder * .05, browLift + eyeY, 1, 1, current.head * .002, 1);

    const mouthOpen = state === 'speaking'
      ? Math.abs(Math.sin(t * 13.5)) * .045 + voicePulse * .026
      : voicePulse * .01;
    const mouthLift = -current.smile * 2.3;
    drawLayer('mouth', featureX * .42, mouthLift + eyeY, 1 + current.smile * .022, 1 + mouthOpen, current.head * .001, 1);

    if (blink > .02) {
      drawLayer('closedLeft', featureX, eyeY, 1, 1, current.head * .002, blink);
      drawLayer('closedRight', featureX, eyeY, 1, 1, current.head * .002, blink);

      context.save();
      context.globalAlpha = Math.min(.92, blink);
      context.strokeStyle = 'rgba(69, 39, 37, .62)';
      context.lineWidth = Math.max(1.1, 1.8 * scale);
      context.lineCap = 'round';

      const leftLineX = offsetX + (POSITIONS.closedLeft[0] + featureX + 7) * scale;
      const leftLineY = offsetY + (POSITIONS.closedLeft[1] + eyeY + 17) * scale;
      const rightLineX = offsetX + (POSITIONS.closedRight[0] + featureX + 7) * scale;
      const rightLineY = offsetY + (POSITIONS.closedRight[1] + eyeY + 17) * scale;

      context.beginPath();
      context.moveTo(leftLineX, leftLineY);
      context.quadraticCurveTo(
        leftLineX + 27 * scale,
        leftLineY - 3 * scale,
        leftLineX + 54 * scale,
        leftLineY
      );
      context.moveTo(rightLineX, rightLineY);
      context.quadraticCurveTo(
        rightLineX + 27 * scale,
        rightLineY - 3 * scale,
        rightLineX + 54 * scale,
        rightLineY
      );
      context.stroke();
      context.restore();
    }

    frameId = requestAnimationFrame(frame);
  }

  Promise.all(Object.entries(ASSETS).map(async ([name, src]) => [name, await loadImage(src)]))
    .then((entries) => {
      if (destroyed) return;
      images = Object.fromEntries(entries);
      loaded = true;
    })
    .catch((error) => console.error('[ALIVE] character asset error', error));

  frameId = requestAnimationFrame(frame);
  scheduleAutonomousGaze();
  scheduleHeadSettle();
  setState('idle');

  return {
    setAttention,
    setState,
    blink: blinkNow,
    speechPulse: pulseVoice,
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(autonomousTimer);
      window.clearTimeout(settleTimer);
    }
  };
}
