export function createWorldController({ scene }) {
  let timeout;

  function updateTime() {
    const hour = new Date().getHours();
    const phase =
      hour >= 6 && hour < 11 ? 'morning' :
      hour >= 11 && hour < 17 ? 'afternoon' :
      hour >= 17 && hour < 22 ? 'evening' :
      'night';

    scene.dataset.time = phase;
  }

  function visitorArrived() {
    scene.classList.add('visitor-present');
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      scene.classList.remove('visitor-present');
    }, 2600);
  }

  updateTime();
  const clock = window.setInterval(updateTime, 60_000);

  return {
    visitorArrived,
    destroy() {
      window.clearInterval(clock);
      window.clearTimeout(timeout);
    }
  };
}
