const randomBetween = (min, max) => min + Math.random() * (max - min);

function blink(stage) {
  stage.classList.add('blink');
  window.setTimeout(() => stage.classList.remove('blink'), 155);
}

export function createIdleBehavior({ stage, setState, getState }) {
  let stopped = false;
  let timer;
  let blinkTimer;

  const scheduleBlink = () => {
    if (stopped) return;
    blinkTimer = window.setTimeout(() => {
      if (!document.hidden) blink(stage);
      scheduleBlink();
    }, randomBetween(2800, 6700));
  };

  const schedulePresence = () => {
    if (stopped) return;

    timer = window.setTimeout(() => {
      const state = getState();

      if (state === 'idle' || state === 'warm') {
        stage.classList.add('micro-shift');
        window.setTimeout(() => stage.classList.remove('micro-shift'), 1200);

        if (Math.random() > 0.66) {
          setState('curious');

          window.setTimeout(() => {
            if (getState() === 'curious') setState('idle');
          }, 1600);
        }
      }

      schedulePresence();
    }, randomBetween(6000, 11500));
  };

  scheduleBlink();
  schedulePresence();

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    window.clearTimeout(blinkTimer);
  };
}
