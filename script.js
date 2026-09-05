(() => {
  'use strict';
  const hero = document.querySelector('.hero');
  const cup = document.querySelector('.cup-scroll');
  const parallax = document.querySelector('.cup-parallax');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!hero || !cup || !parallax) return;

  let frame = 0;
  let observer;
  const clamp = value => Math.min(1, Math.max(0, value));
  const smooth = value => { const p = clamp(value); return p * p * (3 - 2 * p); };
  const range = (value, start, end) => smooth((value - start) / (end - start));
  const mix = (a, b, t) => a + (b - a) * t;
  const fusion = document.querySelector('.fusion');
  const stage = document.querySelector('.fusion__stage');
  const partner = document.querySelector('.fusion__partner');
  const result = document.querySelector('.fusion__result');
  const pulse = document.querySelector('.fusion__pulse');
  const heading = document.querySelector('.fusion__heading');
  const labels = document.querySelector('.fusion__labels');
  const outcome = document.querySelector('.fusion__outcome');
  const progressBar = document.querySelector('.fusion__progress');
  const vortex = document.querySelector('.fusion__vortex');
  const waves = [...document.querySelectorAll('.fusion__shockwaves i')];
  const sparkLayer = document.querySelector('.fusion__sparks');
  let lastBurst = -1;
  const home = document.createElement('div');
  home.className = 'cup-scroll cup-home-position';
  home.setAttribute('aria-hidden', 'true');
  home.style.aspectRatio = '2 / 3';
  const originalParent = cup.parentElement;
  originalParent.insertBefore(home, cup);
  const sparks = Array.from({ length: 64 }, (_, index) => {
    const spark = document.createElement('i');
    sparkLayer.append(spark);
    // Golden-angle distribution gives a dense, repeatable burst without random per-frame work.
    const angle = index * 2.399963;
    return { element: spark, dx: Math.cos(angle), dy: Math.sin(angle), distance: 120 + (index % 7) * 39, delay: (index % 5) * .018, angle };
  });

  function renderScroll() {
    frame = 0;
    if (motion.matches) {
      cup.style.transform = '';
      cup.style.opacity = '';
      return;
    }
    // Read geometry first, then write styles. All phases are a pure function of scroll.
    const origin = home.getBoundingClientRect();
    const main = document.querySelector('main').getBoundingClientRect();
    const scene = stage.getBoundingClientRect();
    const track = fusion.getBoundingClientRect();
    const heroBounds = hero.getBoundingClientRect();
    const arrival = range(-heroBounds.top, 0, heroBounds.height);
    const progress = clamp(-track.top / Math.max(1, track.height - scene.height));
    const spin = range(progress, .02, .43);
    const merge = range(progress, .43, .66);
    const transform = range(progress, .64, .79);
    const angle = spin * Math.PI * 2 + merge * Math.PI * .35;
    const spread = Math.min(scene.width * .22, 225);
    const targetWidth = Math.min(340, Math.max(180, scene.width * .34));
    const cupHeight = origin.width * 1.5 - 2;
    const orbitX = Math.cos(angle) * spread * (1 - merge);
    const orbitY = Math.sin(angle) * Math.min(spread * .68, 130) * (1 - merge);
    const x = mix(origin.left + origin.width / 2, scene.left + scene.width / 2 - orbitX, arrival);
    // Keep a calm viewport trajectory rather than chasing a moving offscreen target.
    // The small arc eases the cup into the next scene without a vertical plunge.
    const y = mix(origin.top - heroBounds.top + cupHeight / 2, Math.min(0, scene.top) + scene.height * .55 - orbitY, arrival) - Math.sin(arrival * Math.PI) * 24;
    // Dimensions only change on layout changes, not on every animation frame.
    const position = { left: `${origin.left - main.left}px`, top: `${origin.top - main.top}px`, width: `${origin.width}px` };
    for (const key in position) if (cup.style[key] !== position[key]) cup.style[key] = position[key];
    const lean = Math.sin(angle) * 15;
    cup.style.transform = `translate3d(${x - origin.left - origin.width / 2}px, ${y - origin.top - cupHeight / 2}px, 0) scale(${mix(1, targetWidth / origin.width, arrival) * (1 - merge * .14)}) rotate(${Math.sin(arrival * Math.PI) * -4 - lean}deg)`;
    cup.style.opacity = String(1 - transform);
    cup.style.visibility = transform === 1 ? 'hidden' : 'visible';
    partner.style.transform = `translate(calc(-50% + ${orbitX}px), calc(-50% + ${orbitY}px)) rotate(${6 * (1 - merge) + lean}deg) scale(${1 - merge * .14})`;
    partner.style.opacity = String(1 - transform);
    result.style.opacity = String(transform);
    result.style.transform = `translate(-50%, -50%) scale(${mix(.7, 1, transform) + Math.sin(transform * Math.PI) * .09}) rotate(-5deg)`;
    vortex.style.opacity = String(range(progress, .01, .1) * (1 - range(progress, .57, .7)));
    vortex.style.transform = `translate(-50%, -50%) rotate(${spin * 360 + merge * 160}deg) scale(${1 - merge * .75})`;
    const burst = clamp((progress - .625) / .36);
    // Update the particle field only during the burst or when reversing into it.
    if (burst !== lastBurst) {
      lastBurst = burst;
      const flash = range(burst, 0, .12) * (1 - range(burst, .15, .85));
      pulse.style.opacity = String(flash * .9);
      pulse.style.transform = `translate(-50%, -50%) scale(${.25 + burst * 1.5})`;
      waves.forEach((wave, index) => {
        const t = clamp((burst - index * .055) / .72);
        wave.style.opacity = String(Math.sin(t * Math.PI) * (1 - t));
        wave.style.transform = `translate(-50%, -50%) scale(${.12 + (1 - (1 - t) ** 3) * (1.2 + index * .16)}) rotate(${index * 28 + t * 60}deg)`;
      });
      const mobile = scene.width < 600;
      sparks.forEach(({ element, dx, dy, distance, delay, angle }, index) => {
        if (mobile && index >= 40) return;
        const t = clamp((burst - delay) / (1 - delay));
        const travel = (1 - (1 - t) ** 3) * distance * (mobile ? .62 : 1);
        element.style.opacity = String(range(t, 0, .06) * (1 - range(t, .25, 1)));
        element.style.transform = `translate3d(${dx * travel}px, ${dy * travel + t * t * 32}px, 0) rotate(${angle * 180 / Math.PI + t * 90}deg) scale(${1 - t * .7})`;
      });
    }
    labels.style.opacity = String(1 - range(progress, .12, .4));
    heading.style.opacity = String(1 - range(progress, .2, .48));
    outcome.style.opacity = String(range(progress, .8, .95));
    outcome.style.transform = `translateY(${12 * (1 - range(progress, .8, .95))}px)`;
    progressBar.style.transform = `scaleX(${progress})`;
  }

  function scheduleScroll() {
    if (!frame) frame = requestAnimationFrame(renderScroll);
  }

  function resetPointer() {
    parallax.style.removeProperty('--pointer-x');
    parallax.style.removeProperty('--pointer-y');
  }

  hero.addEventListener('pointermove', event => {
    if (motion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    parallax.style.setProperty('--pointer-x', `${x * 16}px`);
    parallax.style.setProperty('--pointer-y', `${y * 12}px`);
  }, { passive: true });
  hero.addEventListener('pointerleave', resetPointer);

  function configureMotion() {
    observer?.disconnect();
    resetPointer();
    lastBurst = -1;
    document.documentElement.classList.toggle('scroll-story-enabled', !motion.matches);
    if (motion.matches) {
      originalParent.append(cup);
      cup.classList.remove('is-travelling');
      cup.removeAttribute('style');
      [partner, result, pulse, heading, labels, outcome, progressBar, vortex, ...waves].forEach(element => element.removeAttribute('style'));
      sparks.forEach(({ element }) => element.removeAttribute('style'));
    } else {
      document.querySelector('main').append(cup);
      cup.classList.add('is-travelling');
    }
    const enable = !motion.matches && 'IntersectionObserver' in window;
    document.documentElement.classList.toggle('motion-enabled', enable);
    if (enable) {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      }, { threshold: 0.1 });
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(element => observer.observe(element));
    }
    scheduleScroll();
  }

  window.addEventListener('scroll', scheduleScroll, { passive: true });
  window.addEventListener('resize', () => { lastBurst = -1; scheduleScroll(); }, { passive: true });
  window.addEventListener('pageshow', scheduleScroll);
  motion.addEventListener('change', configureMotion);
  finePointer.addEventListener('change', resetPointer);
  configureMotion();
})();
