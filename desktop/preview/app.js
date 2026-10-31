// Toccata OS - Optimized High-Performance Desktop Engine
// Hardware-accelerated 120Hz/144Hz physics, zero layout thrashing, and low-latency audio.

(function () {
  'use strict';

  let topZIndex = 100;
  let isSpotlightOpen = false;
  let isControlCenterOpen = false;
  let audioFeedbackEnabled = true;

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
      // Audio autoplay gracefully suppressed until first interaction
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
  // 3. WINDOW MANAGEMENT & HARDWARE ACCELERATION
  // ==========================================================================
  const activeAppTitle = document.getElementById('active-app-title');

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

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.remove('hidden');
    bringToFront(win);

    if (id === 'win-scribe') document.getElementById('dot-scribe')?.classList.remove('hidden');
    if (id === 'win-settings') document.getElementById('dot-settings')?.classList.remove('hidden');
    if (id === 'win-tempo') document.getElementById('dot-tempo')?.classList.remove('hidden');
    if (id === 'win-installer') document.getElementById('dot-installer')?.classList.remove('hidden');
  }
  window.openWindow = openWindow;

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.add('hidden');

    if (id === 'win-scribe') document.getElementById('dot-scribe')?.classList.add('hidden');
    if (id === 'win-settings') document.getElementById('dot-settings')?.classList.add('hidden');
    if (id === 'win-tempo') document.getElementById('dot-tempo')?.classList.add('hidden');
    if (id === 'win-installer') document.getElementById('dot-installer')?.classList.add('hidden');

    // Switch active title to next visible window
    const visibleWindows = Array.from(document.querySelectorAll('.window:not(.hidden)'));
    if (visibleWindows.length > 0) {
      visibleWindows.sort((a, b) => (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0));
      bringToFront(visibleWindows[0]);
    } else if (activeAppTitle) {
      activeAppTitle.textContent = 'Cadence';
    }
  }
  window.closeWindow = closeWindow;

  function minimizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.style.transform = 'translate3d(0, 600px, 0) scale(0.2)';
    win.style.opacity = '0';
    setTimeout(() => {
      win.classList.add('hidden');
      win.style.transform = '';
      win.style.opacity = '';
      closeWindow(id);
    }, 200);
  }
  window.minimizeWindow = minimizeWindow;

  function maximizeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;

    if (win.dataset.maximized === 'true') {
      win.style.top = win.dataset.origTop;
      win.style.left = win.dataset.origLeft;
      win.style.width = win.dataset.origWidth;
      win.style.height = win.dataset.origHeight;
      win.style.borderRadius = '14px';
      win.dataset.maximized = 'false';
    } else {
      win.dataset.origTop = win.style.top;
      win.dataset.origLeft = win.style.left;
      win.dataset.origWidth = win.style.width;
      win.dataset.origHeight = win.style.height;

      win.style.top = '28px';
      win.style.left = '0';
      win.style.width = '100vw';
      win.style.height = 'calc(100vh - 28px)';
      win.style.borderRadius = '0';
      win.dataset.maximized = 'true';
    }
  }
  window.maximizeWindow = maximizeWindow;

  // ==========================================================================
  // 4. REQUEST-ANIMATION-FRAME WINDOW DRAGGING (120Hz/144Hz Smoothened)
  // ==========================================================================
  document.querySelectorAll('.window').forEach(win => {
    const titlebar = win.querySelector('.window-titlebar');
    if (!titlebar) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let currentX = 0;
    let currentY = 0;
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
      initialLeft = win.offsetLeft;
      initialTop = win.offsetTop;
      currentX = initialLeft;
      currentY = initialTop;

      bringToFront(win);
      document.body.style.cursor = 'move';
      win.style.willChange = 'left, top';
    });

    function updateWindowPos() {
      if (!isDragging) return;
      win.style.left = `${currentX}px`;
      win.style.top = `${currentY}px`;
      rafId = null;
    }

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      currentX = initialLeft + dx;
      currentY = Math.max(28, initialTop + dy); // Clamp below top bar

      if (!rafId) {
        rafId = requestAnimationFrame(updateWindowPos);
      }
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        win.style.willChange = '';
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    });
  });

  // ==========================================================================
  // 5. CACHED ZERO-THRASHING DOCK MAGNIFICATION
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
  // 6. SPOTLIGHT SEARCH (Debounced Math & Instant Keyboard Navigation)
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
  // 7. KEYBOARD SHORTCUTS SUITE (macOS Ergonomics)
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
  // 8. CONTROL CENTER POPUP
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
  // 9. THEME & ACCENT SYSTEM
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
    if (event?.target?.classList?.contains('accent-dot')) {
      event.target.classList.add('active');
    }
  }
  window.setAccent = setAccent;

  // ==========================================================================
  // 10. NOTIFICATION TOASTS
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
