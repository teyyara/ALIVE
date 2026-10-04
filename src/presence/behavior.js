const randomBetween = (min, max) => min + Math.random() * (max - min);

export function createIdleBehavior({ stage, setState, getState }) {
  let stopped = false;
  let timer;

  const schedule = () => {
    if (stopped) return;
    timer = window.setTimeout(() => {
      const state = getState();
      if (state === 'idle' || state === 'warm') {
        stage.classList.add('micro-shift');
        window.setTimeout(() => stage.classList.remove('micro-shift'), 1200);

        if (Math.random() > 0.62) {
          setState('curious');
          window.setTimeout(() => {
            if (getState() === 'curious') setState('idle');
          }, 1500);
        }
      }
      schedule();
    }, randomBetween(6000, 11500));
  };

  schedule();

  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}
