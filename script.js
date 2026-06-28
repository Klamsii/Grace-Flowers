/* =========================================================
   GRACE FLOWERS — script.js
   Symbol scramble intro, transition, music, scroll effects
   ========================================================= */

(function () {
  'use strict';

  /* -------------------------------------------------------
     CONFIG
  ------------------------------------------------------- */
  const SYMBOLS = '#@$%&*!?+~^÷=≠∞◊▲▼◆●○□■□▪▸◂✦✧✶✸★☆✿❀❁❋✺✼✻✽✾⊕⊗⌘⌦⌛⊞⊠';
  const SCRAMBLE_FRAMES = 18;      // iterations per character
  const FRAME_MS = 45;             // ms per scramble frame
  const CHAR_STAGGER_MS = 120;     // delay between chars starting
  const SUBTITLE_DELAY_MS = 600;   // delay after main chars finish

  /* -------------------------------------------------------
     ELEMENTS
  ------------------------------------------------------- */
  const sceneIntro = document.getElementById('scene-intro');
  const sceneMain  = document.getElementById('scene-main');
  const logoFlower  = document.getElementById('logoFlower');
  const clickHint   = document.getElementById('clickHint');
  const bgMusic     = document.getElementById('bgMusic');
  const musicBtn    = document.getElementById('musicBtn');
  const musicBtnMain = document.getElementById('musicBtnMain');
  const headerFlower = document.getElementById('headerFlower');

  const mainChars     = ['char-G','char-R','char-C','char-E'];
  const subtitleChars = ['sub-f','sub-l','sub-o','sub-w','sub-e','sub-r','sub-s'];

  let introComplete  = false;
  let transitioning  = false;
  let musicPlaying   = false;
  let musicMuted     = false;

  /* -------------------------------------------------------
     UTILITY: random symbol
  ------------------------------------------------------- */
  function randSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
  }

  /* -------------------------------------------------------
     SCRAMBLE ONE CHARACTER
     el        — DOM span
     finalChar — the real letter to end on
     startDelay — ms before starting
  ------------------------------------------------------- */
  function scrambleChar(el, finalChar, startDelay) {
    return new Promise(resolve => {
      setTimeout(() => {
        el.classList.add('scrambling');
        let frame = 0;
        const interval = setInterval(() => {
          if (frame < SCRAMBLE_FRAMES) {
            el.textContent = randSymbol();
            frame++;
          } else {
            clearInterval(interval);
            el.textContent = finalChar;
            el.classList.remove('scrambling');
            el.classList.add('settled');
            resolve();
          }
        }, FRAME_MS);
      }, startDelay);
    });
  }

  /* -------------------------------------------------------
     RUN INTRO ANIMATION
  ------------------------------------------------------- */
  async function runIntroAnimation() {
    // Scramble main chars with stagger
    const charEls = mainChars.map(id => document.getElementById(id));

    // Initial: show symbols for all chars
    charEls.forEach(el => {
      el.textContent = randSymbol();
      el.classList.add('scrambling');
    });

    // Scramble each char, staggered
    const promises = charEls.map((el, i) =>
      scrambleChar(el, el.dataset.final, i * CHAR_STAGGER_MS)
    );

    await Promise.all(promises);

    // After main chars done, reveal subtitle
    await delay(SUBTITLE_DELAY_MS);

    const subEls = subtitleChars.map(id => document.getElementById(id));
    for (let i = 0; i < subEls.length; i++) {
      await delay(80);
      subEls[i].classList.add('visible');
    }

    // Show click hint
    await delay(300);
    clickHint.classList.add('show');
    introComplete = true;
  }

  function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  /* -------------------------------------------------------
     TRANSITION: intro → main
  ------------------------------------------------------- */
  async function transitionToMain() {
    if (!introComplete || transitioning) return;
    transitioning = true;
    clickHint.classList.remove('show');

    // 1. Scramble main chars back then fade out
    const charEls = mainChars.map(id => document.getElementById(id));
    const subEls  = subtitleChars.map(id => document.getElementById(id));

    // Fade out subtitle
    subEls.forEach(el => {
      el.style.transition = 'opacity 0.3s ease';
      el.style.opacity = '0';
    });

    await delay(150);

    // Scramble chars then fade with blur
    charEls.forEach((el, i) => {
      setTimeout(() => {
        el.classList.add('char-exit');
      }, i * 60);
    });

    // Spin flower fast then send it "up"
    const flowerSvg = document.getElementById('flowerSvg');
    flowerSvg.style.transition = 'transform 0.6s cubic-bezier(0.36, 0, 0.66, -0.56)';
    flowerSvg.style.animation = 'flowerSpin 0.4s linear infinite';

    await delay(400);

    // Move flower wrap upward
    logoFlower.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
    logoFlower.style.transform = 'translateY(-120vh) scale(1.4)';
    logoFlower.style.opacity = '0';

    // Fade out scene intro
    sceneIntro.style.transition = 'opacity 0.7s ease';
    sceneIntro.style.opacity = '0';

    await delay(600);

    // Show scene main
    sceneIntro.classList.remove('active');
    sceneIntro.style.pointerEvents = 'none';
    sceneMain.classList.add('active');
    sceneMain.removeAttribute('aria-hidden');
    document.body.style.overflow = 'auto';

    // Animate header flower peeking from top
    await delay(100);
    headerFlower.style.top = '-80px';
    headerFlower.style.transition = 'top 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    await delay(200);
    headerFlower.style.top = '-68px'; // just peeking

    // Reveal elements with scroll animation
    setupScrollReveal();
  }

  /* -------------------------------------------------------
     CLICK/TAP HANDLER on intro scene
  ------------------------------------------------------- */
  sceneIntro.addEventListener('click', () => {
    if (introComplete && !transitioning) {
      // Start music on first interaction (browser policy)
      tryPlayMusic();
      transitionToMain();
    }
  });

  sceneIntro.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (introComplete && !transitioning) {
      tryPlayMusic();
      transitionToMain();
    }
  });

  /* -------------------------------------------------------
     MUSIC
  ------------------------------------------------------- */
  // Use a royalty-free ambient/nature track
  // We'll try multiple sources in order
  const MUSIC_SOURCES = [
    'https://cdn.pixabay.com/audio/2022/11/17/audio_febc508520.mp3',
    'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  ];

  bgMusic.src = MUSIC_SOURCES[0];
  bgMusic.volume = 0.35;

  function tryPlayMusic() {
    if (musicPlaying) return;
    bgMusic.play().then(() => {
      musicPlaying = true;
      updateMusicButtons(true);
    }).catch(() => {
      // Try next source
      bgMusic.src = MUSIC_SOURCES[1];
      bgMusic.play().then(() => {
        musicPlaying = true;
        updateMusicButtons(true);
      }).catch(() => {});
    });
  }

  function updateMusicButtons(playing) {
    const btns = [musicBtn, musicBtnMain];
    btns.forEach(btn => {
      if (!btn) return;
      btn.classList.toggle('muted', !playing);
      btn.title = playing ? 'Выключить музыку' : 'Включить музыку';
    });
  }

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusic();
  });

  if (musicBtnMain) {
    musicBtnMain.addEventListener('click', () => toggleMusic());
  }

  function toggleMusic() {
    if (!musicPlaying) {
      tryPlayMusic();
    } else {
      musicMuted = !musicMuted;
      if (musicMuted) {
        bgMusic.pause();
        updateMusicButtons(false);
      } else {
        bgMusic.play();
        updateMusicButtons(true);
      }
    }
  }

  /* -------------------------------------------------------
     SCROLL REVEAL
  ------------------------------------------------------- */
  function setupScrollReveal() {
    const revealEls = document.querySelectorAll(
      '.catalog-card, .about-content > *, .gallery-item, .contact-card, .section-header'
    );

    revealEls.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 4) * 80}ms`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  }

  /* -------------------------------------------------------
     NAVBAR SCROLL EFFECT
  ------------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  if (navbar) {
    sceneMain.addEventListener('scroll', () => {
      if (sceneMain.scrollTop > 50) {
        navbar.style.boxShadow = '0 4px 30px rgba(45, 69, 85, 0.08)';
      } else {
        navbar.style.boxShadow = 'none';
      }
    });
  }

  /* -------------------------------------------------------
     SMOOTH ANCHOR NAVIGATION
  ------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* -------------------------------------------------------
     PETAL PARALLAX on hero flower
  ------------------------------------------------------- */
  const heroFlower = document.querySelector('.hero-flower-big');
  if (heroFlower) {
    sceneMain.addEventListener('scroll', () => {
      const scrollY = sceneMain.scrollTop;
      heroFlower.style.transform = `translateY(${scrollY * 0.08}px) rotate(${scrollY * 0.02}deg)`;
    });
  }

  /* -------------------------------------------------------
     CATALOG CARD TILT EFFECT
  ------------------------------------------------------- */
  document.querySelectorAll('.catalog-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `
        translateY(-6px)
        rotateX(${-y * 5}deg)
        rotateY(${x * 5}deg)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
    });
  });

  /* -------------------------------------------------------
     HEADER FLOWER CONTINUOUS ROTATION
  ------------------------------------------------------- */
  let hfAngle = 0;
  function animateHeaderFlower() {
    hfAngle += 0.15;
    if (headerFlower) {
      const svg = headerFlower.querySelector('svg');
      if (svg) svg.style.transform = `rotate(${hfAngle}deg)`;
    }
    requestAnimationFrame(animateHeaderFlower);
  }
  animateHeaderFlower();

  /* -------------------------------------------------------
     START INTRO ANIMATION
  ------------------------------------------------------- */
  // Slight delay for fonts to load
  setTimeout(runIntroAnimation, 400);

})();
