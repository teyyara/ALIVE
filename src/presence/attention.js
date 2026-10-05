export function attachAttention(stage, { onHold, onRelease } = {}) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return () => {};

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let raf = 0;
  let resting = true;
  let dwellTimer;
  let ambientTimer;
  let held = false;
  let ambientX = 0;
  let ambientY = 0;

  const scheduleAmbientGaze = () => {
    window.clearTimeout(ambientTimer);

    ambientTimer = window.setTimeout(() => {
      if (!resting || held || document.hidden) {
        scheduleAmbientGaze();
        return;
      }

      ambientX = (Math.random() * 2 - 1) * 0.18;
      ambientY = (Math.random() * 2 - 1) * 0.11;
      scheduleAmbientGaze();
    }, 4200 + Math.random() * 5200);
  };

  const update = (event) => {
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.42;

    const rangeX = Math.max(rect.width * 0.42, 1);
    const rangeY = Math.max(rect.height * 0.46, 1);

    targetX = Math.max(-1, Math.min(1, (event.clientX - centerX) / rangeX));
    targetY = Math.max(-1, Math.min(1, (event.clientY - centerY) / rangeY));
    resting = false;
    ambientX = 0;
    ambientY = 0;
    window.clearTimeout(ambientTimer);

    window.clearTimeout(dwellTimer);
    if (held) {
      held = false;
      onRelease?.();
    }
    stage.classList.remove('attention-held');

    const insideStage =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;

    if (insideStage) {
      dwellTimer = window.setTimeout(() => {
        held = true;
        stage.classList.add('attention-held');
        onHold?.();
      }, 850);
    }
  };

  const reset = () => {
    targetX = 0;
    targetY = 0;
    resting = true;
    ambientX = 0;
    ambientY = 0;
    scheduleAmbientGaze();
    window.clearTimeout(dwellTimer);
    if (held) {
      held = false;
      onRelease?.();
    }
    stage.classList.remove('attention-held');
  };

  const animate = () => {
    const ease = resting ? 0.045 : 0.075;

    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;

    stage.style.setProperty('--attention-x', `${(currentX * 14).toFixed(2)}px`);
    stage.style.setProperty('--attention-y', `${(currentY * 10).toFixed(2)}px`);
    stage.style.setProperty('--attention-rotate', `${(currentX * 1.8).toFixed(2)}deg`);
    stage.style.setProperty('--attention-tilt', `${(currentY * -1.1).toFixed(2)}deg`);

    const gazeX = resting ? currentX + ambientX : currentX;
    const gazeY = resting ? currentY + ambientY : currentY;

    stage.style.setProperty('--gaze-x', `${(gazeX * 6).toFixed(2)}px`);
    stage.style.setProperty('--gaze-y', `${(gazeY * 3.5).toFixed(2)}px`);
    stage.style.setProperty('--glint-x', `${(gazeX * 9).toFixed(2)}px`);
    stage.style.setProperty('--glint-y', `${(gazeY * 5).toFixed(2)}px`);
    stage.style.setProperty('--brow-x', `${(gazeX * 2.2).toFixed(2)}px`);
    stage.style.setProperty('--brow-y', `${(gazeY * 1.4).toFixed(2)}px`);
    stage.style.setProperty('--attention-rest', resting ? '1' : '0');

    raf = requestAnimationFrame(animate);
  };

  window.addEventListener('pointermove', update, { passive: true });
  window.addEventListener('pointerleave', reset, { passive: true });
  window.addEventListener('blur', reset, { passive: true });

  raf = requestAnimationFrame(animate);
  scheduleAmbientGaze();

  return () => {
    window.removeEventListener('pointermove', update);
    window.removeEventListener('pointerleave', reset);
    window.removeEventListener('blur', reset);
    window.clearTimeout(dwellTimer);
    window.clearTimeout(ambientTimer);
    cancelAnimationFrame(raf);
  };
}