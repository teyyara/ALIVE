export function attachVisitorPresence({ scene, setState, getState }) {
  let timeout;
  let slowTimeout;
  let settleTimeout;
  let lastX = 0.5;
  let lastY = 0.5;
  let lastTime = performance.now();

  const onMove = (event) => {
    const now = performance.now();
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    const dt = Math.max(now - lastTime, 16);

    const distance = Math.hypot(x - lastX, y - lastY);
    const speed = Math.min(1, distance / (dt / 1000));

    lastX = x;
    lastY = y;
    lastTime = now;

    scene.style.setProperty('--visitor-x', `${(x * 100).toFixed(1)}%`);
    scene.style.setProperty('--visitor-y', `${(y * 100).toFixed(1)}%`);
    scene.style.setProperty('--visitor-speed', speed.toFixed(3));

    scene.classList.add('visitor-present', 'visitor-moving');
    scene.classList.remove('visitor-settled');

    window.clearTimeout(timeout);
    window.clearTimeout(slowTimeout);
    window.clearTimeout(settleTimeout);

    timeout = window.setTimeout(() => {
      scene.classList.remove('visitor-moving');
    }, 650);

    slowTimeout = window.setTimeout(() => {
      scene.classList.add('visitor-settled');

      if (getState() === 'curious') setState('warm');

      settleTimeout = window.setTimeout(() => {
        if (getState() === 'warm' && !scene.classList.contains('attention-held')) {
          setState('idle');
        }
      }, 3800);
    }, 1100);

    if (getState() === 'idle') {
      setState(speed > 0.75 ? 'curious' : 'warm');
    }

    if (speed > 0.85) {
      scene.classList.add('visitor-rush');
      window.clearTimeout(scene.__aliveRushTimeout);

      scene.__aliveRushTimeout = window.setTimeout(() => {
        scene.classList.remove('visitor-rush');
      }, 420);
    }
  };

  const onLeave = () => {
    scene.classList.remove('visitor-moving', 'visitor-settled', 'visitor-rush');
    window.clearTimeout(timeout);
    window.clearTimeout(slowTimeout);
    window.clearTimeout(settleTimeout);

    slowTimeout = window.setTimeout(() => {
      scene.classList.remove('visitor-present');
      if (getState() === 'warm') setState('idle');
    }, 3200);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', onLeave, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerleave', onLeave);
    window.clearTimeout(timeout);
    window.clearTimeout(slowTimeout);
    window.clearTimeout(settleTimeout);
    window.clearTimeout(scene.__aliveRushTimeout);
  };
}
