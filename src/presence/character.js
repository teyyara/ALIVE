export function characterMarkup() {
  return `
    <svg class="alive-character" viewBox="0 0 800 900" aria-label="ALIVE" role="img">
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f7d9c8"/>
          <stop offset=".58" stop-color="#dfaa91"/>
          <stop offset="1" stop-color="#ad7263"/>
        </linearGradient>
        <linearGradient id="skinLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fce2d0"/>
          <stop offset="1" stop-color="#d79a83"/>
        </linearGradient>
        <linearGradient id="hair" x1=".1" y1="0" x2=".85" y2="1">
          <stop offset="0" stop-color="#1a1516"/>
          <stop offset=".48" stop-color="#2d2424"/>
          <stop offset="1" stop-color="#0b090a"/>
        </linearGradient>
        <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2a2525"/>
          <stop offset="1" stop-color="#0d0b0c"/>
        </linearGradient>
        <radialGradient id="cheek" cx=".5" cy=".5">
          <stop offset="0" stop-color="#f6a99d" stop-opacity=".24"/>
          <stop offset="1" stop-color="#f6a99d" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="lip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#b76c6b"/>
          <stop offset="1" stop-color="#6b3438"/>
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="17"/>
        </filter>
      </defs>

      <ellipse class="character-ground" cx="402" cy="857" rx="225" ry="30" fill="#000" opacity=".42" filter="url(#shadow)"/>

      <g class="character-body">
        <path class="shoulders" d="M150 900C173 778 244 704 329 677C355 669 377 663 400 663C423 663 445 669 471 677C556 704 627 778 650 900Z" fill="url(#cloth)"/>
        <path class="sweater-fold" d="M210 840C267 761 330 730 400 730C470 730 533 761 590 840" fill="none" stroke="#5b4945" stroke-opacity=".24" stroke-width="17" stroke-linecap="round"/>
        <path class="neck" d="M331 579C336 640 330 680 310 706C343 733 372 748 400 748C428 748 457 733 490 706C470 680 464 640 469 579Z" fill="url(#skin)"/>
      </g>

      <g class="character-arm">
        <path d="M238 900C240 819 256 759 295 716C311 698 329 697 343 711C358 726 351 751 329 778C304 810 292 858 292 900Z" fill="url(#cloth)"/>
        <path class="hand" d="M326 708C300 674 288 620 290 570C292 536 306 507 327 493C343 483 356 491 359 507C363 529 349 556 348 577C347 604 360 626 378 645L399 666C411 678 407 695 392 705C368 720 344 721 326 708Z" fill="url(#skinLight)"/>
        <path d="M295 567C312 575 332 572 349 559M299 590C315 598 334 595 351 581M304 613C320 620 339 617 354 604" fill="none" stroke="#965f56" stroke-opacity=".34" stroke-width="5" stroke-linecap="round"/>
      </g>

      <g class="character-head">
        <path class="hair-back" d="M242 323C244 187 325 91 435 103C548 116 611 219 586 361C573 442 601 535 551 617C515 679 461 710 400 710C334 710 278 676 247 616C214 552 225 458 242 405Z" fill="url(#hair)"/>
        <path class="face" d="M279 303C282 226 332 174 405 169C483 164 538 211 548 292L536 455C529 548 476 621 405 637C334 625 281 549 272 456Z" fill="url(#skin)"/>
        <ellipse cx="329" cy="457" rx="78" ry="58" fill="url(#cheek)"/>
        <ellipse cx="483" cy="457" rx="78" ry="58" fill="url(#cheek)"/>

        <path class="nose" d="M405 336C400 382 392 425 386 455C381 481 394 493 414 492C428 491 438 484 443 473" fill="none" stroke="#9d655a" stroke-opacity=".52" stroke-width="7" stroke-linecap="round"/>

        <g class="eye eye-left">
          <path class="eye-white" d="M302 360C326 338 365 338 390 361C367 384 328 386 302 360Z" fill="#fbf7f2"/>
          <ellipse class="iris" cx="347" cy="361" rx="16" ry="18" fill="#6a4b3c"/>
          <ellipse class="pupil" cx="348" cy="361" rx="7.5" ry="9.5" fill="#121011"/>
          <circle class="catchlight" cx="352" cy="355" r="4" fill="#fff" opacity=".95"/>
          <path d="M302 360C328 334 368 334 390 361" fill="none" stroke="#2a1a1a" stroke-width="8" stroke-linecap="round"/>
          <path d="M308 372C331 388 365 389 385 372" fill="none" stroke="#8b584f" stroke-opacity=".48" stroke-width="4" stroke-linecap="round"/>
          <path class="eyelid" d="M300 360C325 337 368 337 392 361C366 369 326 368 300 360Z" fill="#d09381"/>
        </g>

        <g class="eye eye-right">
          <path class="eye-white" d="M420 361C445 338 484 338 508 360C483 386 444 384 420 361Z" fill="#fbf7f2"/>
          <ellipse class="iris" cx="464" cy="361" rx="16" ry="18" fill="#6a4b3c"/>
          <ellipse class="pupil" cx="463" cy="361" rx="7.5" ry="9.5" fill="#121011"/>
          <circle class="catchlight" cx="459" cy="355" r="4" fill="#fff" opacity=".95"/>
          <path d="M420 361C443 334 484 334 508 360" fill="none" stroke="#2a1a1a" stroke-width="8" stroke-linecap="round"/>
          <path d="M425 373C446 388 481 388 501 372" fill="none" stroke="#8b584f" stroke-opacity=".48" stroke-width="4" stroke-linecap="round"/>
          <path class="eyelid" d="M418 361C442 337 485 337 510 360C485 369 441 368 418 361Z" fill="#d09381"/>
        </g>

        <g class="brows">
          <path class="brow brow-left" d="M300 319C325 300 367 298 389 315" fill="none" stroke="#281919" stroke-width="12" stroke-linecap="round"/>
          <path class="brow brow-right" d="M421 315C445 298 482 300 508 318" fill="none" stroke="#281919" stroke-width="12" stroke-linecap="round"/>
        </g>

        <g class="mouth">
          <path class="mouth-line" d="M367 537C389 546 419 546 442 536" fill="none" stroke="#66363a" stroke-width="6" stroke-linecap="round"/>
          <path class="mouth-fill" d="M373 541C393 569 420 569 438 540C420 553 392 553 373 541Z" fill="url(#lip)" opacity=".86"/>
          <path d="M379 543C395 549 416 549 432 543" fill="none" stroke="#f5b6ae" stroke-opacity=".44" stroke-width="3" stroke-linecap="round"/>
        </g>

        <path class="hair-front-left" d="M263 313C250 243 271 166 324 130C286 236 311 306 334 350C341 368 331 405 302 446C276 414 265 364 263 313Z" fill="url(#hair)"/>
        <path class="hair-front-right" d="M510 192C560 222 579 293 559 367C545 418 514 456 493 483C513 399 514 323 497 266C490 239 493 214 510 192Z" fill="url(#hair)"/>
        <path class="hair-strand strand-left" d="M287 201C315 157 352 132 388 120" fill="none" stroke="#5d4742" stroke-opacity=".55" stroke-width="10" stroke-linecap="round"/>
        <path class="hair-strand strand-right" d="M519 226C540 276 540 335 522 396" fill="none" stroke="#59433f" stroke-opacity=".46" stroke-width="9" stroke-linecap="round"/>
      </g>
    </svg>
  `;
}

export function createCharacterController(root) {
  const svg = root.querySelector('.alive-character');
  if (!svg) throw new Error('ALIVE character could not be found.');

  const leftEye = svg.querySelector('.eye-left');
  const rightEye = svg.querySelector('.eye-right');
  const leftIris = svg.querySelector('.eye-left .iris');
  const rightIris = svg.querySelector('.eye-right .iris');
  const leftPupil = svg.querySelector('.eye-left .pupil');
  const rightPupil = svg.querySelector('.eye-right .pupil');
  const leftCatchlight = svg.querySelector('.eye-left .catchlight');
  const rightCatchlight = svg.querySelector('.eye-right .catchlight');
  const leftLid = svg.querySelector('.eye-left .eyelid');
  const rightLid = svg.querySelector('.eye-right .eyelid');
  const leftBrow = svg.querySelector('.brow-left');
  const rightBrow = svg.querySelector('.brow-right');
  const mouth = svg.querySelector('.mouth');
  const head = svg.querySelector('.character-head');
  const body = svg.querySelector('.character-body');
  const shoulders = svg.querySelector('.shoulders');
  const arm = svg.querySelector('.character-arm');
  const strands = [...svg.querySelectorAll('.hair-strand, .hair-front-left, .hair-front-right')];

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  let targetGazeX = 0;
  let targetGazeY = 0;
  let gazeX = 0;
  let gazeY = 0;
  let blink = 0;
  let blinkTarget = 0;
  let state = 'idle';
  let destroyed = false;
  let frameId = 0;
  let mood = { smile: .12, brow: 0, head: 0, breath: 0 };

  const targets = {
    smile: .12, brow: 0, head: 0, breath: 0
  };

  const stateMap = {
    idle: { smile: .12, brow: 0, head: 0, breath: 0 },
    attentive: { smile: .16, brow: .12, head: -.7, breath: .08 },
    listening: { smile: .10, brow: .04, head: -1.2, breath: .16 },
    thinking: { smile: -.02, brow: -.18, head: 1.1, breath: -.05 },
    speaking: { smile: .17, brow: .03, head: .2, breath: .20 },
    warm: { smile: .32, brow: .03, head: .25, breath: .12 },
    curious: { smile: .18, brow: .42, head: -.85, breath: .16 },
    playful: { smile: .48, brow: .28, head: -1.35, breath: .24 }
  };

  function setState(next) {
    state = stateMap[next] ? next : 'idle';
    Object.assign(targets, stateMap[state]);
  }

  function setAttention(x, y) {
    targetGazeX = Math.max(-1, Math.min(1, Number(x) || 0));
    targetGazeY = Math.max(-1, Math.min(1, Number(y) || 0));
  }

  function blinkNow() {
    if (destroyed || reduceMotion) return;
    blinkTarget = 1;
    window.setTimeout(() => {
      if (!destroyed) blinkTarget = 0;
    }, 120);
  }

  function frame(timeMs) {
    if (destroyed) return;

    const time = timeMs * .001;

    gazeX += (targetGazeX - gazeX) * (reduceMotion ? 1 : .09);
    gazeY += (targetGazeY - gazeY) * (reduceMotion ? 1 : .09);
    blink += (blinkTarget - blink) * .34;

    for (const key of Object.keys(mood)) {
      mood[key] += (targets[key] - mood[key]) * .065;
    }

    const breath = reduceMotion ? 0 : Math.sin(time * .82 + .4) * .5 + .5;
    const eyeX = gazeX * 15;
    const eyeY = gazeY * 8;

    leftEye.style.transform = `translate3d(${eyeX}px,${eyeY}px,0)`;
    rightEye.style.transform = `translate3d(${eyeX}px,${eyeY}px,0)`;

    const irisX = gazeX * 8;
    const irisY = gazeY * 4.5;
    [leftIris, rightIris, leftPupil, rightPupil, leftCatchlight, rightCatchlight].forEach((part) => {
      part.style.transform = `translate3d(${irisX}px,${irisY}px,0)`;
    });

    [leftLid, rightLid].forEach((lid) => {
      lid.style.opacity = String(Math.min(1, blink * 1.12));
      lid.style.transformOrigin = '50% 50%';
      lid.style.transform = `scaleY(${Math.max(.035, 1 - blink * .97)})`;
    });

    const browLift = mood.brow * 6 - gazeY * 1.5;
    leftBrow.style.transform = `translate3d(${gazeX * 1.5}px,${-browLift}px,0)`;
    rightBrow.style.transform = `translate3d(${gazeX * 1.5}px,${-browLift}px,0)`;

    const mouthOpen = state === 'speaking' ? Math.abs(Math.sin(time * 13)) * .035 : 0;
    mouth.style.transform = `translate3d(0,${-mood.smile * 4.2}px,0) scaleX(${1 + mood.smile * .13}) scaleY(${1 + mouthOpen})`;

    const headX = eyeX * .18 + mood.head;
    const headY = eyeY * .08;
    head.style.transform = `translate3d(${headX}px,${headY}px,0) rotate(${mood.head * .18}deg)`;

    body.style.transform = `translate3d(0,${-breath * (1.7 + mood.breath * 2.1)}px,0)`;
    shoulders.style.transformOrigin = '50% 100%';
    shoulders.style.transform = `scaleY(${1 + breath * .006})`;

    arm.style.transform = `translate3d(${gazeX * 1.1}px,${gazeY * .55}px,0)`;

    strands.forEach((strand, index) => {
      const sway = reduceMotion ? 0 : Math.sin(time * (.58 + index * .07) + index * 1.8) * (.55 + index * .12);
      strand.style.transform = `translate3d(${gazeX * .7 + sway}px,${gazeY * .25}px,0)`;
    });

    frameId = window.requestAnimationFrame(frame);
  }

  if (!reduceMotion) frameId = window.requestAnimationFrame(frame);

  return {
    setAttention,
    setState,
    blink: blinkNow,
    destroy() {
      destroyed = true;
      window.cancelAnimationFrame(frameId);
    }
  };
}
