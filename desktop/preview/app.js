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
    'win-cadence': document.querySelector('.dock-item[data-app="Cadence"]'),
    'win-horizon': document.querySelector('.dock-item[data-app="Horizon"]'),
    'win-scribe': document.querySelector('.dock-item[data-app="Scribe"]'),
    'win-sonata': document.querySelector('.dock-item[data-app="Sonata"]'),
    'win-tempo': document.querySelector('.dock-item[data-app="Tempo"]'),
    'win-console': document.querySelector('.dock-item[data-app="Console"]'),
    'win-calc': document.querySelector('.dock-item[data-app="Calculator"]'),
    'win-prism': document.querySelector('.dock-item[data-app="Prism"]'),
    'win-chronicle': document.querySelector('.dock-item[data-app="Chronicle"]'),
    'win-installer': document.querySelector('.dock-item[data-app="Gallery"]'),
    'win-settings': document.querySelector('.dock-item[data-app="System Settings"]')
  };

  const windowDotMap = {
    'win-cadence': document.getElementById('dot-cadence'),
    'win-horizon': document.getElementById('dot-horizon'),
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

  function bringToFront(windowEl) {
    if (!windowEl) return;
    topZIndex += 1;
    windowEl.style.zIndex = topZIndex;

    const windows = document.querySelectorAll('.window');
    for (let i = 0; i < windows.length; i++) {
      windows[i].classList.remove('active-window');
    }
    windowEl.classList.add('active-window');

    const titleEl = windowEl.querySelector('.window-title');
    if (titleEl && activeAppTitle) {
      const rawTitle = titleEl.textContent;
      activeAppTitle.textContent = rawTitle.includes('—') ? rawTitle.split('—')[0].trim() : rawTitle.trim();
    }
  }
  window.bringToFront = bringToFront;

  function triggerDockBounce(dockItem) {
    if (!dockItem) return;
    const icon = dockItem.querySelector('.mac-app-icon');
    if (!icon) return;
    icon.classList.remove('dock-bounce-icon');
    void icon.offsetWidth; // Force reflow to immediately restart animation
    icon.classList.add('dock-bounce-icon');
    setTimeout(() => {
      icon.classList.remove('dock-bounce-icon');
    }, 650);
  }

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
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

      // Re-assign active window title
      const visibleWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
      if (visibleWindows.length > 0) {
        visibleWindows.sort((a, b) => (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0));
        bringToFront(visibleWindows[0]);
      } else if (activeAppTitle) {
        activeAppTitle.textContent = 'Cadence';
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

      // Re-assign active window title
      const visibleWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
      if (visibleWindows.length > 0) {
        visibleWindows.sort((a, b) => (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0));
        bringToFront(visibleWindows[0]);
      } else if (activeAppTitle) {
        activeAppTitle.textContent = 'Cadence';
      }
    }, 300);
  }
  window.minimizeWindow = minimizeWindow;

  function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;

    win.style.transition = 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1), left 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.25s ease';

    if (win.dataset.maximized === 'true') {
      win.style.top = win.dataset.origTop;
      win.style.left = win.dataset.origLeft;
      win.style.width = win.dataset.origWidth;
      win.style.height = win.dataset.origHeight;
      win.style.borderRadius = '14px';
      win.dataset.maximized = 'false';
    } else {
      win.dataset.origTop = win.style.top || `${win.offsetTop}px`;
      win.dataset.origLeft = win.style.left || `${win.offsetLeft}px`;
      win.dataset.origWidth = win.style.width || `${win.offsetWidth}px`;
      win.dataset.origHeight = win.style.height || `${win.offsetHeight}px`;

      win.style.top = '28px';
      win.style.left = '0';
      win.style.width = '100vw';
      win.style.height = 'calc(100vh - 28px)';
      win.style.borderRadius = '0';
      win.dataset.maximized = 'true';
    }

    setTimeout(() => {
      win.style.transition = '';
    }, 260);
  }
  window.maximizeWindow = maximizeWindow;

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

  // Single global pointermove & pointerup listener for the entire desktop
  window.addEventListener('pointermove', (e) => {
    if (activeDragWin) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      const instantVx = e.clientX - dragLastX;
      dragLastX = e.clientX;
      dragSmoothedVx = dragSmoothedVx * 0.65 + instantVx * 0.35;

      dragCurX = dragInitLeft + dx;
      dragCurY = Math.max(28, dragInitTop + dy); // Clamp below top bar

      if (!dragRafId) {
        dragRafId = requestAnimationFrame(updateDragFrame);
      }
    } else if (activeResizeWin) {
      const minW = activeResizeWin.classList.contains('calc-window') ? 270 : 380;
      const minH = activeResizeWin.classList.contains('calc-window') ? 380 : 240;

      if (resizeHandleType.includes('r')) {
        resizeCurW = Math.max(minW, resizeStartW + (e.clientX - resizeStartX));
      }
      if (resizeHandleType.includes('b')) {
        resizeCurH = Math.max(minH, resizeStartH + (e.clientY - resizeStartY));
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

  function cacheDockMetrics() {
    cachedItemMetrics = dockItems.map(item => {
      const rect = item.getBoundingClientRect();
      return { el: item, centerX: rect.left + rect.width / 2 };
    });
  }

  window.addEventListener('resize', cacheDockMetrics, { passive: true });
  dock?.addEventListener('mouseenter', cacheDockMetrics, { passive: true });

  dock?.addEventListener('mousemove', (e) => {
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
    // Don't spawn on window titlebars during drag start or resizers
    if (e.target.closest('.window-titlebar') || e.target.closest('.window-resizer')) return;

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
        <span style="font-size: 20px;">📂</span> <span>Cadence (Files & Workspaces)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-scribe'); toggleSpotlight();">
        <span style="font-size: 20px;">📝</span> <span>Scribe (Notes & Code)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-tempo'); toggleSpotlight();">
        <span style="font-size: 20px;">⚡</span> <span>Tempo (Activity Monitor)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-settings'); toggleSpotlight();">
        <span style="font-size: 20px;">⚙️</span> <span>System Settings</span>
      </div>
      <div class="result-item" onclick="openWindow('win-installer'); toggleSpotlight();">
        <span style="font-size: 20px;">💎</span> <span>Gallery & Installer</span>
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
          <span style="font-size: 22px;">🔢</span>
          <div style="font-size: 20px; font-weight: 700;">= ${mathResult.toLocaleString()}</div>
        </div>
      `;
      return;
    }

    const lowerQ = query.toLowerCase();

    // Windows Commands & Muscle Memory Intelligent Bridge
    const winCommands = [
      { cmd: 'ipconfig', icon: '🖧', title: 'ipconfig — 192.168.1.145 (Toccata-5G Fiber)', action: "triggerNotification('IP: 192.168.1.145 • Gateway: 192.168.1.1 • DNS: 1.1.1.1'); toggleSpotlight();" },
      { cmd: 'taskmgr', icon: '⚡', title: 'Task Manager → Tempo Activity Monitor', action: "openWindow('win-tempo'); toggleSpotlight();" },
      { cmd: 'tasklist', icon: '⚡', title: 'tasklist → Tempo Activity Monitor', action: "openWindow('win-tempo'); toggleSpotlight();" },
      { cmd: 'explorer', icon: '📂', title: 'File Explorer → Cadence Files', action: "openWindow('win-cadence'); toggleSpotlight();" },
      { cmd: 'dir', icon: '📂', title: 'dir / ls → Cadence File System', action: "openWindow('win-cadence'); toggleSpotlight();" },
      { cmd: 'notepad', icon: '📝', title: 'Notepad → Scribe Prose Canvas', action: "openWindow('win-scribe'); toggleSpotlight();" },
      { cmd: 'control', icon: '⚙️', title: 'Control Panel → System Settings', action: "openWindow('win-settings'); toggleSpotlight();" },
      { cmd: 'winget', icon: '💎', title: 'winget install → Gallery & Installer Sheet', action: "openWindow('win-installer'); toggleSpotlight();" },
      { cmd: 'systeminfo', icon: 'ℹ️', title: 'systeminfo → Toccata OS (6.11 XanMod • 120Hz Wayland)', action: "triggerNotification('Toccata OS 1.0 • 800MB Idle RAM • PipeWire 0.7ms'); toggleSpotlight();" }
    ];

    const winMatch = winCommands.find(w => w.cmd.startsWith(lowerQ) || lowerQ.startsWith(w.cmd));
    if (winMatch) {
      spotlightResults.innerHTML = `
        <div class="result-item selected" onclick="${winMatch.action}">
          <span style="font-size: 22px;">${winMatch.icon}</span>
          <div>
            <div style="font-weight: 700; font-size: 15px;">${winMatch.title}</div>
            <div style="font-size: 11px; opacity: 0.75;">Windows Command Bridge • Instant Zero-Terminal Execution</div>
          </div>
        </div>
      `;
      return;
    }

    const appIndex = [
      { name: 'Cadence (Files & Explorer)', icon: '📂', id: 'win-cadence' },
      { name: 'Horizon (Sovereign Web Browser)', icon: '🧭', id: 'win-horizon' },
      { name: 'Scribe (Notes & Code Canvas)', icon: '📝', id: 'win-scribe' },
      { name: 'Sonata (Lossless Hi-Fi & PipeWire Player)', icon: '🎼', id: 'win-sonata' },
      { name: 'Tempo (Task Manager & Activity Monitor)', icon: '⚡', id: 'win-tempo' },
      { name: 'Console (Terminal & Command Bridge)', icon: '💻', id: 'win-console' },
      { name: 'Calculator (Solfege Precision)', icon: '🔢', id: 'win-calc' },
      { name: 'Prism (Photos & Vector Inspector)', icon: '💎', id: 'win-prism' },
      { name: 'Chronicle (Calendar & Focus Clock)', icon: '📅', id: 'win-chronicle' },
      { name: 'Gallery & Installer (App Store & winget)', icon: '🛍️', id: 'win-installer' },
      { name: 'System Settings (Control Panel)', icon: '⚙️', id: 'win-settings' }
    ];

    const matches = appIndex.filter(a => a.name.toLowerCase().includes(lowerQ));

    if (matches.length > 0) {
      spotlightResults.innerHTML = matches.map(m => `
        <div class="result-item" onclick="openWindow('${m.id}'); toggleSpotlight();">
          <span style="font-size: 20px;">${m.icon}</span> <span>${m.name}</span>
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

    // Cmd + W: Close Active Window
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
    setTimeout(() => {
      window.close();
      // Graceful fallback if browser restricts script close
      document.body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#09090b;color:#a1a1aa;font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;user-select:none;">
          <div style="font-size:52px;margin-bottom:16px;">⏻</div>
          <h2 style="color:white;font-size:24px;margin-bottom:8px;font-weight:700;">Toccata OS Terminated</h2>
          <p style="font-size:14px;max-width:400px;line-height:1.6;margin-bottom:24px;color:#71717a;">
            You can safely close this window or press <strong style="color:white;">Alt + F4</strong> to return to your Windows desktop.
          </p>
          <button onclick="location.reload()" style="background:#007aff;color:white;border:none;padding:10px 22px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(0,122,255,0.4);">Restart Desktop</button>
        </div>
      `;
    }, 350);
  }
  window.exitToWindows = exitToWindows;

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

  // Control Center Sliders
  document.querySelectorAll('.slider-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      const rect = pill.getBoundingClientRect();
      const pct = Math.max(10, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      const fill = pill.querySelector('.slider-track-fill');
      if (fill) fill.style.width = `${pct}%`;
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

    if (layout === 'win11') {
      document.body.classList.add('layout-win11');
      triggerNotification('Layout: Windows 11 Modern (Zorin Taskbar) active');
      playHarmonicChime([440, 554.37], 0.2);
    } else if (layout === 'win10') {
      document.body.classList.add('layout-win10');
      triggerNotification('Layout: Windows 10 Classic (Zorin Legacy) active');
      playHarmonicChime([392, 523.25], 0.2);
    } else if (layout === 'gnome') {
      document.body.classList.add('layout-gnome');
      triggerNotification('Layout: GNOME 47 / Zorin Overview active');
      playHarmonicChime([330, 440, 554.37], 0.22);
    } else if (layout === 'pearos') {
      document.body.classList.add('layout-pearos', 'layout-macos');
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
      triggerNotification('Layout: macOS Sequoia Floating Dock active');
      playHarmonicChime([523.25, 659.25, 783.99], 0.25);
    }
  }
  window.setDesktopLayout = setDesktopLayout;

  // ==========================================================================
  // 11. THEME & ACCENT SYSTEM
  // ==========================================================================
  function setTheme(theme) {
    document.body.className = theme === 'light' ? 'light-mode' : 'dark-mode';
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
  let currentSelectedFile = {
    name: 'Toccata Manifesto.md',
    type: 'Markdown Document',
    size: '4.2 KB',
    meta: 'Markdown Document • 4.2 KB • Modified Today at 1:40 AM',
    icon: '📄',
    actionText: 'Open with Scribe',
    actionApp: 'win-scribe'
  };

  function selectFile(el, name, type, size) {
    document.querySelectorAll('.finder-grid-view .app-card, .finder-list-view .file-row').forEach(item => {
      item.classList.remove('selected');
    });
    if (el) el.classList.add('selected');

    let icon = '📄';
    let actionText = 'Open';
    let actionApp = 'win-scribe';

    const lower = name.toLowerCase();
    if (lower.endsWith('.md') || lower.endsWith('.rtf') || lower.endsWith('.txt')) {
      icon = '📄';
      actionText = 'Open with Scribe';
      actionApp = 'win-scribe';
    } else if (lower.endsWith('.flac') || lower.endsWith('.mp3') || lower.endsWith('.wav')) {
      icon = '🎵';
      actionText = 'Play in Sonata';
      actionApp = 'win-sonata';
    } else if (lower.endsWith('.zip') || lower.endsWith('.tar.gz')) {
      icon = '📦';
      actionText = 'Extract Archive';
      actionApp = 'extract';
    } else if (lower.endsWith('.dmg') || lower.endsWith('.exe') || lower.endsWith('.msi')) {
      icon = '🪟';
      actionText = 'Open in Gallery';
      actionApp = 'win-installer';
    } else if (lower.endsWith('.app')) {
      icon = '⚡';
      actionText = 'Launch Application';
      actionApp = lower.includes('scribe') ? 'win-scribe' :
                  lower.includes('sonata') ? 'win-sonata' :
                  lower.includes('settings') ? 'win-settings' :
                  lower.includes('tempo') ? 'win-tempo' :
                  lower.includes('gallery') ? 'win-installer' : 'win-cadence';
    } else if (lower.endsWith('.pdf')) {
      icon = '📕';
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

    playHarmonicChime([480], 0.12);
  }
  window.selectFile = selectFile;

  function switchCadenceFolder(folderId) {
    const folders = {
      'apps': { view: 'cadence-view-apps', title: 'Cadence — Applications', status: '10 items • 418.5 GB available on Toccata Core', path: 'Applications' },
      'docs': { view: 'cadence-view-docs', title: 'Cadence — Documents', status: '4 items • 418.5 GB available on Toccata Core', path: 'Documents' },
      'downloads': { view: 'cadence-view-downloads', title: 'Cadence — Downloads', status: '3 items • 418.5 GB available on Toccata Core', path: 'Downloads' },
      'disk': { view: 'cadence-view-disk', title: 'Cadence — Toccata Core (NVMe Storage)', status: '1.0 TB Total • 418.5 GB Available • Btrfs Compressed', path: 'Toccata Core' }
    };

    const target = folders[folderId];
    if (!target) return;

    // Update active sidebar row
    document.querySelectorAll('.finder-sidebar .sidebar-row').forEach(row => row.classList.remove('active'));
    document.getElementById(`sb-row-${folderId}`)?.classList.add('active');

    // Toggle view containers
    ['apps', 'docs', 'downloads', 'disk'].forEach(f => {
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
    if (titleEl) titleEl.innerHTML = `<span class="proxy-icon">📂</span>${target.title}`;

    const statusEl = document.querySelector('.finder-statusbar span');
    if (statusEl) statusEl.textContent = target.status;

    const pathEl = document.getElementById('finder-current-path');
    if (pathEl) pathEl.textContent = target.path;

    playHarmonicChime([523.25], 0.15);
  }
  window.switchCadenceFolder = switchCadenceFolder;

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
        <span>📁</span>
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
    if (heroIcon) heroIcon.textContent = currentSelectedFile.icon;

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
      if (playBtn) playBtn.textContent = '❚❚';
      vinyl?.classList.add('playing');
      spectrum?.classList.add('playing');
      triggerNotification(`Sonata: Playing ${curTrack.title} (PipeWire 0.7ms)`);

      playSonataNote(curTrack.phrase[sonataStep], curTrack.stepSpeed / 1000, curTrack.waveform);
      sonataInterval = setInterval(() => {
        sonataStep = (sonataStep + 1) % curTrack.phrase.length;
        sonataElapsedSec = (sonataElapsedSec + (curTrack.stepSpeed / 1000)) % sonataTotalSec;
        updateSonataProgressUI();
        const isChord = curTrack.phrase[sonataStep].length > 1;
        playSonataNote(curTrack.phrase[sonataStep], isChord ? 0.45 : 0.22, curTrack.waveform);
      }, curTrack.stepSpeed);
    } else {
      if (playBtn) playBtn.textContent = '▶';
      vinyl?.classList.remove('playing');
      spectrum?.classList.remove('playing');
      if (sonataInterval) {
        clearInterval(sonataInterval);
        sonataInterval = null;
      }
      triggerNotification('Sonata: Paused');
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
      return '<pre style="color: #38bdf8; font-family: var(--font-mono); line-height: 1.35; margin: 4px 0;">' +
'       _.._        <span style="color: #34c759; font-weight: 700;">toccata@core</span>\n' +
'     .\' .-\'\'       <span style="color: var(--text-secondary);">------------</span>\n' +
'    /  /           <span style="color: #ff9500;">OS:</span> Toccata OS 1.0 "Sonata" (x86_64)\n' +
'    |  |  ___      <span style="color: #ff9500;">Kernel:</span> 6.11.5-bore-xanmod\n' +
'    \\  \\ \'---\'     <span style="color: #ff9500;">Uptime:</span> 4 hours, 28 mins\n' +
'     \'. \'\'-.,      <span style="color: #ff9500;">Shell:</span> ' + currentShell + ' / Windows Bridge\n' +
'       \'\'\'\'        <span style="color: #ff9500;">Resolution:</span> 3840x2160 @ 120Hz (Retina Display P3)\n' +
'     <span style="color: #ff2d55; font-weight: 700;">[TOCCATA]</span>     <span style="color: #ff9500;">DE:</span> KWin Wayland Compositor (Frosted Slate)\n' +
'                   <span style="color: #ff9500;">Theme:</span> Apple Glass Vibrancy (No Muddy Tones)\n' +
'                   <span style="color: #ff9500;">CPU:</span> 16 Symphony Cores @ 4.8 GHz (BORE Scheduler)\n' +
'                   <span style="color: #ff9500;">Memory:</span> 820 MiB / 32 GiB (2.5% Idle Footprint)\n' +
'                   <span style="color: #ff9500;">Audio:</span> PipeWire 1.2.5 ALSA Direct (0.7ms Latency)\n' +
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
      html += `<div class="cal-cell ${isToday ? 'today' : ''}" onclick="playHarmonicChime([440 + ${d} * 15]); triggerNotification('Selected ${monthNames[month]} ${d}, ${year}')">${d}</div>`;
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

  // Initial focus
  bringToFront(document.getElementById('win-cadence'));
})();
