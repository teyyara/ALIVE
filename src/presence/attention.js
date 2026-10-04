export function attachAttention(stage) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return () => {};

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let raf = 0;
  let resting = true;

  const update = (event) => {
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.42;

    const rangeX = Math.max(rect.width * 0.42, 1);
    const rangeY = Math.max(rect.height * 0.46, 1);

    targetX = Math.max(-1, Math.min(1, (event.clientX - centerX) / rangeX));
    targetY = Math.max(-1, Math.min(1, (event.clientY - centerY) / rangeY));
    resting = false;
  };

  const reset = () => {
    targetX = 0;
    targetY = 0;
    resting = true;
  };

  const animate = () => {
    const ease = resting ? 0.045 : 0.075;

    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;

    stage.style.setProperty('--attention-x', `${(currentX * 14).toFixed(2)}px`);
    stage.style.setProperty('--attention-y', `${(currentY * 10).toFixed(2)}px`);
    stage.style.setProperty('--attention-rotate', `${(currentX * 1.8).toFixed(2)}deg`);
    stage.style.setProperty('--attention-tilt', `${(currentY * -1.1).toFixed(2)}deg`);

    stage.style.setProperty('--gaze-x', `${(currentX * 6).toFixed(2)}px`);
    stage.style.setProperty('--gaze-y', `${(currentY * 3.5).toFixed(2)}px`);
    stage.style.setProperty('--brow-x', `${(currentX * 2.2).toFixed(2)}px`);
    stage.style.setProperty('--brow-y', `${(currentY * 1.4).toFixed(2)}px`);
    stage.style.setProperty('--attention-rest', resting ? '1' : '0');

    raf = requestAnimationFrame(animate);
  };

  window.addEventListener('pointermove', update, { passive: true });
  window.addEventListener('pointerleave', reset, { passive: true });
  window.addEventListener('blur', reset, { passive: true });

  raf = requestAnimationFrame(animate);

  return () => {
    window.removeEventListener('pointermove', update);
    window.removeEventListener('pointerleave', reset);
    window.removeEventListener('blur', reset);
    cancelAnimationFrame(raf);
  };
}
