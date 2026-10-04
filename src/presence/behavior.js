const randomBetween = (min, max) => min + Math.random() * (max - min);

function blink(stage) {
  if (document.hidden) return;
  stage.classList.add('blink');
  window.setTimeout(() => stage.classList.remove('blink'), 155);
}

export function createIdleBehavior({ stage, setState, getState }) {
  let stopped = false;
  let paused = document.hidden;
  let timer;
  let blinkTimer;
  let microTimer;
  let curiosityTimer;

  const scheduleBlink = () => {
    if (stopped || paused) return;

    blinkTimer = window.setTimeout(() => {
      blink(stage);
      scheduleBlink();
    }, randomBetween(2800, 6700));
  };

  const schedulePresence = () => {
    if (stopped || paused) return;

    timer = window.setTimeout(() => {
      if (paused || document.hidden) {
        schedulePresence();
        return;
      }

      const state = getState();

      if (state === 'idle' || state === 'warm') {
        stage.classList.add('micro-shift');

        microTimer = window.setTimeout(() => {
          stage.classList.remove('micro-shift');
        }, 1200);

        if (Math.random() > 0.66) {
          setState('curious');

          curiosityTimer = window.setTimeout(() => {
            if (getState() === 'curious') setState('idle');
          }, 1600);
        }
      }

      schedulePresence();
    }, randomBetween(6000, 11500));
  };

  const restartSchedules = () => {
    window.clearTimeout(timer);
    window.clearTimeout(blinkTimer);

    if (!paused && !stopped) {
      scheduleBlink();
      schedulePresence();
    }
  };

  const onVisibilityChange = () => {
    paused = document.hidden;

    if (paused) {
      window.clearTimeout(timer);
      window.clearTimeout(blinkTimer);
      stage.classList.remove('micro-shift');
      return;
    }

    restartSchedules();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  if (!paused) {
    scheduleBlink();
    schedulePresence();
  }

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    window.clearTimeout(blinkTimer);
    window.clearTimeout(microTimer);
    window.clearTimeout(curiosityTimer);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
