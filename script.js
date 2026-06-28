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
  const wooshSound  = document.getElementById('wooshSound');
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

    // Move flower wrap upward + play woosh
    logoFlower.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease';
    logoFlower.style.transform = 'translateY(-120vh) scale(1.4)';
    logoFlower.style.opacity = '0';

    // Play woosh sound
    if (wooshSound) {
      wooshSound.volume = 0.55;
      wooshSound.currentTime = 0;
      wooshSound.play().catch(() => {});
    }

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
  bgMusic.volume = 0.015; // Extremely low, ambient volume

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
      '.catalog-card, .about-content > *, .collage-item, .contact-card, .section-header'
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

    // Staggered fade-in for smaller detail elements
    const detailEls = document.querySelectorAll(
      '.feature-icon, .stat, .card-tag, .card-badge, .about-badge, .footer-logo, .footer-sub'
    );
    detailEls.forEach((el, i) => {
      el.classList.add('reveal-detail');
      el.style.transitionDelay = `${100 + (i % 5) * 60}ms`;
      observer.observe(el);
    });
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
     SMOOTH SCROLL (enhanced momentum for scene-main)
  ------------------------------------------------------- */
  let scrollTarget = 0;
  let scrollCurrent = 0;
  const SCROLL_EASE = 0.072;

  function smoothScrollLoop() {
    const diff = scrollTarget - scrollCurrent;
    if (Math.abs(diff) < 0.5) {
      scrollCurrent = scrollTarget;
    } else {
      scrollCurrent += diff * SCROLL_EASE;
    }
    sceneMain.scrollTop = scrollCurrent;
    requestAnimationFrame(smoothScrollLoop);
  }

  sceneMain.addEventListener('wheel', (e) => {
    e.preventDefault();
    scrollTarget = Math.max(0, Math.min(
      scrollTarget + e.deltaY * 1.1,
      sceneMain.scrollHeight - sceneMain.clientHeight
    ));
  }, { passive: false });

  // Sync on any programmatic scroll (e.g. touch/swipe natively scrolling container)
  sceneMain.addEventListener('scroll', () => {
    if (Math.abs(sceneMain.scrollTop - scrollCurrent) > 80) {
      scrollCurrent = sceneMain.scrollTop;
      scrollTarget = sceneMain.scrollTop;
    }
  });

  smoothScrollLoop();

  /* -------------------------------------------------------
     SMOOTH ANCHOR NAVIGATION (Floral Flurry Screen Sweep)
  ------------------------------------------------------- */
  const flowerTransition = document.getElementById('flower-transition');

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      
      if (target && flowerTransition) {
        // 1. Play woosh sound
        if (wooshSound) {
          wooshSound.volume = 0.45;
          wooshSound.currentTime = 0;
          wooshSound.play().catch(() => {});
        }

        // 2. Open overlay
        flowerTransition.innerHTML = '';
        flowerTransition.classList.add('active');

        // Spawn central spinning vector flower logo
        const logo = document.createElement('div');
        logo.className = 'transition-logo';
        logo.innerHTML = `
          <svg viewBox="0 0 100 100" style="width:100%; height:100%; fill:none; stroke:currentColor; stroke-width:1.5;">
            <g transform="translate(50,50)">
              <ellipse cx="0" cy="-28" rx="11" ry="22" transform="rotate(0)" />
              <ellipse cx="0" cy="-28" rx="11" ry="22" transform="rotate(45)" />
              <ellipse cx="0" cy="-28" rx="11" ry="22" transform="rotate(90)" />
              <ellipse cx="0" cy="-28" rx="11" ry="22" transform="rotate(135)" />
              <ellipse cx="0" cy="-28" rx="11" ry="22" transform="rotate(180)" />
              <ellipse cx="0" cy="-28" rx="11" ry="22" transform="rotate(225)" />
              <ellipse cx="0" cy="-28" rx="11" ry="22" transform="rotate(270)" />
              <ellipse cx="0" cy="-28" rx="11" ry="22" transform="rotate(315)" />
              <circle cx="0" cy="0" r="10" fill="currentColor" />
            </g>
          </svg>
        `;
        flowerTransition.appendChild(logo);

        // 3. Spawn a sweep of flying flowers
        const numFlowers = 28;
        const symbols = ['✿', '❀', '❁', '🌸', '🌹', '✦', '✧', '❊'];

        for (let i = 0; i < numFlowers; i++) {
          setTimeout(() => {
            const f = document.createElement('div');
            f.className = 'flying-flower';
            f.textContent = symbols[Math.floor(Math.random() * symbols.length)];

            // Spread start positions across the entire bottom edge
            const startX = Math.random() * 100; // 0–100% of viewport width
            f.style.left = `${startX}vw`;
            f.style.bottom = `${-20 - Math.random() * 40}px`;

            // Varied size and animation speed for natural look
            f.style.fontSize = `${20 + Math.random() * 38}px`;
            const dur = 0.9 + Math.random() * 0.5;
            f.style.animationDuration = `${dur}s`;
            f.style.animationDelay = `${Math.random() * 250}ms`;

            // Sweet color mix: pink / crystal / white
            const rnd = Math.random();
            if (rnd > 0.65) {
              f.style.color = '#e4aec5'; // pink
            } else if (rnd > 0.3) {
              f.style.color = '#b0c4d0'; // crystal
            } else {
              f.style.color = '#ffffff'; // white
            }

            flowerTransition.appendChild(f);
            setTimeout(() => f.remove(), 1600);
          }, i * 18);
        }

        // 4. Perform the programmatic scroll exactly at peak cover (500ms)
        setTimeout(() => {
          const targetOffset = target.getBoundingClientRect().top + sceneMain.scrollTop - sceneMain.getBoundingClientRect().top;
          const navbarHeight = navbar ? navbar.clientHeight : 70;
          
          scrollTarget = Math.max(0, Math.min(
            targetOffset - navbarHeight + 5,
            sceneMain.scrollHeight - sceneMain.clientHeight
          ));
          // Instant sync so scrolling looks completely native
          scrollCurrent = scrollTarget;
          sceneMain.scrollTop = scrollTarget;
        }, 500);

        // 5. Hide overlay
        setTimeout(() => {
          flowerTransition.classList.remove('active');
        }, 1100);
      }
    });
  });

  /* -------------------------------------------------------
     AMBIENT FLOATING PETALS on background
  ------------------------------------------------------- */
  function createAmbientParticles() {
    const container = document.createElement('div');
    container.className = 'ambient-particles';
    sceneMain.prepend(container);

    const symbols = ['✿', '❀', '✦', '·', '◦', '✧'];
    const count = 18;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'amb-particle';
      p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      const xPos = Math.random() * 100;
      const delay = Math.random() * 14;
      const duration = 14 + Math.random() * 18;
      const size = 0.55 + Math.random() * 0.6;
      const opacity = 0.04 + Math.random() * 0.09;
      p.style.cssText = `
        left: ${xPos}vw;
        animation-delay: -${delay}s;
        animation-duration: ${duration}s;
        font-size: ${size}rem;
        opacity: ${opacity};
      `;
      container.appendChild(p);
    }
  }

  createAmbientParticles();

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
