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

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Auto-suspend after 15 seconds of inactivity to preserve CPU & battery
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    }, 15000);
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
    'win-scribe': document.querySelector('.dock-item[data-app="Scribe"]'),
    'win-tempo': document.querySelector('.dock-item[data-app="Tempo"]'),
    'win-settings': document.querySelector('.dock-item[data-app="System Settings"]'),
    'win-installer': document.querySelector('.dock-item[data-app="Gallery"]')
  };

  const windowDotMap = {
    'win-cadence': document.getElementById('dot-cadence'),
    'win-scribe': document.getElementById('dot-scribe'),
    'win-tempo': document.getElementById('dot-tempo'),
    'win-settings': document.getElementById('dot-settings'),
    'win-installer': document.getElementById('dot-installer')
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
  // 4. REQUEST-ANIMATION-FRAME WINDOW DRAGGING WITH INERTIAL TILT
  // ==========================================================================
  document.querySelectorAll('.window').forEach(win => {
    const titlebar = win.querySelector('.window-titlebar');
    if (!titlebar) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initialLeft = 0, initialTop = 0;
    let currentX = 0, currentY = 0;
    let lastClientX = 0;
    let smoothedVx = 0;
    let rafId = null;

    win.addEventListener('mousedown', () => bringToFront(win), { passive: true });

    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('tl-btn')) return;
      maximizeWindow(win.id);
    });

    titlebar.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('tl-btn')) return;
      if (win.dataset.maximized === 'true') return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      lastClientX = e.clientX;
      smoothedVx = 0;
      initialLeft = win.offsetLeft;
      initialTop = win.offsetTop;
      currentX = initialLeft;
      currentY = initialTop;

      bringToFront(win);
      document.body.classList.add('is-window-dragging');
      win.classList.add('is-dragging');
      win.style.willChange = 'left, top, transform';
    });

    function updateWindowPos() {
      if (!isDragging) return;
      win.style.left = `${currentX}px`;
      win.style.top = `${currentY}px`;
      if (tiltEnabled) {
        const tilt = Math.max(-2.5, Math.min(2.5, smoothedVx * 0.16));
        win.style.transform = `translate3d(0, 0, 0) rotate(${tilt}deg) scale(1.008)`;
      }
      rafId = null;
    }

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const instantVx = e.clientX - lastClientX;
      lastClientX = e.clientX;
      smoothedVx = smoothedVx * 0.65 + instantVx * 0.35;

      currentX = initialLeft + dx;
      currentY = Math.max(28, initialTop + dy); // Clamp below top bar

      if (!rafId) {
        rafId = requestAnimationFrame(updateWindowPos);
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove('is-window-dragging');
        win.classList.remove('is-dragging');
        win.style.willChange = '';
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }

        win.style.transition = 'transform 0.24s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        win.style.transform = 'translate3d(0, 0, 0) rotate(0deg) scale(1)';
        setTimeout(() => {
          if (!isDragging) {
            win.style.transition = '';
            win.style.transform = '';
          }
        }, 250);
      }
    });
  });

  // ==========================================================================
  // 5. HARDWARE-ACCELERATED WINDOW RESIZING ENGINE
  // ==========================================================================
  document.querySelectorAll('.window').forEach(win => {
    const resizerR = win.querySelector('.window-resizer-r');
    const resizerB = win.querySelector('.window-resizer-b');
    const resizerRB = win.querySelector('.window-resizer-rb');

    function initResizer(resizerEl, resizeWidth, resizeHeight) {
      if (!resizerEl) return;
      let isResizing = false;
      let startX = 0, startY = 0;
      let startW = 0, startH = 0;
      let curW = 0, curH = 0;
      let rRaf = null;

      resizerEl.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startW = win.offsetWidth;
        startH = win.offsetHeight;
        curW = startW;
        curH = startH;
        bringToFront(win);
        win.style.willChange = 'width, height';
      });

      function updateSize() {
        if (!isResizing) return;
        if (resizeWidth) win.style.width = `${curW}px`;
        if (resizeHeight) win.style.height = `${curH}px`;
        rRaf = null;
      }

      window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        if (resizeWidth) curW = Math.max(380, startW + (e.clientX - startX));
        if (resizeHeight) curH = Math.max(220, startH + (e.clientY - startY));
        if (!rRaf) rRaf = requestAnimationFrame(updateSize);
      });

      window.addEventListener('mouseup', () => {
        if (isResizing) {
          isResizing = false;
          win.style.willChange = '';
          if (rRaf) {
            cancelAnimationFrame(rRaf);
            rRaf = null;
          }
        }
      });
    }

    initResizer(resizerR, true, false);
    initResizer(resizerB, false, true);
    initResizer(resizerRB, true, true);
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

    const appIndex = [
      { name: 'Cadence', icon: '📂', id: 'win-cadence' },
      { name: 'Scribe', icon: '📝', id: 'win-scribe' },
      { name: 'Tempo', icon: '⚡', id: 'win-tempo' },
      { name: 'System Settings', icon: '⚙️', id: 'win-settings' },
      { name: 'Gallery', icon: '💎', id: 'win-installer' }
    ];

    const lowerQ = query.toLowerCase();
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
          Search Google or Web for "${query}"
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

    // Cmd + Space: Toggle Spotlight
    if (isCmd && e.code === 'Space') {
      e.preventDefault();
      toggleSpotlight();
      return;
    }

    // Escape: Close Spotlight or Control Center
    if (e.code === 'Escape') {
      if (isSpotlightOpen) toggleSpotlight();
      if (isControlCenterOpen) {
        isControlCenterOpen = false;
        document.getElementById('control-center')?.classList.add('hidden');
      }
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
  });

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

  // Initial focus
  bringToFront(document.getElementById('win-cadence'));
})();
