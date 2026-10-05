export function createWorldController({ scene }) {
  let timeout;
  let environmentalTimer;
  let environmentalEventTimer;

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


  function scheduleEnvironmentalMotion() {
    window.clearTimeout(environmentalTimer);

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    environmentalTimer = window.setTimeout(() => {
      if (!document.hidden) {
        scene.classList.add('city-pass');
        window.clearTimeout(environmentalEventTimer);
        environmentalEventTimer = window.setTimeout(() => {
          scene.classList.remove('city-pass');
        }, 2700);
      }

      scheduleEnvironmentalMotion();
    }, 22_000 + Math.random() * 24_000);
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
  scheduleEnvironmentalMotion();
  const clock = window.setInterval(() => {
    updateTime();
    updateMoon();
  }, 60_000);

  return {
    visitorArrived,
    destroy() {
      window.clearInterval(clock);
      window.clearTimeout(timeout);
      window.clearTimeout(environmentalTimer);
      window.clearTimeout(environmentalEventTimer);
      scene.classList.remove('city-pass');
    }
  };
}
