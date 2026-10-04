export function attachAttention(stage) {
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return () => {};

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let raf = 0;

  const update = (event) => {
    targetX = event.clientX / window.innerWidth - 0.5;
    targetY = event.clientY / window.innerHeight - 0.5;
  };

  const animate = () => {
    currentX += (targetX - currentX) * 0.075;
    currentY += (targetY - currentY) * 0.075;

    stage.style.setProperty('--attention-x', `${(currentX * 18).toFixed(2)}px`);
    stage.style.setProperty('--attention-y', `${(currentY * 13).toFixed(2)}px`);
    stage.style.setProperty('--attention-rotate', `${(currentX * 2.2).toFixed(2)}deg`);
    stage.style.setProperty('--attention-tilt', `${(currentY * -1.4).toFixed(2)}deg`);

    stage.style.setProperty('--gaze-x', `${(currentX * 7).toFixed(2)}px`);
    stage.style.setProperty('--gaze-y', `${(currentY * 4).toFixed(2)}px`);
    stage.style.setProperty('--brow-x', `${(currentX * 2.5).toFixed(2)}px`);
    stage.style.setProperty('--brow-y', `${(currentY * 1.6).toFixed(2)}px`);

    raf = requestAnimationFrame(animate);
  };

  window.addEventListener('pointermove', update, { passive: true });
  raf = requestAnimationFrame(animate);

  return () => {
    window.removeEventListener('pointermove', update);
    cancelAnimationFrame(raf);
  };
}
