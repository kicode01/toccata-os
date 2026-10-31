// Toccata OS - Harmonic Desktop Engine & Acoustic Synthesizer

let topZIndex = 100;
let isSpotlightOpen = false;
let isControlCenterOpen = false;
let audioFeedbackEnabled = true;

// 1. Web Audio API Harmonic Synthesizer
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playHarmonicChime(frequencies = [440, 554.37, 659.25], duration = 0.45) {
  if (!audioFeedbackEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Warm pure sine waves with exponential acoustic decay
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Volume envelope (Steinway/Marimba style pluck)
      const baseGain = 0.08 / frequencies.length;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(baseGain, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + idx * 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + idx * 0.04 + 0.05);
    });
  } catch (e) {
    console.warn('[Toccata Audio] Acoustic touch feedback muted:', e);
  }
}

function toggleAudioFeedback(enabled) {
  audioFeedbackEnabled = enabled;
  if (enabled) {
    playHarmonicChime([523.25, 659.25, 783.99]);
    triggerNotification('Acoustic Touch Synthesizer: Active');
  } else {
    triggerNotification('Acoustic Touch: Muted');
  }
}

document.getElementById('acoustic-sound-toggle')?.addEventListener('click', () => {
  audioFeedbackEnabled = !audioFeedbackEnabled;
  toggleAudioFeedback(audioFeedbackEnabled);
});

// 2. Realtime Clock
function updateClock() {
  const clockEl = document.getElementById('clock-display');
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  clockEl.textContent = now.toLocaleDateString('en-US', options).replace(/,/g, '');
}
setInterval(updateClock, 1000);
updateClock();

// 3. Window Management
function bringToFront(windowEl) {
  topZIndex += 1;
  windowEl.style.zIndex = topZIndex;
  document.querySelectorAll('.window').forEach(w => w.classList.remove('active-window'));
  windowEl.classList.add('active-window');

  const rawTitle = windowEl.querySelector('.window-title').textContent;
  const title = rawTitle.includes('—') ? rawTitle.split('—')[0].trim() : rawTitle.trim();
  document.getElementById('active-app-title').textContent = title;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('hidden');
  bringToFront(win);

  // Play harmonic chord on window movement
  if (id === 'win-cadence') playHarmonicChime([440, 554.37]);
  if (id === 'win-scribe') playHarmonicChime([523.25, 659.25]);
  if (id === 'win-tempo') playHarmonicChime([392, 587.33]);
  if (id === 'win-settings') playHarmonicChime([440, 659.25]);

  // Mark dock dot as active
  if (id === 'win-scribe') document.getElementById('dot-scribe')?.classList.remove('hidden');
  if (id === 'win-settings') document.getElementById('dot-settings')?.classList.remove('hidden');
  if (id === 'win-tempo') document.getElementById('dot-tempo')?.classList.remove('hidden');
  if (id === 'win-installer') document.getElementById('dot-installer')?.classList.remove('hidden');
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.classList.add('hidden');
    if (id === 'win-scribe') document.getElementById('dot-scribe')?.classList.add('hidden');
    if (id === 'win-settings') document.getElementById('dot-settings')?.classList.add('hidden');
    if (id === 'win-tempo') document.getElementById('dot-tempo')?.classList.add('hidden');
    if (id === 'win-installer') document.getElementById('dot-installer')?.classList.add('hidden');
  }
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.style.transform = 'scale(0.18) translateY(680px)';
    win.style.opacity = '0';
    setTimeout(() => {
      win.classList.add('hidden');
      win.style.transform = '';
      win.style.opacity = '';
    }, 220);
  }
}

function maximizeWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;

  if (win.dataset.maximized === 'true') {
    win.style.top = win.dataset.origTop;
    win.style.left = win.dataset.origLeft;
    win.style.width = win.dataset.origWidth;
    win.style.height = win.dataset.origHeight;
    win.style.borderRadius = '16px';
    win.dataset.maximized = 'false';
  } else {
    win.dataset.origTop = win.style.top;
    win.dataset.origLeft = win.style.left;
    win.dataset.origWidth = win.style.width;
    win.dataset.origHeight = win.style.height;

    win.style.top = '30px';
    win.style.left = '0';
    win.style.width = '100vw';
    win.style.height = 'calc(100vh - 30px)';
    win.style.borderRadius = '0';
    win.dataset.maximized = 'true';
  }
}

// 4. Window Dragging Logic
document.querySelectorAll('.window').forEach(win => {
  const titlebar = win.querySelector('.window-titlebar');
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  win.addEventListener('mousedown', () => bringToFront(win));

  titlebar.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('node-btn')) return;
    if (win.dataset.maximized === 'true') return;

    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    bringToFront(win);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let newX = e.clientX - offsetX;
    let newY = Math.max(30, e.clientY - offsetY);
    win.style.left = `${newX}px`;
    win.style.top = `${newY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
});

// 5. Parabolic Dock Magnification
const dock = document.getElementById('dock');
const dockItems = document.querySelectorAll('.dock-item');

dock.addEventListener('mousemove', (e) => {
  const mouseX = e.clientX;
  dockItems.forEach(item => {
    const rect = item.getBoundingClientRect();
    const itemCenterX = rect.left + rect.width / 2;
    const distance = Math.abs(mouseX - itemCenterX);
    
    let scale = 1;
    if (distance < 140) {
      scale = 1 + 0.38 * Math.cos((distance / 140) * (Math.PI / 2));
    }
    const translateY = (scale - 1) * -22;
    item.style.transform = `scale(${scale}) translateY(${translateY}px)`;
  });
});

dock.addEventListener('mouseleave', () => {
  dockItems.forEach(item => {
    item.style.transform = '';
  });
});

// 6. Prelude Search Launcher
const spotlightOverlay = document.getElementById('spotlight-overlay');
const spotlightInput = document.getElementById('spotlight-input');
const spotlightResults = document.getElementById('spotlight-results');

function toggleSpotlight() {
  isSpotlightOpen = !isSpotlightOpen;
  if (isSpotlightOpen) {
    playHarmonicChime([659.25, 783.99]);
    spotlightOverlay.classList.remove('hidden');
    spotlightInput.value = '';
    spotlightResults.innerHTML = `
      <div class="result-item" onclick="openWindow('win-cadence'); toggleSpotlight();">
        <span style="font-size: 20px;">🎵</span> <span>Cadence (Movement Conductor)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-scribe'); toggleSpotlight();">
        <span style="font-size: 20px;">🎼</span> <span>Scribe (Score & Composition)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-tempo'); toggleSpotlight();">
        <span style="font-size: 20px;">⏱️</span> <span>Tempo (Hardware Oscilloscope)</span>
      </div>
      <div class="result-item" onclick="openWindow('win-settings'); toggleSpotlight();">
        <span style="font-size: 20px;">🎛️</span> <span>Sonata (Calibration & Tuning)</span>
      </div>
    `;
    setTimeout(() => spotlightInput.focus(), 50);
  } else {
    spotlightOverlay.classList.add('hidden');
  }
}

document.getElementById('spotlight-btn').addEventListener('click', toggleSpotlight);

document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
    e.preventDefault();
    toggleSpotlight();
  }
  if (e.code === 'Escape' && isSpotlightOpen) {
    toggleSpotlight();
  }
});

spotlightOverlay.addEventListener('click', (e) => {
  if (e.target === spotlightOverlay) toggleSpotlight();
});

spotlightInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  if (!query) return;

  let mathResult = null;
  try {
    if (/^[0-9+\-*/().^\s]+$/.test(query)) {
      mathResult = Function(`"use strict"; return (${query})`)();
    }
  } catch (err) {}

  if (mathResult !== null && !isNaN(mathResult)) {
    spotlightResults.innerHTML = `
      <div class="result-item selected">
        <span style="font-size: 22px;">🎹</span>
        <div style="font-size: 20px; font-weight: 700;">= ${mathResult.toLocaleString()} Hz</div>
      </div>
    `;
  } else {
    const apps = [
      { name: 'Cadence', icon: '🎵', id: 'win-cadence' },
      { name: 'Scribe', icon: '🎼', id: 'win-scribe' },
      { name: 'Tempo', icon: '⏱️', id: 'win-tempo' },
      { name: 'Sonata', icon: '🎛️', id: 'win-settings' },
      { name: 'Gallery', icon: '💎', id: 'win-installer' }
    ];
    const filtered = apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
    if (filtered.length > 0) {
      spotlightResults.innerHTML = filtered.map(a => `
        <div class="result-item" onclick="openWindow('${a.id}'); toggleSpotlight();">
          <span style="font-size: 20px;">${a.icon}</span> <span>${a.name}</span>
        </div>
      `).join('');
    } else {
      spotlightResults.innerHTML = `
        <div style="padding: 14px; color: var(--text-secondary); font-size: 13px;">
          Ask Maestro or Search Web for "${query}"
        </div>
      `;
    }
  }
});

// 7. Control Center & Interactive Sliders
const controlCenter = document.getElementById('control-center');
document.getElementById('control-center-btn').addEventListener('click', () => {
  isControlCenterOpen = !isControlCenterOpen;
  playHarmonicChime([523.25]);
  controlCenter.classList.toggle('hidden', !isControlCenterOpen);
});

document.getElementById('wifi-toggle').addEventListener('click', function() {
  const bubble = this.querySelector('.cc-icon-bubble');
  bubble.classList.toggle('active');
  playHarmonicChime([587.33, 783.99]);
  triggerNotification(bubble.classList.contains('active') ? 'Harmonic Mesh: Connected (Zero Jitter)' : 'Harmonic Mesh: Disconnected');
});

document.getElementById('bt-toggle').addEventListener('click', function() {
  const bubble = this.querySelector('.cc-icon-bubble');
  bubble.classList.toggle('active');
  playHarmonicChime([659.25, 880]);
  triggerNotification(bubble.classList.contains('active') ? 'Hi-Res Audio Stream: Connected' : 'Hi-Res Stream: Standby');
});

document.querySelectorAll('.slider-pill').forEach(pill => {
  pill.addEventListener('click', (e) => {
    const rect = pill.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(10, Math.min(100, Math.round((clickX / rect.width) * 100)));
    const fill = pill.querySelector('.slider-track-fill');
    fill.style.width = `${percentage}%`;
    playHarmonicChime([300 + percentage * 6]);
  });
});

// 8. Theme Switching & Customization
function setTheme(theme) {
  document.body.className = theme === 'light' ? 'light-mode' : 'dark-mode';
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  if (theme === 'light') {
    document.querySelector('.light-theme-preview')?.classList.add('active');
  } else {
    document.querySelector('.dark-theme-preview')?.classList.add('active');
  }
}

document.getElementById('theme-toggle-btn').addEventListener('click', () => {
  const isLight = document.body.classList.contains('light-mode');
  setTheme(isLight ? 'dark' : 'light');
});

function setAccent(color) {
  document.documentElement.style.setProperty('--brass-accent', color);
  document.documentElement.style.setProperty('--brass-glow', `${color}66`);
  document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
  event.target.classList.add('active');
}

// 9. Notification Toasts
function triggerNotification(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2600);
}

// Focus initial window
bringToFront(document.getElementById('win-cadence'));
