const ASSETS = {
  leftIris: '/assets/alive-iris-left.webp',
  rightIris: '/assets/alive-iris-right.webp',
  leftClosed: '/assets/alive-closed-left.webp',
  rightClosed: '/assets/alive-closed-right.webp'
};

const SOURCE = Object.freeze({
  width: 1020,
  height: 842,
  leftEye: [438, 326],
  rightEye: [563, 330],
  leftIrisCenter: [68, 55],
  rightIrisCenter: [62, 56]
});

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ALIVE feature: ${src}`));
    image.src = src;
  });
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createLivingCharacter(canvas) {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable.');

  let destroyed = false;
  let frameId = 0;
  let loaded = false;
  let assets = null;
  let width = 1;
  let height = 1;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  let targetX = 0;
  let targetY = 0;
  let gazeX = 0;
  let gazeY = 0;
  let blink = 0;
  let blinkTarget = 0;
  let speechPulse = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    scale = Math.min(width / SOURCE.width, height / SOURCE.height);
    offsetX = (width - SOURCE.width * scale) * .5;
    offsetY = (height - SOURCE.height * scale) * .5;
  }

  function sourcePoint([x, y]) {
    return [offsetX + x * scale, offsetY + y * scale];
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
    }, 120);
  }

  function speechPulseNow() {
    speechPulse = Math.min(1, speechPulse + .75);
  }

  function drawIris(image, eye, sourceCenter, dx, dy) {
    const [cx, cy] = sourcePoint(eye);
    const radius = 21.5 * scale;
    const moveX = dx * 9.5 * scale;
    const moveY = dy * 5.8 * scale;

    context.save();
    context.beginPath();
    context.arc(cx + moveX, cy + moveY, radius, 0, Math.PI * 2);
    context.clip();

    const [sx, sy] = sourceCenter;
    context.drawImage(
      image,
      sx - 24,
      sy - 24,
      48,
      48,
      cx + moveX - radius,
      cy + moveY - radius,
      radius * 2,
      radius * 2
    );

    context.restore();
  }

  function drawBlink(image, eye) {
    const [cx, cy] = sourcePoint(eye);
    const w = 62 * scale;
    const h = 30 * scale;

    context.save();
    context.globalAlpha = Math.min(1, blink);
    context.drawImage(image, cx - w * .5, cy - h * .5, w, h);
    context.restore();
  }

  function frame() {
    if (destroyed) return;

    resize();
    gazeX += (targetX - gazeX) * .11;
    gazeY += (targetY - gazeY) * .11;
    blink += (blinkTarget - blink) * .4;
    speechPulse *= .9;

    context.clearRect(0, 0, width, height);

    if (loaded) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Only the independently moving features are drawn here.
      // The clean photographic portrait underneath remains untouched.
      drawIris(assets.leftIris, SOURCE.leftEye, SOURCE.leftIrisCenter, gazeX, gazeY);
      drawIris(assets.rightIris, SOURCE.rightEye, SOURCE.rightIrisCenter, gazeX, gazeY);

      if (blink > .02) {
        drawBlink(assets.leftClosed, SOURCE.leftEye);
        drawBlink(assets.rightClosed, SOURCE.rightEye);
      }
    }

    frameId = requestAnimationFrame(frame);
  }

  Promise.all(
    Object.entries(ASSETS).map(async ([name, src]) => [name, await loadImage(src)])
  )
    .then((entries) => {
      if (destroyed) return;
      assets = Object.fromEntries(entries);
      loaded = true;
    })
    .catch(() => {
      loaded = false;
    });

  frame();

  return {
    setAttention,
    setState() {},
    blink: blinkNow,
    speechPulse: speechPulseNow,
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frameId);
    }
  };
}
