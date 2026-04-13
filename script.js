/* ===================================================
   Snake Venom — Interactive Scripts + 3D Model Viewer
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ----- NAV: scrolled state ----- */
  const nav = document.getElementById('main-nav');
  const onScroll = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ----- NAV: mobile toggle ----- */
  const toggle = document.getElementById('nav-toggle');
  const links  = document.getElementById('nav-links');
  toggle.addEventListener('click', () => {
    links.classList.toggle('active');
    toggle.setAttribute('aria-expanded', links.classList.contains('active'));
  });
  links.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => links.classList.remove('active'));
  });

  /* ----- HERO: counter animation ----- */
  const counters = document.querySelectorAll('[data-count]');
  let countersDone = false;

  function animateCounters() {
    if (countersDone) return;
    countersDone = true;
    counters.forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const duration = 2000;
      const start = performance.now();
      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - (1 - progress) * (1 - progress);
        el.textContent = Math.floor(eased * target);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = target;
      }
      requestAnimationFrame(update);
    });
  }

  const statsEl = document.getElementById('hero-stats');
  if (statsEl) {
    const statsObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) animateCounters();
    }, { threshold: 0.5 });
    statsObs.observe(statsEl);
  }

  /* ----- SCROLL REVEAL ----- */
  const revealTargets = document.querySelectorAll(
    '.overview__card, .comp-card, .mechanism__step, .medicine__card, .section__header, .models__viewer-wrapper, .models__tabs'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  revealTargets.forEach(el => revealObs.observe(el));

  /* ----- STAGGERED REVEAL ----- */
  const gridContainers = document.querySelectorAll(
    '.composition__grid, .overview__grid, .medicine__grid, .mechanism__timeline'
  );
  gridContainers.forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 80}ms`;
    });
  });

  /* ----- COMP CARDS: mouse glow tracking ----- */
  document.querySelectorAll('.comp-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });

  /* ----- SMOOTH SCROLL ----- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  /* ===================================================
     3D MODEL VIEWER — 3Dmol.js Integration
     =================================================== */

  // Model definitions with PDB IDs
  const modelData = {
    cobratoxin: {
      pdbId: '2CTX',
      label: 'α-Cobratoxin',
      defaultColor: 'spectrum',
    },
    pla2: {
      pdbId: '1FB2',
      label: 'Phospholipase A₂',
      defaultColor: 'spectrum',
    },
    crotamine: {
      pdbId: '1H5O',
      label: 'Crotamine',
      defaultColor: 'spectrum',
    },
  };

  let viewer = null;
  let currentModel = 'cobratoxin';
  let currentStyle = 'cartoon';
  let pdbCache = {};

  // Initialize the 3Dmol viewer
  function initViewer() {
    const canvas = document.getElementById('model-canvas');
    if (!canvas || typeof $3Dmol === 'undefined') {
      console.warn('3Dmol.js not loaded or canvas not found');
      return;
    }

    viewer = $3Dmol.createViewer(canvas, {
      backgroundColor: '#0a0e0c',
      antialias: true,
    });

    loadModel(currentModel);
  }

  // Fetch PDB data from RCSB
  async function fetchPDB(pdbId) {
    if (pdbCache[pdbId]) return pdbCache[pdbId];

    const url = `https://files.rcsb.org/download/${pdbId}.pdb`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.text();
      pdbCache[pdbId] = data;
      return data;
    } catch (err) {
      console.error(`Failed to fetch PDB ${pdbId}:`, err);
      return null;
    }
  }

  // Load and display a model
  async function loadModel(modelKey) {
    if (!viewer) return;

    const data = modelData[modelKey];
    if (!data) return;

    const loading = document.getElementById('model-loading');
    loading.classList.remove('hidden');

    const pdbData = await fetchPDB(data.pdbId);

    if (pdbData) {
      viewer.clear();
      viewer.addModel(pdbData, 'pdb');
      applyStyle(currentStyle);
      viewer.zoomTo();
      viewer.spin('y', 1); // slow auto-rotate
      viewer.render();
    }

    loading.classList.add('hidden');
    currentModel = modelKey;
  }

  // Apply visualization style
  function applyStyle(style) {
    if (!viewer) return;

    viewer.setStyle({}, {}); // Clear all styles

    switch (style) {
      case 'cartoon':
        viewer.setStyle({}, {
          cartoon: {
            color: 'spectrum',
            opacity: 0.95,
          }
        });
        break;
      case 'stick':
        viewer.setStyle({}, {
          stick: {
            colorscheme: 'Jmol',
            radius: 0.15,
          }
        });
        break;
      case 'sphere':
        viewer.setStyle({}, {
          sphere: {
            colorscheme: 'Jmol',
            scale: 0.3,
          }
        });
        break;
      case 'surface':
        viewer.setStyle({}, {
          cartoon: {
            color: 'spectrum',
            opacity: 0.4,
          }
        });
        viewer.addSurface($3Dmol.SurfaceType.VDW, {
          opacity: 0.75,
          colorscheme: 'greenCarbon',
        });
        break;
    }

    viewer.render();
    currentStyle = style;
  }

  // Tab switching
  const tabs = document.querySelectorAll('.models__tab');
  const infoPanels = document.querySelectorAll('.models__info-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const modelKey = tab.dataset.model;

      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update info panel
      infoPanels.forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`info-${modelKey}`);
      if (panel) panel.classList.add('active');

      // Load the 3D model
      loadModel(modelKey);
    });
  });

  // Style button switching
  const styleBtns = document.querySelectorAll('.models__style-btn');
  styleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      styleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyStyle(btn.dataset.style);
    });
  });

  // Initialize viewer when the section comes into view (lazy load)
  const modelsSection = document.getElementById('models');
  if (modelsSection) {
    const modelObs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        initViewer();
        modelObs.disconnect();
      }
    }, { threshold: 0.1 });
    modelObs.observe(modelsSection);
  }

});
