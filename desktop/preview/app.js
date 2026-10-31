// Toccata OS - Interactive Desktop Engine

let topZIndex = 100;
let isSpotlightOpen = false;
let isControlCenterOpen = false;

// 1. Clock Update
function updateClock() {
  const clockEl = document.getElementById('clock-display');
  const now = new Date();
  const options = { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  clockEl.textContent = now.toLocaleDateString('en-US', options).replace(/,/g, '');
}
setInterval(updateClock, 1000);
updateClock();

// 2. Window Management
function bringToFront(windowEl) {
  topZIndex += 1;
  windowEl.style.zIndex = topZIndex;
  document.querySelectorAll('.window').forEach(w => w.classList.remove('active-window'));
  windowEl.classList.add('active-window');

  // Update top bar app title
  const title = windowEl.querySelector('.window-title').textContent.split('—')[0].trim();
  document.getElementById('active-app-title').textContent = title;
}

function openWindow(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('hidden');
  bringToFront(win);

  // Mark dock dot as active
  if (id === 'win-textedit') document.getElementById('dot-textedit')?.classList.remove('hidden');
  if (id === 'win-settings') document.getElementById('dot-settings')?.classList.remove('hidden');
  if (id === 'win-installer') document.getElementById('dot-installer')?.classList.remove('hidden');
}

function closeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.classList.add('hidden');
    // Hide dock dot
    if (id === 'win-textedit') document.getElementById('dot-textedit')?.classList.add('hidden');
    if (id === 'win-settings') document.getElementById('dot-settings')?.classList.add('hidden');
    if (id === 'win-installer') document.getElementById('dot-installer')?.classList.add('hidden');
  }
}

function minimizeWindow(id) {
  const win = document.getElementById(id);
  if (win) {
    win.style.transform = 'scale(0.2) translateY(600px)';
    win.style.opacity = '0';
    setTimeout(() => {
      win.classList.add('hidden');
      win.style.transform = '';
      win.style.opacity = '';
    }, 200);
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
    win.style.borderRadius = '14px';
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

// 3. Window Dragging Logic
document.querySelectorAll('.window').forEach(win => {
  const titlebar = win.querySelector('.window-titlebar');
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  win.addEventListener('mousedown', () => bringToFront(win));

  titlebar.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('tl-btn')) return; // Ignore traffic lights
    if (win.dataset.maximized === 'true') return;

    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
    bringToFront(win);
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    let newX = e.clientX - offsetX;
    let newY = Math.max(30, e.clientY - offsetY); // Don't go above top menu bar
    win.style.left = `${newX}px`;
    win.style.top = `${newY}px`;
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
});

// 4. Spotlight Search & Instant Math Evaluation
const spotlightOverlay = document.getElementById('spotlight-overlay');
const spotlightInput = document.getElementById('spotlight-input');
const spotlightResults = document.getElementById('spotlight-results');

function toggleSpotlight() {
  isSpotlightOpen = !isSpotlightOpen;
  if (isSpotlightOpen) {
    spotlightOverlay.classList.remove('hidden');
    spotlightInput.value = '';
    spotlightResults.innerHTML = `
      <div class="result-item" onclick="openWindow('win-finder'); toggleSpotlight();">
        <span>📂</span> <span>Finder</span>
      </div>
      <div class="result-item" onclick="openWindow('win-textedit'); toggleSpotlight();">
        <span>📝</span> <span>TextEdit</span>
      </div>
      <div class="result-item" onclick="openWindow('win-settings'); toggleSpotlight();">
        <span>⚙️</span> <span>System Settings</span>
      </div>
      <div class="result-item" onclick="openWindow('win-installer'); toggleSpotlight();">
        <span>📦</span> <span>App Installer</span>
      </div>
    `;
    setTimeout(() => spotlightInput.focus(), 50);
  } else {
    spotlightOverlay.classList.add('hidden');
  }
}

document.getElementById('spotlight-btn').addEventListener('click', toggleSpotlight);

// Keyboard Shortcut: Cmd+Space or Ctrl+Space
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

// Spotlight input search / math calculator
spotlightInput.addEventListener('input', (e) => {
  const query = e.target.value.trim();
  if (!query) return;

  let mathResult = null;
  try {
    // Safe math calculation evaluation
    if (/^[0-9+\-*/().^\s]+$/.test(query)) {
      mathResult = Function(`"use strict"; return (${query})`)();
    }
  } catch (err) {}

  if (mathResult !== null && !isNaN(mathResult)) {
    spotlightResults.innerHTML = `
      <div class="result-item selected">
        <span style="font-size: 20px;">🔢</span>
        <div style="font-size: 18px; font-weight: 700;">= ${mathResult.toLocaleString()}</div>
      </div>
    `;
  } else {
    const apps = [
      { name: 'TextEdit', icon: '📝', id: 'win-textedit' },
      { name: 'Settings', icon: '⚙️', id: 'win-settings' },
      { name: 'Finder', icon: '📂', id: 'win-finder' },
      { name: 'App Installer', icon: '📦', id: 'win-installer' }
    ];
    const filtered = apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
    if (filtered.length > 0) {
      spotlightResults.innerHTML = filtered.map(a => `
        <div class="result-item" onclick="openWindow('${a.id}'); toggleSpotlight();">
          <span>${a.icon}</span> <span>${a.name}</span>
        </div>
      `).join('');
    } else {
      spotlightResults.innerHTML = `
        <div style="padding: 12px; color: var(--text-secondary); font-size: 13px;">
          Search Google or Web for "${query}"
        </div>
      `;
    }
  }
});

// 5. Control Center
const controlCenter = document.getElementById('control-center');
document.getElementById('control-center-btn').addEventListener('click', () => {
  isControlCenterOpen = !isControlCenterOpen;
  controlCenter.classList.toggle('hidden', !isControlCenterOpen);
});

document.getElementById('wifi-toggle').addEventListener('click', function() {
  this.classList.toggle('active');
  triggerNotification(this.classList.contains('active') ? 'Wi-Fi Connected' : 'Wi-Fi Disabled');
});

document.getElementById('bt-toggle').addEventListener('click', function() {
  this.classList.toggle('active');
  triggerNotification(this.classList.contains('active') ? 'Bluetooth Enabled' : 'Bluetooth Disabled');
});

// 6. Theme Switching & Customization
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
  document.documentElement.style.setProperty('--accent-color', color);
  document.querySelectorAll('.accent-dot').forEach(d => d.classList.remove('active'));
  event.target.classList.add('active');
}

// 7. Notification Toasts
function triggerNotification(msg) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  toastMsg.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2500);
}

// Focus initial window
bringToFront(document.getElementById('win-finder'));
