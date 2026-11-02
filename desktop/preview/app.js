// Toccata OS - Optimized High-Performance Desktop Engine
// Hardware-accelerated 120Hz/144Hz physics, bespoke cursor engine, and low-latency audio.

(function () {
  'use strict';

  let topZIndex = 100;
  let isSpotlightOpen = false;
  let isControlCenterOpen = false;
  let audioFeedbackEnabled = true;
  let touchRippleEnabled = true;
  let tiltEnabled = true;
  let customCursorEnabled = true;
  const IS_NATIVE_KIOSK = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // ==========================================================================
  // 1. HIGH-EFFICIENCY WEB AUDIO ENGINE (Zero Memory Leaks & Audio Limiter)
  // ==========================================================================
  let audioCtx = null;
  let masterGain = null;
  let idleTimer = null;
  let masterLimiter = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.08, audioCtx.currentTime);

        masterLimiter = audioCtx.createDynamicsCompressor();
        masterLimiter.threshold.setValueAtTime(-18, audioCtx.currentTime);
        masterLimiter.knee.setValueAtTime(12, audioCtx.currentTime);
        masterLimiter.ratio.setValueAtTime(8, audioCtx.currentTime);
        masterLimiter.attack.setValueAtTime(0.003, audioCtx.currentTime);
        masterLimiter.release.setValueAtTime(0.25, audioCtx.currentTime);

        masterGain.connect(masterLimiter);
        masterLimiter.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Auto-suspend after 12 seconds of inactivity to preserve CPU & battery
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    }, 12000);
  }

  function playHarmonicChime(frequencies = [440, 554.37, 659.25], duration = 0.38) {
    if (!audioFeedbackEnabled) return;
    try {
      initAudio();
      if (!audioCtx || !masterGain) return;

      const now = audioCtx.currentTime;
      const count = frequencies.length;

      frequencies.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        // Acoustic envelope: Fast attack, exponential decay
        const perVoiceGain = 1.0 / count;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(perVoiceGain, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + idx * 0.03);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration + idx * 0.03 + 0.04);
      });
    } catch (e) {
      // Audio autoplay gracefully suppressed until first user gesture
    }
  }
  window.playHarmonicChime = playHarmonicChime;

  function toggleAudioFeedback(enabled) {
    audioFeedbackEnabled = enabled;
    if (enabled) {
      playHarmonicChime([523.25, 659.25, 783.99]);
      triggerNotification('Acoustic Feedback Enabled');
    } else {
      triggerNotification('Acoustic Feedback Muted');
    }
  }
  window.toggleAudioFeedback = toggleAudioFeedback;

  document.getElementById('acoustic-sound-toggle')?.addEventListener('click', () => {
    audioFeedbackEnabled = !audioFeedbackEnabled;
    toggleAudioFeedback(audioFeedbackEnabled);
  });

  // ==========================================================================
  // 2. REALTIME CLOCK (Optimized 1000ms Interval)
  // ==========================================================================
  const clockEl = document.getElementById('clock-display');
  const clockOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  
  function updateClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleDateString('en-US', clockOptions).replace(/,/g, '');
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ==========================================================================
  // 3. WINDOW DOCK MAPPING & LIFE CYCLE
  // ==========================================================================
  const activeAppTitle = document.getElementById('active-app-title');

  const windowDockMap = {
    'win-cadence': document.querySelector('.dock-item[data-app="Finder"]'),
    'win-horizon': document.querySelector('.dock-item[data-app="Safari"]'),
    'win-messages': document.querySelector('.dock-item[data-app="Messages"]'),
    'win-mail': document.querySelector('.dock-item[data-app="Mail"]'),
    'win-scribe': document.querySelector('.dock-item[data-app="Notes"]'),
    'win-sonata': document.querySelector('.dock-item[data-app="Music"]'),
    'win-tempo': document.querySelector('.dock-item[data-app="Activity Monitor"]'),
    'win-console': document.querySelector('.dock-item[data-app="Terminal"]'),
    'win-calc': document.querySelector('.dock-item[data-app="Calculator"]'),
    'win-prism': document.querySelector('.dock-item[data-app="Prism"]'),
    'win-chronicle': document.querySelector('.dock-item[data-app="Chronicle"]'),
    'win-installer': document.querySelector('.dock-item[data-app="App Store"]'),
    'win-settings': document.querySelector('.dock-item[data-app="System Settings"]')
  };

  const windowDotMap = {
    'win-cadence': document.getElementById('dot-cadence'),
    'win-horizon': document.getElementById('dot-horizon'),
    'win-messages': document.getElementById('dot-messages'),
    'win-mail': document.getElementById('dot-mail'),
    'win-scribe': document.getElementById('dot-scribe'),
    'win-sonata': document.getElementById('dot-sonata'),
    'win-tempo': document.getElementById('dot-tempo'),
    'win-console': document.getElementById('dot-console'),
    'win-calc': document.getElementById('dot-calc'),
    'win-prism': document.getElementById('dot-prism'),
    'win-chronicle': document.getElementById('dot-chronicle'),
    'win-installer': document.getElementById('dot-installer'),
    'win-settings': document.getElementById('dot-settings')
  };

  function getActiveWindow() {
    return document.querySelector('.window.active-window:not(.hidden)');
  }

  const WINDOW_Z_MIN = 100;
  const WINDOW_Z_MAX = 850;

  function bringToFront(windowEl) {
    if (!windowEl) return;
    topZIndex += 1;
    if (topZIndex >= WINDOW_Z_MAX) {
      const windows = Array.from(document.querySelectorAll('.window'))
        .sort((a, b) => (parseInt(a.style.zIndex, 10) || WINDOW_Z_MIN) - (parseInt(b.style.zIndex, 10) || WINDOW_Z_MIN));
      windows.forEach((w, idx) => { w.style.zIndex = WINDOW_Z_MIN + idx; });
      topZIndex = WINDOW_Z_MIN + windows.length;
    }
    windowEl.style.zIndex = topZIndex;

    const windows = document.querySelectorAll('.window');
    for (let i = 0; i < windows.length; i++) {
      windows[i].classList.remove('active-window');
    }
    windowEl.classList.add('active-window');

    const titleEl = windowEl.querySelector('.window-title, .toolbar-title');
    if (titleEl && activeAppTitle) {
      const clone = titleEl.cloneNode(true);
      clone.querySelectorAll('.proxy-icon, svg').forEach(el => el.remove());
      const rawTitle = (clone.textContent || '').replace(/^[^\wA-Za-z]+/, '').trim();
      const appName = rawTitle.includes('—') ? rawTitle.split('—')[0].trim() : rawTitle.trim();
      if (appName) {
        activeAppTitle.textContent = appName === 'Cadence' ? 'Finder' : appName;
      }
    }
  }
  window.bringToFront = bringToFront;

  function triggerDockBounce(dockItem) {
    if (!dockItem) return;
    const icon = dockItem.querySelector('.mac-dock-svg, .mac-app-icon');
    if (!icon) return;
    icon.classList.remove('dock-bounce-icon');
    void icon.offsetWidth; // Force reflow to immediately restart animation
    icon.classList.add('dock-bounce-icon');
    setTimeout(() => {
      icon.classList.remove('dock-bounce-icon');
    }, 650);
  }

  function clampSingleWindowToViewport(win) {
    if (!win || win.dataset.maximized === 'true') return;
    const maxTop = window.innerHeight - 85;
    const maxLeft = window.innerWidth - 10;
    const isCalc = win.classList.contains('calc-window');
    const w = isCalc ? Math.min(win.offsetWidth || 280, 320) : Math.min(win.offsetWidth || 600, window.innerWidth - 20);
    const h = isCalc ? Math.min(win.offsetHeight || 420, 480) : Math.min(win.offsetHeight || 400, window.innerHeight - 120);
    const curLeft = parseInt(win.style.left, 10) || win.offsetLeft;
    const curTop = parseInt(win.style.top, 10) || win.offsetTop;
    win.style.left = `${Math.max(10, Math.min(curLeft, Math.max(10, maxLeft - w)))}px`;
    win.style.top = `${Math.max(34, Math.min(curTop, Math.max(34, maxTop - h)))}px`;
  }

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    clampSingleWindowToViewport(win);
    const dockItem = windowDockMap[id];
    triggerDockBounce(dockItem);

    const dot = windowDotMap[id];
    if (dot) dot.classList.remove('hidden');

    // Case A: Window was minimized -> Restore smoothly from dock item
    if (win.dataset.minimized === 'true') {
      let fromX = 0, fromY = 320;
      if (dockItem) {
        const dockRect = dockItem.getBoundingClientRect();
        const winLeft = parseInt(win.style.left, 10) || win.offsetLeft;
        const winTop = parseInt(win.style.top, 10) || win.offsetTop;
        const winW = win.offsetWidth || 600;
        const winH = win.offsetHeight || 400;
        fromX = (dockRect.left + dockRect.width / 2) - (winLeft + winW / 2);
        fromY = (dockRect.top + dockRect.height / 2) - (winTop + winH / 2);
      }

      win.style.transition = 'none';
      win.style.transform = `translate3d(${fromX}px, ${fromY}px, 0) scale(0.06)`;
      win.style.opacity = '0';
      win.style.filter = 'blur(8px)';
      win.classList.remove('hidden');
      void win.offsetWidth; // Force layout

      win.style.transition = 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), filter 0.28s ease';
      win.style.transform = 'translate3d(0, 0, 0) scale(1)';
      win.style.opacity = '1';
      win.style.filter = 'blur(0px)';
      win.dataset.minimized = 'false';

      setTimeout(() => {
        win.style.transition = '';
        win.style.transform = '';
        win.style.opacity = '';
        win.style.filter = '';
      }, 340);

      if (id === 'win-horizon') {
      if (window.initHorizonTabBar) window.initHorizonTabBar();
      const page = document.getElementById('horizon-page-content');
      if (page && (!page.innerHTML || page.innerHTML.trim() === '')) {
        if (window.navigateHorizon) window.navigateHorizon('https://www.google.com');
      }
    }
    bringToFront(win);
      return;
    }

    // Case B: Window was closed -> Spring pop in from center
    if (win.classList.contains('hidden')) {
      win.style.transition = 'none';
      win.style.transform = 'scale(0.88) translateY(18px)';
      win.style.opacity = '0';
      win.style.filter = 'blur(10px)';
      win.classList.remove('hidden');
      void win.offsetWidth; // Force layout

      win.style.transition = 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease, filter 0.25s ease';
      win.style.transform = 'scale(1) translateY(0)';
      win.style.opacity = '1';
      win.style.filter = 'blur(0px)';
      win.dataset.minimized = 'false';

      setTimeout(() => {
        win.style.transition = '';
        win.style.transform = '';
        win.style.opacity = '';
        win.style.filter = '';
      }, 300);

      bringToFront(win);
      return;
    }

    // Case C: Already open -> Bring to front with focus pulse
    bringToFront(win);
  }
  window.openWindow = openWindow;

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win || win.classList.contains('hidden')) return;

    win.style.transition = 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease, filter 0.18s ease';
    win.style.transform = 'scale(0.92) translateY(12px)';
    win.style.opacity = '0';
    win.style.filter = 'blur(6px)';

    setTimeout(() => {
      win.classList.add('hidden');
      win.dataset.minimized = 'false';
      win.style.transition = '';
      win.style.transform = '';
      win.style.opacity = '';
      win.style.filter = '';

      const dot = windowDotMap[id];
      if (dot) dot.classList.add('hidden');

      if (win.dataset.maximized === 'true') {
        win.classList.remove('is-maximized');
        win.dataset.maximized = 'false';
        const otherMax = document.querySelector('.window.is-maximized:not(.hidden)');
        if (!otherMax) document.body.classList.remove('has-fullscreen-window', 'dock-peek');
      }

      // Re-assign active window title
      const visibleWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
      if (visibleWindows.length > 0) {
        visibleWindows.sort((a, b) => (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0));
        bringToFront(visibleWindows[0]);
      } else if (activeAppTitle) {
        activeAppTitle.textContent = 'Finder';
      }
    }, 180);
  }
  window.closeWindow = closeWindow;

  function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (!win || win.classList.contains('hidden') || win.dataset.minimized === 'true') return;

    const dockItem = windowDockMap[id];
    let toX = 0, toY = 400;
    if (dockItem) {
      const dockRect = dockItem.getBoundingClientRect();
      const winRect = win.getBoundingClientRect();
      toX = (dockRect.left + dockRect.width / 2) - (winRect.left + winRect.width / 2);
      toY = (dockRect.top + dockRect.height / 2) - (winRect.top + winRect.height / 2);
    }

    win.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.28s ease, filter 0.28s ease';
    win.style.transform = `translate3d(${toX}px, ${toY}px, 0) scale(0.06)`;
    win.style.opacity = '0';
    win.style.filter = 'blur(6px)';

    setTimeout(() => {
      win.classList.add('hidden');
      win.dataset.minimized = 'true';
      win.style.transition = '';
      win.style.transform = '';
      win.style.opacity = '';
      win.style.filter = '';

      if (dockItem) {
        dockItem.classList.add('dock-absorbed');
        setTimeout(() => dockItem.classList.remove('dock-absorbed'), 350);
      }

      if (win.dataset.maximized === 'true') {
        const otherMax = Array.from(document.querySelectorAll('.window.is-maximized:not(.hidden)')).filter(w => w !== win);
        if (otherMax.length === 0) document.body.classList.remove('has-fullscreen-window', 'dock-peek');
      }

      // Re-assign active window title
      const visibleWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
      if (visibleWindows.length > 0) {
        visibleWindows.sort((a, b) => (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0));
        bringToFront(visibleWindows[0]);
      } else if (activeAppTitle) {
        activeAppTitle.textContent = 'Finder';
      }
    }, 300);
  }
  window.minimizeWindow = minimizeWindow;

  function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (!win || win.classList.contains('calc-window')) return;

    win.style.transition = 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1), left 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.25s ease';

    if (win.dataset.maximized === 'true') {
      // Exit Full Screen -> Restore to exact original floating window state
      win.classList.remove('is-maximized');
      win.dataset.maximized = 'false';

      const otherMax = Array.from(document.querySelectorAll('.window.is-maximized:not(.hidden)')).filter(w => w !== win);
      if (otherMax.length === 0) {
        document.body.classList.remove('has-fullscreen-window', 'dock-peek');
      }

      win.style.top = win.dataset.origTop || '56px';
      win.style.left = win.dataset.origLeft || 'calc(50% - 470px)';
      win.style.width = win.dataset.origWidth || '940px';
      win.style.height = win.dataset.origHeight || '580px';
      win.style.borderRadius = '18px';
      win.style.boxShadow = '';

      playHarmonicChime([480, 360], 0.16);
    } else {
      // Enter Full Screen -> 100vw x 100vh workspace fill, hide dock, square corners
      win.dataset.origTop = win.style.top || `${win.offsetTop}px`;
      win.dataset.origLeft = win.style.left || `${win.offsetLeft}px`;
      win.dataset.origWidth = win.style.width || `${win.offsetWidth}px`;
      win.dataset.origHeight = win.style.height || `${win.offsetHeight}px`;

      win.classList.add('is-maximized');
      win.dataset.maximized = 'true';
      document.body.classList.add('has-fullscreen-window');

      win.style.top = '28px';
      win.style.left = '0';
      win.style.width = '100vw';
      win.style.height = 'calc(100vh - 28px)';
      win.style.borderRadius = '0';
      win.style.boxShadow = 'none';

      bringToFront(win);
      playHarmonicChime([523.25, 659.25, 783.99], 0.18);
    }

    setTimeout(() => {
      win.style.transition = '';
    }, 280);
  }
  window.maximizeWindow = maximizeWindow;

  // Dynamic Dock Peek in macOS Full Screen Mode
  window.addEventListener('mousemove', (e) => {
    if (!document.body.classList.contains('has-fullscreen-window')) return;
    if (e.clientY >= window.innerHeight - 15) {
      document.body.classList.add('dock-peek');
    } else if (e.clientY < window.innerHeight - 85) {
      document.body.classList.remove('dock-peek');
    }
  });

  // ==========================================================================
  // ==========================================================================
  // 4. CENTRALIZED HIGH-PERFORMANCE WINDOW DRAG & RESIZE ENGINE (Single Loop)
  // ==========================================================================
  let activeDragWin = null;
  let dragStartX = 0, dragStartY = 0;
  let dragInitLeft = 0, dragInitTop = 0;
  let dragCurX = 0, dragCurY = 0;
  let dragLastX = 0, dragSmoothedVx = 0;
  let dragRafId = null;

  let activeResizeWin = null;
  let resizeStartX = 0, resizeStartY = 0;
  let resizeStartW = 0, resizeStartH = 0;
  let resizeCurW = 0, resizeCurH = 0;
  let resizeHandleType = ''; // 'r', 'b', 'rb'
  let resizeRafId = null;

  function updateDragFrame() {
    if (!activeDragWin) return;
    activeDragWin.style.left = `${dragCurX}px`;
    activeDragWin.style.top = `${dragCurY}px`;
    if (tiltEnabled) {
      const tilt = Math.max(-2.5, Math.min(2.5, dragSmoothedVx * 0.16));
      activeDragWin.style.transform = `translate3d(0, 0, 0) rotate(${tilt}deg) scale(1.008)`;
    }
    dragRafId = null;
  }

  function updateResizeFrame() {
    if (!activeResizeWin) return;
    if (resizeHandleType.includes('r')) activeResizeWin.style.width = `${resizeCurW}px`;
    if (resizeHandleType.includes('b')) activeResizeWin.style.height = `${resizeCurH}px`;
    resizeRafId = null;
  }

  let pendingSnapZone = null; // 'left', 'right', 'max', or null
  const snapPreviewEl = document.getElementById('snap-preview-overlay');

  function updateSnapPreview(clientX, clientY) {
    if (!snapPreviewEl) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (clientX <= 22) {
      pendingSnapZone = 'left';
      snapPreviewEl.style.top = '34px';
      snapPreviewEl.style.left = '6px';
      snapPreviewEl.style.width = `${Math.floor(vw / 2) - 10}px`;
      snapPreviewEl.style.height = `${vh - 116}px`;
      snapPreviewEl.classList.remove('hidden');
    } else if (clientX >= vw - 22) {
      pendingSnapZone = 'right';
      snapPreviewEl.style.top = '34px';
      snapPreviewEl.style.left = `${Math.floor(vw / 2) + 4}px`;
      snapPreviewEl.style.width = `${Math.floor(vw / 2) - 10}px`;
      snapPreviewEl.style.height = `${vh - 116}px`;
      snapPreviewEl.classList.remove('hidden');
    } else if (clientY <= 32) {
      pendingSnapZone = 'max';
      snapPreviewEl.style.top = '32px';
      snapPreviewEl.style.left = '6px';
      snapPreviewEl.style.width = `${vw - 12}px`;
      snapPreviewEl.style.height = `${vh - 112}px`;
      snapPreviewEl.classList.remove('hidden');
    } else {
      pendingSnapZone = null;
      snapPreviewEl.classList.add('hidden');
    }
  }

  function applyWindowSnap(win, zone) {
    if (!win || !zone || win.classList.contains('calc-window')) return;
    if (!win.dataset.origWidth) {
      win.dataset.origTop = win.style.top || `${win.offsetTop}px`;
      win.dataset.origLeft = win.style.left || `${win.offsetLeft}px`;
      win.dataset.origWidth = win.style.width || `${win.offsetWidth}px`;
      win.dataset.origHeight = win.style.height || `${win.offsetHeight}px`;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    win.style.transition = 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
    if (zone === 'left') {
      win.style.top = '34px';
      win.style.left = '6px';
      win.style.width = `${Math.floor(vw / 2) - 9}px`;
      win.style.height = `${vh - 116}px`;
      win.style.borderRadius = '10px';
      win.dataset.maximized = 'false';
      triggerNotification('Window tiled to Left Half');
    } else if (zone === 'right') {
      win.style.top = '34px';
      win.style.left = `${Math.floor(vw / 2) + 3}px`;
      win.style.width = `${Math.floor(vw / 2) - 9}px`;
      win.style.height = `${vh - 116}px`;
      win.style.borderRadius = '10px';
      win.dataset.maximized = 'false';
      triggerNotification('Window tiled to Right Half');
    } else if (zone === 'max') {
      maximizeWindow(win.id);
    }
    playHarmonicChime([523.25, 659.25], 0.16);
    setTimeout(() => { win.style.transition = ''; }, 240);
  }

  // Single global pointermove & pointerup listener for the entire desktop
  window.addEventListener('pointermove', (e) => {
    if (activeDragWin) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const instantVx = e.clientX - dragLastX;
      dragLastX = e.clientX;
      dragSmoothedVx = dragSmoothedVx * 0.65 + instantVx * 0.35;

      const winW = activeDragWin.offsetWidth || 600;
      const winH = activeDragWin.offsetHeight || 400;
      const minTop = 28; // Menu bar clearance
      const maxTop = Math.max(minTop, window.innerHeight - 85 - 40); // 85px dock zone + 40px minimum titlebar visibility
      const minLeft = 10;
      const maxLeft = Math.max(minLeft, window.innerWidth - winW - 10);

      dragCurX = Math.max(minLeft, Math.min(dragInitLeft + dx, maxLeft));
      dragCurY = Math.max(minTop, Math.min(dragInitTop + dy, maxTop));

      updateSnapPreview(e.clientX, e.clientY);

      if (!dragRafId) {
        dragRafId = requestAnimationFrame(updateDragFrame);
      }
    } else if (activeResizeWin) {
      const isCalc = activeResizeWin.classList.contains('calc-window');
      const minW = isCalc ? 260 : 480;
      const maxW = isCalc ? 320 : Math.floor(window.innerWidth * 0.96);
      const minH = isCalc ? 390 : 320;
      const maxH = isCalc ? 480 : (window.innerHeight - 100);

      const winLeft = activeResizeWin.offsetLeft;
      const winTop = activeResizeWin.offsetTop;
      const maxAllowedW = Math.min(maxW, window.innerWidth - winLeft - 10);
      const maxAllowedH = Math.min(maxH, window.innerHeight - winTop - 85);

      if (resizeHandleType.includes('r')) {
        resizeCurW = Math.max(minW, Math.min(maxAllowedW, resizeStartW + (e.clientX - resizeStartX)));
      }
      if (resizeHandleType.includes('b')) {
        resizeCurH = Math.max(minH, Math.min(maxAllowedH, resizeStartH + (e.clientY - resizeStartY)));
      }

      if (!resizeRafId) {
        resizeRafId = requestAnimationFrame(updateResizeFrame);
      }
    }
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    if (activeDragWin) {
      const win = activeDragWin;
      activeDragWin = null;
      document.body.classList.remove('is-window-dragging');
      win.classList.remove('is-dragging');
      win.style.willChange = '';
      if (dragRafId) {
        cancelAnimationFrame(dragRafId);
        dragRafId = null;
      }

      if (pendingSnapZone) {
        const zone = pendingSnapZone;
        pendingSnapZone = null;
        snapPreviewEl?.classList.add('hidden');
        applyWindowSnap(win, zone);
      }

      win.style.transition = 'transform 0.24s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      win.style.transform = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
      setTimeout(() => {
        if (!activeDragWin) {
          win.style.transition = '';
          win.style.transform = '';
        }
      }, 250);
    }

    if (activeResizeWin) {
      activeResizeWin.style.willChange = '';
      activeResizeWin = null;
      if (resizeRafId) {
        cancelAnimationFrame(resizeRafId);
        resizeRafId = null;
      }
    }
  });

  document.querySelectorAll('.window').forEach(win => {
    const titlebar = win.querySelector('.window-titlebar');
    if (!titlebar) return;

    win.addEventListener('pointerdown', () => bringToFront(win), { passive: true });

    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('tl-btn')) return;
      maximizeWindow(win.id);
    });

    titlebar.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('tl-btn')) return;
      if (win.dataset.maximized === 'true') return;

      activeDragWin = win;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragLastX = e.clientX;
      dragSmoothedVx = 0;
      dragInitLeft = win.offsetLeft;
      dragInitTop = win.offsetTop;
      dragCurX = dragInitLeft;
      dragCurY = dragInitTop;

      bringToFront(win);
      document.body.classList.add('is-window-dragging');
      win.classList.add('is-dragging');
      win.style.willChange = 'left, top, transform';
    });

    // Wire resizers with zero redundant listeners
    ['r', 'b', 'rb'].forEach(type => {
      const handle = win.querySelector(`.window-resizer-${type}`);
      if (handle) {
        handle.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          e.preventDefault();
          activeResizeWin = win;
          resizeHandleType = type;
          resizeStartX = e.clientX;
          resizeStartY = e.clientY;
          resizeStartW = win.offsetWidth;
          resizeStartH = win.offsetHeight;
          resizeCurW = resizeStartW;
          resizeCurH = resizeStartH;
          bringToFront(win);
          win.style.willChange = 'width, height';
        });
      }
    });
  });

  // ==========================================================================
  // 6. CACHED ZERO-THRASHING DOCK MAGNIFICATION (Continuous Parabolic Fisheye)
  // ==========================================================================
  const dock = document.getElementById('dock');
  const dockItems = Array.from(document.querySelectorAll('.dock-item'));
  let cachedItemMetrics = [];
  let dockRafId = null;
  let dockMagnificationEnabled = true;

  function cacheDockMetrics() {
    cachedItemMetrics = dockItems.map(item => {
      const rect = item.getBoundingClientRect();
      return { el: item, centerX: rect.left + rect.width / 2 };
    });
  }

  function clampAllWindowsToViewport() {
    document.querySelectorAll('.window:not(.hidden)').forEach(win => {
      clampSingleWindowToViewport(win);
    });
  }

  window.addEventListener('resize', () => {
    cacheDockMetrics();
    clampAllWindowsToViewport();
  }, { passive: true });
  dock?.addEventListener('mouseenter', cacheDockMetrics, { passive: true });

  dock?.addEventListener('mousemove', (e) => {
    if (!dockMagnificationEnabled) return;
    if (dockRafId) return;

    dockRafId = requestAnimationFrame(() => {
      const mouseX = e.clientX;
      const radius = 130;

      for (let i = 0; i < cachedItemMetrics.length; i++) {
        const item = cachedItemMetrics[i];
        const distance = Math.abs(mouseX - item.centerX);

        if (distance < radius) {
          const factor = Math.cos((distance / radius) * (Math.PI / 2));
          const scale = 1 + 0.38 * factor;
          const translateY = -14 * factor;
          item.el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
        } else {
          item.el.style.transform = '';
        }
      }
      dockRafId = null;
    });
  }, { passive: true });

  dock?.addEventListener('mouseleave', () => {
    if (dockRafId) {
      cancelAnimationFrame(dockRafId);
      dockRafId = null;
    }
    for (let i = 0; i < dockItems.length; i++) {
      dockItems[i].style.transform = '';
    }
  });

  // ==========================================================================
  // 7. ACOUSTIC TOUCH RESONANCE RIPPLE ("TO TOUCH")
  // ==========================================================================
  document.addEventListener('pointerdown', (e) => {
    if (!touchRippleEnabled) return;
    // Don't spawn on top menu bar, dock, window titlebars, or resizers
    if (
      e.target.closest('#menu-bar') ||
      e.target.closest('#dock') ||
      e.target.closest('.window-titlebar') ||
      e.target.closest('.window-resizer')
    ) return;

    const ripple = document.createElement('div');
    ripple.className = 'acoustic-touch-ripple';
    ripple.style.left = `${e.clientX}px`;
    ripple.style.top = `${e.clientY}px`;
    document.body.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 380);
  }, { passive: true });

  function toggleTouchRipple(enabled) {
    touchRippleEnabled = enabled;
    triggerNotification(enabled ? 'Acoustic Touch Feedback Enabled' : 'Touch Feedback Disabled');
  }
  window.toggleTouchRipple = toggleTouchRipple;

  function toggleTilt(enabled) {
    tiltEnabled = enabled;
    triggerNotification(enabled ? 'Window Inertial Tilt Enabled' : 'Inertial Tilt Disabled');
  }
  window.toggleTilt = toggleTilt;

  function toggleCustomCursor(enabled) {
    customCursorEnabled = enabled;
    if (enabled) {
      document.body.style.cursor = '';
      triggerNotification('Toccata Signature Cursors Active');
    } else {
      document.body.style.cursor = 'auto';
      triggerNotification('Default Native Cursors Active');
    }
  }
  window.toggleCustomCursor = toggleCustomCursor;

  // ==========================================================================
  // 8. SPOTLIGHT SEARCH (Debounced Math & Instant Keyboard Navigation)
  // ==========================================================================
  const spotlightOverlay = document.getElementById('spotlight-overlay');
  const spotlightInput = document.getElementById('spotlight-input');
  const spotlightResults = document.getElementById('spotlight-results');

  function toggleSpotlight() {
    isSpotlightOpen = !isSpotlightOpen;
    if (isSpotlightOpen) {
      playHarmonicChime([659.25, 783.99]);
      spotlightOverlay.classList.remove('hidden');
      spotlightInput.value = '';
      renderSpotlightDefault();
      requestAnimationFrame(() => spotlightInput.focus());
    } else {
      spotlightOverlay.classList.add('hidden');
    }
  }
  window.toggleSpotlight = toggleSpotlight;

  document.getElementById('spotlight-btn')?.addEventListener('click', toggleSpotlight);

  function renderSpotlightDefault() {
    spotlightResults.innerHTML = `
      <div class="result-item" onclick="openWindow('win-cadence'); toggleSpotlight();">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> <span>Cadence (Files & Workspaces)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-scribe'); toggleSpotlight();">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> <span>Scribe (Notes & Code)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-tempo'); toggleSpotlight();">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#30d158" stroke-width="2.5" style="margin-right: 10px;"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> <span>Tempo (Activity Monitor)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-settings'); toggleSpotlight();">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> <span>System Settings</span>
      </div>
      <div class="result-item" onclick="openWindow('win-installer'); toggleSpotlight();">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> <span>Gallery & Installer</span>
      </div>
    `;
  }

  // Safe and ultra-fast math calculator parser
  function evaluateMath(expression) {
    if (!/^[0-9+\-*/().^\s]+$/.test(expression)) return null;
    try {
      const fn = new Function(`"use strict"; return (${expression})`);
      const val = fn();
      return (typeof val === 'number' && !isNaN(val) && isFinite(val)) ? val : null;
    } catch {
      return null;
    }
  }

  spotlightInput?.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (!query) {
      renderSpotlightDefault();
      return;
    }

    const mathResult = evaluateMath(query);
    if (mathResult !== null) {
      spotlightResults.innerHTML = `
        <div class="result-item selected">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><circle cx="8" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="11" r="1" fill="currentColor"/><circle cx="16" cy="11" r="1" fill="currentColor"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="12" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="15" r="1" fill="currentColor"/><circle cx="8" cy="19" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/><circle cx="16" cy="19" r="1" fill="currentColor"/></svg>
          <div style="font-size: 20px; font-weight: 700;">= ${mathResult.toLocaleString()}</div>
        </div>
      `;
      return;
    }

    const lowerQ = query.toLowerCase();

    // Windows Commands & Muscle Memory Intelligent Bridge
    const winCommands = [
      { cmd: 'ipconfig', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`, title: 'ipconfig — 192.168.1.145 (Toccata-5G Fiber)', action: "triggerNotification('IP: 192.168.1.145 • Gateway: 192.168.1.1 • DNS: 1.1.1.1'); toggleSpotlight();" },
      { cmd: 'taskmgr', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#30d158" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, title: 'Task Manager → Tempo Activity Monitor', action: "openWindow('win-tempo'); toggleSpotlight();" },
      { cmd: 'tasklist', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#30d158" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, title: 'tasklist → Tempo Activity Monitor', action: "openWindow('win-tempo'); toggleSpotlight();" },
      { cmd: 'explorer', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`, title: 'File Explorer → Cadence Files', action: "openWindow('win-cadence'); toggleSpotlight();" },
      { cmd: 'dir', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`, title: 'dir / ls → Cadence File System', action: "openWindow('win-cadence'); toggleSpotlight();" },
      { cmd: 'notepad', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`, title: 'Notepad → Scribe Prose Canvas', action: "openWindow('win-scribe'); toggleSpotlight();" },
      { cmd: 'control', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`, title: 'Control Panel → System Settings', action: "openWindow('win-settings'); toggleSpotlight();" },
      { cmd: 'winget', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`, title: 'winget install → Gallery & Installer Sheet', action: "openWindow('win-installer'); toggleSpotlight();" },
      { cmd: 'systeminfo', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`, title: 'systeminfo → Toccata OS (6.11 XanMod • 120Hz Wayland)', action: "triggerNotification('Toccata OS 1.0 • 800MB Idle RAM • PipeWire 0.7ms'); toggleSpotlight();" }
    ];

    const winMatch = winCommands.find(w => w.cmd.startsWith(lowerQ) || lowerQ.startsWith(w.cmd));
    if (winMatch) {
      spotlightResults.innerHTML = `
        <div class="result-item selected" onclick="${winMatch.action}">
          <span style="display: inline-flex; align-items: center; margin-right: 10px;">${winMatch.icon}</span>
          <div>
            <div style="font-weight: 700; font-size: 15px;">${winMatch.title}</div>
            <div style="font-size: 11px; opacity: 0.75;">Windows Command Bridge • Instant Zero-Terminal Execution</div>
          </div>
        </div>
      `;
      return;
    }

    const appIndex = [
      { name: 'Cadence (Files & Explorer)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`, id: 'win-cadence' },
      { name: 'Horizon (Sovereign Web Browser)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`, id: 'win-horizon' },
      { name: 'Scribe (Notes & Code Canvas)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`, id: 'win-scribe' },
      { name: 'Sonata (Lossless Hi-Fi & PipeWire Player)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`, id: 'win-sonata' },
      { name: 'Tempo (Task Manager & Activity Monitor)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#30d158" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`, id: 'win-tempo' },
      { name: 'Console (Terminal & Command Bridge)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>`, id: 'win-console' },
      { name: 'Calculator (Solfege Precision)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><circle cx="8" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="11" r="1" fill="currentColor"/><circle cx="16" cy="11" r="1" fill="currentColor"/><circle cx="8" cy="15" r="1" fill="currentColor"/><circle cx="12" cy="15" r="1" fill="currentColor"/><circle cx="16" cy="15" r="1" fill="currentColor"/><circle cx="8" cy="19" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/><circle cx="16" cy="19" r="1" fill="currentColor"/></svg>`, id: 'win-calc' },
      { name: 'Prism (Photos & Vector Inspector)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`, id: 'win-prism' },
      { name: 'Chronicle (Calendar & Focus Clock)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`, id: 'win-chronicle' },
      { name: 'Gallery & Installer (App Store & winget)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`, id: 'win-installer' },
      { name: 'System Settings (Control Panel)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`, id: 'win-settings' },
      { name: 'Reminders (pearOS Tasks & To-Do)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2"/><line x1="12" y1="6" x2="20" y2="6"/><circle cx="6" cy="12" r="2"/><line x1="12" y1="12" x2="20" y2="12"/><circle cx="6" cy="18" r="2"/><line x1="12" y1="18" x2="20" y2="18"/></svg>`, id: 'win-todo' },
      { name: 'Contacts (pearOS Address Book)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a6 6 0 0 1 12 0v2"/></svg>`, id: 'win-contacts' },
      { name: 'Zorin Connect (Mobile Phone Bridge)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`, id: 'win-connect' },
      { name: 'Welcome Tour (Toccata & Zorin Guide)', icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`, id: 'win-tour' }
    ];

    const matches = appIndex.filter(a => a.name.toLowerCase().includes(lowerQ));

    if (matches.length > 0) {
      spotlightResults.innerHTML = matches.map(m => `
        <div class="result-item" onclick="openWindow('${m.id}'); toggleSpotlight();">
          <span style="display: inline-flex; align-items: center; margin-right: 10px;">${m.icon}</span> <span>${m.name}</span>
        </div>
      `).join('');
    } else {
      spotlightResults.innerHTML = `
        <div style="padding: 14px; color: var(--text-secondary); font-size: 13px;">
          Search web, files, or Windows command for "${query}"
        </div>
      `;
    }
  });

  spotlightOverlay?.addEventListener('click', (e) => {
    if (e.target === spotlightOverlay) toggleSpotlight();
  });

  // ==========================================================================
  // 9. KEYBOARD SHORTCUTS SUITE (macOS Ergonomics)
  // ==========================================================================
  document.addEventListener('keydown', (e) => {
    const isCmd = e.metaKey || e.ctrlKey;
    const tag = (e.target.tagName || '').toUpperCase();
    const isEditable = e.target.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    // Cmd + Space: Toggle Spotlight
    if (isCmd && e.code === 'Space') {
      e.preventDefault();
      toggleSpotlight();
      return;
    }

    // Spacebar: Quick Look Toggle (Only when not actively typing in an input/textarea)
    if (e.code === 'Space' && !isCmd && !isEditable) {
      e.preventDefault();
      const ql = document.getElementById('quick-look-modal');
      if (ql && !ql.classList.contains('hidden')) {
        closeQuickLook();
      } else {
        openQuickLook();
      }
      return;
    }

    // Escape: Close Overlays & Sheets
    if (e.code === 'Escape') {
      const ql = document.getElementById('quick-look-modal');
      if (ql && !ql.classList.contains('hidden')) {
        closeQuickLook();
        return;
      }
      const shutModal = document.getElementById('shutdown-modal');
      if (shutModal && !shutModal.classList.contains('hidden')) {
        closeShutdownModal();
        return;
      }
      const fqSheet = document.getElementById('tempo-force-quit-sheet');
      if (fqSheet && !fqSheet.classList.contains('hidden')) {
        cancelForceQuit();
        return;
      }
      const lp = document.getElementById('launchpad-overlay');
      if (lp && !lp.classList.contains('hidden')) {
        closeLaunchpad();
        return;
      }
      const startMenu = document.getElementById('zorin-start-menu');
      if (startMenu && !startMenu.classList.contains('hidden')) {
        closeZorinStartMenu();
        return;
      }
      if (isToccataMenuOpen) closeToccataMenu();
      if (isSpotlightOpen) toggleSpotlight();
      if (isControlCenterOpen) {
        isControlCenterOpen = false;
        document.getElementById('control-center')?.classList.add('hidden');
      }
      return;
    }

    // Cmd + B / Cmd + I in Scribe Editor
    if (isCmd && (e.key === 'b' || e.key === 'B') && isEditable && e.target.id === 'scribe-input') {
      e.preventDefault();
      insertScribeFormat('**');
      return;
    }
    if (isCmd && (e.key === 'i' || e.key === 'I') && isEditable && e.target.id === 'scribe-input') {
      e.preventDefault();
      insertScribeFormat('*');
      return;
    }

    // Ctrl + Shift + Shortcuts (Go Menu & System Actions)
    if (isCmd && e.shiftKey) {
      const k = e.key.toUpperCase();
      if (k === 'A') { e.preventDefault(); openWindow('win-cadence'); switchCadenceFolder('apps'); return; }
      if (k === 'O') { e.preventDefault(); openWindow('win-cadence'); switchCadenceFolder('docs'); return; }
      if (k === 'C') { e.preventDefault(); openWindow('win-cadence'); switchCadenceFolder('disk'); return; }
      if (k === 'T') { e.preventDefault(); openWindow('win-cadence'); switchCadenceFolder('trash'); return; }
      if (k === 'U') { e.preventDefault(); openWindow('win-console'); return; }
      if (k === 'N') { e.preventDefault(); createNewCadenceFolder(); return; }
      if (k === 'D') { e.preventDefault(); toggleTheme(); return; }
    }

    if (isCmd && !e.shiftKey && !isEditable) {
      const k = e.key.toUpperCase();
      if (k === 'J') { e.preventDefault(); openWindow('win-cadence'); switchCadenceFolder('downloads'); return; }
      if (k === '1') { e.preventDefault(); openWindow('win-cadence'); setCadenceViewMode('grid'); return; }
      if (k === '2') { e.preventDefault(); openWindow('win-cadence'); setCadenceViewMode('list'); return; }
      if (k === 'F') { e.preventDefault(); toggleSpotlight(); return; }
    }

    if (e.code === 'Delete' && !isEditable) {
      e.preventDefault();
      moveSelectedToTrash();
      return;
    }

    // Ctrl + W / Alt + F4: Close Active Window
    if (isCmd && (e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      const active = getActiveWindow();
      if (active) closeWindow(active.id);
      return;
    }

    // Cmd + M: Minimize Active Window
    if (isCmd && (e.key === 'm' || e.key === 'M')) {
      e.preventDefault();
      const active = getActiveWindow();
      if (active) minimizeWindow(active.id);
      return;
    }

    // Solfege Calculator Global / Focused Keyboard Routing
    const activeWin = getActiveWindow();
    if (activeWin && activeWin.id === 'win-calc' && !isEditable) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        calcAction('num', e.key);
        return;
      }
      if (e.key === '.') {
        e.preventDefault();
        calcAction('dot');
        return;
      }
      if (['+', '-', '*', '/'].includes(e.key)) {
        e.preventDefault();
        calcAction('op', e.key);
        return;
      }
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calcAction('equals');
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        calcBackspace();
        return;
      }
      if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        calcAction('clear');
        return;
      }
      if (e.key === '%') {
        e.preventDefault();
        calcAction('percent');
        return;
      }
    }
  });

  // ==========================================================================
  // 9B. TOCCATA APPLE-STYLE SYSTEM MENU & SHUTDOWN ENGINE
  // ==========================================================================
  let isToccataMenuOpen = false;
  const toccataSystemMenu = document.getElementById('toccata-system-menu');

  function toggleToccataMenu() {
    isToccataMenuOpen = !isToccataMenuOpen;
    toccataSystemMenu?.classList.toggle('hidden', !isToccataMenuOpen);
    if (isToccataMenuOpen) {
      playHarmonicChime([523.25], 0.12);
    }
  }
  window.toggleToccataMenu = toggleToccataMenu;

  function closeToccataMenu() {
    isToccataMenuOpen = false;
    toccataSystemMenu?.classList.add('hidden');
  }
  window.closeToccataMenu = closeToccataMenu;

  document.addEventListener('pointerdown', (e) => {
    if (isToccataMenuOpen && !e.target.closest('#toccata-menu-btn') && !e.target.closest('#toccata-system-menu')) {
      closeToccataMenu();
    }
  });

  function promptShutdown() {
    const modal = document.getElementById('shutdown-modal');
    modal?.classList.remove('hidden');
    playHarmonicChime([392, 330, 261.63], 0.3);
  }
  window.promptShutdown = promptShutdown;

  function closeShutdownModal() {
    document.getElementById('shutdown-modal')?.classList.add('hidden');
    playHarmonicChime([440], 0.1);
  }
  window.closeShutdownModal = closeShutdownModal;

  function exitToWindows() {
    playHarmonicChime([440, 330, 220, 164.81], 0.6);
    triggerNotification('Shutting down Toccata OS...');
    if (IS_NATIVE_KIOSK) {
      fetch('/api/system/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'shutdown' })
      }).catch(() => {});
    }
    setTimeout(() => {
      window.close();
      // Graceful fallback if browser restricts script close
      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#09090b;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;user-select:none;">
          <img src="favicon.svg" alt="Toccata OS Logo" style="width:68px;height:68px;border-radius:16px;margin-bottom:18px;box-shadow:0 8px 24px rgba(0,122,255,0.4);">
          <h2 style="color:white;font-size:24px;margin-bottom:8px;font-weight:700;">Toccata OS Terminated</h2>
          <p style="font-size:14px;max-width:400px;line-height:1.6;margin-bottom:24px;color:#71717a;">
            The sovereign session has stopped. Safe to power off hardware or exit VM.
          </p>
          <button onclick="location.reload()" style="background:#007aff;color:white;border:none;padding:10px 22px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,122,255,0.4);">Restart Desktop</button>
        </div>
      `;
    }, 350);
  }
  window.exitToWindows = exitToWindows;

  function restartSystem() {
    playHarmonicChime([330, 440, 554.37], 0.4);
    triggerNotification('Rebooting Toccata OS...');
    if (IS_NATIVE_KIOSK) {
      fetch('/api/system/power', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restart' })
      }).catch(() => {});
    }
    setTimeout(() => { location.reload(); }, 350);
  }
  window.restartSystem = restartSystem;

  function toggleSleepMode() {
    const overlay = document.getElementById('sleep-overlay');
    overlay?.classList.remove('hidden');
    playHarmonicChime([330, 220], 0.4);
  }
  window.toggleSleepMode = toggleSleepMode;

  function wakeFromSleep() {
    const overlay = document.getElementById('sleep-overlay');
    overlay?.classList.add('hidden');
    playHarmonicChime([440, 554.37, 659.25], 0.3);
  }
  window.wakeFromSleep = wakeFromSleep;

  // ==========================================================================
  // 10. CONTROL CENTER POPUP
  // ==========================================================================
  const controlCenter = document.getElementById('control-center');
  document.getElementById('control-center-btn')?.addEventListener('click', () => {
    isControlCenterOpen = !isControlCenterOpen;
    playHarmonicChime([523.25]);
    controlCenter?.classList.toggle('hidden', !isControlCenterOpen);
  });

  document.addEventListener('pointerdown', (e) => {
    if (isControlCenterOpen && !e.target.closest('#control-center-btn') && !e.target.closest('#control-center')) {
      isControlCenterOpen = false;
      controlCenter?.classList.add('hidden');
    }
  });

  document.getElementById('wifi-toggle')?.addEventListener('click', function () {
    const bubble = this.querySelector('.cc-icon-bubble');
    bubble?.classList.toggle('active');
    playHarmonicChime([587.33, 783.99]);
    triggerNotification(bubble?.classList.contains('active') ? 'Wi-Fi: Connected to Toccata-5G' : 'Wi-Fi: Disabled');
  });

  document.getElementById('bt-toggle')?.addEventListener('click', function () {
    const bubble = this.querySelector('.cc-icon-bubble');
    bubble?.classList.toggle('active');
    playHarmonicChime([659.25, 880]);
    triggerNotification(bubble?.classList.contains('active') ? 'Bluetooth: Connected to AirPods Pro' : 'Bluetooth: Standby');
  });

  // Control Center Sliders (Live Display Brightness & Sound Volume)
  document.querySelectorAll('.slider-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const rect = pill.getBoundingClientRect();
      const pct = Math.max(10, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      const fill = pill.querySelector('.slider-track-fill');
      if (fill) {
        fill.style.width = `${pct}%`;
        if (fill.id === 'display-track-fill') {
          setDisplayBrightness(Math.max(40, pct));
        } else if (fill.id === 'sound-track-fill') {
          setMasterVolume(pct);
        }
      }
      playHarmonicChime([320 + pct * 5]);
    });
  });

  // ==========================================================================
  // 10B. DESKTOP LAYOUT SWITCHER (Zorin OS & pearOS Adaptive Superpower)
  // ==========================================================================
  function setDesktopLayout(layout) {
    document.body.classList.remove('layout-macos', 'layout-pearos', 'layout-win11', 'layout-win10', 'layout-gnome');
    document.querySelectorAll('.layout-preset-card').forEach(c => c.classList.remove('active'));

    document.getElementById(`layout-card-${layout}`)?.classList.add('active');
    const zorinBtn = document.getElementById('zorin-start-btn');

    if (layout === 'win11') {
      document.body.classList.add('layout-win11');
      zorinBtn?.classList.remove('hidden');
      triggerNotification('Layout: Windows 11 Modern (Zorin Taskbar & Start Menu) active');
      playHarmonicChime([440, 554.37], 0.2);
    } else if (layout === 'win10') {
      document.body.classList.add('layout-win10');
      zorinBtn?.classList.remove('hidden');
      triggerNotification('Layout: Windows 10 Classic (Zorin Legacy) active');
      playHarmonicChime([392, 523.25], 0.2);
    } else if (layout === 'gnome') {
      document.body.classList.add('layout-gnome');
      zorinBtn?.classList.add('hidden');
      triggerNotification('Layout: GNOME 47 / Zorin Overview active');
      playHarmonicChime([330, 440, 554.37], 0.22);
    } else if (layout === 'pearos') {
      document.body.classList.add('layout-pearos', 'layout-macos');
      zorinBtn?.classList.add('hidden');
      triggerNotification('Layout: pearOS NiceC0re Cupertino active');
      try {
        const audio = new Audio('sounds/boot-sound.wav');
        audio.volume = 0.5;
        audio.play().catch(() => playHarmonicChime([523.25, 659.25, 783.99, 1046.5], 0.35));
      } catch (e) {
        playHarmonicChime([523.25, 659.25, 783.99, 1046.5], 0.35);
      }
    } else {
      document.body.classList.add('layout-macos');
      zorinBtn?.classList.add('hidden');
      triggerNotification('Layout: macOS Sequoia Floating Dock active');
      playHarmonicChime([523.25, 659.25, 783.99], 0.25);
    }
    try { localStorage.setItem('toccata_layout', layout); } catch (_) {}
    setTimeout(cacheDockMetrics, 150);
  }
  window.setDesktopLayout = setDesktopLayout;

  // ==========================================================================
  // 11. THEME & ACCENT SYSTEM
  // ==========================================================================
  function setTheme(theme) {
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(theme === 'light' ? 'light-mode' : 'dark-mode');
    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    if (theme === 'light') {
      document.querySelector('.light-theme-preview')?.classList.add('active');
    } else {
      document.querySelector('.dark-theme-preview')?.classList.add('active');
    }
  }
  window.setTheme = setTheme;

  document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-mode');
    setTheme(isLight ? 'dark' : 'light');
  });

  function setAccent(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-glow', `${color}66`);
    document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
    if (window.event?.target?.classList?.contains('accent-dot')) {
      window.event.target.classList.add('active');
    }
  }
  window.setAccent = setAccent;

  // ==========================================================================
  // 12. NOTIFICATION TOASTS
  // ==========================================================================
  let toastTimer = null;
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');

  function triggerNotification(msg) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add('hidden'), 2400);
  }
  window.triggerNotification = triggerNotification;

  // ==========================================================================
  // 13. PHASE 1 CORE APPLICATION SUITE ENGINE
  // ==========================================================================

  // --- A. CADENCE FILE BROWSER & ARCHIVE EXTRACTION ---
  const CADENCE_ICONS = {
    doc: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    audio: '<svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    zip: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
    pkg: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><polygon points="10 8 16 12 10 16"/></svg>',
    app: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="4"/><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    pdf: '<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h6"/></svg>'
  };

  let currentSelectedFile = {
    name: 'Toccata Manifesto.md',
    type: 'Markdown Document',
    size: '4.2 KB',
    meta: 'Markdown Document • 4.2 KB • Modified Today at 1:40 AM',
    icon: CADENCE_ICONS.doc,
    actionText: 'Open with Scribe',
    actionApp: 'win-scribe'
  };

  function selectFile(el, name, type, size) {
    document.querySelectorAll('.finder-grid-view .app-card, .finder-list-view .file-row').forEach(item => {
      item.classList.remove('selected');
    });
    if (el) el.classList.add('selected');

    let icon = CADENCE_ICONS.doc;
    let actionText = 'Open';
    let actionApp = 'win-scribe';

    const lower = name.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.rtf') || lower.endsWith('.txt')) {
      icon = CADENCE_ICONS.doc;
      actionText = 'Open with Scribe';
      actionApp = 'win-scribe';
    } else if (lower.endsWith('.flac') || lower.endsWith('.mp3') || lower.endsWith('.wav')) {
      icon = CADENCE_ICONS.audio;
      actionText = 'Play in Sonata';
      actionApp = 'win-sonata';
    } else if (lower.endsWith('.zip') || lower.endsWith('.tar.gz')) {
      icon = CADENCE_ICONS.zip;
      actionText = 'Extract Archive';
      actionApp = 'extract';
    } else if (lower.endsWith('.dmg') || lower.endsWith('.exe') || lower.endsWith('.msi')) {
      icon = CADENCE_ICONS.pkg;
      actionText = 'Open in Gallery';
      actionApp = 'win-installer';
    } else if (lower.endsWith('.app')) {
      icon = CADENCE_ICONS.app;
      actionText = 'Launch Application';
      actionApp = lower.includes('scribe') ? 'win-scribe' :
                  lower.includes('sonata') ? 'win-sonata' :
                  lower.includes('settings') ? 'win-settings' :
                  lower.includes('tempo') ? 'win-tempo' :
                  lower.includes('gallery') ? 'win-installer' : 'win-cadence';
    } else if (lower.endsWith('.pdf')) {
      icon = CADENCE_ICONS.pdf;
      actionText = 'View Document';
      actionApp = 'pdf';
    }

    currentSelectedFile = {
      name,
      type: type || 'File',
      size: size || 'Unknown size',
      meta: `${type || 'File'} • ${size || ''} • Modified Today`,
      icon,
      actionText,
      actionApp
    };

    const statusEl = document.querySelector('.finder-statusbar span');
    if (statusEl) {
      statusEl.textContent = `"${name}" selected (${size || 'Application'}) • 418.5 GB available on Toccata Core`;
    }

    playHarmonicChime([480], 0.12);
  }
  window.selectFile = selectFile;

  let cadenceHistory = ['apps'];
  let cadenceHistoryIdx = 0;
  let currentCadenceFolder = 'apps';

  function updateCadenceNavButtons() {
    const backBtn = document.getElementById('cadence-back-btn');
    const fwdBtn = document.getElementById('cadence-fwd-btn');
    if (backBtn) backBtn.disabled = cadenceHistoryIdx <= 0;
    if (fwdBtn) fwdBtn.disabled = cadenceHistoryIdx >= cadenceHistory.length - 1;
  }

  function switchCadenceFolder(folderId, pushHistory = true) {
    const folders = {
      'apps': { view: 'cadence-view-apps', title: 'Cadence — Applications', status: '10 items • 418.5 GB available on Toccata Core', path: 'Applications' },
      'docs': { view: 'cadence-view-docs', title: 'Cadence — Documents', status: '4 items • 418.5 GB available on Toccata Core', path: 'Documents' },
      'downloads': { view: 'cadence-view-downloads', title: 'Cadence — Downloads', status: '3 items • 418.5 GB available on Toccata Core', path: 'Downloads' },
      'disk': { view: 'cadence-view-disk', title: 'Cadence — Toccata Core (NVMe Storage)', status: '1.0 TB Total • 418.5 GB Available • Btrfs Compressed', path: 'Toccata Core' },
      'trash': { view: 'cadence-view-trash', title: 'Cadence — Trash', status: 'Trash • 418.5 GB available on Toccata Core', path: 'Trash' }
    };

    const target = folders[folderId];
    if (!target) return;

    currentCadenceFolder = folderId;
    if (pushHistory && cadenceHistory[cadenceHistoryIdx] !== folderId) {
      cadenceHistory = cadenceHistory.slice(0, cadenceHistoryIdx + 1);
      cadenceHistory.push(folderId);
      cadenceHistoryIdx = cadenceHistory.length - 1;
    }
    updateCadenceNavButtons();

    // Update active sidebar row
    document.querySelectorAll('#win-cadence .finder-sidebar .sidebar-row').forEach(row => row.classList.remove('active'));
    document.getElementById(`sb-row-${folderId}`)?.classList.add('active');

    // Toggle view containers
    ['apps', 'docs', 'downloads', 'disk', 'trash'].forEach(f => {
      const el = document.getElementById(folders[f].view);
      if (el) {
        if (f === folderId) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
        }
      }
    });

    const titleEl = document.getElementById('cadence-toolbar-title');
    if (titleEl) titleEl.innerHTML = `<span class="proxy-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>${target.title}`;

    const statusEl = document.getElementById('finder-statusbar-text') || document.querySelector('.finder-statusbar span');
    if (statusEl) statusEl.textContent = target.status;

    const pathEl = document.getElementById('finder-current-path');
    if (pathEl) pathEl.textContent = target.path;

    playHarmonicChime([523.25], 0.15);
  }
  window.switchCadenceFolder = switchCadenceFolder;

  function cadenceGoBack() {
    if (cadenceHistoryIdx > 0) {
      cadenceHistoryIdx--;
      switchCadenceFolder(cadenceHistory[cadenceHistoryIdx], false);
    }
  }
  window.cadenceGoBack = cadenceGoBack;

  function cadenceGoForward() {
    if (cadenceHistoryIdx < cadenceHistory.length - 1) {
      cadenceHistoryIdx++;
      switchCadenceFolder(cadenceHistory[cadenceHistoryIdx], false);
    }
  }
  window.cadenceGoForward = cadenceGoForward;

  function setCadenceViewMode(mode) {
    document.getElementById('cadence-view-btn-grid')?.classList.toggle('active', mode === 'grid');
    document.getElementById('cadence-view-btn-list')?.classList.toggle('active', mode === 'list');
    const appsView = document.getElementById('cadence-view-apps');
    if (appsView && currentCadenceFolder === 'apps') {
      if (mode === 'list') {
        appsView.style.display = 'flex';
        appsView.style.flexDirection = 'column';
        appsView.style.gap = '6px';
        appsView.querySelectorAll('.app-card').forEach(c => {
          c.style.flexDirection = 'row';
          c.style.justifyContent = 'flex-start';
          c.style.padding = '8px 14px';
          c.style.gap = '12px';
        });
      } else {
        appsView.style.display = '';
        appsView.style.flexDirection = '';
        appsView.style.gap = '';
        appsView.querySelectorAll('.app-card').forEach(c => {
          c.style.flexDirection = '';
          c.style.justifyContent = '';
          c.style.padding = '';
          c.style.gap = '';
        });
      }
    }
    triggerNotification(`Cadence: Switched to ${mode === 'grid' ? 'Icons Grid' : 'List'} View`);
    playHarmonicChime([523.25], 0.1);
  }
  window.setCadenceViewMode = setCadenceViewMode;

  function filterCadenceFiles(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('#win-cadence .app-card, #win-cadence .file-row').forEach(item => {
      const txt = item.textContent.toLowerCase();
      item.style.display = (!q || txt.includes(q)) ? '' : 'none';
    });
  }
  window.filterCadenceFiles = filterCadenceFiles;

  let newFolderCounter = 1;
  function createNewCadenceFolder() {
    openWindow('win-cadence');
    if (currentCadenceFolder === 'disk' || currentCadenceFolder === 'apps') {
      switchCadenceFolder('docs');
    }
    const container = document.getElementById(`cadence-view-${currentCadenceFolder}`) || document.getElementById('cadence-view-docs');
    if (!container) return;
    const folderName = `Untitled Folder ${newFolderCounter++}`;
    const row = document.createElement('div');
    row.className = 'file-row selected';
    row.onclick = function () { selectFile(this, folderName, 'Folder', '0 KB'); };
    row.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="#007aff"><path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z"/></svg>
      <span style="font-weight: 600;">${folderName}</span>
      <span style="color: var(--text-secondary);">Just now</span>
      <span style="color: var(--text-secondary);">Folder</span>
    `;
    container.prepend(row);
    selectFile(row, folderName, 'Folder', '0 KB');
    triggerNotification(`Created "${folderName}"`);
    playHarmonicChime([523.25, 659.25], 0.18);
  }
  window.createNewCadenceFolder = createNewCadenceFolder;

  function moveSelectedToTrash() {
    const selectedEl = document.querySelector('#win-cadence .file-row.selected');
    const trashList = document.getElementById('trash-items-container');
    if (selectedEl && trashList) {
      selectedEl.classList.remove('selected');
      trashList.prepend(selectedEl);
      triggerNotification(`Moved "${currentSelectedFile.name}" to Trash`);
      playHarmonicChime([330, 261.63], 0.2);
    } else {
      triggerNotification('Select a document or file in Cadence first to move to Trash');
    }
  }
  window.moveSelectedToTrash = moveSelectedToTrash;

  function emptyTrashBin() {
    const trashList = document.getElementById('trash-items-container');
    if (trashList) {
      trashList.innerHTML = `<div style="padding: 28px; text-align: center; color: var(--text-secondary); font-size: 13px;">Trash is empty</div>`;
    }
    playHarmonicChime([440, 330, 220], 0.25);
    triggerNotification('Trash permanently emptied');
  }
  window.emptyTrashBin = emptyTrashBin;

  let extractedArchives = {};
  function extractArchive(el, archiveName) {
    if (extractedArchives[archiveName]) {
      triggerNotification(`${archiveName} is already uncompressed in /Downloads`);
      return;
    }
    extractedArchives[archiveName] = true;

    playHarmonicChime([392, 523.25, 659.25, 783.99], 0.4);

    const downloadsView = document.getElementById('cadence-view-downloads');
    if (downloadsView) {
      const folderCard = document.createElement('div');
      folderCard.className = 'file-row';
      folderCard.style.animation = 'scalePop 0.24s cubic-bezier(0.16, 1, 0.3, 1)';
      folderCard.onclick = function () { selectFile(this, 'Ableton Live 12/', 'Folder &bull; Uncompressed Bundle', '4.1 GB'); };
      folderCard.ondblclick = function () { openWindow('win-installer'); };
      folderCard.innerHTML = `
        <span><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: -2px; margin-right: 6px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></span>
        <span style="font-weight: 700; color: var(--accent-color);">Ableton Live 12/</span>
        <span style="color: var(--text-secondary);">Ready to Run</span>
        <span style="color: var(--text-secondary);">4.1 GB</span>
      `;
      downloadsView.prepend(folderCard);
    }

    triggerNotification(`Extracted ${archiveName} into /Downloads in 0.08s (Zero-terminal)`);
  }
  window.extractArchive = extractArchive;

  // --- B. QUICK LOOK MODAL OVERLAY ---
  function openQuickLook() {
    const modal = document.getElementById('quick-look-modal');
    if (!modal) return;

    document.getElementById('ql-header-filename').textContent = currentSelectedFile.name;
    document.getElementById('ql-name').textContent = currentSelectedFile.name;
    document.getElementById('ql-meta').textContent = currentSelectedFile.meta;

    const heroIcon = document.getElementById('ql-hero-icon');
    if (heroIcon) heroIcon.innerHTML = currentSelectedFile.icon;

    const actionBtn = document.getElementById('ql-action-btn');
    if (actionBtn) {
      actionBtn.textContent = currentSelectedFile.actionText;
      actionBtn.onclick = function () {
        if (currentSelectedFile.actionApp === 'extract') {
          extractArchive(null, currentSelectedFile.name);
        } else if (currentSelectedFile.actionApp && currentSelectedFile.actionApp.startsWith('win-')) {
          openWindow(currentSelectedFile.actionApp);
        } else {
          triggerNotification(`Opened ${currentSelectedFile.name}`);
        }
        closeQuickLook();
      };
    }

    modal.classList.remove('hidden');
    playHarmonicChime([523.25, 659.25], 0.22);
  }
  window.openQuickLook = openQuickLook;

  function closeQuickLook() {
    const modal = document.getElementById('quick-look-modal');
    modal?.classList.add('hidden');
  }
  window.closeQuickLook = closeQuickLook;

  // --- C. SCRIBE PROSE & CODE CANVAS ---
  let currentScribeView = 'editor';

  function parseMarkdown(md) {
    if (!md) return '';
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 style="margin: 12px 0 6px; font-size: 16px;">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 style="margin: 16px 0 8px; font-size: 19px;">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 style="margin: 20px 0 10px; font-size: 23px; border-bottom: 1px solid var(--glass-border); padding-bottom: 6px;">$1</h1>');

    // Bold & Italic
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

    // Inline code
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Blockquote
    html = html.replace(/^\> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--accent-color); padding-left: 10px; opacity: 0.85; margin: 8px 0;">$1</blockquote>');

    // Bullet items
    html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>');

    // Paragraphs
    const paras = html.split('\n\n');
    html = paras.map(p => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<block')) {
        return trimmed;
      }
      return `<p style="margin-bottom: 10px; line-height: 1.6;">${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
  }

  function renderScribePreview() {
    const input = document.getElementById('scribe-input');
    const preview = document.getElementById('scribe-preview');
    if (!input || !preview) return;
    preview.innerHTML = parseMarkdown(input.value);
  }

  function setScribeView(mode) {
    currentScribeView = mode;
    ['editor', 'split', 'preview'].forEach(m => {
      document.getElementById(`scribe-btn-${m}`)?.classList.toggle('active', m === mode);
    });

    const input = document.getElementById('scribe-input');
    const preview = document.getElementById('scribe-preview');
    if (!input || !preview) return;

    if (mode === 'editor') {
      input.style.display = 'block';
      input.style.width = '100%';
      preview.classList.add('hidden');
      preview.style.display = 'none';
    } else if (mode === 'preview') {
      input.style.display = 'none';
      preview.classList.remove('hidden');
      preview.style.display = 'block';
      preview.style.width = '100%';
      renderScribePreview();
    } else if (mode === 'split') {
      input.style.display = 'block';
      input.style.width = '50%';
      preview.classList.remove('hidden');
      preview.style.display = 'block';
      preview.style.width = '50%';
      renderScribePreview();
    }

    playHarmonicChime([523.25], 0.15);
  }
  window.setScribeView = setScribeView;

  function insertScribeFormat(token) {
    const input = document.getElementById('scribe-input');
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const selected = text.substring(start, end);

    if (token === '### ') {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      input.value = text.substring(0, lineStart) + '### ' + text.substring(lineStart);
      input.selectionStart = input.selectionEnd = start + 4;
    } else {
      const replacement = selected ? `${token}${selected}${token}` : `${token}${token}`;
      input.value = text.substring(0, start) + replacement + text.substring(end);
      const newCursor = selected ? start + replacement.length : start + token.length;
      input.selectionStart = input.selectionEnd = newCursor;
    }

    input.focus();
    updateScribeStats();
    playHarmonicChime([587.33], 0.12);
  }
  window.insertScribeFormat = insertScribeFormat;

  function updateScribeStats() {
    const input = document.getElementById('scribe-input');
    const stats = document.getElementById('scribe-stats');
    if (!input) return;

    const text = input.value;
    const lines = text.split('\n').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    if (stats) {
      stats.textContent = `${lines} lines • ${words} words • ${chars} characters`;
    }
    if (currentScribeView === 'split' || currentScribeView === 'preview') {
      renderScribePreview();
    }
  }
  window.updateScribeStats = updateScribeStats;

  // --- D. SONATA ACOUSTIC HI-FI PLAYER & SOUND STAGE ---
  let sonataPlaying = false;
  let sonataInterval = null;
  let sonataStep = 0;
  let sonataElapsedSec = 45;
  let sonataTotalSec = 262; // 4:22

  const sonataTracks = [
    {
      title: 'Toccata & Fugue in D Minor',
      artist: 'J.S. Bach • Synthesized Polyphony • PipeWire Studio',
      totalSec: 262,
      durationStr: '4:22',
      phrase: [
        [587.33], [554.37], [587.33], [523.25], [466.16], [440.00], [392.00], [349.23], [329.63], [293.66],
        [220.00, 293.66, 349.23, 440.00], [220.00, 293.66, 349.23, 440.00],
        [233.08, 293.66, 349.23, 466.16], [220.00, 277.18, 329.63, 440.00],
        [146.83, 220.00, 293.66, 349.23]
      ],
      stepSpeed: 280,
      waveform: 'triangle'
    },
    {
      title: 'Gymnopédie No. 1',
      artist: 'Erik Satie • Ambient Acoustic Felt Piano',
      totalSec: 195,
      durationStr: '3:15',
      phrase: [
        [329.63, 392.00, 493.88], [293.66, 369.99, 440.00],
        [329.63, 392.00, 493.88], [293.66, 369.99, 440.00],
        [392.00, 493.88, 587.33], [440.00, 523.25, 659.25]
      ],
      stepSpeed: 600,
      waveform: 'sine'
    },
    {
      title: 'Clair de Lune',
      artist: 'Claude Debussy • Impressionist Studio Master',
      totalSec: 304,
      durationStr: '5:04',
      phrase: [
        [415.30, 523.25, 622.25], [466.16, 587.33, 698.46],
        [523.25, 659.25, 783.99], [415.30, 493.88, 622.25],
        [392.00, 466.16, 587.33]
      ],
      stepSpeed: 450,
      waveform: 'triangle'
    },
    {
      title: 'The Four Seasons: Winter (Allegro)',
      artist: 'Antonio Vivaldi • High-Velocity PipeWire Strings',
      totalSec: 218,
      durationStr: '3:38',
      phrase: [
        [349.23], [349.23], [392.00], [440.00],
        [466.16], [440.00], [392.00], [349.23],
        [329.63], [293.66], [261.63], [293.66],
        [349.23, 440.00, 523.25]
      ],
      stepSpeed: 200,
      waveform: 'sawtooth'
    }
  ];

  let currentTrackIdx = 0;

  function updateSonataProgressUI() {
    const curEl = document.getElementById('sonata-time-cur');
    const totalEl = document.getElementById('sonata-time-total');
    const fillEl = document.getElementById('sonata-progress-fill');

    const m = Math.floor(sonataElapsedSec / 60);
    const s = Math.floor(sonataElapsedSec % 60);
    if (curEl) curEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    if (totalEl) totalEl.textContent = sonataTracks[currentTrackIdx].durationStr;

    const pct = Math.min(100, (sonataElapsedSec / sonataTotalSec) * 100);
    if (fillEl) fillEl.style.width = `${pct}%`;
  }

  function selectSonataTrack(idx) {
    if (typeof sonataTracks === 'undefined' || idx < 0 || idx >= sonataTracks.length) return;
    currentTrackIdx = idx;
    const track = sonataTracks[currentTrackIdx];
    const titleEl = document.querySelector('.sonata-title');
    const artistEl = document.querySelector('.sonata-artist');
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;

    sonataStep = 0;
    sonataElapsedSec = 0;
    sonataTotalSec = track.totalSec;
    updateSonataProgressUI();
    renderSonataPlaylist();

    triggerNotification(`Sonata: ${track.title}`);
    playHarmonicChime([523.25, 659.25], 0.15);
    renderSonataPlaylist();

    if (!sonataPlaying) {
      toggleSonataPlayback();
    } else {
      if (sonataInterval) clearInterval(sonataInterval);
      const curTrack = sonataTracks[currentTrackIdx];
      playSonataNote(curTrack.phrase[sonataStep], curTrack.stepSpeed / 1000, curTrack.waveform);
      sonataInterval = setInterval(() => {
        sonataStep = (sonataStep + 1) % curTrack.phrase.length;
        sonataElapsedSec = (sonataElapsedSec + (curTrack.stepSpeed / 1000)) % sonataTotalSec;
        updateSonataProgressUI();
        const isChord = curTrack.phrase[sonataStep].length > 1;
        playSonataNote(curTrack.phrase[sonataStep], isChord ? 0.45 : 0.22, curTrack.waveform);
      }, curTrack.stepSpeed);
    }
  }
  window.selectSonataTrack = selectSonataTrack;

  function renderSonataPlaylist() {
    const listEl = document.getElementById('sonata-playlist-list');
    if (!listEl || typeof sonataTracks === 'undefined') return;
    listEl.innerHTML = '';
    sonataTracks.forEach((t, i) => {
      const isCur = i === currentTrackIdx;
      const row = document.createElement('div');
      row.className = `sonata-track-row ${isCur ? 'active' : ''}`;
      row.onclick = () => selectSonataTrack(i);
      row.innerHTML = `
        <div class="sonata-track-num">${isCur && sonataPlaying ? '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><rect x="3" y="10" width="4" height="10" rx="1"/><rect x="10" y="4" width="4" height="16" rx="1"/><rect x="17" y="8" width="4" height="12" rx="1"/></svg>' : (i + 1)}</div>
        <div class="sonata-track-meta">
          <div class="sonata-track-name">${t.title}</div>
          <div class="sonata-track-sub">${t.artist}</div>
        </div>
        <div class="sonata-track-dur">${t.durationStr}</div>
      `;
      listEl.appendChild(row);
    });
  }
  window.renderSonataPlaylist = renderSonataPlaylist;

  function changeSonataTrack(direction) {
    currentTrackIdx = (currentTrackIdx + direction + sonataTracks.length) % sonataTracks.length;
    const track = sonataTracks[currentTrackIdx];
    const titleEl = document.querySelector('.sonata-title');
    const artistEl = document.querySelector('.sonata-artist');
    if (titleEl) titleEl.textContent = track.title;
    if (artistEl) artistEl.textContent = track.artist;

    sonataStep = 0;
    sonataElapsedSec = 0;
    sonataTotalSec = track.totalSec;
    updateSonataProgressUI();

    triggerNotification(`Sonata: ${track.title}`);
    playHarmonicChime([523.25, 659.25], 0.15);
    renderSonataPlaylist();

    if (sonataPlaying) {
      if (sonataInterval) clearInterval(sonataInterval);
      const curTrack = sonataTracks[currentTrackIdx];
      playSonataNote(curTrack.phrase[sonataStep], curTrack.stepSpeed / 1000, curTrack.waveform);
      sonataInterval = setInterval(() => {
        sonataStep = (sonataStep + 1) % curTrack.phrase.length;
        sonataElapsedSec = (sonataElapsedSec + (curTrack.stepSpeed / 1000)) % sonataTotalSec;
        updateSonataProgressUI();
        const isChord = curTrack.phrase[sonataStep].length > 1;
        playSonataNote(curTrack.phrase[sonataStep], isChord ? 0.45 : 0.22, curTrack.waveform);
      }, curTrack.stepSpeed);
    }
  }
  window.changeSonataTrack = changeSonataTrack;

  // Scrubber interactive seek
  document.getElementById('sonata-scrubber')?.addEventListener('click', (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    sonataElapsedSec = Math.floor(pct * sonataTotalSec);
    updateSonataProgressUI();
    playHarmonicChime([440 + pct * 200], 0.08);
  });

  function playSonataNote(freqs, duration = 0.24, waveType = 'triangle') {
    if (!audioFeedbackEnabled) return;
    try {
      initAudio();
      if (!audioCtx || !masterGain) return;
      const now = audioCtx.currentTime;

      freqs.forEach(f => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = waveType;
        osc.frequency.setValueAtTime(f, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2600, now);
        filter.Q.setValueAtTime(2.5, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.07 / freqs.length, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + 0.06);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration + 0.08);
      });
    } catch (e) {}
  }

  function toggleSonataPlayback() {
    sonataPlaying = !sonataPlaying;
    const playBtn = document.getElementById('sonata-play-btn');
    const vinyl = document.getElementById('sonata-vinyl');
    const spectrum = document.getElementById('sonata-spectrum');
    const curTrack = sonataTracks[currentTrackIdx];

    if (sonataPlaying) {
      if (playBtn) playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align: middle;"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
      vinyl?.classList.add('playing');
      spectrum?.classList.add('playing');
      triggerNotification(`Sonata: Playing ${curTrack.title} (PipeWire 0.7ms)`);
      renderSonataPlaylist();

      playSonataNote(curTrack.phrase[sonataStep], curTrack.stepSpeed / 1000, curTrack.waveform);
      sonataInterval = setInterval(() => {
        sonataStep = (sonataStep + 1) % curTrack.phrase.length;
        sonataElapsedSec = (sonataElapsedSec + (curTrack.stepSpeed / 1000)) % sonataTotalSec;
        updateSonataProgressUI();
        const isChord = curTrack.phrase[sonataStep].length > 1;
        playSonataNote(curTrack.phrase[sonataStep], isChord ? 0.45 : 0.22, curTrack.waveform);
      }, curTrack.stepSpeed);
    } else {
      if (playBtn) playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="vertical-align: middle;"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
      vinyl?.classList.remove('playing');
      spectrum?.classList.remove('playing');
      if (sonataInterval) {
        clearInterval(sonataInterval);
        sonataInterval = null;
      }
      triggerNotification('Sonata: Paused');
      renderSonataPlaylist();
    }
  }
  window.toggleSonataPlayback = toggleSonataPlayback;

  function setAudioOutput(pillEl, deviceName) {
    document.querySelectorAll('.pipewire-output-box .output-pill').forEach(p => p.classList.remove('active'));
    pillEl?.classList.add('active');
    playHarmonicChime([523.25, 783.99], 0.25);
    triggerNotification(`PipeWire Output: Switched to ${deviceName} (0.7ms Latency)`);
  }
  window.setAudioOutput = setAudioOutput;

  // --- E. TEMPO ACTIVITY MONITOR & TASK MANAGER ---
  let selectedProcess = {
    name: 'Horizon Web Engine',
    pid: '2842',
    cpu: '4.8%',
    mem: '280 MB',
    element: null
  };

  function selectProcess(rowEl, name, pid, cpu, mem) {
    document.querySelectorAll('#tempo-process-list .process-row').forEach(r => r.classList.remove('selected'));
    if (rowEl) rowEl.classList.add('selected');
    selectedProcess = { name, pid, cpu: cpu || '1.0%', mem: mem || '50 MB', element: rowEl };

    const fqName = document.getElementById('fq-process-name');
    if (fqName) fqName.textContent = name;
    playHarmonicChime([480], 0.12);
  }
  window.selectProcess = selectProcess;

  function filterProcesses(query) {
    const lower = (query || '').toLowerCase();
    const rows = document.querySelectorAll('#tempo-process-list .process-row');
    rows.forEach(r => {
      const text = r.textContent.toLowerCase();
      r.style.display = text.includes(lower) ? '' : 'none';
    });
  }
  window.filterProcesses = filterProcesses;

  function promptForceQuit() {
    const sheet = document.getElementById('tempo-force-quit-sheet');
    const fqName = document.getElementById('fq-process-name');
    if (fqName) fqName.textContent = selectedProcess.name || 'Selected Application';
    sheet?.classList.remove('hidden');
    playHarmonicChime([349.23, 293.66], 0.25);
  }
  window.promptForceQuit = promptForceQuit;

  function cancelForceQuit() {
    document.getElementById('tempo-force-quit-sheet')?.classList.add('hidden');
  }
  window.cancelForceQuit = cancelForceQuit;

  function confirmForceQuit() {
    const sheet = document.getElementById('tempo-force-quit-sheet');
    sheet?.classList.add('hidden');

    const row = selectedProcess.element || document.querySelector('#tempo-process-list .process-row.selected');
    if (row) {
      row.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
      row.style.opacity = '0';
      row.style.transform = 'translateX(24px)';
      setTimeout(() => {
        row.remove();
        const cpuMetric = document.getElementById('tempo-cpu-metric');
        if (cpuMetric) cpuMetric.textContent = '9% Load';
      }, 200);
    }

    const procLower = (selectedProcess.name || '').toLowerCase();
    if (procLower.includes('sonata')) {
      closeWindow('win-sonata');
    } else if (procLower.includes('scribe')) {
      closeWindow('win-scribe');
    }

    triggerNotification(`Force-quit ${selectedProcess.name} (PID: ${selectedProcess.pid})`);
    playHarmonicChime([440, 330, 220], 0.35);
  }
  window.confirmForceQuit = confirmForceQuit;

  // Lightweight background heartbeat for Tempo Activity Monitor
  setInterval(() => {
    if (IS_NATIVE_KIOSK) {
      fetch('/api/system')
        .then(res => res.json())
        .then(data => {
          const cpuMetric = document.getElementById('tempo-cpu-metric');
          if (cpuMetric && data.cpu_percent !== undefined) {
            cpuMetric.textContent = `${data.cpu_percent}% Load`;
          }
        })
        .catch(() => {});
      return;
    }
    const cpuMetric = document.getElementById('tempo-cpu-metric');
    if (cpuMetric) {
      const load = Math.floor(7 + Math.random() * 8);
      cpuMetric.textContent = `${load}% Load`;
    }
    const firstRowCpu = document.querySelector('#tempo-process-list .process-row td:nth-child(3)');
    if (firstRowCpu) {
      firstRowCpu.textContent = `${(2.2 + Math.random() * 2.4).toFixed(1)}%`;
    }
  }, 2500);

  // --- F. SYSTEM SETTINGS TAB CONTROLLER (macOS Sequoia Multi-Category Suite) ---
  const allSettingsTabs = [
    'wifi', 'bluetooth', 'network',
    'appearance', 'controlcenter', 'desktopdock', 'wallpaper',
    'displays', 'sound', 'battery',
    'general', 'snapshots', 'security', 'windowscompat'
  ];

  function switchSettingsTab(tabKey) {
    allSettingsTabs.forEach(t => {
      const nav = document.getElementById(`tab-nav-${t}`);
      const content = document.getElementById(`settings-tab-${t}`);
      if (t === tabKey) {
        nav?.classList.add('active');
        content?.classList.remove('hidden');
      } else {
        nav?.classList.remove('active');
        content?.classList.add('hidden');
      }
    });
    playHarmonicChime([440, 554.37], 0.18);
  }
  window.switchSettingsTab = switchSettingsTab;

  function setWallpaper(gradient, name, cardEl) {
    document.documentElement.style.setProperty('--bg-wallpaper', gradient);
    document.querySelectorAll('#settings-tab-wallpaper .wallpaper-card').forEach(c => {
      c.style.borderColor = 'var(--glass-border)';
      c.style.borderWidth = '1px';
      const statusText = c.querySelector('.wallpaper-status');
      if (statusText) {
        statusText.textContent = 'Available • Display P3';
        statusText.style.color = 'var(--text-secondary)';
      }
    });
    if (cardEl) {
      cardEl.style.borderColor = 'var(--accent-color)';
      cardEl.style.borderWidth = '2px';
      const statusText = cardEl.querySelector('.wallpaper-status');
      if (statusText) {
        statusText.textContent = 'Current Wallpaper • Active';
        statusText.style.color = 'var(--accent-color)';
      }
    }
    playHarmonicChime([523.25, 659.25, 783.99], 0.25);
    triggerNotification(`Applied Wallpaper: ${name}`);
  }
  window.setWallpaper = setWallpaper;

  function filterSettings(query) {
    const q = (query || '').toLowerCase().trim();
    const navItems = document.querySelectorAll('.settings-sidebar .settings-nav-item');
    const sectionTitles = document.querySelectorAll('.settings-sidebar .settings-section-title');

    navItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });

    // Hide section headers if all items in section hidden
    sectionTitles.forEach(title => {
      title.style.display = q ? 'none' : 'block';
    });
  }
  window.filterSettings = filterSettings;

  // ==========================================================================
  // 14. HORIZON SOVEREIGN BROWSER ENGINE (Zero Telemetry, WebKit Aesthetics)
  // ==========================================================================
  let horizonHistory = ['toccata://speed-benchmark'];
  let horizonHistoryIdx = 0;
  let horizonTrackerCount = 2841;

  function renderHorizonPage(url) {
    const container = document.getElementById('horizon-page-content');
    if (!container) return;

    if (url === 'toccata://speed-benchmark') {
      container.innerHTML = `
        <div class="horizon-page-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <span style="font-size: 11px; font-weight: 700; color: #34c759; text-transform: uppercase;">Realtime Benchmark Suite</span>
              <h2 style="font-size: 22px; margin-top: 4px;">Toccata OS Architecture Efficiency</h2>
            </div>
            <span style="background: rgba(52, 199, 89, 0.15); color: #34c759; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px;">Validated Live</span>
          </div>

          <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
            Engineered from the ground up to eliminate Windows kernel thread contention and background telemetry thrashing, while preserving pure macOS aesthetic polish.
          </p>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px;">
            <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; color: var(--text-secondary);">Audio Master Latency</div>
              <div style="font-size: 22px; font-weight: 800; color: #38bdf8; margin: 6px 0;">0.7 ms</div>
              <div style="font-size: 11px; color: #34c759;">vs 12.4ms (Windows DPC)</div>
            </div>
            <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; color: var(--text-secondary);">Idle Memory Footprint</div>
              <div style="font-size: 22px; font-weight: 800; color: #34c759; margin: 6px 0;">820 MB</div>
              <div style="font-size: 11px; color: #34c759;">vs 4.4 GB (Windows 11)</div>
            </div>
            <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 10px; padding: 14px;">
              <div style="font-size: 11px; color: var(--text-secondary);">Telemetry Bandwidth</div>
              <div style="font-size: 22px; font-weight: 800; color: #ff9500; margin: 6px 0;">0 KB/day</div>
              <div style="font-size: 11px; color: #34c759;">100% Kernel Blocked</div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--glass-border); padding-top: 16px; display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary);">
            <span>BORE CPU Scheduler active</span>
            <span>Btrfs Zstd-15 transparent compression</span>
          </div>
        </div>
      `;
    } else if (url === 'toccata://pipewire-studio') {
      container.innerHTML = `
        <div class="horizon-page-card">
          <span style="font-size: 11px; font-weight: 700; color: var(--accent-color); text-transform: uppercase;">Pro Studio Sound Architecture</span>
          <h2 style="font-size: 22px; margin: 6px 0 16px;">PipeWire ALSA Hardware Passthrough</h2>
          <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
            Unlike the Windows Audio Session API (WASAPI) and generic ALSA layers, Toccata wires bit-perfect streams straight into memory buffers at 96kHz / 24-bit with zero jitter.
          </p>
          <div style="padding: 16px; background: rgba(0,0,0,0.25); border-radius: 10px; font-family: var(--font-mono); font-size: 12px; color: #a1a1aa; line-height: 1.8;">
            <div>&bull; Graph Node: [alsa_output.pci-0000_00_1f.3.analog-stereo]</div>
            <div>&bull; Buffer Size: 64 samples @ 96000 Hz (0.667 ms)</div>
            <div>&bull; Resampler: Speex-Resampler (Quality 10, Bit-Perfect)</div>
            <div>&bull; Active Sinks: Sonata Lossless Stream &rarr; Master Bus</div>
          </div>
        </div>
      `;
    } else if (url === 'toccata://privacy-manifesto') {
      container.innerHTML = `
        <div class="horizon-page-card">
          <span style="font-size: 11px; font-weight: 700; color: #ff2d55; text-transform: uppercase;">Privacy Sovereignty</span>
          <h2 style="font-size: 22px; margin: 6px 0 16px;">Your Hardware. Zero Corporate Extraction.</h2>
          <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.6; margin-bottom: 16px;">
            Windows ships with dozens of diagnostics services (DiagTrack, dmwappushservice, Connected User Experiences) sending telemetry, keystrokes, and diagnostics back to corporate servers.
          </p>
          <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.6;">
            Toccata OS contains exactly zero telemetry packages. No ad IDs, no start menu suggestions, no cloud account forcing. Everything runs on local silicon.
          </p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="horizon-page-card">
          <h2 style="font-size: 20px; margin-bottom: 12px;">Search: ${url}</h2>
          <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 20px;">Results via Sovereign Private Index (Zero Tracking):</p>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <a href="#" style="color: var(--accent-color); font-weight: 600; text-decoration: none;" onclick="navigateHorizon('toccata://speed-benchmark')">Toccata OS Architectural Overview &amp; Benchmark</a>
              <div style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">Official documentation on Linux speed, macOS polish, and Windows commands.</div>
            </div>
            <div>
              <a href="#" style="color: var(--accent-color); font-weight: 600; text-decoration: none;" onclick="navigateHorizon('https://archlinux.org')">Arch Linux Rolling Foundation</a>
              <div style="color: var(--text-secondary); font-size: 12px; margin-top: 2px;">Bleeding-edge Linux kernel, pacman package infrastructure, and Wayland desktop.</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  function navigateHorizon(url) {
    if (!url) return;
    const input = document.getElementById('horizon-url-input');
    if (input) input.value = url;

    horizonHistory.push(url);
    horizonHistoryIdx = horizonHistory.length - 1;

    // Simulate tracker block counter increment
    horizonTrackerCount += Math.floor(Math.random() * 4) + 1;
    const trackerEl = document.getElementById('horizon-tracker-count');
    if (trackerEl) trackerEl.textContent = horizonTrackerCount.toLocaleString();

    renderHorizonPage(url);
    playHarmonicChime([587.33], 0.12);
  }
  window.navigateHorizon = navigateHorizon;

  function horizonGoBack() {
    if (horizonHistoryIdx > 0) {
      horizonHistoryIdx--;
      const url = horizonHistory[horizonHistoryIdx];
      const input = document.getElementById('horizon-url-input');
      if (input) input.value = url;
      renderHorizonPage(url);
      playHarmonicChime([480], 0.1);
    }
  }
  window.horizonGoBack = horizonGoBack;

  function horizonGoForward() {
    if (horizonHistoryIdx < horizonHistory.length - 1) {
      horizonHistoryIdx++;
      const url = horizonHistory[horizonHistoryIdx];
      const input = document.getElementById('horizon-url-input');
      if (input) input.value = url;
      renderHorizonPage(url);
      playHarmonicChime([520], 0.1);
    }
  }
  window.horizonGoForward = horizonGoForward;

  function horizonReload() {
    const input = document.getElementById('horizon-url-input');
    if (input) renderHorizonPage(input.value);
    playHarmonicChime([659.25], 0.1);
    triggerNotification('Horizon: Page reloaded');
  }
  window.horizonReload = horizonReload;

  function toggleHorizonReader() {
    triggerNotification('Horizon: Reader Mode toggled');
    playHarmonicChime([783.99], 0.15);
  }
  window.toggleHorizonReader = toggleHorizonReader;

  // Initialize default page
  renderHorizonPage('toccata://speed-benchmark');

  // ==========================================================================
  // 15. CONSOLE TERMINAL ENGINE (Dual-Personality Linux & Windows Shell)
  // ==========================================================================
  let currentShell = 'zsh';

  function switchTerminalTab(pillEl, shellType) {
    document.querySelectorAll('.terminal-tab-bar .terminal-tab-pill').forEach(p => p.classList.remove('active'));
    pillEl?.classList.add('active');
    currentShell = shellType;

    const label = document.getElementById('term-prompt-label');
    if (label) {
      if (shellType === 'pwsh') label.textContent = 'PS /home/toccata>';
      else if (shellType === 'cmd') label.textContent = 'C:\\Users\\Toccata>';
      else label.textContent = 'toccata@core:~$';
    }
    playHarmonicChime([523.25], 0.12);
  }
  window.switchTerminalTab = switchTerminalTab;

  let termHistoryList = [];
  let termHistoryIdx = -1;

  function handleTerminalKey(e) {
    const input = document.getElementById('term-input');
    const history = document.getElementById('term-history');
    if (!input || !history) return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (termHistoryList.length === 0) return;
      if (termHistoryIdx === -1) {
        termHistoryIdx = termHistoryList.length - 1;
      } else if (termHistoryIdx > 0) {
        termHistoryIdx--;
      }
      input.value = termHistoryList[termHistoryIdx] || '';
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (termHistoryIdx !== -1) {
        if (termHistoryIdx < termHistoryList.length - 1) {
          termHistoryIdx++;
          input.value = termHistoryList[termHistoryIdx] || '';
        } else {
          termHistoryIdx = -1;
          input.value = '';
        }
      }
      return;
    }

    if (e.key !== 'Enter') return;

    const cmd = input.value.trim();
    input.value = '';
    if (!cmd) return;

    termHistoryList.push(cmd);
    termHistoryIdx = -1;

    // Append executed prompt
    const pLabel = document.getElementById('term-prompt-label')?.textContent || 'toccata@core:~$';
    const cmdRow = document.createElement('div');
    cmdRow.className = 'term-line-output';
    cmdRow.innerHTML = `<span style="color: #34c759; font-weight: 700;">${pLabel}</span> ${escapeHtml(cmd)}`;
    history.appendChild(cmdRow);

    // Native Bridge IPC Execution Hook
    if (IS_NATIVE_KIOSK && !['cls', 'clear'].includes(cmd.toLowerCase())) {
      const container = document.getElementById('term-container');
      fetch('/api/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd: cmd })
      })
      .then(res => res.json())
      .then(data => {
        const outRow = document.createElement('div');
        outRow.className = 'term-line-output';
        let rendered = '';
        if (data.stdout) {
          rendered += escapeHtml(data.stdout).replace(/\n/g, '<br>');
        }
        if (data.stderr) {
          rendered += (rendered ? '<br>' : '') + `<span style="color: #ef4444;">${escapeHtml(data.stderr).replace(/\n/g, '<br>')}</span>`;
        }
        if (!rendered && data.error) {
          rendered = `<span style="color: #ef4444;">${escapeHtml(data.error)}</span>`;
        }
        outRow.innerHTML = rendered || `<span style="color: #a1a1aa;">(Command returned with exit code ${data.exit_code || 0})</span>`;
        history.appendChild(outRow);
        if (container) container.scrollTop = container.scrollHeight;
      })
      .catch(() => {
        // Fallback to static simulator if API fails
        const output = evaluateTerminalCommand(cmd);
        if (output) {
          const outRow = document.createElement('div');
          outRow.className = 'term-line-output';
          outRow.innerHTML = output;
          history.appendChild(outRow);
        }
        if (container) container.scrollTop = container.scrollHeight;
      });
      playHarmonicChime([440], 0.08);
      return;
    }

    // Evaluate dual-personality command
    const output = evaluateTerminalCommand(cmd);
    if (output) {
      const outRow = document.createElement('div');
      outRow.className = 'term-line-output';
      outRow.innerHTML = output;
      history.appendChild(outRow);
    }

    // Scroll to bottom
    const container = document.getElementById('term-container');
    if (container) container.scrollTop = container.scrollHeight;

    playHarmonicChime([440], 0.08);
  }
  window.handleTerminalKey = handleTerminalKey;

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function evaluateTerminalCommand(rawCmd) {
    const parts = rawCmd.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    // 1. Clear Screen
    if (cmd === 'cls' || cmd === 'clear') {
      const history = document.getElementById('term-history');
      if (history) history.innerHTML = '';
      return '';
    }

    // 2. IP Config (Windows / Linux)
    if (cmd === 'ipconfig' || cmd === 'ifconfig' || (cmd === 'ip' && parts[1] === 'a')) {
      return `<span style="color: #a1a1aa;">Windows IP Configuration &bull; Toccata Core Bridge:</span>
Ethernet adapter Core0:
   Connection-specific DNS Suffix  . : localdomain
   Link-local IPv6 Address . . . . . : fe80::d418:8923:ff82:402b%12
   IPv4 Address. . . . . . . . . . . : 192.168.1.145
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   Hardware MAC  . . . . . . . . . . : e8:9c:25:a1:44:bc (Realtek 2.5GbE)`;
    }

    // 3. Directory Listing (dir / ls)
    if (cmd === 'dir' || cmd === 'ls') {
      if (currentShell === 'cmd') {
        return ` Volume in drive C is Toccata Core NVMe
 Volume Serial Number is 7B12-9A4E

 Directory of C:\\Users\\Toccata

11/01/2026  01:40 AM    &lt;DIR&gt;          Applications
11/01/2026  01:40 AM    &lt;DIR&gt;          Documents
11/01/2026  01:40 AM    &lt;DIR&gt;          Downloads
11/01/2026  01:40 AM             4,280 Toccata Manifesto.md
11/01/2026  01:40 AM        52,428,800 Scribe.app
11/01/2026  01:40 AM        38,912,000 Sonata.app
               2 File(s)     52,433,080 bytes
               3 Dir(s)  449,368,064,000 bytes free`;
      }
      return `<span style="color: #38bdf8; font-weight: 700;">Applications/  Documents/  Downloads/</span>
Toccata Manifesto.md   Scribe.app   Sonata.app   Tempo.app   Horizon.app`;
    }

    // 4. Task Manager (taskmgr / tasklist / ps / top)
    if (cmd === 'taskmgr' || cmd === 'tasklist' || cmd === 'ps' || cmd === 'top') {
      openWindow('win-tempo');
      return `PID   TTY      TIME     CMD
1042  ?        00:01:24 kwin_wayland
1850  ?        00:00:18 cadence
1920  ?        00:00:04 scribe
2105  ?        00:00:12 sonata
2842  ?        00:00:32 horizon
Opening Tempo Activity Monitor...`;
    }

    // 5. Memory / Resources (free / systeminfo)
    if (cmd === 'free' || cmd === 'free -m' || cmd === 'free -h') {
      return `               total        used        free      shared  buff/cache   available
Mem:            32Gi       820Mi        29Gi        42Mi       2.1Gi        30Gi
Swap:           16Gi          0B        16Gi`;
    }

    if (cmd === 'systeminfo') {
      return `OS Name:                   Toccata Operating System
OS Version:                1.0.4 Build 20261101 (Sonata)
System Manufacturer:       Toccata Acoustics & Systems
System Model:              Display P3 Studio Pro
System Type:               x64-based PC
Processor(s):              16 Symphony Cores @ 4.8 GHz (BORE Scheduler)
Installed Physical Memory: 32,768 MB (820 MB Used at Idle)
Audio Engine:              PipeWire Low-Latency Subsystem (0.7ms ALSA)`;
    }

    // 6. Kernel & System (uname / ver)
    if (cmd === 'uname' || cmd === 'uname -a') {
      return `Linux toccata-core 6.11.5-bore #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`;
    }

    if (cmd === 'ver') {
      return `Toccata OS [Version 1.0.4.2026] (Windows Command Subsystem Compatible)`;
    }

    // 7. Fastfetch & Neofetch
    if (cmd === 'fastfetch' || cmd === 'neofetch') {
      return '<pre style="color: #e2e8f0; font-family: var(--font-mono); line-height: 1.35; margin: 4px 0;">' +
'      ██████████     <span style="color: #34c759; font-weight: 700;">toccata@core</span>\n' +
'                    <span style="color: var(--text-secondary);">------------</span>\n' +
'       ██    ██     <span style="color: #ff9500;">OS:</span> Toccata OS 1.0 "Sonata" (x86_64)\n' +
'       ██    ██     <span style="color: #ff9500;">Kernel:</span> 6.11.5-bore-xanmod\n' +
'       ╚═╗  ╔═╝     <span style="color: #ff9500;">Uptime:</span> 4 hours, 28 mins\n' +
'          ██        <span style="color: #ff9500;">Shell:</span> ' + currentShell + ' / Windows Bridge\n' +
'          ██        <span style="color: #ff9500;">Resolution:</span> 3840x2160 @ 120Hz (Retina Display P3)\n' +
'     <span style="color: #38bdf8; font-weight: 700;">[TOCCATA]</span>      <span style="color: #ff9500;">DE:</span> KWin Wayland Compositor (Frosted Slate)\n' +
'                    <span style="color: #ff9500;">Theme:</span> Apple Glass Vibrancy (No Muddy Tones)\n' +
'                    <span style="color: #ff9500;">CPU:</span> 16 Symphony Cores @ 4.8 GHz (BORE Scheduler)\n' +
'                    <span style="color: #ff9500;">Memory:</span> 820 MiB / 32 GiB (2.5% Idle Footprint)\n' +
'                    <span style="color: #ff9500;">Audio:</span> PipeWire 1.2.5 ALSA Direct (0.7ms Latency)\n' +
'      </pre>';
    }

    // 8. Matrix Real-Time Stream
    if (cmd === 'matrix') {
      return `<div style="color: #34c759; font-family: monospace; font-size: 11px; line-height: 1.4;">
01010100 01101111 01100011 01100011 01100001 01110100 01100001<br>
λ 0x7FFD2B814400 : KERNEL_REALTIME_DISPATCH_OK<br>
λ PIPEWIRE_ALSA_STREAM : 96000Hz_24BIT_0.667ms_LOCKED<br>
λ BORE_CPU_BURST_PENALTY : 0 (Max Interactive Responsiveness)<br>
<span style="color: white; font-weight: 700;">[Matrix Stream Decoded] Hypervisor real-time mode active. Zero telemetry.</span>
      </div>`;
    }

    // 9. Text Viewer (cat / type)
    if (cmd === 'cat' || cmd === 'type') {
      const target = (parts[1] || '').toLowerCase();
      if (target.includes('manifesto')) {
        return `<pre style="color: var(--text-primary); font-family: var(--font-mono); white-space: pre-wrap; margin: 4px 0;">
# Toccata OS Manifesto
1. Apple Aesthetics: Pure Frosted Slate Vibrancy without muddy tones.
2. Linux Performance: XanMod/BORE kernel, PipeWire 0.7ms, 820MB idle RAM.
3. Windows Commands: Muscle-memory bridge for dir, ipconfig, taskmgr, winget.
4. Zero-Terminal Rule: Everything has a visual GUI and touch sheets.
        </pre>`;
      }
      return `File: ${parts[1] || 'unspecified'}. Open in Scribe with 'notepad ${parts[1] || ''}'.`;
    }

    // 10. Navigation & Identity
    if (cmd === 'pwd') {
      return currentShell === 'cmd' ? 'C:\\Users\\Toccata' : '/home/toccata';
    }

    if (cmd === 'whoami') {
      return currentShell === 'cmd' ? 'TOCCATA-CORE\\toccata' : 'toccata (Sovereign Root)';
    }

    if (cmd === 'date' || cmd === 'time') {
      return new Date().toString();
    }

    if (cmd === 'echo') {
      return escapeHtml(rawCmd.substring(5).trim());
    }

    if (cmd === 'wsl') {
      return `<span style="color: #38bdf8;">Windows Subsystem for Linux (WSLg) Status:</span>
Distribution: Toccata-Core-ArchLinux (Default)
Version: WSL 2 (Kernel 6.11.5-bore-xanmod)
Wayland Socket: /mnt/wslg/runtime-dir/wayland-0 (Hardware Accelerated)
Audio Driver: /mnt/wslg/PulseAudio &rarr; Host WASAPI / PipeWire Direct`;
    }

    // 11. Package Installer (winget / pacman / apt)
    if (cmd === 'winget' || cmd === 'pacman') {
      return `<span style="color: #34c759;">Toccata Unified Package Hub (Zero-Terminal Enabled):</span>
Double-click any .app, .dmg, or .exe in Cadence to install visually.
Or search packages in Gallery.app.`;
    }

    // 12. Help
    if (cmd === 'todo' || cmd === 'reminders') {
      openWindow('win-todo');
      return 'Opening Reminders (pearOS To-Do)...';
    }
    if (cmd === 'contacts') {
      openWindow('win-contacts');
      return 'Opening Contacts (pearOS Address Book)...';
    }
    if (cmd === 'connect' || cmd === 'zorin-connect') {
      openWindow('win-connect');
      return 'Opening Zorin Connect Mobile Bridge...';
    }
    if (cmd === 'tour' || cmd === 'welcome') {
      openWindow('win-tour');
      return 'Opening Welcome Tour...';
    }

    if (cmd === 'help') {
      return `<span style="color: #38bdf8; font-weight: 700;">Toccata Shell Built-in Commands:</span>
&bull; Windows Compatibility : ipconfig, dir, cls, taskmgr, tasklist, systeminfo, ver, winget, echo, cat
&bull; Linux Standard CLI   : ls, ps, free, df, uname, clear, pwd, whoami, fastfetch, matrix, help, date
&bull; GUI Integration      : Double-clicking any .app or file launches instant native visual sheets.`;
    }

    return `<span style="color: #ff453a;">${escapeHtml(cmd)}: command not found</span>. Type 'help' for available commands.`;
  }

  // ==========================================================================
  // 16. SOLFEGE CALCULATOR ENGINE (Apple Glass Layout & Precision Math)
  // ==========================================================================
  let calcCurrent = '0';
  let calcPrev = null;
  let calcOp = null;
  let calcShouldReset = false;

  function updateCalcScreen() {
    const mainEl = document.getElementById('calc-main-display');
    const subEl = document.getElementById('calc-sub-display');
    if (mainEl) mainEl.textContent = calcCurrent;
    if (subEl) subEl.textContent = calcOp ? `${calcPrev} ${calcOp}` : '';
  }

  function updateCalcOpHighlight() {
    document.querySelectorAll('.calc-key-op').forEach(btn => {
      btn.classList.remove('active');
      const txt = btn.textContent.trim();
      if (calcOp && !calcShouldReset) {
        if ((calcOp === '/' && (txt === '÷' || txt === '/')) ||
            (calcOp === '*' && (txt === '×' || txt === '*')) ||
            (calcOp === '-' && (txt === '−' || txt === '-')) ||
            (calcOp === '+' && txt === '+')) {
          btn.classList.add('active');
        }
      }
    });
  }

  function calcBackspace() {
    if (calcShouldReset) return;
    if (calcCurrent.length > 1) {
      calcCurrent = calcCurrent.slice(0, -1);
    } else {
      calcCurrent = '0';
    }
    playHarmonicChime([380], 0.06);
    updateCalcScreen();
  }
  window.calcBackspace = calcBackspace;

  function calcAction(action, val) {
    if (action === 'num') {
      if (calcCurrent === '0' || calcShouldReset) {
        calcCurrent = val;
        calcShouldReset = false;
      } else {
        if (calcCurrent.length < 12) calcCurrent += val;
      }
      playHarmonicChime([400 + parseInt(val, 10) * 30], 0.08);
    } else if (action === 'dot') {
      if (!calcCurrent.includes('.')) calcCurrent += '.';
      playHarmonicChime([480], 0.08);
    } else if (action === 'clear') {
      calcCurrent = '0';
      calcPrev = null;
      calcOp = null;
      calcShouldReset = false;
      playHarmonicChime([300], 0.1);
    } else if (action === 'invert') {
      calcCurrent = (parseFloat(calcCurrent) * -1).toString();
      playHarmonicChime([450], 0.08);
    } else if (action === 'percent') {
      calcCurrent = (parseFloat(calcCurrent) / 100).toString();
      playHarmonicChime([500], 0.08);
    } else if (action === 'op') {
      calcPrev = parseFloat(calcCurrent);
      calcOp = val;
      calcShouldReset = true;
      playHarmonicChime([600], 0.1);
    } else if (action === 'equals') {
      if (calcOp && calcPrev !== null) {
        const cur = parseFloat(calcCurrent);
        let res = 0;
        if (calcOp === '+') res = calcPrev + cur;
        else if (calcOp === '-') res = calcPrev - cur;
        else if (calcOp === '*') res = calcPrev * cur;
        else if (calcOp === '/') res = cur !== 0 ? calcPrev / cur : 'Error';

        calcCurrent = (typeof res === 'number') ? parseFloat(res.toPrecision(10)).toString() : res;
        calcPrev = null;
        calcOp = null;
        calcShouldReset = true;
        playHarmonicChime([523.25, 659.25], 0.15);
      }
    }
    updateCalcScreen();
    updateCalcOpHighlight();
  }
  window.calcAction = calcAction;

  // ==========================================================================
  // 17. PRISM PHOTOS & VECTOR PREVIEW ENGINE
  // ==========================================================================
  let prismZoomScale = 1.0;
  let prismRot = 0;
  let prismExifShown = true;

  function updatePrismTransform() {
    const frame = document.getElementById('prism-frame');
    if (frame) {
      frame.style.transform = `scale(${prismZoomScale}) rotate(${prismRot}deg)`;
    }
  }

  function prismZoom(delta) {
    prismZoomScale = Math.max(0.6, Math.min(2.5, prismZoomScale + delta));
    updatePrismTransform();
    playHarmonicChime([450 + prismZoomScale * 100], 0.08);
  }
  window.prismZoom = prismZoom;

  function prismRotate() {
    prismRot = (prismRot + 90) % 360;
    updatePrismTransform();
    playHarmonicChime([587.33], 0.12);
  }
  window.prismRotate = prismRotate;

  function setPrismFilter(btnEl, filterType) {
    document.querySelectorAll('.prism-toolbar .seg-btn').forEach(b => b.classList.remove('active'));
    btnEl?.classList.add('active');

    const frame = document.getElementById('prism-frame');
    if (!frame) return;

    if (filterType === 'vivid') {
      frame.style.filter = 'saturate(160%) contrast(110%)';
      triggerNotification('Prism: Display P3 Wide Gamut active');
    } else if (filterType === 'mono') {
      frame.style.filter = 'grayscale(100%) contrast(125%)';
      triggerNotification('Prism: Monolithic Silver Halide filter');
    } else {
      frame.style.filter = 'none';
      triggerNotification('Prism: Standard color profile');
    }
    playHarmonicChime([523.25], 0.1);
  }
  window.setPrismFilter = setPrismFilter;

  function togglePrismExif() {
    prismExifShown = !prismExifShown;
    const pill = document.getElementById('prism-exif-pill');
    if (pill) pill.style.display = prismExifShown ? 'flex' : 'none';
    playHarmonicChime([440], 0.1);
  }
  window.togglePrismExif = togglePrismExif;

  // ==========================================================================
  // 18. CHRONICLE CALENDAR & POMODORO ACOUSTIC FOCUS CLOCK
  // ==========================================================================
  let currentCalYear = 2026;
  let currentCalMonth = 10; // 0-indexed: 10 = November

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DEFAULT_CAL_EVENTS = [
    { id: 1, title: 'Toccata Phase 2 Review', date: '2026-11-01', time: '16:00', cat: 'work', color: '#007aff' },
    { id: 2, title: 'PipeWire Studio Jam', date: '2026-11-02', time: '19:30', cat: 'studio', color: '#af52de' },
    { id: 3, title: 'Architecture Audit', date: '2026-11-05', time: '14:00', cat: 'work', color: '#007aff' },
    { id: 4, title: 'Alpha Release Milestone', date: '2026-11-12', time: '10:00', cat: 'personal', color: '#34c759' }
  ];

  let CAL_EVENTS = [];
  try {
    const savedCal = localStorage.getItem('toccata_cal_events');
    CAL_EVENTS = savedCal ? JSON.parse(savedCal) : DEFAULT_CAL_EVENTS;
  } catch (e) {
    CAL_EVENTS = DEFAULT_CAL_EVENTS;
  }
  window.CAL_EVENTS = CAL_EVENTS;

  function saveCalEventsToStorage() {
    try {
      localStorage.setItem('toccata_cal_events', JSON.stringify(CAL_EVENTS));
    } catch (e) {}
  }
  window.saveCalEventsToStorage = saveCalEventsToStorage;

  let selectedCalDay = 1;

  function selectCalDate(year, month, day) {
    selectedCalDay = day;
    renderCalendar(year, month);
    renderCalSidebarEvents(year, month, day);
    playHarmonicChime([440 + day * 15], 0.1);
  }
  window.selectCalDate = selectCalDate;

  function renderCalSidebarEvents(year = currentCalYear, month = currentCalMonth, day = selectedCalDay) {
    const sidebarContainer = document.querySelector('.chronicle-sidebar > div:last-child');
    if (!sidebarContainer) return;

    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = CAL_EVENTS.filter(e => e.date === dateKey);

    sidebarContainer.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Events &bull; ${monthNames[month].slice(0, 3)} ${day}</span>
        <button class="btn btn-secondary" onclick="promptAddCalEvent('${dateKey}')" style="padding:2px 6px;font-size:10px;font-weight:700;">+ Add</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; max-height: 190px; overflow-y: auto;">
        ${dayEvents.length === 0 ? '<div style="color:var(--text-secondary);font-size:11px;padding:8px 2px;opacity:0.75;">No events scheduled for this day</div>' : dayEvents.map(ev => `
          <div class="cal-event-item" style="background: rgba(255,255,255,0.06); border-left: 3px solid ${ev.color || '#007aff'};">
            <div>
              <div style="font-weight: 600;">${ev.title}</div>
              <div style="color: var(--text-secondary); font-size: 10px;">${ev.time || 'All Day'} &bull; ${ev.cat || 'General'}</div>
            </div>
            <button class="cal-event-del" onclick="deleteCalEvent(${ev.id}, event)" title="Delete Event">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }
  window.renderCalSidebarEvents = renderCalSidebarEvents;

  function deleteCalEvent(id, event) {
    if (event) event.stopPropagation();
    const idx = CAL_EVENTS.findIndex(e => e.id === id);
    if (idx === -1) return;
    const removedTitle = CAL_EVENTS[idx].title;
    CAL_EVENTS.splice(idx, 1);
    saveCalEventsToStorage();
    renderCalendar(currentCalYear, currentCalMonth);
  renderCalSidebarEvents(currentCalYear, currentCalMonth, 1);
    renderCalSidebarEvents(currentCalYear, currentCalMonth, selectedCalDay);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Removed event: ${removedTitle}`);
    }
    playHarmonicChime([330, 220], 0.12);
  }
  window.deleteCalEvent = deleteCalEvent;

  function renderCalendar(year, month) {
    const titleEl = document.getElementById('cal-month-title');
    const gridEl = document.getElementById('cal-grid-cells');
    if (titleEl) titleEl.textContent = `${monthNames[month]} ${year}`;
    if (!gridEl) return;

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let html = dayLabels.map(d => `<div class="cal-day-name">${d}</div>`).join('');

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      html += `<div class="cal-cell other-month">${prevMonthDays - i}</div>`;
    }

    // Current month days
    const now = new Date();
    const isThisMonth = now.getFullYear() === year && now.getMonth() === month;
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = isThisMonth && now.getDate() === d;
      const isSelected = selectedCalDay === d;
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = CAL_EVENTS.filter(e => e.date === dateKey);
      const dots = dayEvents.length ? '<div class="cal-event-dots">' + dayEvents.map(e => `<span class="cal-event-dot" style="background:${e.color || '#007aff'}"></span>`).join('') + '</div>' : '';
      html += `<div class="cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" onclick="selectCalDate(${year}, ${month}, ${d})"><span>${d}</span>${dots}</div>`;
    }

    // Next month padding
    const remaining = 35 - (firstDay + daysInMonth);
    for (let n = 1; n <= (remaining > 0 ? remaining : remaining + 7); n++) {
      html += `<div class="cal-cell other-month">${n}</div>`;
    }

    gridEl.innerHTML = html;
  }

  function changeCalMonth(delta) {
    currentCalMonth += delta;
    if (currentCalMonth < 0) {
      currentCalMonth = 11;
      currentCalYear--;
    } else if (currentCalMonth > 11) {
      currentCalMonth = 0;
      currentCalYear++;
    }
    renderCalendar(currentCalYear, currentCalMonth);
    playHarmonicChime([523.25], 0.12);
  }
  window.changeCalMonth = changeCalMonth;

  // Initialize Calendar
  renderCalendar(currentCalYear, currentCalMonth);

  // Pomodoro Focus Clock
  let pomoSeconds = 25 * 60;
  let pomoRunning = false;
  let pomoTimer = null;

  function updatePomoDisplay() {
    const el = document.getElementById('pomo-display');
    if (!el) return;
    const m = Math.floor(pomoSeconds / 60);
    const s = pomoSeconds % 60;
    el.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function togglePomodoro() {
    pomoRunning = !pomoRunning;
    const btn = document.getElementById('pomo-toggle-btn');
    if (pomoRunning) {
      if (btn) btn.textContent = 'Pause';
      playHarmonicChime([523.25, 659.25], 0.2);
      pomoTimer = setInterval(() => {
        if (pomoSeconds > 0) {
          pomoSeconds--;
          updatePomoDisplay();
        } else {
          clearInterval(pomoTimer);
          pomoRunning = false;
          if (btn) btn.textContent = 'Start';
          playHarmonicChime([523.25, 659.25, 783.99, 1046.50], 0.8);
          triggerNotification('Focus Session Complete! Take a 5-minute break.');
        }
      }, 1000);
      triggerNotification('Focus Timer: 25 minutes started');
    } else {
      if (btn) btn.textContent = 'Resume';
      clearInterval(pomoTimer);
      triggerNotification('Focus Timer paused');
      playHarmonicChime([392], 0.15);
    }
  }
  window.togglePomodoro = togglePomodoro;

  function resetPomodoro() {
    clearInterval(pomoTimer);
    pomoRunning = false;
    pomoSeconds = 25 * 60;
    const btn = document.getElementById('pomo-toggle-btn');
    if (btn) btn.textContent = 'Start';
    updatePomoDisplay();
    playHarmonicChime([330], 0.15);
    triggerNotification('Focus Timer reset to 25:00');
  }
  window.resetPomodoro = resetPomodoro;

  // ==========================================================================
  // 19. GLOBAL TOP MENU BAR DROPDOWNS & WINDOW TILING COMMANDS
  // ==========================================================================
  function closeAllTopBarDropdowns() {
    document.querySelectorAll('.topbar-sub-dropdown').forEach(el => el.classList.add('hidden'));
  }
  window.closeAllTopBarDropdowns = closeAllTopBarDropdowns;

  function toggleTopBarDropdown(menuId) {
    if (menuId === 'app') {
      toggleToccataMenu();
      closeAllTopBarDropdowns();
      return;
    }
    closeToccataMenu();
    const target = document.getElementById(`topbar-dropdown-${menuId}`);
    if (!target) return;
    const wasHidden = target.classList.contains('hidden');
    closeAllTopBarDropdowns();
    if (wasHidden) {
      target.classList.remove('hidden');
      playHarmonicChime([523.25], 0.1);
    }
  }
  window.toggleTopBarDropdown = toggleTopBarDropdown;

  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.top-menu-trigger') && !e.target.closest('.topbar-sub-dropdown')) {
      closeAllTopBarDropdowns();
    }
  });

  function closeFocusedWindow() {
    const w = getActiveWindow();
    if (w) closeWindow(w.id);
  }
  window.closeFocusedWindow = closeFocusedWindow;

  function minimizeFocusedWindow() {
    const w = getActiveWindow();
    if (w) minimizeWindow(w.id);
  }
  window.minimizeFocusedWindow = minimizeFocusedWindow;

  function maximizeFocusedWindow() {
    const w = getActiveWindow();
    if (w) maximizeWindow(w.id);
  }
  window.maximizeFocusedWindow = maximizeFocusedWindow;

  function snapFocusedWindow(side) {
    const w = getActiveWindow();
    if (w) applyWindowSnap(w, side);
  }
  window.snapFocusedWindow = snapFocusedWindow;

  function centerFocusedWindow() {
    const w = getActiveWindow();
    if (!w) return;
    w.style.transition = 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)';
    w.dataset.maximized = 'false';
    const width = parseInt(w.dataset.origWidth, 10) || 760;
    const height = parseInt(w.dataset.origHeight, 10) || 500;
    w.style.width = `${width}px`;
    w.style.height = `${height}px`;
    w.style.left = `${Math.max(20, Math.floor((window.innerWidth - width) / 2))}px`;
    w.style.top = `${Math.max(40, Math.floor((window.innerHeight - height) / 2) - 20)}px`;
    triggerNotification('Window centered on screen');
    setTimeout(() => { w.style.transition = ''; }, 240);
  }
  window.centerFocusedWindow = centerFocusedWindow;

  function bringAllWindowsToFront() {
    document.querySelectorAll('.window').forEach(w => {
      if (w.dataset.minimized === 'true') {
        openWindow(w.id);
      }
    });
    triggerNotification('All open windows brought to front');
  }
  window.bringAllWindowsToFront = bringAllWindowsToFront;

  function copyCurrentSelection() {
    const sel = window.getSelection()?.toString();
    if (sel && navigator.clipboard) {
      navigator.clipboard.writeText(sel).catch(() => {});
      triggerNotification('Copied selection to clipboard');
    } else {
      triggerNotification('Clipboard: Ready');
    }
  }
  window.copyCurrentSelection = copyCurrentSelection;

  function pasteToFocusedInput() {
    triggerNotification('Paste triggered');
  }
  window.pasteToFocusedInput = pasteToFocusedInput;

  function selectAllInActiveApp() {
    const w = getActiveWindow();
    if (w && w.id === 'win-scribe') {
      const inp = document.getElementById('scribe-input');
      if (inp) { inp.focus(); inp.select(); }
    }
    triggerNotification('Selected all content in active window');
  }
  window.selectAllInActiveApp = selectAllInActiveApp;

  function toggleTheme() {
    const isLight = document.body.classList.contains('light-mode');
    setTheme(isLight ? 'dark' : 'light');
  }
  window.toggleTheme = toggleTheme;

  function createNewScribeDoc() {
    const inp = document.getElementById('scribe-input');
    if (inp) {
      inp.value = `# Untitled Note — ${new Date().toLocaleTimeString()}\n\nWrite markdown or code here...\n`;
      if (typeof updateScribeStats === 'function') updateScribeStats();
      inp.focus();
    }
    triggerNotification('Scribe: Created new Markdown document');
  }
  window.createNewScribeDoc = createNewScribeDoc;

  function executeCommand(cmd) {
    const input = document.getElementById('term-input');
    if (input) {
      input.value = cmd;
      handleTerminalKey({ key: 'Enter', preventDefault: () => {} });
    }
  }
  window.executeCommand = executeCommand;

  // ==========================================================================
  // 20. PEAROS LAUNCHPAD & GNOME 47 VIRTUAL WORKSPACES ENGINE
  // ==========================================================================
  let currentWorkspace = 1;
  const workspaceWindowPresets = {
    1: ['win-cadence', 'win-horizon'],
    2: ['win-sonata', 'win-prism'],
    3: ['win-console', 'win-scribe', 'win-tempo']
  };

  function toggleLaunchpad() {
    const lp = document.getElementById('launchpad-overlay');
    if (!lp) return;
    const isHidden = lp.classList.contains('hidden');
    if (isHidden) {
      document.body.classList.add('launchpad-active');
      lp.classList.remove('hidden');
      const search = document.getElementById('launchpad-search-input');
      if (search) {
        search.value = '';
        filterLaunchpadApps('');
        setTimeout(() => search.focus(), 60);
      }
      playHarmonicChime([523.25, 659.25, 783.99], 0.22);
    } else {
      closeLaunchpad();
    }
  }
  window.toggleLaunchpad = toggleLaunchpad;

  function closeLaunchpad() {
    document.body.classList.remove('launchpad-active');
    document.getElementById('launchpad-overlay')?.classList.add('hidden');
  }
  window.closeLaunchpad = closeLaunchpad;

  function filterLaunchpadApps(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('#launchpad-app-grid .launchpad-item').forEach(item => {
      const name = (item.dataset.name || item.textContent || '').toLowerCase();
      item.style.display = (!q || name.includes(q)) ? 'flex' : 'none';
    });
  }
  window.filterLaunchpadApps = filterLaunchpadApps;

  function switchWorkspace(wsNum) {
    currentWorkspace = wsNum;
    [1, 2, 3].forEach(n => {
      document.getElementById(`ws-pill-${n}`)?.classList.toggle('active', n === wsNum);
      document.getElementById(`top-ws-dot-${n}`)?.classList.toggle('active', n === wsNum);
    });

    // Smooth workspace transition: show preset windows for the chosen workspace
    const targetWins = workspaceWindowPresets[wsNum] || ['win-cadence'];
    document.querySelectorAll('.window').forEach(w => {
      if (!targetWins.includes(w.id) && !w.classList.contains('hidden')) {
        w.classList.add('hidden');
      }
    });
    targetWins.forEach(id => openWindow(id));

    closeLaunchpad();
    playHarmonicChime([440, 554.37, 659.25], 0.22);
    const wsNames = { 1: 'Workspace 1 (Main Desktop)', 2: 'Workspace 2 (Creative & Audio)', 3: 'Workspace 3 (Dev & Terminal)' };
    triggerNotification(`Switched to ${wsNames[wsNum]}`);
  }
  window.switchWorkspace = switchWorkspace;

  // ==========================================================================
  // 21. ZORIN OS START MENU & DESKTOP RIGHT-CLICK CONTEXT MENU
  // ==========================================================================
  function toggleZorinStartMenu() {
    const menu = document.getElementById('zorin-start-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
  }
  window.toggleZorinStartMenu = toggleZorinStartMenu;

  function closeZorinStartMenu() {
    document.getElementById('zorin-start-menu')?.classList.add('hidden');
  }
  window.closeZorinStartMenu = closeZorinStartMenu;

  function filterZorinStartApps(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('#zorin-start-app-list .zorin-app-row').forEach(row => {
      const txt = row.textContent.toLowerCase();
      row.style.display = (!q || txt.includes(q)) ? 'flex' : 'none';
    });
  }
  window.filterZorinStartApps = filterZorinStartApps;

  document.addEventListener('pointerdown', (e) => {
    const zMenu = document.getElementById('zorin-start-menu');
    if (zMenu && !zMenu.classList.contains('hidden') && !e.target.closest('#zorin-start-menu') && !e.target.closest('#zorin-start-btn')) {
      closeZorinStartMenu();
    }
    const ctxMenu = document.getElementById('desktop-context-menu');
    if (ctxMenu && !ctxMenu.classList.contains('hidden') && !e.target.closest('#desktop-context-menu')) {
      closeDesktopContextMenu();
    }
  });

  const desktopEl = document.getElementById('desktop');
  const contextMenuEl = document.getElementById('desktop-context-menu');

  desktopEl?.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.window') || e.target.closest('#menu-bar') || e.target.closest('#dock')) return;
    e.preventDefault();
    if (!contextMenuEl) return;
    const x = Math.min(e.clientX, window.innerWidth - 240);
    const y = Math.min(e.clientY, window.innerHeight - 280);
    contextMenuEl.style.left = `${x}px`;
    contextMenuEl.style.top = `${y}px`;
    contextMenuEl.classList.remove('hidden');
    playHarmonicChime([523.25], 0.08);
  });

  function closeDesktopContextMenu() {
    contextMenuEl?.classList.add('hidden');
  }
  window.closeDesktopContextMenu = closeDesktopContextMenu;

  function cleanUpDesktopIcons() {
    triggerNotification('Desktop icons aligned to Retina grid');
    playHarmonicChime([523.25, 659.25], 0.15);
  }
  window.cleanUpDesktopIcons = cleanUpDesktopIcons;

  // ==========================================================================
  // 22. SYSTEM SETTINGS INTERACTIVE CONTROLLERS (All 14 Tabs 100% Live)
  // ==========================================================================
  function activateSegmentBtn(btnEl) {
    if (!btnEl || !btnEl.parentElement) return;
    btnEl.parentElement.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    playHarmonicChime([523.25], 0.1);
  }
  window.activateSegmentBtn = activateSegmentBtn;

  function toggleMenuBarItem(elementId, visible, label) {
    const el = document.getElementById(elementId);
    if (el) {
      el.style.display = visible ? '' : 'none';
    }
    triggerNotification(`${label} ${visible ? 'shown in' : 'hidden from'} Menu Bar`);
    playHarmonicChime([480], 0.1);
  }
  window.toggleMenuBarItem = toggleMenuBarItem;

  function setDockSize(size, btnEl) {
    activateSegmentBtn(btnEl);
    document.body.classList.remove('dock-size-small', 'dock-size-large');
    const desc = document.getElementById('dock-size-desc');
    if (size === 'small') {
      document.body.classList.add('dock-size-small');
      if (desc) desc.textContent = 'Compact squircle size: 40px';
      triggerNotification('Dock Size: Small (40px)');
    } else if (size === 'large') {
      document.body.classList.add('dock-size-large');
      if (desc) desc.textContent = 'Expanded squircle size: 60px';
      triggerNotification('Dock Size: Large (60px)');
    } else {
      if (desc) desc.textContent = 'Default squircle size: 52px';
      triggerNotification('Dock Size: Medium (52px)');
    }
    setTimeout(cacheDockMetrics, 120);
  }
  window.setDockSize = setDockSize;

  function toggleDockMagnification(enabled) {
    dockMagnificationEnabled = enabled;
    triggerNotification(enabled ? 'Dock Fisheye Magnification Enabled' : 'Dock Magnification Disabled');
    playHarmonicChime([523.25], 0.1);
  }
  window.toggleDockMagnification = toggleDockMagnification;

  function setDockPosition(pos, btnEl) {
    activateSegmentBtn(btnEl);
    document.body.classList.remove('dock-pos-left', 'dock-pos-right');
    if (pos === 'left') {
      document.body.classList.add('dock-pos-left');
      triggerNotification('Dock Position: Left Screen Edge');
    } else if (pos === 'right') {
      document.body.classList.add('dock-pos-right');
      triggerNotification('Dock Position: Right Screen Edge');
    } else {
      triggerNotification('Dock Position: Bottom Floating Pill');
    }
    setTimeout(cacheDockMetrics, 150);
  }
  window.setDockPosition = setDockPosition;

  function setMinimizeEffect(effect, btnEl) {
    activateSegmentBtn(btnEl);
    triggerNotification(`Minimize Effect: ${effect === 'genie' ? 'Genie Curved Animation' : 'Linear Scale Animation'}`);
  }
  window.setMinimizeEffect = setMinimizeEffect;

  function toggleDockAutohide(enabled) {
    document.body.classList.toggle('dock-autohide', enabled);
    triggerNotification(enabled ? 'Dock Auto-Hide Enabled (Hover bottom edge to reveal)' : 'Dock Always Visible');
    playHarmonicChime([440], 0.12);
  }
  window.toggleDockAutohide = toggleDockAutohide;

  function setDisplayResolution(mode, btnEl) {
    activateSegmentBtn(btnEl);
    const desc = document.getElementById('display-res-desc');
    if (mode === 'scaled') {
      if (desc) desc.textContent = '2560 × 1440 (Larger Text • 125% UI Scale)';
      triggerNotification('Resolution: 2560×1440 HiDPI Scaled');
    } else if (mode === 'morespace') {
      if (desc) desc.textContent = '4096 × 2304 (More Space • Native Studio Canvas)';
      triggerNotification('Resolution: 4096×2304 More Space');
    } else {
      if (desc) desc.textContent = '3840 × 2160 (HiDPI 200% Crisp Scaling)';
      triggerNotification('Resolution: 3840×2160 4K Retina');
    }
  }
  window.setDisplayResolution = setDisplayResolution;

  function setRefreshRate(hz, btnEl) {
    activateSegmentBtn(btnEl);
    triggerNotification(`Display Refresh Rate locked to ${hz} V-Sync`);
  }
  window.setRefreshRate = setRefreshRate;

  function toggleTrueTone(enabled) {
    document.body.classList.toggle('true-tone-active', enabled);
    triggerNotification(enabled ? 'True Tone / Night Light Warmth Active' : 'True Tone Disabled (Standard D65)');
    playHarmonicChime([523.25], 0.12);
  }
  window.toggleTrueTone = toggleTrueTone;

  function setDisplayBrightness(val) {
    const pct = Math.max(35, Math.min(100, Number(val) || 100));
    document.documentElement.style.setProperty('--screen-brightness', (pct / 100).toFixed(2));
    const fill = document.getElementById('display-track-fill');
    if (fill) fill.style.width = `${pct}%`;
  }
  window.setDisplayBrightness = setDisplayBrightness;

  function setMasterVolume(val) {
    const pct = Math.max(0, Math.min(100, Number(val) || 0));
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime((pct / 100) * 0.14, audioCtx.currentTime);
    }
    const fill = document.getElementById('sound-track-fill');
    if (fill) fill.style.width = `${pct}%`;
    const lbl = document.getElementById('settings-volume-label');
    if (lbl) lbl.textContent = `${pct}% Studio Gain`;
    const slider = document.getElementById('settings-volume-slider');
    if (slider && Number(slider.value) !== pct) slider.value = pct;
  }
  window.setMasterVolume = setMasterVolume;

  function setSettingsAudioOutput(btnEl, sinkName) {
    if (btnEl && btnEl.parentElement) {
      btnEl.parentElement.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
      btnEl.classList.add('active');
    }
    const desc = document.getElementById('settings-audio-sink-desc');
    if (desc) desc.textContent = `Default system audio sink device: ${sinkName}`;
    triggerNotification(`PipeWire Output routed to ${sinkName}`);
    playHarmonicChime([523.25, 659.25], 0.15);
  }
  window.setSettingsAudioOutput = setSettingsAudioOutput;

  function toggleLowPowerMode(enabled) {
    const pctEl = document.getElementById('menubar-battery-pct');
    if (pctEl) pctEl.style.color = enabled ? '#ffcc00' : '';
    triggerNotification(enabled ? 'Low Power Mode Enabled (Energy Saver active)' : 'Low Power Mode Disabled');
    playHarmonicChime([440], 0.12);
  }
  window.toggleLowPowerMode = toggleLowPowerMode;

  let snapshotCounter = 15;
  function createBtrfsSnapshot() {
    const tbody = document.getElementById('snapshots-table-body');
    const countLabel = document.getElementById('snapshot-count-label');
    const id = snapshotCounter++;
    if (tbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Snapshot #${id} (Live User Checkpoint)</td>
        <td>Just now</td>
        <td>4 MB</td>
        <td><button class="btn btn-secondary" style="padding: 2px 8px; font-size: 11px;" onclick="triggerNotification('Rolled back to Snapshot #${id} in 0.04s!')">Restore</button></td>
      `;
      tbody.prepend(tr);
    }
    if (countLabel) {
      countLabel.textContent = `${id} Snapshots Available`;
    }
    playHarmonicChime([261.63, 329.63, 392, 523.25], 0.25);
    triggerNotification(`Created Btrfs Snapshot #${id} in 0.02s`);
  }
  window.createBtrfsSnapshot = createBtrfsSnapshot;

  // ==========================================================================
  // 23. GALLERY SOFTWARE STORE, MESSAGES.APP & MAIL.APP CONTROLLERS
  // ==========================================================================
  function switchStoreCategory(cat, rowEl) {
    document.querySelectorAll('#win-installer .finder-sidebar .sidebar-row').forEach(r => r.classList.remove('active'));
    rowEl?.classList.add('active');
    document.querySelectorAll('#store-apps-grid .store-app-card').forEach(card => {
      const c = card.dataset.category;
      card.style.display = (cat === 'all' || c === cat) ? 'flex' : 'none';
    });
    playHarmonicChime([523.25], 0.1);
  }
  window.switchStoreCategory = switchStoreCategory;

  function filterStoreApps(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('#store-apps-grid .store-app-card').forEach(card => {
      const txt = (card.dataset.name || card.textContent || '').toLowerCase();
      card.style.display = (!q || txt.includes(q)) ? 'flex' : 'none';
    });
  }
  window.filterStoreApps = filterStoreApps;

  function installStoreApp(btnEl, appName, targetWindow) {
    if (!btnEl) return;
    if (btnEl.dataset.installed === 'true') {
      if (targetWindow && targetWindow.startsWith('win-')) openWindow(targetWindow);
      return;
    }
    btnEl.disabled = true;
    btnEl.textContent = 'Installing...';
    playHarmonicChime([440, 554.37], 0.18);

    setTimeout(() => {
      btnEl.disabled = false;
      btnEl.dataset.installed = 'true';
      btnEl.textContent = 'Open';
      btnEl.className = 'btn btn-secondary';
      const card = btnEl.closest('.store-app-card');
      if (card) card.dataset.category = 'installed';

      // Also add to Finder Applications if not already there
      const appsGrid = document.getElementById('cadence-view-apps');
      if (appsGrid && !appsGrid.querySelector(`[data-installed-app="${appName}"]`)) {
        const div = document.createElement('div');
        div.className = 'app-card';
        div.dataset.installedApp = appName;
        div.onclick = function () { selectFile(this, `${appName}.app`, 'Installed Store Application', '128 MB'); };
        div.ondblclick = function () {
          if (targetWindow && targetWindow.startsWith('win-')) openWindow(targetWindow);
          else triggerNotification(`Launched ${appName}`);
        };
        div.innerHTML = `
          <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#007aff,#5856d6);display:flex;align-items:center;justify-content:center;color:white;box-shadow:0 4px 12px rgba(0,122,255,0.3);"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
          <span class="app-title">${appName}.app</span>
        `;
        appsGrid.appendChild(div);
      }

      playHarmonicChime([523.25, 659.25, 783.99, 1046.5], 0.3);
      triggerNotification(`${appName} installed to /Applications!`);
    }, 900);
  }
  window.installStoreApp = installStoreApp;

  // --- Messages.app ---
  const messageThreads = [
    {
      name: 'Alex (Studio Engineer)',
      messages: [
        { from: 'incoming', text: 'Hey! Have you tested the new PipeWire 0.6ms buffer in Sonata?' },
        { from: 'outgoing', text: 'Yes! Zero audio dropouts even with 120Hz window dragging.' },
        { from: 'incoming', text: 'PipeWire latency is 0.6ms! Way cleaner than Windows WASAPI.' }
      ]
    },
    {
      name: 'Zorin & pearOS Core Team',
      messages: [
        { from: 'incoming', text: 'We just merged the pearOS Launchpad + Zorin Taskbar layout switcher.' },
        { from: 'incoming', text: 'GNOME 47 workspaces ready — try clicking Activities in the top bar!' }
      ]
    },
    {
      name: 'Maestro AI Assistant',
      messages: [
        { from: 'incoming', text: 'Hello! I am Maestro, your local zero-telemetry Toccata assistant. Ask me anything!' }
      ]
    }
  ];
  let activeThreadIdx = 0;

  function renderMessageThread() {
    const thread = messageThreads[activeThreadIdx];
    const headerEl = document.getElementById('messages-recipient-name');
    const historyEl = document.getElementById('messages-chat-history');
    if (headerEl && thread) headerEl.textContent = thread.name;
    if (historyEl && thread) {
      historyEl.innerHTML = thread.messages.map(m => `
        <div class="chat-bubble ${m.from}">${escapeHtml(m.text)}</div>
      `).join('');
      historyEl.scrollTop = historyEl.scrollHeight;
    }
  }

  function selectMessageThread(idx, rowEl) {
    activeThreadIdx = idx;
    document.querySelectorAll('#win-messages .finder-sidebar .sidebar-row').forEach(r => r.classList.remove('active'));
    rowEl?.classList.add('active');
    renderMessageThread();
    playHarmonicChime([523.25], 0.1);
  }
  window.selectMessageThread = selectMessageThread;

  function sendChatMessage() {
    const input = document.getElementById('messages-input-box');
    if (!input) return;
    const txt = input.value.trim();
    if (!txt) return;
    input.value = '';
    messageThreads[activeThreadIdx].messages.push({ from: 'outgoing', text: txt });
    renderMessageThread();
    playHarmonicChime([587.33, 783.99], 0.15);

    setTimeout(() => {
      const replies = [
        'Sounds awesome! Everything is running at 120Hz.',
        'Got it! Synced across your local Btrfs volume.',
        'Maestro: Command verified with zero telemetry.'
      ];
      messageThreads[activeThreadIdx].messages.push({
        from: 'incoming',
        text: replies[activeThreadIdx % replies.length]
      });
      renderMessageThread();
      playHarmonicChime([523.25], 0.12);
    }, 650);
  }
  window.sendChatMessage = sendChatMessage;

  renderMessageThread();

  // --- Mail.app ---
  const mailItems = [
    {
      subject: 'Welcome to Toccata OS (pearOS + Zorin + GNOME 47)',
      from: 'From: core@toccata.os • Today, 1:45 AM',
      body: `<p>Welcome to <strong>Toccata OS</strong>! Your desktop environment combines the finest workflows of <strong>pearOS NiceC0re</strong>, <strong>Zorin OS 18</strong>, and <strong>GNOME 47</strong>:</p>
             <ul style="margin: 10px 0 10px 20px;">
               <li>Switch instantly between <strong>macOS Sequoia</strong>, <strong>pearOS</strong>, <strong>Windows 11 (Zorin Start Menu)</strong>, and <strong>GNOME 47</strong> in System Settings &rarr; Desktop &amp; Dock.</li>
               <li>Drag any window to the left, right, or top screen edge to trigger <strong>Zorin / GNOME Window Tiling</strong>.</li>
               <li>Click <strong>Launchpad</strong> or <strong>Activities</strong> to switch between Virtual Workspaces 1, 2, and 3.</li>
             </ul>`
    },
    {
      subject: '0.667ms Bit-Perfect Audio Verified on PipeWire',
      from: 'From: studio@pipewire.io • Yesterday, 8:15 PM',
      body: `<p>Your hardware audio sink is locked at <strong>64 frames / 96,000 Hz</strong> with zero resampling jitter.</p>
             <p style="margin-top:8px;">Open <strong>Sonata.app</strong> or <strong>System Settings &rarr; Sound</strong> to switch between Internal Speakers, AirPods Pro, and Studio USB DAC.</p>`
    },
    {
      subject: 'Production Deployment Live on toccataos.vercel.app',
      from: 'From: ci-cd@vercel.com • Yesterday, 4:30 PM',
      body: `<p>Your repository <code>kicode01/toccata-os</code> is connected to automatic production deployments and 1:1 QEMU VM live-sync.</p>`
    }
  ];

  function selectMailItem(idx, rowEl) {
    document.querySelectorAll('#mail-inbox-list .sidebar-row').forEach(r => r.classList.remove('active'));
    rowEl?.classList.add('active');
    const item = mailItems[idx];
    if (!item) return;
    const subj = document.getElementById('mail-subject');
    const from = document.getElementById('mail-from');
    const body = document.getElementById('mail-body');
    if (subj) subj.textContent = item.subject;
    if (from) from.textContent = item.from;
    if (body) body.innerHTML = item.body;
    playHarmonicChime([523.25], 0.1);
  }
  window.selectMailItem = selectMailItem;

  function promptComposeMail() {
    const replyInput = document.getElementById('mail-quick-reply');
    if (replyInput) replyInput.focus();
    triggerNotification('Mail: Ready to compose message below');
  }
  window.promptComposeMail = promptComposeMail;

  function sendQuickMailReply() {
    const replyInput = document.getElementById('mail-quick-reply');
    if (!replyInput || !replyInput.value.trim()) {
      triggerNotification('Write a reply message first');
      return;
    }
    const txt = replyInput.value.trim();
    replyInput.value = '';
    const body = document.getElementById('mail-body');
    if (body) {
      body.innerHTML += `<div style="margin-top:14px;padding:10px 14px;border-radius:10px;background:rgba(0,122,255,0.14);border-left:3px solid var(--accent-color);"><strong>You replied:</strong><br>${escapeHtml(txt)}</div>`;
    }
    playHarmonicChime([523.25, 659.25, 783.99], 0.2);
    triggerNotification('Mail reply sent via encrypted bridge');
  }
  window.sendQuickMailReply = sendQuickMailReply;

  // Initial focus
  bringToFront(document.getElementById('win-cadence'));

  // ==========================================================================
  // TOCCATA OS ANIMATED WELCOME / BOOT SPLASH CONTROLLER
  // ==========================================================================
  let bootSplashTimer = null;
  let bootSplashCleanupTimer = null;

  function dismissBootSplash() {
    const splash = document.getElementById('toccata-boot-splash');
    if (!splash || splash.classList.contains('boot-dismissed')) return;
    if (bootSplashTimer) {
      clearTimeout(bootSplashTimer);
      bootSplashTimer = null;
    }
    // Pentatonic chord: F3, A3, C#4, E4, A4 (330Hz root)
    playHarmonicChime([330, 440, 554.37, 659.25, 880], 0.45);
    splash.classList.add('boot-dismissed');

    // Teardown GPU compositor layer after CSS opacity fade (0.6s) completes
    if (bootSplashCleanupTimer) clearTimeout(bootSplashCleanupTimer);
    bootSplashCleanupTimer = setTimeout(() => {
      splash.style.display = 'none';
    }, 650);
  }
  window.dismissBootSplash = dismissBootSplash;

  function replayBootSplash() {
    const splash = document.getElementById('toccata-boot-splash');
    if (!splash) return;
    if (bootSplashTimer) {
      clearTimeout(bootSplashTimer);
      bootSplashTimer = null;
    }
    if (bootSplashCleanupTimer) {
      clearTimeout(bootSplashCleanupTimer);
      bootSplashCleanupTimer = null;
    }
    splash.style.display = 'flex';
    splash.classList.remove('boot-dismissed');

    // Cleanly re-trigger keyframe animations without destructive DOM replacement
    const animatedElements = splash.querySelectorAll('.boot-seed-pill, .boot-svg-emblem, .boot-part-bar, .boot-part-fork, .boot-volumetric-stack, .boot-echo');
    animatedElements.forEach(el => {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });

    playHarmonicChime([330, 440, 554.37, 659.25, 880], 0.5);
    bootSplashTimer = setTimeout(dismissBootSplash, 3350);
  }
  window.replayBootSplash = replayBootSplash;

  // Startup chord on initial boot (silently handled if autoplay policy awaits user gesture)
  try {
    playHarmonicChime([330, 440, 554.37, 659.25, 880], 0.45);
  } catch (e) {}

  // Auto-dismiss initial welcome boot splash after volumetric sweep finishes
  bootSplashTimer = setTimeout(dismissBootSplash, 3350);

  // ==========================================================================
  // LIVE-SYNC HOT RELOAD (1:1 Instant Updates inside Native Linux Kiosk / VM)
  // ==========================================================================
  if (IS_NATIVE_KIOSK) {
    let knownAssetsMtime = null;
    setInterval(async () => {
      try {
        const res = await fetch('/api/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.assets_mtime) {
          if (knownAssetsMtime === null) {
            knownAssetsMtime = data.assets_mtime;
          } else if (data.assets_mtime !== knownAssetsMtime) {
            knownAssetsMtime = data.assets_mtime;
            window.location.reload();
          }
        }
      } catch (e) {
        // Ignore transient network errors
      }
    }, 1200);
  }

  // Automated Test & Verification Hook
  const testParam = new URLSearchParams(window.location.search).get('test');
  if (testParam) {
    if (typeof dismissBootSplash === 'function') dismissBootSplash();
    const splash = document.getElementById('toccata-boot-splash');
    if (splash) splash.style.display = 'none';

    if (testParam === 'windows') {
      openWindow('win-settings');
      openWindow('win-installer');
      openWindow('win-calc');
    } else if (testParam === 'battery') {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      openWindow('win-settings');
      switchSettingsTab('battery');
    } else if (testParam === 'appearance') {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      openWindow('win-settings');
      switchSettingsTab('appearance');
    } else if (testParam === 'launchpad_cadence') {
      openWindow('win-cadence');
      openWindow('win-messages');
      toggleLaunchpad();
    } else if (testParam === 'launchpad') {
      toggleLaunchpad();
    } else if (testParam === 'spotlight') {
      toggleSpotlight();
    } else if (testParam === 'zorin') {
      toggleZorinStartMenu();
    }
  }
})();
