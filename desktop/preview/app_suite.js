/**
 * Toccata OS — Sovereign Application Suite
 * Full-Pledge Interactive Desktop Implementations for:
 * 1. Cadence (Virtual Filesystem, Context Menu, Inspector, Sorting)
 * 2. Scribe (Multi-Doc Notebook, Live GFM Split Preview, Formatting, Export)
 * 3. Horizon (Multi-Tab Browser, 120Hz Canvas Benchmark, Web Inspector, Destinations)
 * 4. Sonata (Real Web Audio DSP Synthesizer, 5-Band EQ, 60fps Canvas Visualizer)
 * 5. Tempo (Dynamic Multi-Core CPU/RAM Engine, Rolling Canvas Chart, Process Killer)
 * 6. Console (UNIX + Windows Dual Shell, Fastfetch, VFS CLI, Command History, Tab Complete)
 * 7. Solfege (Basic & Scientific Keypad, Paper Tape History, Full Keyboard Input)
 * 8. Prism (Filmstrip Library, Real-Time Photo Adjustments, EXIF Inspector, Wallpaper Setter)
 * 9. Chronicle (Interactive Month Grid, Event Creator, Focus Pomodoro Studio with Chimes)
 * 10. Gallery (App Store Product Sheet, Live Download Simulator, Install/Uninstall)
 * 11. Messages (Interactive Maestro AI Assistant, Audio Chimes, Typing Indicator)
 * 12. Mail (Multi-Folder Inbox, Rich Message Viewer, Interactive Composer Sheet)
 */

(function () {
  'use strict';

  // ==========================================================================
  // SHARED AUDIO UTILITIES
  // ==========================================================================
  let globalAudioCtx = null;
  function getAudioContext() {
    if (!globalAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) globalAudioCtx = new AudioCtx();
    }
    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      globalAudioCtx.resume().catch(() => {});
    }
    return globalAudioCtx;
  }

  function playUiTone(freqs, duration = 0.2, wave = 'sine', gainVal = 0.08) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      gain.connect(ctx.destination);

      (Array.isArray(freqs) ? freqs : [freqs]).forEach(f => {
        const osc = ctx.createOscillator();
        osc.type = wave;
        osc.frequency.setValueAtTime(f, now);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + duration);
      });
    } catch (e) {}
  }

  // ==========================================================================
  // 1. CADENCE: VIRTUAL FILESYSTEM & ADVANCED EXPLORER
  // ==========================================================================
  const VFS = {
    '/': ['Applications', 'Documents', 'Downloads', 'Music', 'Trash'],
    '/Applications': [
      { name: 'Scribe.app', type: 'app', size: '142 MB', date: 'Today at 1:40 AM', app: 'win-scribe' },
      { name: 'Sonata.app', type: 'app', size: '98 MB', date: 'Today at 1:40 AM', app: 'win-sonata' },
      { name: 'Settings.app', type: 'app', size: '64 MB', date: 'Today at 1:40 AM', app: 'win-settings' },
      { name: 'Gallery.app', type: 'app', size: '112 MB', date: 'Today at 1:40 AM', app: 'win-installer' },
      { name: 'Tempo.app', type: 'app', size: '48 MB', date: 'Today at 1:40 AM', app: 'win-tempo' },
      { name: 'Horizon.app', type: 'app', size: '185 MB', date: 'Today at 1:40 AM', app: 'win-horizon' },
      { name: 'Console.app', type: 'app', size: '32 MB', date: 'Today at 1:40 AM', app: 'win-console' },
      { name: 'Calculator.app', type: 'app', size: '18 MB', date: 'Today at 1:40 AM', app: 'win-calc' },
      { name: 'Prism.app', type: 'app', size: '76 MB', date: 'Today at 1:40 AM', app: 'win-prism' },
      { name: 'Chronicle.app', type: 'app', size: '54 MB', date: 'Today at 1:40 AM', app: 'win-chronicle' }
    ],
    '/Documents': [
      { name: 'Toccata Manifesto.md', type: 'doc', size: '4.2 KB', date: 'Today at 1:40 AM', app: 'win-scribe' },
      { name: 'PipeWire Architecture.md', type: 'doc', size: '12.8 KB', date: 'Yesterday at 8:15 PM', app: 'win-scribe' },
      { name: 'Kernel XanMod 6.11 Specs.txt', type: 'doc', size: '8.4 KB', date: 'Nov 1, 2026', app: 'win-scribe' },
      { name: 'Proton Container Blueprint.pdf', type: 'pdf', size: '1.8 MB', date: 'Oct 30, 2026', app: 'win-scribe' }
    ],
    '/Downloads': [
      { name: 'Ableton-Live-12-Linux.tar.gz', type: 'zip', size: '4.1 GB', date: 'Today at 2:10 AM', app: 'win-installer' },
      { name: 'FL_Studio_24_Installer.exe', type: 'exe', size: '890 MB', date: 'Yesterday at 11:22 PM', app: 'win-installer' },
      { name: 'Debussy_Clair_de_Lune.flac', type: 'audio', size: '42.5 MB', date: 'Oct 31, 2026', app: 'win-sonata' }
    ],
    '/Trash': [
      { name: 'Legacy-Alsa-Config.bak', type: 'doc', size: '2.1 KB', date: 'Oct 28, 2026', app: 'win-scribe' }
    ]
  };
  window.VFS = VFS;

  // File Inspector Modal for "Get Info"
  function openFileInfoModal(file) {
    let modal = document.getElementById('cadence-file-info-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'cadence-file-info-modal';
      modal.className = 'toccata-modal-sheet';
      modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:340px;padding:22px;z-index:98000;display:flex;flex-direction:column;gap:14px;';
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--glass-border);padding-bottom:10px;">
        <span style="font-weight:700;font-size:13px;">${file.name} Info</span>
        <button class="btn btn-secondary" onclick="this.closest('#cadence-file-info-modal').remove()" style="padding:2px 8px;font-size:11px;">✕</button>
      </div>
      <div style="display:flex;align-items:center;gap:14px;padding:6px 0;">
        <div style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#007aff,#5856d6);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 20px rgba(0,122,255,0.25);">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <div>
          <div style="font-weight:700;font-size:14px;">${file.name}</div>
          <div style="font-size:11px;color:var(--text-secondary);">${file.size || '128 KB'} &bull; ${(file.type || 'FILE').toUpperCase()}</div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;background:rgba(0,0,0,0.12);padding:12px;border-radius:8px;">
        <div><strong>Kind:</strong> ${file.type === 'app' ? 'Toccata Sovereign Application' : 'Document / Media File'}</div>
        <div><strong>Modified:</strong> ${file.date || 'Today'}</div>
        <div><strong>Permissions:</strong> Read &amp; Write (toccata@core)</div>
        <div><strong>Filesystem:</strong> Btrfs Subvolume (ZSTD Compressed)</div>
      </div>
      <button class="btn btn-primary" onclick="this.closest('#cadence-file-info-modal').remove(); if(typeof openWindow === 'function') openWindow('${file.app || 'win-scribe'}');" style="padding:7px;font-size:12px;font-weight:600;">Open with Default Application</button>
    `;
    playUiTone([659.25], 0.1, 'sine', 0.05);
  }
  window.openFileInfoModal = openFileInfoModal;

  // Cadence Right-Click File Context Menu
  function initCadenceContextMenu() {
    const cadenceWin = document.getElementById('win-cadence');
    if (!cadenceWin) return;

    let menu = document.getElementById('cadence-file-context-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'cadence-file-context-menu';
      menu.className = 'file-context-menu hidden';
      document.body.appendChild(menu);
    }

    cadenceWin.addEventListener('contextmenu', (e) => {
      const card = e.target.closest('.app-card') || e.target.closest('.finder-list-row');
      if (!card) return;

      e.preventDefault();
      e.stopPropagation();

      const titleEl = card.querySelector('.app-title') || card.querySelector('td');
      const fileName = titleEl ? titleEl.textContent.trim() : 'Item';
      const fileData = {
        name: fileName,
        type: fileName.endsWith('.app') ? 'app' : (fileName.endsWith('.md') ? 'doc' : 'file'),
        size: '142 MB',
        date: 'Today at 1:40 AM',
        app: fileName.toLowerCase().includes('sonata') ? 'win-sonata' : (fileName.toLowerCase().includes('calc') ? 'win-calc' : 'win-scribe')
      };

      menu.innerHTML = `
        <div class="file-context-menu-item" id="ctx-file-open">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open
        </div>
        <div class="file-context-menu-item" id="ctx-file-ql">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Quick Look (Space)
        </div>
        <div class="file-context-menu-item" id="ctx-file-info">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Get Info (Cmd+I)
        </div>
        <div class="file-context-menu-divider"></div>
        <div class="file-context-menu-item" id="ctx-file-dup">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Duplicate
        </div>
        <div class="file-context-menu-item" id="ctx-file-trash" style="color:#ff3b30;">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          Move to Trash
        </div>
      `;

      menu.style.left = `${Math.min(e.clientX, window.innerWidth - 190)}px`;
      menu.style.top = `${Math.min(e.clientY, window.innerHeight - 200)}px`;
      menu.classList.remove('hidden');

      document.getElementById('ctx-file-open').onclick = () => {
        menu.classList.add('hidden');
        if (typeof window.openWindow === 'function') window.openWindow(fileData.app);
      };
      document.getElementById('ctx-file-ql').onclick = () => {
        menu.classList.add('hidden');
        if (typeof window.openQuickLook === 'function') window.openQuickLook();
      };
      document.getElementById('ctx-file-info').onclick = () => {
        menu.classList.add('hidden');
        openFileInfoModal(fileData);
      };
      document.getElementById('ctx-file-dup').onclick = () => {
        menu.classList.add('hidden');
        duplicateCadenceItem(card, fileName);
      };
      document.getElementById('ctx-file-trash').onclick = () => {
        menu.classList.add('hidden');
        deleteCadenceItem(card, fileName);
      };
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#cadence-file-context-menu')) {
        menu?.classList.add('hidden');
      }
    });
  }

  function duplicateCadenceItem(cardEl, name) {
    const clone = cardEl.cloneNode(true);
    const titleEl = clone.querySelector('.app-title') || clone.querySelector('td');
    if (titleEl) titleEl.textContent = `${name.replace(/\.app|\.md|\.txt/, '')} copy${name.match(/\.[^.]+$/) ? name.match(/\.[^.]+$/)[0] : ''}`;
    cardEl.parentElement.appendChild(clone);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Duplicated ${name}`);
    }
    playUiTone([523.25, 659.25], 0.12, 'sine', 0.05);
  }

  function deleteCadenceItem(cardEl, name) {
    cardEl.style.transition = 'all 0.2s ease';
    cardEl.style.opacity = '0';
    cardEl.style.transform = 'scale(0.85)';
    setTimeout(() => {
      cardEl.remove();
      if (typeof window.triggerNotification === 'function') {
        window.triggerNotification(`Moved "${name}" to Trash`);
      }
      playUiTone([330, 220], 0.15, 'sawtooth', 0.04);
    }, 200);
  }

  // ==========================================================================
  // 2. SCRIBE: MULTI-NOTE NOTEBOOK & LIVE MARKDOWN ENGINE
  // ==========================================================================
  const SCRIBE_DOCS = [
    {
      id: 'doc-manifesto',
      title: 'Toccata Manifesto.md',
      date: 'Today at 1:40 AM',
      content: `# Toccata Operating System

### 1. The Visual Standard
Pure, crisp macOS aesthetics:
* Vibrant topographical wallpaper depth.
* Authentic red, yellow, and green inset traffic lights.
* Clean frosted glass vibrancy without muddy tones.
* Smooth 120Hz window physics and parabolic dock magnification.

### 2. Zero-Terminal Rule
Every administrative task is accessible visually:
* Installing apps via simple double-click.
* Restoring Btrfs system snapshots with a single click.
* Connecting displays, networks, and audio through intuitive sliders.

### 3. Windows Compatibility
* Native CMD & PowerShell command shims (\`ipconfig\`, \`taskmgr\`, \`explorer\`, \`winget\`).
* Double-click \`.exe\` / \`.msi\` container execution via Proton.`
    },
    {
      id: 'doc-pipewire',
      title: 'PipeWire 0.7ms Studio.md',
      date: 'Yesterday at 8:15 PM',
      content: `# PipeWire Low-Latency Audio Subsystem

### Architectural Directives
1. **ALSA Direct Bypass**: 64 sample buffer @ 96,000 Hz.
2. **Deterministic Jitter**: Maximum 0.72ms round-trip latency for live MIDI.
3. **Bit-Perfect Routing**: No resampling for FLAC/DSD studio masters.`
    },
    {
      id: 'doc-code',
      title: 'Fast Fourier Transform.js',
      date: 'Oct 30, 2026',
      content: `// Toccata High-Efficiency 512-Point Radix-2 Real FFT
function computeSpectrum(timeDomainBuffer) {
  const N = timeDomainBuffer.length;
  const spectrum = new Float32Array(N / 2);
  for (let k = 0; k < N / 2; k++) {
    let re = 0, im = 0;
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      re += timeDomainBuffer[n] * Math.cos(angle);
      im -= timeDomainBuffer[n] * Math.sin(angle);
    }
    spectrum[k] = Math.sqrt(re * re + im * im) / N;
  }
  return spectrum;
}`
    }
  ];

  let currentScribeDocId = 'doc-manifesto';

  function initScribeNotebook() {
    const splitContainer = document.querySelector('.scribe-split-container');
    if (!splitContainer) return;

    let sidebar = document.getElementById('scribe-docs-sidebar');
    if (!sidebar) {
      sidebar = document.createElement('div');
      sidebar.id = 'scribe-docs-sidebar';
      sidebar.className = 'finder-sidebar';
      sidebar.style.cssText = 'width: 190px; min-width: 170px; border-right: 1px solid var(--glass-border); display: flex; flex-direction: column; padding: 10px; gap: 4px; overflow-y: auto;';
      splitContainer.prepend(sidebar);
    }
    renderScribeDocsList();
  }

  function renderScribeDocsList() {
    const sidebar = document.getElementById('scribe-docs-sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 2px 4px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary);">Notebook Files</span>
        <button class="toolbar-icon-btn" onclick="addNewScribeDoc()" title="Create New Document" style="width: 20px; height: 20px; font-size: 13px;">+</button>
      </div>
    `;

    SCRIBE_DOCS.forEach(doc => {
      const row = document.createElement('div');
      row.className = `sidebar-row ${doc.id === currentScribeDocId ? 'active' : ''}`;
      row.style.cssText = 'padding: 6px 8px; border-radius: 6px; cursor: pointer; display: flex; flex-direction: column; gap: 2px;';
      row.onclick = () => switchScribeDoc(doc.id);
      row.innerHTML = `
        <div style="font-weight: 600; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doc.title}</div>
        <div style="font-size: 10px; color: var(--text-secondary);">${doc.date}</div>
      `;
      sidebar.appendChild(row);
    });
  }

  function switchScribeDoc(docId) {
    const doc = SCRIBE_DOCS.find(d => d.id === docId);
    if (!doc) return;

    const input = document.getElementById('scribe-input');
    const cur = SCRIBE_DOCS.find(d => d.id === currentScribeDocId);
    if (cur && input) cur.content = input.value;

    currentScribeDocId = docId;
    if (input) input.value = doc.content;

    const titleEl = document.querySelector('#win-scribe .window-title');
    if (titleEl) {
      titleEl.innerHTML = `<span class="proxy-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>Scribe &mdash; ${doc.title}`;
    }

    renderScribeDocsList();
    renderLiveMarkdownPreview();
    playUiTone([659.25], 0.1, 'sine', 0.04);
  }
  window.switchScribeDoc = switchScribeDoc;

  function addNewScribeDoc() {
    const newId = 'doc-' + Date.now();
    const newDoc = {
      id: newId,
      title: `Untitled Note ${SCRIBE_DOCS.length + 1}.md`,
      date: 'Just now',
      content: `# Untitled Document\n\nDraft your notes, thoughts, or code here...`
    };
    SCRIBE_DOCS.unshift(newDoc);
    switchScribeDoc(newId);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Created ${newDoc.title}`);
    }
  }
  window.addNewScribeDoc = addNewScribeDoc;

  function renderLiveMarkdownPreview() {
    const input = document.getElementById('scribe-input');
    const preview = document.getElementById('scribe-preview');
    if (!input || !preview) return;

    const raw = input.value;
    let html = raw
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n$/gim, '<br />');

    preview.innerHTML = html;

    // Update Status Bar Live Stats
    const words = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    const chars = raw.length;
    const readTime = Math.max(1, Math.ceil(words / 200));

    const statusEl = document.querySelector('#win-scribe .scribe-statusbar');
    if (statusEl) {
      statusEl.innerHTML = `
        <span>${words} words &bull; ${chars} characters &bull; ~${readTime} min read</span>
        <span style="color:#34c759;font-weight:600;">✓ Synced to Core NVMe</span>
      `;
    }
  }
  window.renderLiveMarkdownPreview = renderLiveMarkdownPreview;

  // Real File Exporter
  function exportScribeDocument() {
    const input = document.getElementById('scribe-input');
    const cur = SCRIBE_DOCS.find(d => d.id === currentScribeDocId);
    const content = input ? input.value : (cur ? cur.content : '');
    const filename = cur ? cur.title : 'note.md';

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Exported ${filename} to Downloads`);
    }
    playUiTone([523.25, 783.99], 0.15, 'sine', 0.05);
  }
  window.exportScribeDocument = exportScribeDocument;

  // Intercept scribe input for live markdown
  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'scribe-input') {
      renderLiveMarkdownPreview();
    }
  });

  // ==========================================================================
  // 3. HORIZON: MULTI-TAB BROWSER & DEVELOPER INSPECTOR
  // ==========================================================================
  const HORIZON_TABS = [
    { id: 'tab-speed', title: 'Speed & Latency', url: 'toccata://speed-benchmark' },
    { id: 'tab-arch', title: 'Toccata Architecture', url: 'toccata://architecture' },
    { id: 'tab-hn', title: 'Hacker News', url: 'https://news.ycombinator.com' },
    { id: 'tab-wiki', title: 'Wikipedia — OS', url: 'https://en.wikipedia.org/wiki/Operating_system' }
  ];

  let currentHorizonTabId = 'tab-speed';

  function initHorizonTabBar() {
    const horizonWindow = document.getElementById('win-horizon');
    if (!horizonWindow) return;

    let tabBar = document.getElementById('horizon-tab-bar');
    if (!tabBar) {
      tabBar = document.createElement('div');
      tabBar.id = 'horizon-tab-bar';
      tabBar.style.cssText = 'display:flex;align-items:center;padding:4px 12px 0;gap:6px;background:rgba(0,0,0,0.14);border-bottom:1px solid var(--glass-border);';
      const body = horizonWindow.querySelector('.horizon-body');
      if (body) body.prepend(tabBar);
    }
    renderHorizonTabs();
  }

  function renderHorizonTabs() {
    const tabBar = document.getElementById('horizon-tab-bar');
    if (!tabBar) return;

    tabBar.innerHTML = '';
    HORIZON_TABS.forEach(tab => {
      const tabEl = document.createElement('div');
      const isActive = tab.id === currentHorizonTabId;
      tabEl.className = `horizon-tab ${isActive ? 'active' : ''}`;
      tabEl.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:8px 8px 0 0;font-size:12px;cursor:pointer;background:${isActive ? 'var(--glass-bg)' : 'transparent'};border:${isActive ? '1px solid var(--glass-border)' : '1px solid transparent'};border-bottom:none;color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};`;
      tabEl.innerHTML = `
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        <span style="max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tab.title}</span>
        <span onclick="event.stopPropagation(); closeHorizonTab('${tab.id}')" style="opacity:0.6;font-size:11px;padding:0 2px;">✕</span>
      `;
      tabEl.onclick = () => selectHorizonTab(tab.id);
      tabBar.appendChild(tabEl);
    });

    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'toolbar-icon-btn';
    addTabBtn.title = 'Open New Tab';
    addTabBtn.style.cssText = 'width:24px;height:24px;font-size:14px;';
    addTabBtn.textContent = '+';
    addTabBtn.onclick = createNewHorizonTab;
    tabBar.appendChild(addTabBtn);
  }

  function selectHorizonTab(tabId) {
    const tab = HORIZON_TABS.find(t => t.id === tabId);
    if (!tab) return;
    currentHorizonTabId = tabId;
    renderHorizonTabs();
    const urlInput = document.getElementById('horizon-url-input');
    if (urlInput) urlInput.value = tab.url;
    navigateHorizon(tab.url);
  }
  window.selectHorizonTab = selectHorizonTab;

  function closeHorizonTab(tabId) {
    if (HORIZON_TABS.length <= 1) return;
    const idx = HORIZON_TABS.findIndex(t => t.id === tabId);
    if (idx !== -1) {
      HORIZON_TABS.splice(idx, 1);
      if (currentHorizonTabId === tabId) {
        currentHorizonTabId = HORIZON_TABS[Math.max(0, idx - 1)].id;
      }
      selectHorizonTab(currentHorizonTabId);
    }
  }
  window.closeHorizonTab = closeHorizonTab;

  function createNewHorizonTab() {
    const newId = 'tab-' + Date.now();
    HORIZON_TABS.push({
      id: newId,
      title: 'Speed & Latency',
      url: 'toccata://speed-benchmark'
    });
    selectHorizonTab(newId);
  }
  window.createNewHorizonTab = createNewHorizonTab;

  // Custom Horizon Navigator with Destinations
  function navigateHorizon(url) {
    const viewport = document.getElementById('horizon-page-content');
    if (!viewport) return;

    if (url === 'toccata://speed-benchmark') {
      viewport.innerHTML = `
        <div style="padding: 24px; max-width: 720px; margin: 0 auto; color: var(--text-primary);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
            <div>
              <h2 style="font-size: 22px; font-weight: 800; margin: 0;">System Latency &amp; Frame Rate Benchmark</h2>
              <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">Hardware Accelerated ProMotion 120Hz &bull; PipeWire Real-Time Audio</div>
            </div>
            <div style="background: rgba(52,199,89,0.15); color: #34c759; border-radius: 20px; padding: 6px 14px; font-weight: 700; font-size: 13px;">120.0 FPS LOCKED</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px;">
            <div style="background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); border-radius: 12px; padding: 16px;">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--text-secondary); font-weight: 700;">Audio Jitter</div>
              <div style="font-size: 24px; font-weight: 800; color: #007aff; margin-top: 4px;">0.67 ms</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">ALSA Direct Pass</div>
            </div>
            <div style="background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); border-radius: 12px; padding: 16px;">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--text-secondary); font-weight: 700;">Compositor Latency</div>
              <div style="font-size: 24px; font-weight: 800; color: #34c759; margin-top: 4px;">0.42 ms</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">KWin Wayland Tear-Free</div>
            </div>
            <div style="background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); border-radius: 12px; padding: 16px;">
              <div style="font-size: 11px; text-transform: uppercase; color: var(--text-secondary); font-weight: 700;">Display Refresh</div>
              <div style="font-size: 24px; font-weight: 800; color: #af52de; margin-top: 4px;">120 Hz</div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">Variable VRR Synchronized</div>
            </div>
          </div>
          <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px; border: 1px solid var(--glass-border);">
            <div style="font-size: 12px; font-weight: 700; margin-bottom: 8px;">Real-Time Frame Interval Oscilloscope (8.33ms Target)</div>
            <canvas id="horizon-fps-canvas" width="670" height="120" style="width:100%; height:120px; display:block;"></canvas>
          </div>
        </div>
      `;
      startHorizonBenchmarkCanvas();
    } else if (url === 'toccata://architecture') {
      viewport.innerHTML = `
        <div style="padding: 24px; max-width: 720px; margin: 0 auto; color: var(--text-primary); line-height: 1.6;">
          <h2 style="font-size: 20px; font-weight: 800;">Toccata Core Architectural Stack</h2>
          <p style="color: var(--text-secondary); font-size: 13px;">Engineered for professional music synthesis, 120Hz display responsiveness, and zero Windows bloat.</p>
          <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 12px;">
            <div style="padding: 14px; background: rgba(255,255,255,0.06); border-radius: 10px; border-left: 4px solid #007aff;">
              <div style="font-weight: 700;">Layer 1: XanMod 6.11 Linux Kernel with BORE Scheduler</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Burst-Oriented Response Enhancer (BORE) dynamically prioritizes UI interactivity and audio threads over background I/O.</div>
            </div>
            <div style="padding: 14px; background: rgba(255,255,255,0.06); border-radius: 10px; border-left: 4px solid #af52de;">
              <div style="font-weight: 700;">Layer 2: PipeWire Audio Processing Graph</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Native 64-sample buffer size delivering 0.67ms round-trip hardware latency with bit-perfect ALSA pass-through.</div>
            </div>
            <div style="padding: 14px; background: rgba(255,255,255,0.06); border-radius: 10px; border-left: 4px solid #34c759;">
              <div style="font-weight: 700;">Layer 3: KWin Wayland Compositor</div>
              <div style="font-size: 12px; color: var(--text-secondary);">Hardware direct scanout for zero-latency presentation, fractional scaling, and macOS-grade 120Hz fluid motion.</div>
            </div>
          </div>
        </div>
      `;
    } else if (url.includes('ycombinator.com')) {
      viewport.innerHTML = `
        <div style="background: #f6f6ef; color: #222; font-family: Verdana, sans-serif; font-size: 13px; min-height: 100%; padding: 14px;">
          <div style="background: #ff6600; padding: 4px 8px; font-weight: bold; color: #222; margin-bottom: 12px; display: flex; justify-content: space-between;">
            <span>Hacker News (Horizon Sovereign Mirror)</span>
            <span style="font-size: 11px;">100% Trackers Blocked</span>
          </div>
          <ol style="padding-left: 20px; margin: 0; line-height: 1.8;">
            <li><strong>Toccata OS: Zero-Terminal Operating System Released</strong> (toccata.os) <div style="font-size:10px;color:#828282;">482 points by kicode 2 hours ago | 148 comments</div></li>
            <li><strong>PipeWire 0.7ms Latency on XanMod Kernel</strong> (pipewire.io) <div style="font-size:10px;color:#828282;">312 points by audio_pro 4 hours ago | 92 comments</div></li>
            <li><strong>Wayland direct scanout hits 120Hz on ProMotion displays</strong> (kwin.kde.org) <div style="font-size:10px;color:#828282;">195 points by wayland_core 6 hours ago | 64 comments</div></li>
          </ol>
        </div>
      `;
    } else {
      viewport.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--text-primary);">
          <div style="font-size: 28px; margin-bottom: 10px;">🌐</div>
          <div style="font-size: 16px; font-weight: 700;">${url}</div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">Zero Telemetry Shield Active &bull; 100% Tracking Scripts Blocked</div>
        </div>
      `;
    }
  }
  window.navigateHorizon = navigateHorizon;

  function startHorizonBenchmarkCanvas() {
    const canvas = document.getElementById('horizon-fps-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameTimes = new Array(80).fill(8.33);

    function loop() {
      if (!document.getElementById('horizon-fps-canvas')) return;
      frameTimes.shift();
      frameTimes.push(8.25 + (Math.random() * 0.2 - 0.1));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid Target (8.33ms = 120 FPS)
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 60);
      ctx.lineTo(canvas.width, 60);
      ctx.stroke();

      // Draw Graph
      ctx.strokeStyle = '#007aff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const step = canvas.width / frameTimes.length;
      frameTimes.forEach((t, i) => {
        const y = 60 + (t - 8.33) * 200;
        if (i === 0) ctx.moveTo(0, y);
        else ctx.lineTo(i * step, y);
      });
      ctx.stroke();

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Toggle Web Inspector Drawer
  function toggleWebInspector() {
    let insp = document.getElementById('horizon-web-inspector');
    if (insp) {
      insp.remove();
      return;
    }
    const viewport = document.getElementById('horizon-page-content');
    if (!viewport) return;

    insp = document.createElement('div');
    insp.id = 'horizon-web-inspector';
    insp.style.cssText = 'height: 180px; border-top: 2px solid var(--accent-color); background: rgba(18,18,22,0.96); color: #38bdf8; font-family: monospace; font-size: 11px; display: flex; flex-direction: column; overflow: hidden;';
    insp.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 10px;background:rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.1);">
        <div style="display:flex;gap:12px;font-weight:700;">
          <span style="color:#fff;border-bottom:2px solid var(--accent-color);padding-bottom:2px;">Elements</span>
          <span style="opacity:0.7;">Console</span>
          <span style="opacity:0.7;">Network (0.4ms)</span>
          <span style="opacity:0.7;">Performance 120Hz</span>
        </div>
        <button class="toolbar-icon-btn" onclick="this.closest('#horizon-web-inspector').remove()" style="font-size:12px;width:18px;height:18px;">✕</button>
      </div>
      <div style="flex:1;padding:8px 12px;overflow-y:auto;line-height:1.6;">
        <div>&lt;<span style="color:#ff2d55;">html</span> <span style="color:#ffd60a;">lang</span>=<span style="color:#34c759;">"en"</span> <span style="color:#ffd60a;">data-toccata-bore</span>=<span style="color:#34c759;">"6.11"</span>&gt;</div>
        <div style="padding-left:14px;">&lt;<span style="color:#ff2d55;">head</span>&gt;&hellip;&lt;/<span style="color:#ff2d55;">head</span>&gt;</div>
        <div style="padding-left:14px;">&lt;<span style="color:#ff2d55;">body</span> <span style="color:#ffd60a;">class</span>=<span style="color:#34c759;">"sovereign-viewport"</span>&gt;</div>
        <div style="padding-left:28px;">&lt;<span style="color:#ff2d55;">div</span> <span style="color:#ffd60a;">id</span>=<span style="color:#34c759;">"pipewire-render-target"</span> <span style="color:#ffd60a;">latency</span>=<span style="color:#34c759;">"0.72ms"</span>&gt;&hellip;&lt;/<span style="color:#ff2d55;">div</span>&gt;</div>
        <div style="padding-left:14px;">&lt;/<span style="color:#ff2d55;">body</span>&gt;</div>
        <div>&lt;/<span style="color:#ff2d55;">html</span>&gt;</div>
      </div>
    `;
    viewport.parentElement.appendChild(insp);
    playUiTone([880], 0.1, 'sine', 0.05);
  }
  window.toggleWebInspector = toggleWebInspector;

  // ==========================================================================
  // 4. SONATA: REAL WEB AUDIO DSP & 5-BAND GRAPHIC EQUALIZER
  // ==========================================================================
  let sonataEqFilters = [];
  const EQ_FREQS = [60, 250, 1000, 4000, 12000];

  function initSonataDSP() {
    const ctx = getAudioContext();
    if (!ctx || sonataEqFilters.length > 0) return;

    sonataEqFilters = EQ_FREQS.map(freq => {
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = 1.0;
      filter.gain.value = 0;
      return filter;
    });

    for (let i = 0; i < sonataEqFilters.length - 1; i++) {
      sonataEqFilters[i].connect(sonataEqFilters[i + 1]);
    }
    sonataEqFilters[sonataEqFilters.length - 1].connect(ctx.destination);
  }

  function setSonataEqGain(bandIdx, gainDb) {
    initSonataDSP();
    if (sonataEqFilters[bandIdx]) {
      sonataEqFilters[bandIdx].gain.setTargetAtTime(parseFloat(gainDb), getAudioContext().currentTime, 0.05);
    }
  }
  window.setSonataEqGain = setSonataEqGain;

  function toggleSonataEqualizer() {
    const drawer = document.getElementById('sonata-eq-drawer');
    const win = document.getElementById('win-sonata');
    if (!drawer) return;
    drawer.classList.toggle('hidden');
    if (win) {
      win.style.height = drawer.classList.contains('hidden') ? '460px' : '545px';
    }
    playUiTone([523.25, 659.25], 0.1, 'sine', 0.04);
  }
  window.toggleSonataEqualizer = toggleSonataEqualizer;

  function resetSonataEq() {
    const drawer = document.getElementById('sonata-eq-drawer');
    if (!drawer) return;
    const inputs = drawer.querySelectorAll('input[type="range"]');
    inputs.forEach((input, idx) => {
      input.value = 0;
      setSonataEqGain(idx, 0);
    });
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification('Sonata Equalizer reset to Flat (0 dB)');
    }
    playUiTone([440], 0.1, 'sine', 0.04);
  }
  window.resetSonataEq = resetSonataEq;

  // ==========================================================================
  // 5. TEMPO: REAL-TIME ROLLING SYSTEM MONITOR ENGINE
  // ==========================================================================
  const TEMPO_PROCESSES = [
    { name: 'KWin Wayland Compositor', pid: 1042, cpu: 3.2, mem: '128 MB', user: 'toccata' },
    { name: 'PipeWire Audio Server', pid: 1180, cpu: 0.8, mem: '44 MB', user: 'toccata' },
    { name: 'Horizon Web Engine', pid: 2842, cpu: 4.8, mem: '280 MB', user: 'toccata' },
    { name: 'Cadence Files Daemon', pid: 1850, cpu: 1.4, mem: '84 MB', user: 'toccata' },
    { name: 'Sonata DSP Synthesizer', pid: 2195, cpu: 2.1, mem: '92 MB', user: 'toccata' },
    { name: 'Scribe Prose Canvas', pid: 2410, cpu: 0.6, mem: '58 MB', user: 'toccata' },
    { name: 'System Settings Host', pid: 1944, cpu: 0.5, mem: '62 MB', user: 'toccata' },
    { name: 'Proton DXVK Container', pid: 3108, cpu: 0.2, mem: '110 MB', user: 'toccata' },
    { name: 'systemd init', pid: 1, cpu: 0.1, mem: '24 MB', user: 'root' },
    { name: 'dbus-daemon', pid: 840, cpu: 0.2, mem: '16 MB', user: 'messagebus' }
  ];

  function renderTempoProcessTable() {
    const list = document.getElementById('tempo-process-list');
    if (!list) return;

    list.innerHTML = '';
    TEMPO_PROCESSES.forEach(proc => {
      const jitterCpu = Math.max(0.1, proc.cpu + (Math.random() * 0.8 - 0.4)).toFixed(1);
      const tr = document.createElement('tr');
      tr.className = 'process-row';
      tr.onclick = function () {
        document.querySelectorAll('#tempo-process-list .process-row').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        window.selectedTempoProcess = proc;
        const nameEl = document.getElementById('fq-process-name');
        if (nameEl) nameEl.textContent = proc.name;
      };
      tr.innerHTML = `
        <td style="font-weight:600;">${proc.name}</td>
        <td style="color:var(--text-secondary);">${proc.pid}</td>
        <td style="color:#34c759;font-weight:700;">${jitterCpu}%</td>
        <td>${proc.mem}</td>
        <td style="color:var(--text-secondary);">${proc.user}</td>
      `;
      list.appendChild(tr);
    });
  }

  setInterval(() => {
    const tempoWin = document.getElementById('win-tempo');
    if (tempoWin && !tempoWin.classList.contains('hidden')) {
      renderTempoProcessTable();
      const cpuMetric = document.getElementById('tempo-cpu-metric');
      if (cpuMetric) {
        const total = (12 + Math.random() * 6).toFixed(0);
        cpuMetric.textContent = `${total}% Load`;
      }
    }
  }, 1600);

  function terminateSelectedProcess() {
    if (!window.selectedTempoProcess) {
      if (typeof window.triggerNotification === 'function') {
        window.triggerNotification('Select a process to force quit');
      }
      return;
    }
    const proc = window.selectedTempoProcess;
    const idx = TEMPO_PROCESSES.findIndex(p => p.pid === proc.pid);
    if (idx !== -1) {
      TEMPO_PROCESSES.splice(idx, 1);
      renderTempoProcessTable();
      if (typeof window.triggerNotification === 'function') {
        window.triggerNotification(`Force quit ${proc.name} (PID ${proc.pid})`);
      }
      playUiTone([330, 220], 0.2, 'sawtooth', 0.05);

      if (proc.name.includes('Horizon') && typeof window.closeWindow === 'function') window.closeWindow('win-horizon');
      if (proc.name.includes('Scribe') && typeof window.closeWindow === 'function') window.closeWindow('win-scribe');
      if (proc.name.includes('Sonata') && typeof window.closeWindow === 'function') window.closeWindow('win-sonata');
    }
    const sheet = document.getElementById('tempo-force-quit-sheet');
    if (sheet) sheet.classList.add('hidden');
  }
  window.confirmForceQuit = terminateSelectedProcess;

  // ==========================================================================
  // 6. CONSOLE: DUAL UNIX/WINDOWS COMMAND SHELL & FASTFETCH
  // ==========================================================================
  const CMD_HISTORY = [];
  let cmdHistoryIdx = -1;

  function runConsoleCommand(inputStr) {
    const termContainer = document.getElementById('term-container');
    const termHistory = document.getElementById('term-history');
    if (!termHistory) return;

    const trimmed = inputStr.trim();
    if (!trimmed) return;

    CMD_HISTORY.push(trimmed);
    cmdHistoryIdx = CMD_HISTORY.length;

    const promptLabel = document.getElementById('term-prompt-label')?.textContent || 'toccata@core:~$';
    const echoRow = document.createElement('div');
    echoRow.style.cssText = 'color: #e2e8f0; margin-bottom: 4px;';
    echoRow.innerHTML = `<span style="color:#38bdf8;">${promptLabel}</span> ${trimmed}`;
    termHistory.appendChild(echoRow);

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const outputEl = document.createElement('div');
    outputEl.className = 'term-line-output';
    outputEl.style.cssText = 'margin-bottom: 12px; line-height: 1.5;';

    switch (cmd) {
      case 'clear':
      case 'cls':
        termHistory.innerHTML = '';
        return;

      case 'help':
        outputEl.innerHTML = `
<strong style="color:#ffd60a;">Toccata Shell Built-in Commands:</strong>
  fastfetch, neofetch  Display OS emblem, XanMod kernel, memory &amp; Wayland specs
  ls, dir [-la]        List files in virtual filesystem
  pwd                  Print working directory
  cat &lt;file&gt;           Display document contents
  mkdir &lt;name&gt;         Create directory in current path
  date, uptime         Display system clock and session runtime
  uname -a             Display Linux kernel architecture
  ps, tasklist         List active system processes
  open &lt;app&gt;           Launch GUI application window (calc, sonata, scribe...)
  ipconfig, ifconfig   Display network adapters and DNS
  clear, cls           Clear terminal screen
`;
        break;

      case 'fastfetch':
      case 'neofetch':
        outputEl.innerHTML = `
<pre style="margin:0;font-family:inherit;color:#38bdf8;">
   ┌─────────┐    <strong style="color:#ffffff;">toccata</strong>@<strong style="color:#ffffff;">core</strong>
   │  ( ⋔ )  │    ────────────
   └─────────┘    <strong style="color:#ff2d55;">OS:</strong> Toccata OS 1.0.4 "Sonata" x86_64
                  <strong style="color:#ff9500;">Host:</strong> Apple Silicon / KVM MicroVM Virtualization
                  <strong style="color:#ffd60a;">Kernel:</strong> 6.11.5-bore1-xanmod SMP PREEMPT_DYNAMIC
                  <strong style="color:#34c759;">Uptime:</strong> 1 hour, 42 mins
                  <strong style="color:#007aff;">Packages:</strong> 842 (flatpak, pacman, proton)
                  <strong style="color:#5856d6;">Shell:</strong> zsh 5.9 (dual-personality shim)
                  <strong style="color:#af52de;">WM:</strong> KWin (Wayland Compositor • 120Hz Fluid)
                  <strong style="color:#38bdf8;">Memory:</strong> 820 MiB / 32768 MiB (Pro Grade)
</pre>`;
        break;

      case 'ls':
      case 'dir':
        outputEl.innerHTML = `
<span style="color:#007aff;font-weight:700;">Applications/</span>   <span style="color:#007aff;font-weight:700;">Documents/</span>   <span style="color:#007aff;font-weight:700;">Downloads/</span>   <span style="color:#007aff;font-weight:700;">Music/</span>   <span style="color:#ff3b30;">Trash/</span>
<span style="color:#34c759;">Toccata_Manifesto.md</span>   <span style="color:#ffd60a;">PipeWire_Audio.conf</span>   <span style="color:#8e8e93;">.bashrc</span>
`;
        break;

      case 'pwd':
        outputEl.textContent = '/home/toccata';
        break;

      case 'date':
        outputEl.textContent = new Date().toString();
        break;

      case 'uptime':
        outputEl.textContent = '15:10:42 up 1:42, 1 user, load average: 0.14, 0.18, 0.12';
        break;

      case 'uname':
        outputEl.textContent = 'Linux toccata-core 6.11.5-bore #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux';
        break;

      case 'ps':
      case 'tasklist':
        outputEl.innerHTML = `
PID  TTY      TIME     CMD
1042 tty1     00:03:12 kwin_wayland
1180 tty1     00:00:48 pipewire-pulse
2842 tty1     00:04:15 horizon-engine
3108 tty1     00:00:14 proton-bridge
`;
        break;

      case 'ipconfig':
      case 'ifconfig':
        outputEl.innerHTML = `
Ethernet adapter toccata0 (10 GbE High-Bandwidth):
   IPv4 Address. . . . . . . . . . . : 192.168.1.145
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1
   Primary DNS Server. . . . . . . . : 1.1.1.1 (Cloudflare Privacy Direct)
`;
        break;

      case 'open':
        const targetApp = args[0] ? args[0].toLowerCase() : '';
        const appMap = {
          calc: 'win-calc', calculator: 'win-calc',
          scribe: 'win-scribe', notes: 'win-scribe',
          sonata: 'win-sonata', music: 'win-sonata',
          horizon: 'win-horizon', browser: 'win-horizon',
          tempo: 'win-tempo', monitor: 'win-tempo',
          gallery: 'win-installer', store: 'win-installer',
          settings: 'win-settings',
          messages: 'win-messages',
          mail: 'win-mail',
          prism: 'win-prism', photos: 'win-prism',
          chronicle: 'win-chronicle', calendar: 'win-chronicle'
        };
        if (appMap[targetApp]) {
          if (typeof window.openWindow === 'function') window.openWindow(appMap[targetApp]);
          outputEl.textContent = `Launched ${targetApp}.app`;
        } else {
          outputEl.innerHTML = `<span style="color:#ff3b30;">Unknown app '${targetApp}'. Try: open calc, open sonata, open scribe</span>`;
        }
        break;

      default:
        outputEl.innerHTML = `<span style="color:#ff3b30;">command not found: ${cmd}</span>. Type <strong style="color:#ffd60a;">help</strong> for list of commands.`;
    }

    termHistory.appendChild(outputEl);
    if (termContainer) termContainer.scrollTop = termContainer.scrollHeight;
    playUiTone([440], 0.08, 'triangle', 0.03);
  }

  window.handleTerminalKey = function (e) {
    const input = document.getElementById('term-input');
    if (!input) return;

    if (e.key === 'Enter') {
      const val = input.value;
      input.value = '';
      runConsoleCommand(val);
    } else if (e.key === 'ArrowUp') {
      if (CMD_HISTORY.length > 0 && cmdHistoryIdx > 0) {
        cmdHistoryIdx--;
        input.value = CMD_HISTORY[cmdHistoryIdx];
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (CMD_HISTORY.length > 0 && cmdHistoryIdx < CMD_HISTORY.length - 1) {
        cmdHistoryIdx++;
        input.value = CMD_HISTORY[cmdHistoryIdx];
      } else {
        cmdHistoryIdx = CMD_HISTORY.length;
        input.value = '';
      }
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const partial = input.value.trim().toLowerCase();
      const candidates = ['fastfetch', 'neofetch', 'clear', 'help', 'uptime', 'uname', 'ipconfig', 'open', 'cat', 'dir', 'ls'];
      const match = candidates.find(c => c.startsWith(partial));
      if (match) input.value = match;
    }
  };

  // ==========================================================================
  // 7. SOLFEGE: SCIENTIFIC KEYPAD, PAPER TAPE & FULL KEYBOARD INPUT
  // ==========================================================================
  const CALC_TAPE = [];

  function addCalcTapeEntry(expr, result) {
    CALC_TAPE.unshift({ expr, result, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    renderCalcTape();
  }

  function renderCalcTape() {
    let tapeEl = document.getElementById('calc-tape-drawer');
    if (!tapeEl) return;

    tapeEl.innerHTML = `
      <div style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">History Tape</div>
    `;

    if (CALC_TAPE.length === 0) {
      tapeEl.innerHTML += `<div style="font-size:11px;color:var(--text-secondary);opacity:0.7;">No recent calculations</div>`;
      return;
    }

    CALC_TAPE.slice(0, 10).forEach(entry => {
      const row = document.createElement('div');
      row.style.cssText = 'padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer;';
      row.onclick = () => {
        const main = document.getElementById('calc-main-display');
        if (main) main.textContent = entry.result;
      };
      row.innerHTML = `
        <div style="font-size: 10px; color: var(--text-secondary);">${entry.expr} =</div>
        <div style="font-size: 13px; font-weight: 700; color: var(--accent-color);">${entry.result}</div>
      `;
      tapeEl.appendChild(row);
    });
  }

  function updateCalcWindowSize() {
    const calcWin = document.getElementById('win-calc');
    const isSci = calcWin?.classList.contains('scientific-mode');
    const tape = document.getElementById('calc-tape-drawer');
    const isTape = tape && !tape.classList.contains('hidden');

    let baseW = 280;
    if (isSci && isTape) baseW = 590;
    else if (isSci) baseW = 460;
    else if (isTape) baseW = 440;

    if (calcWin) calcWin.style.width = `${baseW}px`;
  }

  function toggleCalcHistory() {
    const calcWin = document.getElementById('win-calc');
    const tape = document.getElementById('calc-tape-drawer');
    if (tape) {
      tape.classList.toggle('hidden');
      calcWin?.classList.toggle('with-tape');
      renderCalcTape();
      updateCalcWindowSize();
      playUiTone([523.25, 659.25], 0.1, 'sine', 0.04);
    }
  }
  window.toggleCalcHistory = toggleCalcHistory;

  function toggleCalcSciMode() {
    const calcWin = document.getElementById('win-calc');
    const sciGrid = document.getElementById('calc-sci-grid');
    if (!calcWin || !sciGrid) return;

    calcWin.classList.toggle('scientific-mode');
    sciGrid.classList.toggle('hidden');
    updateCalcWindowSize();
    playUiTone([659.25, 783.99], 0.1, 'sine', 0.04);
  }
  window.toggleCalcSciMode = toggleCalcSciMode;

  // Intercept calcAction for equals & sci functions
  const origCalcAction = window.calcAction;
  window.calcAction = function (action, val) {
    if (action === 'fn') {
      const display = document.getElementById('calc-main-display');
      let cur = parseFloat(display ? display.textContent : '0');
      let res = cur;
      let label = val;

      if (val === 'sin') res = Math.sin(cur);
      else if (val === 'cos') res = Math.cos(cur);
      else if (val === 'tan') res = Math.tan(cur);
      else if (val === 'sqrt') res = Math.sqrt(cur);
      else if (val === 'sqr') res = cur * cur;
      else if (val === 'ln') res = Math.log(cur);
      else if (val === 'pi') res = Math.PI;
      else if (val === 'e') res = Math.E;

      const formatted = parseFloat(res.toPrecision(8)).toString();
      if (display) display.textContent = formatted;
      addCalcTapeEntry(`${val}(${cur})`, formatted);
      playUiTone([587.33], 0.1, 'sine', 0.05);
      return;
    }

    if (action === 'equals') {
      const sub = document.getElementById('calc-sub-display')?.textContent || '';
      const main = document.getElementById('calc-main-display')?.textContent || '0';
      if (typeof origCalcAction === 'function') origCalcAction(action, val);
      const after = document.getElementById('calc-main-display')?.textContent || '0';
      addCalcTapeEntry(`${sub} ${main}`.trim(), after);
      return;
    }

    if (typeof origCalcAction === 'function') {
      origCalcAction(action, val);
    }
  };

  // Keyboard navigation for Calculator
  document.addEventListener('keydown', (e) => {
    const calcWin = document.getElementById('win-calc');
    if (!calcWin || calcWin.classList.contains('hidden')) return;

    if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

    if (e.key >= '0' && e.key <= '9') {
      window.calcAction('num', e.key);
    } else if (e.key === '.') {
      window.calcAction('dot');
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      window.calcAction('op', e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      window.calcAction('equals');
      e.preventDefault();
    } else if (e.key === 'Backspace') {
      if (typeof window.calcBackspace === 'function') window.calcBackspace();
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      window.calcAction('clear');
    }
  });

  // ==========================================================================
  // 8. PRISM: PHOTO LIBRARY, ADJUSTMENTS & WALLPAPER SETTER
  // ==========================================================================
  const PRISM_PHOTOS = [
    { id: 'sonata', title: 'Sonata Dynamic Topography', res: '3840 × 2160', color: 'Display P3', bg: 'wallpapers/pearos-light.jpg', grad: 'radial-gradient(circle at 30% 30%, #38bdf8 0%, #007aff 40%, #af52de 85%, #ff2d55 100%)' },
    { id: 'dark-nebula', title: 'Deep Space Nebula HDR', res: '5120 × 2880', color: 'Rec. 2020 HDR', bg: 'wallpapers/pearos-dark.jpg', grad: 'radial-gradient(circle at 70% 30%, #1e1b4b 0%, #0f172a 60%, #000000 100%)' },
    { id: 'abstract', title: 'Acoustic Wave Resonance', res: '4096 × 2304', color: 'Display P3', bg: 'wallpapers/abstract.jpg', grad: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)' }
  ];

  let currentPrismPhotoIdx = 0;

  function setPrismActivePhoto(idx) {
    if (!PRISM_PHOTOS[idx]) return;
    currentPrismPhotoIdx = idx;
    const photo = PRISM_PHOTOS[idx];

    document.querySelectorAll('#prism-filmstrip .prism-thumb').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === idx);
    });

    const titleEl = document.getElementById('prism-window-title');
    if (titleEl) {
      titleEl.innerHTML = `<span class="proxy-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="2" fill="none"/></svg></span>Prism &mdash; ${photo.title}`;
    }

    const frame = document.getElementById('prism-frame');
    if (frame) {
      const box = frame.querySelector('div');
      if (box) box.style.background = photo.grad;
    }

    const exif = document.getElementById('prism-exif-pill');
    if (exif) {
      exif.innerHTML = `
        <span>${photo.res}</span>
        <span>${photo.color}</span>
        <span>10-bit HDR</span>
        <span>Hasselblad X2D 100C</span>
      `;
    }
    playUiTone([783.99], 0.1, 'sine', 0.04);
  }
  window.setPrismActivePhoto = setPrismActivePhoto;

  function updatePrismAdjustments() {
    const exp = document.getElementById('prism-slider-exp')?.value || 100;
    const con = document.getElementById('prism-slider-con')?.value || 100;
    const sat = document.getElementById('prism-slider-sat')?.value || 100;
    const blur = document.getElementById('prism-slider-blur')?.value || 0;

    const frame = document.getElementById('prism-frame');
    if (frame) {
      frame.style.filter = `brightness(${exp}%) contrast(${con}%) saturate(${sat}%) blur(${blur}px)`;
    }
  }
  window.updatePrismAdjustments = updatePrismAdjustments;

  function resetPrismAdjustments() {
    const exp = document.getElementById('prism-slider-exp');
    const con = document.getElementById('prism-slider-con');
    const sat = document.getElementById('prism-slider-sat');
    const blur = document.getElementById('prism-slider-blur');
    if (exp) exp.value = 100;
    if (con) con.value = 100;
    if (sat) sat.value = 100;
    if (blur) blur.value = 0;
    updatePrismAdjustments();
    playUiTone([440], 0.08, 'sine', 0.03);
  }
  window.resetPrismAdjustments = resetPrismAdjustments;

  function setPrismAsWallpaper() {
    const photo = PRISM_PHOTOS[currentPrismPhotoIdx];
    if (photo && photo.bg) {
      document.documentElement.style.setProperty('--bg-wallpaper', `url('${photo.bg}')`);
      if (typeof window.triggerNotification === 'function') {
        window.triggerNotification(`Desktop wallpaper updated to ${photo.title}`);
      }
      playUiTone([523.25, 659.25, 1046.5], 0.25, 'sine', 0.08);
    }
  }
  window.setPrismAsWallpaper = setPrismAsWallpaper;

  // ==========================================================================
  // 9. CHRONICLE: CALENDAR AGENDA & POMODORO FOCUS TIMER
  // ==========================================================================
  let pomoMins = 25;
  let pomoSecs = 0;
  let pomoTimer = null;
  let pomoRunning = false;

  function setPomoDuration(mins) {
    pomoMins = mins;
    pomoSecs = 0;
    pomoRunning = false;
    if (pomoTimer) clearInterval(pomoTimer);
    updatePomoDisplay();
    const btn = document.getElementById('pomo-toggle-btn');
    if (btn) btn.textContent = 'Start';
    playUiTone([659.25], 0.1, 'sine', 0.04);
  }
  window.setPomoDuration = setPomoDuration;

  function updatePomoDisplay() {
    const display = document.getElementById('pomo-display');
    if (display) {
      const m = String(pomoMins).padStart(2, '0');
      const s = String(pomoSecs).padStart(2, '0');
      display.textContent = `${m}:${s}`;
    }
  }

  function togglePomodoro() {
    pomoRunning = !pomoRunning;
    const btn = document.getElementById('pomo-toggle-btn');

    if (pomoRunning) {
      if (btn) btn.textContent = 'Pause';
      playUiTone([523.25, 659.25], 0.15, 'sine', 0.05);

      pomoTimer = setInterval(() => {
        if (pomoSecs === 0) {
          if (pomoMins === 0) {
            clearInterval(pomoTimer);
            pomoRunning = false;
            if (btn) btn.textContent = 'Start';
            playUiTone([523.25, 659.25, 783.99, 1046.5], 0.8, 'sine', 0.1);
            if (typeof window.triggerNotification === 'function') {
              window.triggerNotification('Focus session complete! Take a relaxing break.');
            }
            return;
          }
          pomoMins--;
          pomoSecs = 59;
        } else {
          pomoSecs--;
        }
        updatePomoDisplay();
      }, 1000);
    } else {
      if (btn) btn.textContent = 'Resume';
      if (pomoTimer) clearInterval(pomoTimer);
    }
  }
  window.togglePomodoro = togglePomodoro;

  function resetPomodoro() {
    pomoRunning = false;
    if (pomoTimer) clearInterval(pomoTimer);
    pomoMins = 25;
    pomoSecs = 0;
    updatePomoDisplay();
    const btn = document.getElementById('pomo-toggle-btn');
    if (btn) btn.textContent = 'Start';
  }
  window.resetPomodoro = resetPomodoro;

  // Add Calendar Event Modal
  function promptAddCalEvent() {
    let modal = document.getElementById('chronicle-add-event-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'chronicle-add-event-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="toccata-modal-sheet" style="width: 380px; padding: 22px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight: 700; font-size: 14px;">Add Calendar Event</span>
          <button class="btn btn-secondary" onclick="this.closest('#chronicle-add-event-modal').remove()" style="padding: 2px 8px;">✕</button>
        </div>
        <div>
          <label style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Event Title</label>
          <input type="text" id="cal-new-title" placeholder="e.g. Master Track Review" style="width: 100%; margin-top: 4px; padding: 8px 10px; background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); outline: none;">
        </div>
        <div style="display: flex; gap: 10px;">
          <div style="flex: 1;">
            <label style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Date</label>
            <input type="date" id="cal-new-date" value="2026-11-04" style="width: 100%; margin-top: 4px; padding: 6px 8px; background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); outline: none;">
          </div>
          <div style="flex: 1;">
            <label style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Time</label>
            <input type="time" id="cal-new-time" value="16:00" style="width: 100%; margin-top: 4px; padding: 6px 8px; background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); outline: none;">
          </div>
        </div>
        <button class="btn btn-primary" onclick="saveNewCalEvent()" style="padding: 8px; font-weight: 700; margin-top: 6px;">Save Event</button>
      </div>
    `;
    playUiTone([659.25], 0.1, 'sine', 0.05);
  }
  window.promptAddCalEvent = promptAddCalEvent;

  function saveNewCalEvent() {
    const titleInput = document.getElementById('cal-new-title');
    const dateInput = document.getElementById('cal-new-date');
    const timeInput = document.getElementById('cal-new-time');
    const title = titleInput ? titleInput.value.trim() : '';

    if (!title) return;

    const milestonesList = document.querySelector('.chronicle-sidebar > div:last-child > div:last-child');
    if (milestonesList) {
      const card = document.createElement('div');
      card.style.cssText = 'padding: 6px 10px; background: rgba(52, 199, 89, 0.15); border-left: 3px solid #34c759; border-radius: 4px;';
      card.innerHTML = `
        <div style="font-weight: 600;">${title}</div>
        <div style="color: var(--text-secondary); font-size: 10px;">${dateInput?.value || 'Nov 4'} &bull; ${timeInput?.value || '4:00 PM'}</div>
      `;
      milestonesList.prepend(card);
    }

    document.getElementById('chronicle-add-event-modal')?.remove();
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Event "${title}" added to Calendar`);
    }
    playUiTone([523.25, 659.25, 783.99], 0.2, 'sine', 0.06);
  }
  window.saveNewCalEvent = saveNewCalEvent;

  // ==========================================================================
  // 10. GALLERY: RICH PRODUCT SHEET & ANIMATED INSTALLER
  // ==========================================================================
  const STORE_DETAILS = {
    'Ableton Live 12': {
      version: 'v12.0.5 Studio Pro',
      size: '4.1 GB',
      dev: 'Ableton AG',
      rating: '4.9 ★★★★★ (1,248 reviews)',
      desc: 'The industry-standard Digital Audio Workstation, featuring native PipeWire ALSA Direct 0.7ms low latency integration, bit-perfect audio export, and high-DPI Wayland scaling.',
      iconBg: 'linear-gradient(135deg, #ff2d55, #ff9500)'
    },
    'VS Code': {
      version: 'v1.95.0 Sovereign Build',
      size: '210 MB',
      dev: 'Microsoft / Sovereign Core',
      rating: '4.8 ★★★★★ (3,420 reviews)',
      desc: 'Zero-telemetry build with pre-configured Rust-Analyzer, Clangd, and JetBrains Mono fonts. Integrated Wayland drag-and-drop file trees.',
      iconBg: 'linear-gradient(135deg, #007aff, #00c6ff)'
    },
    'Blender 4.2': {
      version: 'v4.2.3 LTS',
      size: '520 MB',
      dev: 'Blender Foundation',
      rating: '4.9 ★★★★★ (890 reviews)',
      desc: 'Open-source 3D creation suite powered by Vulkan HipRT compute kernels with real-time viewport raytracing.',
      iconBg: 'linear-gradient(135deg, #ff9500, #ea580c)'
    },
    'Steam + Proton GE': {
      version: 'v9.0-3 GE Custom',
      size: '850 MB',
      dev: 'Valve & GloriousEggroll',
      rating: '4.9 ★★★★★ (5,120 reviews)',
      desc: 'Windows Gaming & DXVK 2.4 DirectX-to-Vulkan translation layer. Run your full Windows Steam catalog on Toccata OS.',
      iconBg: 'linear-gradient(135deg, #1e293b, #3b82f6)'
    }
  };

  function openAppProductSheet(appName) {
    const details = STORE_DETAILS[appName] || {
      version: 'v1.0.0 Native',
      size: '128 MB',
      dev: 'Toccata Studio Developer',
      rating: '4.8 ★★★★★',
      desc: 'Optimized native package built for Toccata OS with zero runtime overhead.',
      iconBg: 'linear-gradient(135deg, #007aff, #5856d6)'
    };

    let modal = document.getElementById('store-product-sheet-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'store-product-sheet-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="toccata-modal-sheet" style="width:520px;max-width:90vw;padding:24px;display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div style="display:flex;gap:16px;align-items:center;">
            <div style="width:64px;height:64px;border-radius:14px;background:${details.iconBg};display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 20px rgba(0,0,0,0.25);">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <div>
              <div style="font-size:18px;font-weight:800;">${appName}</div>
              <div style="font-size:12px;color:var(--text-secondary);">${details.dev} &bull; ${details.version}</div>
              <div style="font-size:12px;color:#ffd60a;margin-top:2px;">${details.rating}</div>
            </div>
          </div>
          <button class="btn btn-secondary" onclick="this.closest('#store-product-sheet-modal').remove()" style="padding:4px 10px;font-size:12px;">✕</button>
        </div>

        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;background:rgba(0,0,0,0.12);padding:14px;border-radius:10px;">
          ${details.desc}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,0.08);padding-top:12px;">
          <span style="font-size:12px;color:var(--text-secondary);">Download Size: <strong>${details.size}</strong></span>
          <button class="btn btn-primary" onclick="installStoreApp(this, '${appName}', 'win-installer'); this.closest('#store-product-sheet-modal').remove();" style="padding:8px 20px;font-weight:700;">Get / Install</button>
        </div>
      </div>
    `;
    playUiTone([659.25], 0.1, 'sine', 0.05);
  }
  window.openAppProductSheet = openAppProductSheet;

  // ==========================================================================
  // 11. MESSAGES: INTERACTIVE MAESTRO AI ASSISTANT
  // ==========================================================================
  const MAESTRO_KNOWLEDGE = {
    wallpaper: 'You can change the desktop wallpaper by opening System Settings &rarr; Wallpaper, or right-clicking anywhere on the Desktop and choosing "Change Wallpaper".',
    pipewire: 'PipeWire is Toccata OS\'s sovereign real-time audio subsystem, delivering direct ALSA hardware access with 0.7ms round-trip latency at 96kHz.',
    terminal: 'You can open Terminal with Ctrl+Shift+U or from the Dock/Launchpad. Type "fastfetch" to inspect kernel specs.',
    shortcuts: 'Top shortcuts: Ctrl+Space (Spotlight), Win+Tab (Activities & Workspaces), Ctrl+Shift+D (Dark/Light mode), Space (Quick Look).',
    proton: 'Toccata OS runs Windows .exe and .msi applications directly via Proton GE containers with Wine-ASIO support.'
  };

  function sendMaestroAiReply(userPrompt) {
    const history = document.getElementById('messages-chat-history');
    if (!history) return;

    const typingRow = document.createElement('div');
    typingRow.id = 'maestro-typing-indicator';
    typingRow.style.cssText = 'display:flex;align-items:center;gap:6px;padding:8px 12px;background:rgba(255,255,255,0.08);border-radius:14px;width:fit-content;';
    typingRow.innerHTML = `
      <span style="width:6px;height:6px;border-radius:50%;background:#007aff;display:inline-block;"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:#af52de;display:inline-block;"></span>
      <span style="width:6px;height:6px;border-radius:50%;background:#ff2d55;display:inline-block;"></span>
      <span style="font-size:11px;color:var(--text-secondary);margin-left:6px;">Maestro is thinking...</span>
    `;
    history.appendChild(typingRow);
    history.scrollTop = history.scrollHeight;

    setTimeout(() => {
      typingRow.remove();

      let replyText = 'I am Maestro, your Toccata OS companion. Ask me about system features, PipeWire studio audio, shortcuts, or terminal commands.';
      const lower = userPrompt.toLowerCase();

      if (lower.includes('wallpaper') || lower.includes('background')) replyText = MAESTRO_KNOWLEDGE.wallpaper;
      else if (lower.includes('audio') || lower.includes('pipewire') || lower.includes('sound')) replyText = MAESTRO_KNOWLEDGE.pipewire;
      else if (lower.includes('terminal') || lower.includes('console') || lower.includes('command')) replyText = MAESTRO_KNOWLEDGE.terminal;
      else if (lower.includes('shortcut') || lower.includes('key')) replyText = MAESTRO_KNOWLEDGE.shortcuts;
      else if (lower.includes('windows') || lower.includes('exe') || lower.includes('proton')) replyText = MAESTRO_KNOWLEDGE.proton;
      else if (lower.includes('hi') || lower.includes('hello')) replyText = 'Greetings! How can I assist you with Toccata OS today?';

      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble incoming';
      botBubble.style.cssText = 'max-width:75%;padding:10px 14px;border-radius:16px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.08);color:var(--text-primary);align-self:flex-start;font-size:12px;line-height:1.5;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
      botBubble.innerHTML = `
        <div style="font-weight:700;font-size:10px;text-transform:uppercase;color:var(--accent-color);margin-bottom:2px;">Maestro AI</div>
        <div>${replyText}</div>
      `;
      history.appendChild(botBubble);
      history.scrollTop = history.scrollHeight;

      playUiTone([659.25, 880], 0.15, 'sine', 0.05);
    }, 750);
  }
  window.sendMaestroAiReply = sendMaestroAiReply;

  // Intercept sendChatMessage to route to Maestro when active
  const origSendMsg = window.sendChatMessage;
  window.sendChatMessage = function () {
    const input = document.getElementById('messages-input-box');
    const msg = input ? input.value.trim() : '';

    if (typeof origSendMsg === 'function') origSendMsg();

    const recipient = document.getElementById('messages-recipient-name')?.textContent || '';
    if (recipient.includes('Maestro') && msg) {
      sendMaestroAiReply(msg);
    }
  };

  // ==========================================================================
  // 12. MAIL: RICH COMPOSER SHEET & SENDING ENGINE
  // ==========================================================================
  function promptComposeMail() {
    let modal = document.getElementById('mail-compose-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mail-compose-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="toccata-modal-sheet" style="width: 480px; max-width: 90vw; padding: 22px; display: flex; flex-direction: column; gap: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight: 700; font-size: 14px;">New Message &mdash; Sovereign Mail</span>
          <button class="btn btn-secondary" onclick="this.closest('#mail-compose-modal').remove()" style="padding: 2px 8px;">✕</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <input type="text" id="mail-compose-to" placeholder="To: recipient@toccata.os" style="width:100%; padding:8px 10px; background:rgba(0,0,0,0.15); border:1px solid var(--glass-border); border-radius:8px; color:var(--text-primary); font-size:12px; outline:none;">
          <input type="text" id="mail-compose-sub" placeholder="Subject" style="width:100%; padding:8px 10px; background:rgba(0,0,0,0.15); border:1px solid var(--glass-border); border-radius:8px; color:var(--text-primary); font-size:12px; outline:none;">
          <textarea id="mail-compose-body" placeholder="Write your sovereign encrypted message..." rows="6" style="width:100%; padding:10px; background:rgba(0,0,0,0.15); border:1px solid var(--glass-border); border-radius:8px; color:var(--text-primary); font-size:12px; outline:none; resize:none;"></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px;">
          <button class="btn btn-secondary" onclick="this.closest('#mail-compose-modal').remove()">Discard</button>
          <button class="btn btn-primary" onclick="sendComposedMail()" style="padding: 6px 18px; font-weight: 700;">Send ↑</button>
        </div>
      </div>
    `;
    playUiTone([659.25], 0.1, 'sine', 0.05);
  }
  window.promptComposeMail = promptComposeMail;

  function sendComposedMail() {
    const toInput = document.getElementById('mail-compose-to');
    const subInput = document.getElementById('mail-compose-sub');
    const to = toInput ? toInput.value.trim() : '';
    const sub = subInput ? subInput.value.trim() : '';

    if (!to || !sub) {
      if (typeof window.triggerNotification === 'function') {
        window.triggerNotification('Please specify recipient and subject');
      }
      return;
    }

    document.getElementById('mail-compose-modal')?.remove();
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Message sent to ${to}!`);
    }
    playUiTone([523.25, 783.99, 1046.5], 0.25, 'sine', 0.07);
  }
  window.sendComposedMail = sendComposedMail;

  // ==========================================================================
  // 13. UNIVERSAL FILE ENGINE & HOST DRAG-AND-DROP INGESTION
  // ==========================================================================
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function detectMagicSignature(bytes) {
    if (!bytes || bytes.length < 4) return 'Unknown Binary Stream';
    const b = Array.from(bytes.slice(0, 8));
    const hex = b.map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(' ');

    if (b[0] === 0x4D && b[1] === 0x5A) return 'Windows PE Executable / DLL (MZ)';
    if (b[0] === 0x7F && b[1] === 0x45 && b[2] === 0x4C && b[3] === 0x46) return 'Linux ELF Executable / Shared Object';
    if (b[0] === 0x50 && b[1] === 0x4B && b[2] === 0x03 && b[3] === 0x04) return 'ZIP / JAR / OpenXML Compressed Archive';
    if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'Adobe Portable Document Format (PDF)';
    if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47) return 'PNG Lossless Raster Image';
    if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'JPEG Photo / EXIF Stream';
    if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'GIF Animated Graphics Image';
    if (b[0] === 0x1F && b[1] === 0x8B) return 'GZIP Compressed Archive';
    if (b[0] === 0x4F && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53) return 'Ogg Vorbis / Opus Multimedia Container';
    if (b[0] === 0x1A && b[1] === 0x45 && b[2] === 0xDF && b[3] === 0xA3) return 'Matroska / WebM Multimedia Container';
    if (b[0] === 0x66 && b[1] === 0x74 && b[2] === 0x79 && b[3] === 0x70) return 'MP4 / QuickTime ISO Media Container';

    return `Raw Binary (${hex.slice(0, 11)}...)`;
  }

  function openUniversalHexInspector(fileName, sizeStr, mimeType, arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const magic = detectMagicSignature(bytes);

    let hexRows = [];
    for (let offset = 0; offset < Math.min(bytes.length, 256); offset += 16) {
      const slice = bytes.slice(offset, offset + 16);
      const hexPart = Array.from(slice).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ').padEnd(48, ' ');
      const asciiPart = Array.from(slice).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
      const offHex = offset.toString(16).padStart(8, '0').toUpperCase();
      hexRows.push(`<span style="color:#007aff;">${offHex}</span>  <span style="color:#38bdf8;">${hexPart}</span>  <span style="color:#34c759;">|${asciiPart}|</span>`);
    }

    let modal = document.getElementById('hex-inspector-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hex-inspector-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="toccata-modal-sheet" style="width: 720px; max-width: 95vw; padding: 22px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--glass-border); padding-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#007aff,#5856d6);display:flex;align-items:center;justify-content:center;color:#fff;">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;">${fileName} &mdash; Binary &amp; Hex Analyzer</div>
              <div style="font-size:11px;color:var(--text-secondary);">${sizeStr} &bull; ${mimeType || 'application/octet-stream'}</div>
            </div>
          </div>
          <button class="btn btn-secondary" onclick="this.closest('#hex-inspector-modal').remove()" style="padding:4px 10px;font-size:12px;">✕</button>
        </div>

        <div style="background:rgba(0,122,255,0.1); border:1px solid rgba(0,122,255,0.25); border-radius:8px; padding:10px 14px; font-size:12px; display:flex; justify-content:space-between; align-items:center;">
          <span><strong>Detected Signature:</strong> ${magic}</span>
          <span style="color:#34c759;font-weight:700;">Entropy: Normal (Unencrypted)</span>
        </div>

        <div style="background:rgba(0,0,0,0.45); border:1px solid var(--glass-border); border-radius:8px; padding:14px; font-family:monospace; font-size:11px; line-height:1.6; overflow-x:auto; max-height:240px; overflow-y:auto; color:#f8fafc;">
          ${hexRows.join('<br>')}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--glass-border); padding-top:12px;">
          <span style="font-size:11px;color:var(--text-secondary);">Open with installed application:</span>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary" onclick="openWindow('win-scribe'); this.closest('#hex-inspector-modal').remove();">Scribe</button>
            <button class="btn btn-secondary" onclick="openWindow('win-prism'); this.closest('#hex-inspector-modal').remove();">Prism</button>
            <button class="btn btn-secondary" onclick="openWindow('win-console'); this.closest('#hex-inspector-modal').remove();">Console</button>
            <button class="btn btn-primary" onclick="this.closest('#hex-inspector-modal').remove()">Done</button>
          </div>
        </div>
      </div>
    `;
    playUiTone([659.25], 0.12, 'sine', 0.05);
  }

  function openProtonExecutionModal(fileName, sizeStr) {
    let modal = document.getElementById('proton-exec-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'proton-exec-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="toccata-modal-sheet" style="width: 480px; max-width: 90vw; padding: 24px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#ff2d55,#ff9500);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 20px rgba(255,45,85,0.3);">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;">Proton GE 9.0-3 Windows Subsystem</div>
              <div style="font-size:11px;color:var(--text-secondary);">${fileName} &bull; ${sizeStr}</div>
            </div>
          </div>
          <button class="btn btn-secondary" onclick="this.closest('#proton-exec-modal').remove()" style="padding:2px 8px;">✕</button>
        </div>

        <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;background:rgba(0,0,0,0.12);padding:14px;border-radius:10px;">
          Toccata OS intercepts Windows PE <code>.exe</code> and <code>.msi</code> binaries using a pre-configured <strong>Proton GE</strong> container with <strong>Wine-ASIO 0.7ms low latency</strong> and <strong>DXVK 2.4 DirectX-to-Vulkan</strong> acceleration.
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid var(--glass-border); padding-top:12px;">
          <button class="btn btn-secondary" onclick="this.closest('#proton-exec-modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="simulateProtonLaunch('${fileName}'); this.closest('#proton-exec-modal').remove();" style="font-weight:700;padding:6px 18px;">Run in Proton Container</button>
        </div>
      </div>
    `;
    playUiTone([523.25, 783.99], 0.15, 'sine', 0.05);
  }

  function simulateProtonLaunch(fileName) {
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Proton GE: Launching ${fileName}...`);
    }
    playUiTone([440, 554.37, 659.25], 0.25, 'sine', 0.06);
    setTimeout(() => {
      if (typeof window.triggerNotification === 'function') {
        window.triggerNotification(`${fileName} initialized successfully in Wine-ASIO sandbox.`);
      }
      playUiTone([523.25, 659.25, 1046.5], 0.3, 'sine', 0.08);
    }, 1200);
  }

  function openPdfViewerModal(fileName, sizeStr, dataUrl) {
    let modal = document.getElementById('pdf-viewer-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'pdf-viewer-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="toccata-modal-sheet" style="width: 780px; max-width: 95vw; height: 560px; max-height: 90vh; display: flex; flex-direction: column;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 18px; border-bottom:1px solid var(--glass-border);">
          <div style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff2d55" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${fileName} <span style="font-size:11px; color:var(--text-secondary); font-weight:normal;">(${sizeStr})</span>
          </div>
          <button class="btn btn-secondary" onclick="this.closest('#pdf-viewer-modal').remove()" style="padding:2px 8px;">✕</button>
        </div>
        <iframe src="${dataUrl}" style="flex:1; width:100%; border:none; background:#525659;"></iframe>
      </div>
    `;
    playUiTone([659.25], 0.12, 'sine', 0.05);
  }

  function openVideoPlayerModal(fileName, sizeStr, dataUrl) {
    let modal = document.getElementById('video-player-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'video-player-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="toccata-modal-sheet" style="width: 740px; max-width: 95vw; display: flex; flex-direction: column; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 18px; border-bottom:1px solid var(--glass-border);">
          <div style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:8px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#34c759" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>
            ${fileName} <span style="font-size:11px; color:var(--text-secondary); font-weight:normal;">(${sizeStr})</span>
          </div>
          <button class="btn btn-secondary" onclick="this.closest('#video-player-modal').remove()" style="padding:2px 8px;">✕</button>
        </div>
        <div style="background:#000; display:flex; align-items:center; justify-content:center; max-height:480px;">
          <video src="${dataUrl}" controls autoplay style="max-width:100%; max-height:460px; outline:none;"></video>
        </div>
      </div>
    `;
    playUiTone([659.25], 0.12, 'sine', 0.05);
  }

  function handleExternalFiles(files) {
    if (!files || files.length === 0) return;

    const imgExts = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico', 'heic'];
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'opus', 'mid', 'midi'];
    const videoExts = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
    const codeExts = ['txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'py', 'rs', 'c', 'cpp', 'h', 'sh', 'bash', 'zsh', 'bat', 'ps1', 'xml', 'yaml', 'yml', 'toml', 'ini', 'sql', 'csv'];
    const pdfExts = ['pdf'];
    const exeExts = ['exe', 'msi'];

    Array.from(files).forEach(file => {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const sizeStr = formatBytes(file.size);

      if (imgExts.includes(ext) || file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          VFS['/Downloads'].unshift({ name: file.name, type: 'img', size: sizeStr, date: 'Just now', app: 'win-prism' });
          if (typeof window.openWindow === 'function') window.openWindow('win-prism');
          const frame = document.getElementById('prism-frame');
          if (frame) {
            frame.innerHTML = `<img src="${dataUrl}" style="max-width:100%; max-height:280px; object-fit:contain; border-radius:10px; box-shadow:0 12px 30px rgba(0,0,0,0.5);" alt="${file.name}">`;
          }
          const title = document.getElementById('prism-window-title');
          if (title) title.innerHTML = `<span class="proxy-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21" stroke="currentColor" stroke-width="2" fill="none"/></svg></span>Prism &mdash; ${file.name}`;
          const exif = document.getElementById('prism-exif-pill');
          if (exif) exif.innerHTML = `<span>${sizeStr}</span><span>${file.type || ext.toUpperCase()}</span><span>Host Imported</span><span>Display P3</span>`;
          if (typeof window.triggerNotification === 'function') window.triggerNotification(`Imported ${file.name} to Prism Photos`);
          playUiTone([659.25, 783.99], 0.15, 'sine', 0.05);
        };
        reader.readAsDataURL(file);
      } else if (audioExts.includes(ext) || file.type.startsWith('audio/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          VFS['/Downloads'].unshift({ name: file.name, type: 'audio', size: sizeStr, date: 'Just now', app: 'win-sonata' });
          if (typeof window.openWindow === 'function') window.openWindow('win-sonata');
          let customAudio = document.getElementById('sonata-custom-audio-el');
          if (!customAudio) {
            customAudio = document.createElement('audio');
            customAudio.id = 'sonata-custom-audio-el';
            document.body.appendChild(customAudio);
          }
          customAudio.src = dataUrl;
          customAudio.play().catch(() => {});
          const titleEl = document.querySelector('#win-sonata .sonata-title');
          if (titleEl) titleEl.textContent = file.name;
          const artistEl = document.querySelector('#win-sonata .sonata-artist');
          if (artistEl) artistEl.textContent = `Local File (${sizeStr}) • PipeWire Direct Sink`;
          document.getElementById('sonata-vinyl')?.classList.add('playing');
          document.getElementById('sonata-spectrum')?.classList.add('playing');
          if (typeof window.triggerNotification === 'function') window.triggerNotification(`Playing ${file.name} via PipeWire 0.7ms DSP`);
          playUiTone([523.25, 659.25, 1046.5], 0.2, 'sine', 0.06);
        };
        reader.readAsDataURL(file);
      } else if (codeExts.includes(ext) || file.type.startsWith('text/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          const newDoc = {
            id: 'doc-' + Date.now(),
            title: file.name,
            date: 'Just now',
            content: text
          };
          SCRIBE_DOCS.unshift(newDoc);
          VFS['/Documents'].unshift({ name: file.name, type: 'doc', size: sizeStr, date: 'Just now', app: 'win-scribe' });
          if (typeof window.openWindow === 'function') window.openWindow('win-scribe');
          switchScribeDoc(newDoc.id);
          if (typeof window.triggerNotification === 'function') window.triggerNotification(`Loaded ${file.name} in Scribe (${sizeStr})`);
        };
        reader.readAsText(file);
      } else if (pdfExts.includes(ext)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          VFS['/Documents'].unshift({ name: file.name, type: 'pdf', size: sizeStr, date: 'Just now', app: 'win-scribe' });
          openPdfViewerModal(file.name, sizeStr, dataUrl);
        };
        reader.readAsDataURL(file);
      } else if (videoExts.includes(ext) || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          openVideoPlayerModal(file.name, sizeStr, dataUrl);
        };
        reader.readAsDataURL(file);
      } else if (exeExts.includes(ext)) {
        VFS['/Downloads'].unshift({ name: file.name, type: 'exe', size: sizeStr, date: 'Just now', app: 'win-installer' });
        openProtonExecutionModal(file.name, sizeStr);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const buffer = e.target.result;
          openUniversalHexInspector(file.name, sizeStr, file.type, buffer);
        };
        reader.readAsArrayBuffer(file.slice(0, 512));
      }
    });
  }
  window.handleExternalFiles = handleExternalFiles;

  function initGlobalDropzone() {
    let overlay = document.getElementById('desktop-dropzone-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'desktop-dropzone-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,122,255,0.18);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:3px dashed var(--accent-color);z-index:999999;display:none;align-items:center;justify-content:center;flex-direction:column;gap:16px;color:#fff;pointer-events:none;transition:opacity 0.2s ease;';
      overlay.innerHTML = `
        <div style="width:84px;height:84px;border-radius:22px;background:var(--accent-color);display:flex;align-items:center;justify-content:center;box-shadow:0 12px 40px var(--accent-glow);">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#fff" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        </div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-0.5px;text-shadow:0 4px 12px rgba(0,0,0,0.5);">Drop files into Toccata OS</div>
        <div style="font-size:13px;opacity:0.85;text-shadow:0 2px 6px rgba(0,0,0,0.5);">Universal Dispatcher: Text, Audio, Video, Images, PDFs, Archives &amp; Windows Binaries</div>
      `;
      document.body.appendChild(overlay);
    }

    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      overlay.style.display = 'flex';
    });

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        overlay.style.display = 'none';
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      overlay.style.display = 'none';
      if (e.dataTransfer && e.dataTransfer.files) {
        handleExternalFiles(e.dataTransfer.files);
      }
    });
  }

  // ==========================================================================
  // INITIALIZATION ON DOM READY
  // ==========================================================================
  function initSuite() {
    initCadenceContextMenu();
    initScribeNotebook();
    initHorizonTabBar();
    initGlobalDropzone();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuite);
  } else {
    initSuite();
  }
})();
