export function createWorldController({ scene }) {
  let timeout;

  function updateTime() {
    const now = new Date();
    const hour = now.getHours();
    const phase =
      hour >= 6 && hour < 11 ? 'morning' :
      hour >= 11 && hour < 17 ? 'afternoon' :
      hour >= 17 && hour < 22 ? 'evening' :
      'night';

    scene.dataset.time = phase;
  }


  function moonPhase(date) {
    const reference = Date.UTC(2000, 0, 6, 18, 14);
    const cycle = 29.530588853;
    const days = (date.getTime() - reference) / 86_400_000;
    return ((days % cycle) + cycle) % cycle / cycle;
  }

  function updateMoon() {
    const phase = moonPhase(new Date());
    const index = Math.round(phase * 8) % 8;
    scene.dataset.moon = String(index);
  }

  function visitorArrived() {
    scene.classList.add('visitor-present');
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      scene.classList.remove('visitor-present');
    }, 2600);
  }

  updateTime();
  updateMoon();
  const clock = window.setInterval(() => {
    updateTime();
    updateMoon();
  }, 60_000);

  return {
    visitorArrived,
    destroy() {
      window.clearInterval(clock);
      window.clearTimeout(timeout);
    }
  };
}
