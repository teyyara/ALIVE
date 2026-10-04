export function attachVisitorPresence({ scene, setState, getState }) {
  let timeout;
  let lastX = 0.5;
  let lastY = 0.5;

  const onMove = (event) => {
    lastX = event.clientX / window.innerWidth;
    lastY = event.clientY / window.innerHeight;

    scene.style.setProperty('--visitor-x', `${(lastX * 100).toFixed(1)}%`);
    scene.style.setProperty('--visitor-y', `${(lastY * 100).toFixed(1)}%`);

    scene.classList.add('visitor-moving');
    window.clearTimeout(timeout);

    timeout = window.setTimeout(() => {
      scene.classList.remove('visitor-moving');
    }, 650);

    if (getState() === 'idle') {
      setState(lastX > 0.68 ? 'curious' : 'warm');
    }
  };

  window.addEventListener('pointermove', onMove, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onMove);
    window.clearTimeout(timeout);
  };
}
