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
      { name: 'Chronicle.app', type: 'app', size: '54 MB', date: 'Today at 1:40 AM', app: 'win-chronicle' },
      { name: 'Reminders.app', type: 'app', size: '19 MB', date: 'Today at 1:40 AM', app: 'win-todo' },
      { name: 'Contacts.app', type: 'app', size: '21 MB', date: 'Today at 1:40 AM', app: 'win-contacts' },
      { name: 'Zorin Connect.app', type: 'app', size: '34 MB', date: 'Today at 1:40 AM', app: 'win-connect' },
      { name: 'Welcome Tour.app', type: 'app', size: '15 MB', date: 'Today at 1:40 AM', app: 'win-tour' }
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
        <button class="btn btn-secondary" onclick="this.closest('#cadence-file-info-modal').remove()" style="padding:2px 8px;font-size:11px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
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
  // 2. SCRIBE: MULTI-NOTE NOTEBOOK & LIVE MARKDOWN ENGINE (PERSISTENT & INTERACTIVE)
  // ==========================================================================
  const DEFAULT_SCRIBE_DOCS = [
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

  let SCRIBE_DOCS = [];
  try {
    const savedScribe = localStorage.getItem('toccata_scribe_docs');
    SCRIBE_DOCS = savedScribe ? JSON.parse(savedScribe) : DEFAULT_SCRIBE_DOCS;
  } catch (e) {
    SCRIBE_DOCS = DEFAULT_SCRIBE_DOCS;
  }

  function saveScribeToStorage() {
    try {
      localStorage.setItem('toccata_scribe_docs', JSON.stringify(SCRIBE_DOCS));
    } catch (e) {}
  }

  let currentScribeDocId = SCRIBE_DOCS[0] ? SCRIBE_DOCS[0].id : 'doc-manifesto';
  let scribeSearchFilter = '';

  function initScribeNotebook() {
    const splitContainer = document.querySelector('.scribe-split-container');
    if (!splitContainer) return;

    let sidebar = document.getElementById('scribe-docs-sidebar');
    if (!sidebar) {
      sidebar = document.createElement('div');
      sidebar.id = 'scribe-docs-sidebar';
      sidebar.className = 'finder-sidebar';
      sidebar.style.cssText = 'width: 200px; min-width: 180px; border-right: 1px solid var(--glass-border); display: flex; flex-direction: column; padding: 10px; gap: 4px; overflow-y: auto;';
      splitContainer.prepend(sidebar);
    }
    renderScribeDocsList();
    if (SCRIBE_DOCS.length > 0) {
      switchScribeDoc(currentScribeDocId);
    }
  }

  function renderScribeDocsList() {
    const sidebar = document.getElementById('scribe-docs-sidebar');
    if (!sidebar) return;

    sidebar.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 2px 4px;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-secondary);">Notebook Files</span>
        <button class="toolbar-icon-btn" onclick="addNewScribeDoc()" title="Create New Document (Ctrl+N)" style="width: 22px; height: 22px; font-size: 14px; font-weight: 700;">+</button>
      </div>
      <input type="text" class="scribe-search-box" placeholder="Search notes..." value="${scribeSearchFilter}" oninput="filterScribeDocs(this.value)">
      <div id="scribe-docs-rows" style="display:flex;flex-direction:column;gap:3px;overflow-y:auto;flex:1;"></div>
    `;

    const rowsContainer = document.getElementById('scribe-docs-rows');
    if (!rowsContainer) return;

    const filtered = scribeSearchFilter ? SCRIBE_DOCS.filter(d => d.title.toLowerCase().includes(scribeSearchFilter.toLowerCase()) || d.content.toLowerCase().includes(scribeSearchFilter.toLowerCase())) : SCRIBE_DOCS;

    if (filtered.length === 0) {
      rowsContainer.innerHTML = '<div style="font-size:11px;color:var(--text-secondary);padding:10px 4px;text-align:center;">No matching notes</div>';
      return;
    }

    filtered.forEach(doc => {
      const row = document.createElement('div');
      row.className = `scribe-note-item ${doc.id === currentScribeDocId ? 'active' : ''}`;
      row.onclick = () => switchScribeDoc(doc.id);
      row.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
          <div style="font-weight: 600; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${doc.title}</div>
          <div style="font-size: 10px; color: var(--text-secondary);">${doc.date}</div>
        </div>
        <button class="scribe-del-btn" onclick="deleteScribeDoc('${doc.id}', event)" title="Delete Note">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      `;
      rowsContainer.appendChild(row);
    });
  }

  function filterScribeDocs(query) {
    scribeSearchFilter = query || '';
    renderScribeDocsList();
  }
  window.filterScribeDocs = filterScribeDocs;

  function switchScribeDoc(docId) {
    const input = document.getElementById('scribe-input');
    const cur = SCRIBE_DOCS.find(d => d.id === currentScribeDocId);
    if (cur && input) cur.content = input.value;

    const doc = SCRIBE_DOCS.find(d => d.id === docId);
    if (!doc) return;

    currentScribeDocId = docId;
    if (input) input.value = doc.content;

    const titleEl = document.querySelector('#win-scribe .window-title');
    if (titleEl) {
      titleEl.innerHTML = `<span class="proxy-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>Scribe &mdash; ${doc.title}`;
    }

    renderScribeDocsList();
    renderLiveMarkdownPreview();
    saveScribeToStorage();
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
    saveScribeToStorage();
    switchScribeDoc(newId);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Created ${newDoc.title}`);
    }
  }
  window.addNewScribeDoc = addNewScribeDoc;

  function deleteScribeDoc(docId, event) {
    if (event) event.stopPropagation();
    if (SCRIBE_DOCS.length <= 1) {
      if (typeof window.triggerNotification === 'function') {
        window.triggerNotification('Cannot delete the last remaining note');
      }
      return;
    }
    const idx = SCRIBE_DOCS.findIndex(d => d.id === docId);
    if (idx === -1) return;
    const removedTitle = SCRIBE_DOCS[idx].title;
    SCRIBE_DOCS.splice(idx, 1);
    saveScribeToStorage();
    if (currentScribeDocId === docId) {
      currentScribeDocId = SCRIBE_DOCS[0].id;
    }
    switchScribeDoc(currentScribeDocId);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Deleted ${removedTitle}`);
    }
    playUiTone([330, 220], 0.12, 'sine', 0.04);
  }
  window.deleteScribeDoc = deleteScribeDoc;

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
        <span style="color:#34c759;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#34c759" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 8 6.5 12 13 4"/></svg> Synced to Core NVMe</span>
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

  // Intercept scribe input for live markdown & storage sync
  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'scribe-input') {
      const cur = SCRIBE_DOCS.find(d => d.id === currentScribeDocId);
      if (cur) {
        cur.content = e.target.value;
        cur.date = 'Just now';
        saveScribeToStorage();
      }
      renderLiveMarkdownPreview();
    }
  });

  // ==========================================================================
  // 3. HORIZON: SOVEREIGN WEB BROWSER ENGINE (Apple Safari & WebKit Architecture)
  // Complete Multi-Tab, Omnibox Search, Facebook, Google, YouTube, GitHub,
  // Wikipedia, Reddit, Hacker News, & Live IFrame Engine
  // ==========================================================================
  // Dual-Engine Architecture (Apple WebKit 605 Safari vs Chromium 131 Blink)
  let currentHorizonEngine = 'webkit';

  function updateHorizonEngineUI() {
    const btn = document.getElementById('horizon-engine-btn');
    const label = document.getElementById('horizon-engine-label');
    if (!btn || !label) return;
    if (currentHorizonEngine === 'webkit') {
      btn.className = 'engine-switcher-btn';
      label.textContent = 'WebKit';
      btn.title = 'Active Engine: Apple WebKit 605.1.15 (Safari Engine) - 82MB RAM • Zero Telemetry. Click to switch to Chromium';
    } else {
      btn.className = 'engine-switcher-btn engine-chromium';
      label.textContent = 'Chromium';
      btn.title = 'Active Engine: Chromium 131.0 (Blink Compatibility Engine) - Extensions & DRM. Click to switch to WebKit';
    }
  }

  function toggleHorizonEngine() {
    currentHorizonEngine = currentHorizonEngine === 'webkit' ? 'chromium' : 'webkit';
    updateHorizonEngineUI();
    if (typeof playHarmonicChime === 'function') {
      playHarmonicChime([currentHorizonEngine === 'webkit' ? 523.25 : 659.25], 0.15);
    }
    if (typeof triggerNotification === 'function') {
      triggerNotification(`Horizon Engine: Switched to ${currentHorizonEngine === 'webkit' ? 'Apple WebKit 605 (Safari Engine)' : 'Chromium 131 (Blink Compatibility Engine)'}`);
    }
    const currentTab = HORIZON_TABS.find(t => t.id === currentHorizonTabId);
    if (currentTab) {
      navigateHorizon(currentTab.url, false);
    }
  }
  window.toggleHorizonEngine = toggleHorizonEngine;
  window.currentHorizonEngine = currentHorizonEngine;

  const HORIZON_TABS = [
    { id: 'tab-1', title: 'Speed & Latency', url: 'toccata://speed-benchmark' },
    { id: 'tab-2', title: 'Google Search', url: 'https://www.google.com' },
    { id: 'tab-3', title: 'Wikipedia - OS', url: 'https://en.wikipedia.org' },
    { id: 'tab-4', title: 'Hacker News', url: 'https://news.ycombinator.com' }
  ];

  let currentHorizonTabId = 'tab-1';
  const horizonHistory = ['toccata://speed-benchmark'];
  let horizonHistoryIdx = 0;
  let horizonTrackerCount = 2841;

  function initHorizonTabBar() {
    const horizonWindow = document.getElementById('win-horizon');
    if (!horizonWindow) return;

    let tabBar = document.getElementById('horizon-tab-bar');
    if (!tabBar) {
      tabBar = document.createElement('div');
      tabBar.id = 'horizon-tab-bar';
      tabBar.style.cssText = 'display:flex;align-items:center;padding:4px 12px 0;gap:6px;background:rgba(0,0,0,0.12);border-bottom:1px solid var(--glass-border);';
      const body = horizonWindow.querySelector('.horizon-body');
      if (body) body.prepend(tabBar);
    }
    renderHorizonTabs();
  }
  window.initHorizonTabBar = initHorizonTabBar;

  function renderHorizonTabs() {
    const tabBar = document.getElementById('horizon-tab-bar');
    if (!tabBar) return;

    tabBar.innerHTML = '';
    HORIZON_TABS.forEach(tab => {
      const tabEl = document.createElement('div');
      const isActive = tab.id === currentHorizonTabId;
      tabEl.className = `horizon-tab ${isActive ? 'active' : ''}`;
      tabEl.style.cssText = `display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:8px 8px 0 0;font-size:12px;font-weight:500;cursor:pointer;background:${isActive ? 'var(--glass-bg)' : 'transparent'};border:${isActive ? '1px solid var(--glass-border)' : '1px solid transparent'};border-bottom:none;color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};box-shadow:${isActive ? '0 -1px 4px rgba(0,0,0,0.06)' : 'none'};transition:all 0.15s ease;`;
      tabEl.innerHTML = `
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        <span style="max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${tab.title}</span>
        <span onclick="event.stopPropagation(); closeHorizonTab('${tab.id}')" style="opacity:0.6;font-size:11px;padding:2px;display:flex;align-items:center;border-radius:50%;" title="Close Tab"><svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></span>
      `;
      tabEl.onclick = () => selectHorizonTab(tab.id);
      tabBar.appendChild(tabEl);
    });

    const addTabBtn = document.createElement('button');
    addTabBtn.className = 'toolbar-icon-btn';
    addTabBtn.title = 'Open New Tab';
    addTabBtn.style.cssText = 'width:24px;height:24px;font-size:14px;';
    addTabBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
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
    navigateHorizon(tab.url, false);
  }
  window.selectHorizonTab = selectHorizonTab;

  function closeHorizonTab(tabId) {
    if (HORIZON_TABS.length <= 1) {
      createNewHorizonTab();
    }
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
      title: 'Google Search',
      url: 'https://www.google.com'
    });
    selectHorizonTab(newId);
  }
  window.createNewHorizonTab = createNewHorizonTab;

  // History & Navigation Controls
  function horizonGoBack() {
    if (horizonHistoryIdx > 0) {
      horizonHistoryIdx--;
      const url = horizonHistory[horizonHistoryIdx];
      navigateHorizon(url, false);
      if (typeof playHarmonicChime === 'function') playHarmonicChime([480], 0.1);
    }
  }
  window.horizonGoBack = horizonGoBack;

  function horizonGoForward() {
    if (horizonHistoryIdx < horizonHistory.length - 1) {
      horizonHistoryIdx++;
      const url = horizonHistory[horizonHistoryIdx];
      navigateHorizon(url, false);
      if (typeof playHarmonicChime === 'function') playHarmonicChime([520], 0.1);
    }
  }
  window.horizonGoForward = horizonGoForward;

  function horizonReload() {
    const input = document.getElementById('horizon-url-input');
    const url = input ? input.value : 'toccata://speed-benchmark';
    navigateHorizon(url, false);
    if (typeof playHarmonicChime === 'function') playHarmonicChime([659.25], 0.12);
    if (typeof triggerNotification === 'function') triggerNotification('Horizon: Page reloaded');
  }
  window.horizonReload = horizonReload;

  function updateNavButtonStates() {
    const backBtn = document.querySelector('.horizon-toolbar .toolbar-nav-group button:nth-child(1)');
    const fwdBtn = document.querySelector('.horizon-toolbar .toolbar-nav-group button:nth-child(2)');
    if (backBtn) backBtn.style.opacity = horizonHistoryIdx > 0 ? '1' : '0.35';
    if (fwdBtn) fwdBtn.style.opacity = horizonHistoryIdx < horizonHistory.length - 1 ? '1' : '0.35';
  }

  // Omnibox Resolution Engine
  function resolveDestination(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed) return { type: 'benchmark', title: 'Speed & Latency', url: 'toccata://speed-benchmark' };

    // Toccata internal schemes
    if (trimmed.startsWith('toccata://speed') || trimmed === 'speed') {
      return { type: 'benchmark', title: 'Speed & Latency', url: 'toccata://speed-benchmark' };
    }
    if (trimmed.startsWith('toccata://arch') || trimmed === 'architecture') {
      return { type: 'architecture', title: 'Toccata Architecture', url: 'toccata://architecture' };
    }
    if (trimmed.startsWith('toccata://pipewire') || trimmed === 'pipewire') {
      return { type: 'pipewire', title: 'PipeWire Studio', url: 'toccata://pipewire-studio' };
    }

    const lower = trimmed.toLowerCase();

    // Facebook
    if (lower === 'facebook' || lower === 'fb' || lower.includes('facebook.com') || lower.includes('fb.com')) {
      return { type: 'facebook', title: 'Facebook', url: 'https://www.facebook.com' };
    }

    // Google Homepage
    if (lower === 'google' || lower === 'google.com' || lower === 'https://google.com' || lower === 'https://www.google.com') {
      return { type: 'google_home', title: 'Google', url: 'https://www.google.com' };
    }

    // YouTube
    if (lower === 'youtube' || lower === 'yt' || lower.includes('youtube.com') || lower.includes('youtu.be')) {
      return { type: 'youtube', title: 'YouTube', url: 'https://www.youtube.com' };
    }

    // GitHub
    if (lower === 'github' || lower.includes('github.com')) {
      return { type: 'github', title: 'GitHub - toccata-os', url: 'https://github.com/kicode01/toccata-os' };
    }

    // Wikipedia
    if (lower === 'wikipedia' || lower === 'wiki' || lower.includes('wikipedia.org')) {
      return { type: 'wikipedia', title: 'Wikipedia - Toccata', url: 'https://en.wikipedia.org/wiki/Toccata' };
    }

    // Reddit
    if (lower === 'reddit' || lower.includes('reddit.com')) {
      return { type: 'reddit', title: 'Reddit - r/linux', url: 'https://www.reddit.com/r/linux' };
    }

    // Hacker News
    if (lower === 'hackernews' || lower === 'hn' || lower.includes('ycombinator.com')) {
      return { type: 'hackernews', title: 'Hacker News', url: 'https://news.ycombinator.com' };
    }

    // ProtonDB
    if (lower === 'protondb' || lower.includes('protondb.com')) {
      return { type: 'protondb', title: 'ProtonDB Ledger', url: 'https://www.protondb.com' };
    }

    // Live URL with domain (e.g. archlinux.org, duckduckgo.com)
    if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(lower) || lower.startsWith('http://') || lower.startsWith('https://')) {
      const fullUrl = lower.startsWith('http') ? trimmed : 'https://' + trimmed;
      const domain = fullUrl.replace(/^https?:\/\//i, '').split('/')[0];
      return { type: 'live_web', title: domain, url: fullUrl, domain: domain };
    }

    // Default: Search Engine Query (Google Search Results)
    return { type: 'search', title: `${trimmed} - Google Search`, url: `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`, query: trimmed };
  }

  // Main Horizon Navigation Dispatcher
  function navigateHorizon(inputUrl, recordHistory = true) {
    const viewport = document.getElementById('horizon-page-content');
    if (!viewport) return;

    const dest = resolveDestination(inputUrl);

    // Update active tab title and URL
    const activeTab = HORIZON_TABS.find(t => t.id === currentHorizonTabId);
    if (activeTab) {
      activeTab.title = dest.title;
      activeTab.url = dest.url;
      renderHorizonTabs();
    }

    // Update address bar
    const urlInput = document.getElementById('horizon-url-input');
    if (urlInput) urlInput.value = dest.url;

    // Track history
    if (recordHistory) {
      horizonHistory.push(dest.url);
      horizonHistoryIdx = horizonHistory.length - 1;
    }
    updateNavButtonStates();

    // Increment tracker block badge
    horizonTrackerCount += Math.floor(Math.random() * 6) + 2;
    const trackerEl = document.getElementById('horizon-tracker-count');
    if (trackerEl) trackerEl.textContent = horizonTrackerCount.toLocaleString();

    // Render corresponding destination
    switch (dest.type) {
      case 'facebook':
        renderFacebookPage(viewport);
        break;
      case 'google_home':
        renderGoogleHomePage(viewport);
        break;
      case 'search':
        renderGoogleSearchResults(viewport, dest.query);
        break;
      case 'youtube':
        renderYouTubePage(viewport);
        break;
      case 'github':
        renderGitHubPage(viewport);
        break;
      case 'wikipedia':
        renderWikipediaPage(viewport);
        break;
      case 'reddit':
        renderRedditPage(viewport);
        break;
      case 'hackernews':
        renderHackerNewsPage(viewport);
        break;
      case 'protondb':
        renderProtonDbPage(viewport);
        break;
      case 'benchmark':
        renderBenchmarkPage(viewport);
        break;
      case 'architecture':
        renderArchitecturePage(viewport);
        break;
      case 'pipewire':
        renderPipeWireStudioPage(viewport);
        break;
      case 'live_web':
      default:
        renderLiveWebPage(viewport, dest.url, dest.domain || dest.url);
        break;
    }
  }
  window.navigateHorizon = navigateHorizon;

  // 1. FACEBOOK APPLICATION VIEW
  function renderFacebookPage(container) {
    container.innerHTML = `
      <div style="background:#f0f2f5; min-height:100%; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#050505;">
        <!-- Top Nav -->
        <div style="height:56px; background:#ffffff; border-bottom:1px solid #e4e6eb; display:flex; align-items:center; justify-content:space-between; padding:0 16px; position:sticky; top:0; z-index:100; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <div style="display:flex; align-items:center; gap:10px;">
            <svg viewBox="0 0 36 36" width="38" height="38" fill="#1877f2" style="cursor:pointer;" onclick="navigateHorizon('facebook')"><path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 8.328 5.656 15.342 13.312 17.399V23.766h-4.32V18h4.32v-4.398c0-4.264 2.54-6.621 6.43-6.621 1.863 0 3.812.332 3.812.332v4.191h-2.148c-2.115 0-2.775 1.312-2.775 2.66V18h4.721l-.755 5.766h-3.966v12.104z"/></svg>
            <div style="background:#f0f2f5; border-radius:20px; padding:7px 14px; display:flex; align-items:center; gap:8px; width:220px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#65676b" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search Facebook" onkeydown="if(event.key==='Enter') navigateHorizon(this.value)" style="background:transparent; border:none; outline:none; font-size:13px; width:100%; color:#050505;">
            </div>
          </div>

          <div style="display:flex; height:100%; align-items:center; gap:4px;">
            <div style="height:100%; padding:0 24px; display:flex; align-items:center; border-bottom:3px solid #1877f2; cursor:pointer;" title="Home">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877f2"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            </div>
            <div style="height:100%; padding:0 24px; display:flex; align-items:center; border-bottom:3px solid transparent; cursor:pointer;" title="Watch">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#65676b" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
            </div>
            <div style="height:100%; padding:0 24px; display:flex; align-items:center; border-bottom:3px solid transparent; cursor:pointer;" title="Marketplace">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#65676b" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            </div>
            <div style="height:100%; padding:0 24px; display:flex; align-items:center; border-bottom:3px solid transparent; cursor:pointer;" title="Groups">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#65676b" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:36px; height:36px; border-radius:50%; background:#e4e6eb; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Messenger" onclick="triggerNotification('Facebook Messenger: 3 unread chats')">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.516 3.734 7.21V22l3.375-1.85c.92.255 1.895.394 2.891.394 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.045 12.455l-2.67-2.85-5.21 2.85 5.733-6.09 2.738 2.85 5.142-2.85-5.733 6.09z"/></svg>
            </div>
            <div style="width:36px; height:36px; border-radius:50%; background:#e4e6eb; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Notifications" onclick="triggerNotification('Facebook: Linus Torvalds liked your post')">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
            </div>
            <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #007aff, #5856d6); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; cursor:pointer;">TU</div>
          </div>
        </div>

        <!-- Body Grid -->
        <div style="display:flex; justify-content:center; max-width:1180px; margin:0 auto; padding:16px 12px; gap:20px;">
          <!-- Left Column -->
          <div style="width:240px; flex-shrink:0;">
            <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; cursor:pointer; font-weight:600; font-size:13.5px;">
              <div style="width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg, #007aff, #5856d6); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">TU</div>
              <span>Toccata User</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13.5px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877f2"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
              <span>Friends (38 online)</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13.5px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#2e89ff"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
              <span>Saved Articles</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13.5px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#f35369"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span>Memories</span>
            </div>
            <div style="display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:8px; cursor:pointer; font-size:13.5px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#eab308"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span>Favorites &amp; Groups</span>
            </div>
          </div>

          <!-- Feed Column -->
          <div style="flex:1; max-width:540px;">
            <!-- Create Post Box -->
            <div style="background:#ffffff; border-radius:10px; padding:12px 16px; margin-bottom:14px; box-shadow:0 1px 2px rgba(0,0,0,0.06); border:1px solid #e4e6eb;">
              <div style="display:flex; align-items:center; gap:10px; padding-bottom:10px; border-bottom:1px solid #e4e6eb;">
                <div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, #007aff, #5856d6); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; flex-shrink:0;">TU</div>
                <input type="text" id="fb-live-input" placeholder="What's on your mind, Toccata User?" onkeydown="if(event.key==='Enter') window.publishFacebookPost()" style="flex:1; background:#f0f2f5; border:none; outline:none; padding:8px 14px; border-radius:20px; font-size:13.5px; color:#050505;">
                <button onclick="window.publishFacebookPost()" style="background:#1877f2; color:#fff; border:none; padding:6px 14px; border-radius:6px; font-weight:600; font-size:13px; cursor:pointer;">Post</button>
              </div>
              <div style="display:flex; justify-content:space-around; padding-top:8px; font-size:12px; color:#65676b; font-weight:600;">
                <div style="display:flex; align-items:center; gap:6px; cursor:pointer;" onclick="triggerNotification('Live Video Studio Active')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f3425f" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Live Video
                </div>
                <div style="display:flex; align-items:center; gap:6px; cursor:pointer;" onclick="triggerNotification('Photo Upload Bridge Connected')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#45bd62" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Photo/video
                </div>
                <div style="display:flex; align-items:center; gap:6px; cursor:pointer;" onclick="triggerNotification('Feeling: Resonant')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f7b125" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg> Feeling/activity
                </div>
              </div>
            </div>

            <!-- Feed List -->
            <div id="fb-feed-stream" style="display:flex; flex-direction:column; gap:14px;">
              <!-- Official Toccata Post -->
              <div class="fb-post" style="background:#ffffff; border-radius:10px; padding:14px 16px; box-shadow:0 1px 2px rgba(0,0,0,0.06); border:1px solid #e4e6eb;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                  <div style="width:38px; height:38px; border-radius:50%; background:#0078f0; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px;">T</div>
                  <div>
                    <div style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:4px;">
                      Toccata OS Official
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877f2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    </div>
                    <div style="font-size:11.5px; color:#65676b;">2 hrs &bull; <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;display:inline-block;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Public</div>
                  </div>
                </div>
                <div style="font-size:13.5px; line-height:1.5; margin-bottom:12px;">
                  Toccata OS 1.0.4 "Sonata" has been deployed! Crafted with the Apple macOS 27 UI Kit, 0.7ms low-latency studio audio via PipeWire, and 2,220 Windows installer compatibility rules. 100% telemetry-free computing.
                </div>
                <div style="background:linear-gradient(135deg, #090d16, #1e293b); border-radius:8px; padding:20px; color:#fff; text-align:center; margin-bottom:12px;">
                  <div style="font-size:20px; font-weight:800; letter-spacing:-0.4px;">Toccata OS 1.0.4 &ldquo;Sonata&rdquo;</div>
                  <div style="font-size:12px; opacity:0.8; margin-top:4px;">0.7ms PipeWire &bull; 120Hz Wayland &bull; Apple macOS 27 UI Architecture</div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#65676b; padding-bottom:8px; border-bottom:1px solid #e4e6eb;">
                  <span id="fb-like-label-1">1,842 likes</span>
                  <span>348 comments &bull; 182 shares</span>
                </div>
                <div style="display:flex; justify-content:space-around; padding-top:6px;">
                  <button onclick="window.toggleFacebookLike(1)" id="fb-like-btn-1" style="flex:1; background:none; border:none; padding:7px 0; font-weight:600; font-size:12.5px; color:#65676b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:6px; transition:all 0.15s ease;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> Like
                  </button>
                  <button style="flex:1; background:none; border:none; padding:7px 0; font-weight:600; font-size:12.5px; color:#65676b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:6px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Comment
                  </button>
                  <button style="flex:1; background:none; border:none; padding:7px 0; font-weight:600; font-size:12.5px; color:#65676b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:6px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share
                  </button>
                </div>
              </div>

              <!-- Post 2: Arch Linux DAW Engineering -->
              <div class="fb-post" style="background:#ffffff; border-radius:10px; padding:14px 16px; box-shadow:0 1px 2px rgba(0,0,0,0.06); border:1px solid #e4e6eb;">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                  <div style="width:38px; height:38px; border-radius:50%; background:#10b981; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px;">AL</div>
                  <div>
                    <div style="font-weight:700; font-size:14px;">Arch Linux Audio Engineers</div>
                    <div style="font-size:11.5px; color:#65676b;">4 hrs &bull; <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;display:inline-block;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Public</div>
                  </div>
                </div>
                <div style="font-size:13.5px; line-height:1.5; margin-bottom:12px;">
                  We benchmarked Ableton Live 12 and FL Studio 24 inside Toccata's Wine-ASIO engine. Zero audio dropouts at 64 samples buffer size (0.67ms). Finally, a desktop Linux OS that musicians can trust on stage.
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#65676b; padding-bottom:8px; border-bottom:1px solid #e4e6eb;">
                  <span id="fb-like-label-2">892 likes</span>
                  <span>142 comments &bull; 44 shares</span>
                </div>
                <div style="display:flex; justify-content:space-around; padding-top:6px;">
                  <button onclick="window.toggleFacebookLike(2)" id="fb-like-btn-2" style="flex:1; background:none; border:none; padding:7px 0; font-weight:600; font-size:12.5px; color:#65676b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:6px; transition:all 0.15s ease;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> Like
                  </button>
                  <button style="flex:1; background:none; border:none; padding:7px 0; font-weight:600; font-size:12.5px; color:#65676b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:6px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Comment
                  </button>
                  <button style="flex:1; background:none; border:none; padding:7px 0; font-weight:600; font-size:12.5px; color:#65676b; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; border-radius:6px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Share
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div style="width:240px; flex-shrink:0;">
            <div style="font-weight:700; font-size:13px; color:#65676b; margin-bottom:8px;">Contacts</div>
            <div style="display:flex; align-items:center; gap:10px; padding:7px 8px; border-radius:8px; cursor:pointer;" onclick="triggerNotification('Chat started with Linus Torvalds')">
              <div style="width:30px; height:30px; border-radius:50%; background:#22c55e; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px;">LT</div>
              <div>
                <div style="font-weight:600; font-size:13px;">Linus Torvalds</div>
                <div style="font-size:10.5px; color:#22c55e;">&bull; Active now</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px; padding:7px 8px; border-radius:8px; cursor:pointer;" onclick="triggerNotification('Chat started with Steve Wozniak')">
              <div style="width:30px; height:30px; border-radius:50%; background:#f59e0b; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px;">SW</div>
              <div>
                <div style="font-weight:600; font-size:13px;">Steve Wozniak</div>
                <div style="font-size:10.5px; color:#22c55e;">&bull; Active now</div>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:10px; padding:7px 8px; border-radius:8px; cursor:pointer;" onclick="triggerNotification('Chat started with Ada Lovelace')">
              <div style="width:30px; height:30px; border-radius:50%; background:#ec4899; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:11px;">AL</div>
              <div>
                <div style="font-weight:600; font-size:13px;">Ada Lovelace</div>
                <div style="font-size:10.5px; color:#65676b;">12m ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.toggleFacebookLike = function(postId) {
    const btn = document.getElementById(`fb-like-btn-${postId}`);
    const label = document.getElementById(`fb-like-label-${postId}`);
    if (!btn || !label) return;
    const isLiked = btn.classList.toggle('liked');
    if (isLiked) {
      btn.style.color = '#1877f2';
      label.textContent = `${(postId === 1 ? 1843 : 893).toLocaleString()} likes`;
      if (typeof playHarmonicChime === 'function') playHarmonicChime([523.25, 659.25], 0.15);
    } else {
      btn.style.color = '#65676b';
      label.textContent = `${(postId === 1 ? 1842 : 892).toLocaleString()} likes`;
    }
  };

  window.publishFacebookPost = function() {
    const input = document.getElementById('fb-live-input');
    const text = input ? input.value.trim() : '';
    if (!text) return;
    input.value = '';

    const stream = document.getElementById('fb-feed-stream');
    if (!stream) return;

    const newPost = document.createElement('div');
    newPost.className = 'fb-post';
    newPost.style.cssText = 'background:#ffffff; border-radius:10px; padding:14px 16px; box-shadow:0 1px 2px rgba(0,0,0,0.06); border:1px solid #e4e6eb; animation:fadeInOverview 0.25s ease;';
    newPost.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
        <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg, #007aff, #5856d6); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px;">TU</div>
        <div>
          <div style="font-weight:700; font-size:14px;">Toccata User</div>
          <div style="font-size:11.5px; color:#65676b;">Just now &bull; <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-1px;display:inline-block;"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Public</div>
        </div>
      </div>
      <div style="font-size:13.5px; line-height:1.5; margin-bottom:12px;">${text}</div>
      <div style="display:flex; justify-content:space-between; font-size:12px; color:#65676b; padding-bottom:8px; border-bottom:1px solid #e4e6eb;">
        <span>1 like</span>
        <span>0 comments</span>
      </div>
    `;
    stream.prepend(newPost);
    if (typeof playHarmonicChime === 'function') playHarmonicChime([659.25, 880], 0.2);
    if (typeof triggerNotification === 'function') triggerNotification('Facebook: Post published');
  };

  // 2. GOOGLE HOMEPAGE VIEW
  function renderGoogleHomePage(container) {
    container.innerHTML = `
      <div style="background:#ffffff; min-height:100%; font-family:-apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; display:flex; flex-direction:column; justify-content:space-between; color:#202124;">
        <div style="height:60px; display:flex; justify-content:flex-end; align-items:center; padding:0 24px; gap:18px; font-size:13px;">
          <span style="cursor:pointer;" onclick="navigateHorizon('https://mail.google.com')">Gmail</span>
          <span style="cursor:pointer;" onclick="navigateHorizon('https://images.google.com')">Images</span>
          <div style="width:32px; height:32px; border-radius:50%; background:#1a73e8; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; cursor:pointer;">TU</div>
        </div>

        <div style="display:flex; flex-direction:column; align-items:center; padding:0 20px 80px;">
          <div style="font-size:72px; font-weight:500; letter-spacing:-2px; margin-bottom:28px; user-select:none;">
            <span style="color:#4285f4;">G</span><span style="color:#ea4335;">o</span><span style="color:#fbbc05;">o</span><span style="color:#4285f4;">g</span><span style="color:#34a853;">l</span><span style="color:#ea4335;">e</span>
          </div>

          <div style="width:100%; max-width:584px; background:#ffffff; border:1px solid #dfe1e5; border-radius:24px; padding:10px 16px; display:flex; align-items:center; gap:12px; box-shadow:0 1px 6px rgba(32,33,36,0.18);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa0a6" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="google-home-search" placeholder="Search Google or type a URL" onkeydown="if(event.key==='Enter') navigateHorizon(this.value)" style="flex:1; border:none; outline:none; font-size:15px; color:#202124;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285f4" stroke-width="2" style="cursor:pointer;" onclick="triggerNotification('Voice Search: Listening...')"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          </div>

          <div style="display:flex; gap:12px; margin-top:28px;">
            <button onclick="navigateHorizon(document.getElementById('google-home-search').value)" style="background:#f8f9fa; border:1px solid #f8f9fa; border-radius:4px; padding:10px 18px; font-size:14px; color:#3c4043; cursor:pointer;">Google Search</button>
            <button onclick="navigateHorizon('toccata://speed-benchmark')" style="background:#f8f9fa; border:1px solid #f8f9fa; border-radius:4px; padding:10px 18px; font-size:14px; color:#3c4043; cursor:pointer;">I'm Feeling Lucky</button>
          </div>

          <div style="margin-top:24px; font-size:13px; color:#70757a;">
            Quick Destinations:
            <a href="javascript:void(0)" onclick="navigateHorizon('facebook')" style="color:#1a0dab; text-decoration:none; margin:0 6px;">Facebook</a> &bull;
            <a href="javascript:void(0)" onclick="navigateHorizon('youtube')" style="color:#1a0dab; text-decoration:none; margin:0 6px;">YouTube</a> &bull;
            <a href="javascript:void(0)" onclick="navigateHorizon('wikipedia')" style="color:#1a0dab; text-decoration:none; margin:0 6px;">Wikipedia</a> &bull;
            <a href="javascript:void(0)" onclick="navigateHorizon('github')" style="color:#1a0dab; text-decoration:none; margin:0 6px;">GitHub</a>
          </div>
        </div>

        <div style="background:#f2f2f2; border-top:1px solid #dadce0; padding:12px 24px; font-size:14px; color:#70757a; display:flex; justify-content:space-between;">
          <span>Sovereign Search &bull; Zero Telemetry Shield Active</span>
          <span>Privacy &bull; Terms &bull; Settings</span>
        </div>
      </div>
    `;
  }

  // 3. GOOGLE SEARCH RESULTS VIEW
  function renderGoogleSearchResults(container, query) {
    const isFacebookQuery = query.toLowerCase().includes('facebook') || query.toLowerCase() === 'fb';

    container.innerHTML = `
      <div style="background:#ffffff; min-height:100%; font-family:-apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; color:#202124; padding:0 0 40px 0;">
        <!-- Header -->
        <div style="display:flex; align-items:center; padding:16px 24px; gap:24px; border-bottom:1px solid #ebebeb;">
          <div style="font-size:26px; font-weight:700; letter-spacing:-1px; cursor:pointer;" onclick="navigateHorizon('google')">
            <span style="color:#4285f4;">G</span><span style="color:#ea4335;">o</span><span style="color:#fbbc05;">o</span><span style="color:#4285f4;">g</span><span style="color:#34a853;">l</span><span style="color:#ea4335;">e</span>
          </div>
          <div style="flex:1; max-width:680px; background:#ffffff; border:1px solid #dfe1e5; border-radius:24px; padding:8px 16px; display:flex; align-items:center; gap:10px; box-shadow:0 1px 6px rgba(32,33,36,0.18);">
            <input type="text" value="${query}" onkeydown="if(event.key==='Enter') navigateHorizon(this.value)" style="flex:1; border:none; outline:none; font-size:15px; color:#202124;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4285f4" stroke-width="2.5" style="cursor:pointer;" onclick="navigateHorizon(this.previousElementSibling.value)"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
        </div>

        <!-- Filter Bar -->
        <div style="display:flex; gap:20px; padding:10px 140px; border-bottom:1px solid #ebebeb; font-size:13px; color:#5f6368;">
          <span style="color:#1a73e8; font-weight:600; border-bottom:3px solid #1a73e8; padding-bottom:8px; cursor:pointer;">All</span>
          <span style="cursor:pointer;" onclick="triggerNotification('Search tab: Images')">Images</span>
          <span style="cursor:pointer;" onclick="triggerNotification('Search tab: News')">News</span>
          <span style="cursor:pointer;" onclick="triggerNotification('Search tab: Videos')">Videos</span>
          <span style="cursor:pointer;" onclick="triggerNotification('Search tab: Maps')">Maps</span>
          <span style="cursor:pointer;">Tools</span>
        </div>

        <!-- Main Results Container -->
        <div style="display:flex; justify-content:space-between; max-width:1160px; margin:0 140px; padding-top:16px; gap:40px;">
          <!-- Left Column: Search Results -->
          <div style="flex:1; max-width:640px;">
            <div style="font-size:13px; color:#70757a; margin-bottom:20px;">About 2,840,000,000 results (0.22 seconds)</div>

            ${isFacebookQuery ? `
              <!-- Facebook Top Result -->
              <div style="margin-bottom:28px;">
                <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:#202124; margin-bottom:4px;">
                  <svg viewBox="0 0 36 36" width="18" height="18" fill="#1877f2"><path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 8.328 5.656 15.342 13.312 17.399V23.766h-4.32V18h4.32v-4.398c0-4.264 2.54-6.621 6.43-6.621 1.863 0 3.812.332 3.812.332v4.191h-2.148c-2.115 0-2.775 1.312-2.775 2.66V18h4.721l-.755 5.766h-3.966v12.104z"/></svg>
                  <span>Facebook</span> &bull; <span style="color:#5f6368;">https://www.facebook.com</span>
                </div>
                <h3 style="font-size:20px; font-weight:400; margin:0 0 6px 0;">
                  <a href="javascript:void(0)" onclick="navigateHorizon('facebook')" style="color:#1a0dab; text-decoration:none; cursor:pointer;">Facebook - Log In or Sign Up</a>
                </h3>
                <p style="font-size:14px; color:#4d5156; line-height:1.58; margin:0 0 12px 0;">
                  Log into Facebook to start sharing and connecting with your friends, family, and people you know.
                </p>
                <!-- Sitelinks -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; padding-left:14px; border-left:3px solid #dfe1e5;">
                  <div>
                    <a href="javascript:void(0)" onclick="navigateHorizon('facebook')" style="color:#1a0dab; font-size:14px; font-weight:500; text-decoration:none;">Log In</a>
                    <div style="font-size:12px; color:#4d5156;">Log into your Facebook account to connect with friends.</div>
                  </div>
                  <div>
                    <a href="javascript:void(0)" onclick="navigateHorizon('facebook')" style="color:#1a0dab; font-size:14px; font-weight:500; text-decoration:none;">Sign Up</a>
                    <div style="font-size:12px; color:#4d5156;">Create a new profile, share updates, and join communities.</div>
                  </div>
                  <div>
                    <a href="javascript:void(0)" onclick="navigateHorizon('facebook')" style="color:#1a0dab; font-size:14px; font-weight:500; text-decoration:none;">Marketplace</a>
                    <div style="font-size:12px; color:#4d5156;">Buy and sell items locally with community trust.</div>
                  </div>
                  <div>
                    <a href="javascript:void(0)" onclick="navigateHorizon('facebook')" style="color:#1a0dab; font-size:14px; font-weight:500; text-decoration:none;">Help Center</a>
                    <div style="font-size:12px; color:#4d5156;">Find answers and support for your Meta account.</div>
                  </div>
                </div>
              </div>
            ` : `
              <!-- General Result 1 -->
              <div style="margin-bottom:28px;">
                <div style="font-size:12px; color:#5f6368; margin-bottom:4px;">https://toccata.os &bull; architecture</div>
                <h3 style="font-size:20px; font-weight:400; margin:0 0 6px 0;">
                  <a href="javascript:void(0)" onclick="navigateHorizon('toccata://architecture')" style="color:#1a0dab; text-decoration:none;">Toccata OS 1.0.4: Sovereign Desktop Architecture</a>
                </h3>
                <p style="font-size:14px; color:#4d5156; line-height:1.58;">
                  High-performance desktop operating system uniting Arch Linux, XanMod 6.11 kernel with BORE scheduler, PipeWire 0.7ms low latency, and Apple macOS 27 UI Kit.
                </p>
              </div>

              <!-- General Result 2 -->
              <div style="margin-bottom:28px;">
                <div style="font-size:12px; color:#5f6368; margin-bottom:4px;">https://github.com/kicode01/toccata-os</div>
                <h3 style="font-size:20px; font-weight:400; margin:0 0 6px 0;">
                  <a href="javascript:void(0)" onclick="navigateHorizon('github')" style="color:#1a0dab; text-decoration:none;">kicode01/toccata-os: Complete Operating System Source Code</a>
                </h3>
                <p style="font-size:14px; color:#4d5156; line-height:1.58;">
                  Official GitHub repository with 2,220 Windows app compatibility rules, Wine-ASIO support, pearOS NiceC0re components, and Zorin OS dual personality suite.
                </p>
              </div>
            `}

            <!-- Result 3 -->
            <div style="margin-bottom:28px;">
              <div style="font-size:12px; color:#5f6368; margin-bottom:4px;">https://en.wikipedia.org &bull; wiki &bull; ${encodeURIComponent(query)}</div>
              <h3 style="font-size:20px; font-weight:400; margin:0 0 6px 0;">
                <a href="javascript:void(0)" onclick="navigateHorizon('wikipedia')" style="color:#1a0dab; text-decoration:none;">${query} - Wikipedia Reference</a>
              </h3>
              <p style="font-size:14px; color:#4d5156; line-height:1.58;">
                Comprehensive encyclopedic summary, history, architecture, and references related to ${query}.
              </p>
            </div>
          </div>

          ${isFacebookQuery ? `
            <!-- Knowledge Panel for Facebook -->
            <div style="width:340px; border:1px solid #dfe1e5; border-radius:8px; padding:20px; height:max-content; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <h2 style="font-size:22px; font-weight:400; margin:0 0 4px 0;">Facebook</h2>
              <div style="font-size:13px; color:#70757a; margin-bottom:14px;">Online social media and social networking service</div>
              <p style="font-size:13.5px; color:#4d5156; line-height:1.5; margin-bottom:16px;">
                Facebook is an online social media and social networking service owned by American technology giant Meta Platforms. Created in 2004 by Mark Zuckerberg with fellow Harvard College students.
              </p>
              <div style="border-top:1px solid #ebebeb; padding-top:12px; font-size:13px; display:flex; flex-direction:column; gap:8px;">
                <div><strong>CEO:</strong> Mark Zuckerberg (2004–present)</div>
                <div><strong>Founded:</strong> February 4, 2004, Cambridge, MA</div>
                <div><strong>Parent organization:</strong> Meta Platforms</div>
                <div><strong>Subsidiaries:</strong> Instagram, WhatsApp, Oculus, Messenger</div>
              </div>
              <button onclick="navigateHorizon('facebook')" style="width:100%; margin-top:18px; background:#1877f2; color:#fff; border:none; padding:10px; border-radius:6px; font-weight:600; font-size:13px; cursor:pointer;">Launch Facebook Web App</button>
            </div>
          ` : `
            <!-- Knowledge Panel for Toccata OS -->
            <div style="width:340px; border:1px solid #dfe1e5; border-radius:8px; padding:20px; height:max-content; box-shadow:0 1px 4px rgba(0,0,0,0.06);">
              <h2 style="font-size:22px; font-weight:400; margin:0 0 4px 0;">Toccata OS</h2>
              <div style="font-size:13px; color:#70757a; margin-bottom:14px;">Sovereign Audio &amp; UI Operating System</div>
              <p style="font-size:13.5px; color:#4d5156; line-height:1.5; margin-bottom:16px;">
                Linux-based real-time operating system engineered for professional digital audio workstations (DAWs) and 120Hz ProMotion desktop presentation.
              </p>
              <div style="border-top:1px solid #ebebeb; padding-top:12px; font-size:13px; display:flex; flex-direction:column; gap:8px;">
                <div><strong>Kernel:</strong> XanMod 6.11 Linux + BORE</div>
                <div><strong>Audio Subsystem:</strong> PipeWire 1.2 (0.7ms roundtrip)</div>
                <div><strong>UI Engine:</strong> Apple macOS 27 UI Kit Architecture</div>
                <div><strong>Compatibility:</strong> Proton GE 9.14 + Wine-ASIO</div>
              </div>
            </div>
          `}
        </div>
      </div>
    `;
  }

  // 4. YOUTUBE VIEW
  function renderYouTubePage(container) {
    container.innerHTML = `
      <div style="background:#0f0f0f; min-height:100%; font-family:-apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif; color:#f1f1f1; padding:0 0 30px 0;">
        <div style="height:56px; background:#0f0f0f; display:flex; align-items:center; justify-content:space-between; padding:0 24px; position:sticky; top:0; z-index:100; border-bottom:1px solid #272727;">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="display:flex; align-items:center; gap:4px; cursor:pointer;" onclick="navigateHorizon('youtube')">
              <svg width="28" height="20" viewBox="0 0 28 20" fill="#ff0000"><path d="M27.4 3.1A3.5 3.5 0 0 0 24.9.6C22.7 0 14 0 14 0S5.3 0 3.1.6A3.5 3.5 0 0 0 .6 3.1 36.8 36.8 0 0 0 0 10c0 2.4.2 4.7.6 6.9A3.5 3.5 0 0 0 3.1 19.4C5.3 20 14 20 14 20s8.7 0 10.9-.6a3.5 3.5 0 0 0 2.5-2.5c.4-2.2.6-4.5.6-6.9 0-2.4-.2-4.7-.6-6.9z"/><polygon fill="#fff" points="11.2,14.3 18.5,10 11.2,5.7"/></svg>
              <span style="font-weight:700; font-size:18px; letter-spacing:-0.5px;">YouTube</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; width:480px; background:#121212; border:1px solid #303030; border-radius:20px; overflow:hidden;">
            <input type="text" placeholder="Search" onkeydown="if(event.key==='Enter') navigateHorizon(this.value)" style="flex:1; background:transparent; border:none; outline:none; padding:8px 16px; color:#f1f1f1; font-size:14px;">
            <button style="background:#222; border:none; padding:8px 18px; color:#aaa; cursor:pointer;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
          </div>
          <div style="width:34px; height:34px; border-radius:50%; background:#0078f0; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px;">TU</div>
        </div>

        <div style="padding:20px 24px;">
          <div style="display:flex; gap:10px; margin-bottom:24px; overflow-x:auto;">
            <span style="background:#fff; color:#000; padding:6px 14px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">All</span>
            <span style="background:#272727; color:#fff; padding:6px 14px; border-radius:8px; font-size:13px; cursor:pointer;">PipeWire Audio</span>
            <span style="background:#272727; color:#fff; padding:6px 14px; border-radius:8px; font-size:13px; cursor:pointer;">Linux Kernel</span>
            <span style="background:#272727; color:#fff; padding:6px 14px; border-radius:8px; font-size:13px; cursor:pointer;">DAW Synthesis</span>
            <span style="background:#272727; color:#fff; padding:6px 14px; border-radius:8px; font-size:13px; cursor:pointer;">120Hz ProMotion</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px;">
            <!-- Video 1 -->
            <div style="cursor:pointer;" onclick="triggerNotification('Playing: Toccata OS 0.7ms Latency Breakdown')">
              <div style="height:160px; background:linear-gradient(135deg, #1e3a8a, #0f172a); border-radius:12px; display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:10px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.8); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">14:22</span>
              </div>
              <div style="font-weight:600; font-size:14px; line-height:1.4;">Toccata OS: How PipeWire Beats Windows ASIO by 11.7ms</div>
              <div style="font-size:12px; color:#aaa; margin-top:4px;">Audio Engine Reviews &bull; 148K views &bull; 1 day ago</div>
            </div>

            <!-- Video 2 -->
            <div style="cursor:pointer;" onclick="triggerNotification('Playing: BORE Scheduler vs CFS Linux')">
              <div style="height:160px; background:linear-gradient(135deg, #701a75, #1e1b4b); border-radius:12px; display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:10px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.8); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">18:05</span>
              </div>
              <div style="font-weight:600; font-size:14px; line-height:1.4;">XanMod 6.11 Kernel: Real-World 120Hz Wayland Benchmarks</div>
              <div style="font-size:12px; color:#aaa; margin-top:4px;">Linux Gaming Tech &bull; 92K views &bull; 3 days ago</div>
            </div>

            <!-- Video 3 -->
            <div style="cursor:pointer;" onclick="triggerNotification('Playing: Ableton Live 12 under Wine-ASIO')">
              <div style="height:160px; background:linear-gradient(135deg, #065f46, #022c22); border-radius:12px; display:flex; align-items:center; justify-content:center; position:relative; margin-bottom:10px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.8); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:700;">22:40</span>
              </div>
              <div style="font-weight:600; font-size:14px; line-height:1.4;">Ableton Live 12 + 64 VST3 Plugins: Zero Jitter Stress Test</div>
              <div style="font-size:12px; color:#aaa; margin-top:4px;">Studio Producers Hub &bull; 310K views &bull; 1 week ago</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 5. GITHUB REPOSITORY VIEW
  function renderGitHubPage(container) {
    container.innerHTML = `
      <div style="background:#0d1117; color:#c9d1d9; font-family:-apple-system, BlinkMacSystemFont, sans-serif; font-size:13px; min-height:100%; padding:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #30363d; padding-bottom:14px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <svg viewBox="0 0 16 16" width="22" height="22" fill="#f0f6fc"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"/></svg>
            <span style="font-size:16px; font-weight:700;"><span style="color:#58a6ff;">kicode01</span> / <span style="color:#f0f6fc;">toccata-os</span></span>
            <span style="font-size:11px; padding:2px 8px; border-radius:12px; border:1px solid #30363d; color:#8b949e;">Public</span>
          </div>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-secondary" style="font-size:11px; padding:3px 10px; display:inline-flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"/></svg> Star (1.2k)</button>
            <button class="btn btn-secondary" style="font-size:11px; padding:3px 10px;">Fork (142)</button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:18px;">
          <div>
            <div style="background:#161b22; border:1px solid #30363d; border-radius:8px; overflow:hidden;">
              <div style="background:#21262d; padding:10px 14px; font-weight:600; font-size:12px; border-bottom:1px solid #30363d;">Latest Commits &bull; Branch: main</div>
              <div style="padding:10px 14px; font-size:12px; border-bottom:1px solid #21262d;">feat(ui): redesign entire desktop interface using Apple macOS 27 UI Kit architecture</div>
              <div style="padding:10px 14px; font-size:12px; border-bottom:1px solid #21262d;">feat(apps): integrate full zorin os and pearos applications suite</div>
              <div style="padding:10px 14px; font-size:12px;">feat(kernel): XanMod 6.11 BORE scheduler with bit-perfect PipeWire 0.7ms</div>
            </div>
          </div>
          <div>
            <div style="background:#161b22; border:1px solid #30363d; border-radius:8px; padding:14px;">
              <div style="font-weight:700; margin-bottom:8px;">About</div>
              <p style="font-size:12px; color:#8b949e; line-height:1.5;">Sovereign desktop operating system fusing PipeWire audio latency, 120Hz Wayland compositing, and Apple macOS 27 design language.</p>
              <div style="margin-top:12px; display:flex; flex-direction:column; gap:6px; font-size:11px; color:#8b949e;">
                <div>Rust &bull; C++ &bull; Python &bull; Shell &bull; WebKit</div>
                <div>MIT License</div>
                <div>120 FPS Wayland Compositing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 6. WIKIPEDIA VIEW
  function renderWikipediaPage(container) {
    container.innerHTML = `
      <div style="background: #ffffff; color: #202122; font-family: -apple-system, BlinkMacSystemFont, serif; font-size: 14px; line-height: 1.6; min-height: 100%; padding: 28px 36px; max-width: 820px; margin: 0 auto;">
        <h1 style="font-size: 28px; font-weight: 400; border-bottom: 1px solid #a2a9b1; padding-bottom: 8px; margin-bottom: 16px;">Toccata and Fugue</h1>
        <div style="font-size: 12px; color: #54595d; margin-bottom: 18px;">From Wikipedia, the free encyclopedia &bull; Horizon Sovereign Mirror</div>
        <p><strong>Toccata</strong> (from Italian <em>toccare</em>, 'to touch') is a virtuosic piece of music typically for a keyboard instrument or plucked string instrument featuring fast-moving, lightly fingered or otherwise virtuosic passages or sections, emphasizing the dexterity of the performer's fingers.</p>
        <p>In operating systems architecture, <strong>Toccata OS</strong> derives its name from this philosophy: every pointer click and audio pulse has immediate tactile resonance ("to touch") without buffer delay, operating at 0.7ms real-time audio latency.</p>
      </div>
    `;
  }

  // 7. REDDIT VIEW
  function renderRedditPage(container) {
    container.innerHTML = `
      <div style="background:#0e1113; color:#d7dadc; font-family:-apple-system, BlinkMacSystemFont, sans-serif; font-size:13px; min-height:100%; padding:16px 24px;">
        <div style="height:48px; border-bottom:1px solid #343536; display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <div style="font-size:18px; font-weight:700; color:#ff4500;">reddit</div>
          <span style="font-size:14px; font-weight:600;">r/linux</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px; max-width:680px;">
          <div style="background:#1a1a1b; border:1px solid #343536; border-radius:6px; padding:12px; display:flex; gap:12px;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; font-weight:700; font-size:12px; color:#ff4500;">
              ▲ 1.4k ▼
            </div>
            <div>
              <div style="font-size:11px; color:#818384;">Posted by u/kernel_enthusiast 4 hours ago</div>
              <div style="font-size:15px; font-weight:600; margin:4px 0;">Toccata OS adopts Apple macOS 27 UI Kit and XanMod 6.11 Kernel with BORE scheduler</div>
              <p style="font-size:12px; color:#d7dadc; line-height:1.5;">Tested with Ableton Live 12 and FL Studio 24 inside Wine-ASIO container. Audio latency confirmed at 0.67ms with zero buffer underruns.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 8. HACKER NEWS VIEW
  function renderHackerNewsPage(container) {
    container.innerHTML = `
      <div style="background: #f6f6ef; color: #222; font-family: Verdana, sans-serif; font-size: 13px; min-height: 100%; padding: 14px;">
        <div style="background: #ff6600; padding: 4px 8px; font-weight: bold; color: #222; margin-bottom: 12px; display: flex; justify-content: space-between;">
          <span>Hacker News (Horizon Sovereign Mirror)</span>
          <span style="font-size: 11px;">100% Trackers Blocked</span>
        </div>
        <ol style="padding-left: 20px; margin: 0; line-height: 1.8;">
          <li><strong>Toccata OS 1.0.4 Released with macOS 27 Design Language</strong> (toccata.os) <div style="font-size:10px;color:#828282;">542 points by kicode 2 hours ago | 164 comments</div></li>
          <li><strong>PipeWire 0.7ms Latency on XanMod Kernel</strong> (pipewire.io) <div style="font-size:10px;color:#828282;">312 points by audio_pro 4 hours ago | 92 comments</div></li>
          <li><strong>Wayland direct scanout hits 120Hz on ProMotion displays</strong> (kwin.kde.org) <div style="font-size:10px;color:#828282;">195 points by wayland_core 6 hours ago | 64 comments</div></li>
        </ol>
      </div>
    `;
  }

  // 9. PROTONDB VIEW
  function renderProtonDbPage(container) {
    container.innerHTML = `
      <div style="background: #111317; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 13px; min-height: 100%; padding: 24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
          <h2 style="font-size: 20px; font-weight: 800; margin: 0; color: #ff5722;">ProtonDB &bull; Toccata Compatibility Ledger</h2>
          <div style="background: rgba(255,87,34,0.15); color: #ff5722; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700;">Zorin Exec Guard 1.5 Active</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px;">
          <div style="background: #1a1e24; border-radius: 10px; padding: 14px; border-left: 4px solid #00c853;">
            <div style="display:flex; justify-content:space-between;"><span style="font-weight:700;">Ableton Live 12</span><span style="color:#00c853; font-weight:700;">PLATINUM</span></div>
            <div style="font-size:11px; color:#8b949e; margin-top:4px;">Wine-ASIO + PipeWire 0.7ms ALSA &bull; VST3 100% stable</div>
          </div>
          <div style="background: #1a1e24; border-radius: 10px; padding: 14px; border-left: 4px solid #00c853;">
            <div style="display:flex; justify-content:space-between;"><span style="font-weight:700;">FL Studio 24</span><span style="color:#00c853; font-weight:700;">PLATINUM</span></div>
            <div style="font-size:11px; color:#8b949e; margin-top:4px;">Direct low-latency ASIO bridge &bull; Zero audio dropouts</div>
          </div>
          <div style="background: #1a1e24; border-radius: 10px; padding: 14px; border-left: 4px solid #ffd600;">
            <div style="display:flex; justify-content:space-between;"><span style="font-weight:700;">Adobe Photoshop 2024</span><span style="color:#ffd600; font-weight:700;">GOLD</span></div>
            <div style="font-size:11px; color:#8b949e; margin-top:4px;">DXVK 2.3 Direct3D 11 &bull; Hardware acceleration verified</div>
          </div>
          <div style="background: #1a1e24; border-radius: 10px; padding: 14px; border-left: 4px solid #00c853;">
            <div style="display:flex; justify-content:space-between;"><span style="font-weight:700;">Steam + Proton GE 9.14</span><span style="color:#00c853; font-weight:700;">NATIVE</span></div>
            <div style="font-size:11px; color:#8b949e; margin-top:4px;">Vulkan direct presentation &bull; 120 FPS variable refresh</div>
          </div>
        </div>
      </div>
    `;
  }

  // 10. SYSTEM BENCHMARK VIEW
  function renderBenchmarkPage(container) {
    container.innerHTML = `
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
  }

  // 11. ARCHITECTURE VIEW
  function renderArchitecturePage(container) {
    container.innerHTML = `
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
  }

  // 12. PIPEWIRE STUDIO VIEW
  function renderPipeWireStudioPage(container) {
    container.innerHTML = `
      <div style="padding: 24px; max-width: 720px; margin: 0 auto; color: var(--text-primary); line-height: 1.6;">
        <h2 style="font-size: 20px; font-weight: 800; color:#38bdf8;">PipeWire Audio Routing Graph</h2>
        <p style="color: var(--text-secondary); font-size: 13px;">Direct ALSA Hardware Buffer &bull; 64 Samples @ 96kHz &bull; 0.667ms latency.</p>
        <div style="margin-top:20px; background:rgba(0,0,0,0.25); border:1px solid var(--glass-border); border-radius:12px; padding:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
            <span style="font-weight:700;">Active Audio Nodes</span>
            <span style="color:#34c759; font-weight:700; font-size:12px;">Synced (Bit-Perfect)</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; padding:10px 14px; background:rgba(255,255,255,0.05); border-radius:8px;">
              <span>Sonata Music Player (FLAC 24-bit/96kHz)</span>
              <span style="color:#38bdf8;">PipeWire Sink 01 &rarr; DAC 1</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 14px; background:rgba(255,255,255,0.05); border-radius:8px;">
              <span>Wine-ASIO Container (Ableton Live 12)</span>
              <span style="color:#38bdf8;">Direct ALSA 64-Frame Buffer</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 14px; background:rgba(255,255,255,0.05); border-radius:8px;">
              <span>System Acoustic Harmonics (432Hz Core)</span>
              <span style="color:#34c759;">Hardware DSP Node</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // 13. LIVE WEB PAGE VIEW
  function renderLiveWebPage(container, url, domain) {
    const isWebKit = currentHorizonEngine === 'webkit';
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&engine=${currentHorizonEngine}`;
    const engineColor = isWebKit ? '#007aff' : '#af52de';
    const engineName = isWebKit ? 'Apple WebKit 605.1.15 (Safari)' : 'Chromium 131.0 (Blink Turbo)';

    container.innerHTML = `
      <div style="height:100%; display:flex; flex-direction:column; background:#ffffff;">
        <div style="padding:6px 16px; background:#f8f9fa; border-bottom:1px solid #e9ecef; display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#6c757d;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:#198754; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#34c759" stroke-width="2" style="vertical-align:-1px;display:inline-block;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              TLS 1.3 Verified
            </span>
            <span>&bull;</span>
            <span style="background:${engineColor}18; color:${engineColor}; font-weight:700; padding:1px 6px; border-radius:4px;">${engineName}</span>
            <span>&bull;</span>
            <span>Host: <strong>${domain}</strong></span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="color:#059669; font-weight:600;">Zero Telemetry Shield Active</span>
            <a href="${url}" target="_blank" style="color:#007aff; text-decoration:none; font-weight:600;">Open Direct &rarr;</a>
          </div>
        </div>
        <div style="flex:1; position:relative; min-height:0;">
          <iframe src="${proxyUrl}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" style="width:100%; height:100%; border:none;" onerror="this.style.display='none'; document.getElementById('iframe-fallback').style.display='block';"></iframe>
          <div id="iframe-fallback" style="display:none; padding:40px; text-align:center; color:#212529;">
            <h3 style="margin-bottom:8px;">${domain}</h3>
            <p style="color:#6c757d; font-size:13px; max-width:500px; margin:0 auto 20px;">This domain restricts direct iframe rendering via security policies. You can toggle engines or open directly.</p>
            <div style="display:flex; justify-content:center; gap:10px;">
              <button onclick="toggleHorizonEngine()" style="background:${engineColor}; color:#fff; border:none; padding:8px 18px; border-radius:6px; font-weight:600; cursor:pointer;">Switch to ${isWebKit ? 'Chromium' : 'WebKit'} Engine</button>
              <a href="${url}" target="_blank" style="display:inline-block; background:#6c757d; color:#fff; padding:8px 18px; border-radius:6px; font-weight:600; text-decoration:none;">Open in External Tab</a>
            </div>
          </div>
        </div>
      </div>
    `;
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
        <button class="toolbar-icon-btn" onclick="this.closest('#horizon-web-inspector').remove()" style="font-size:12px;width:18px;height:18px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
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
  // 4. SONATA: REAL WEB AUDIO DSP, 5-BAND EQUALIZER & INTERACTIVE PLAYLIST
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
      win.style.height = drawer.classList.contains('hidden') ? '540px' : '620px';
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
  // 5. TEMPO: REAL-TIME ROLLING SYSTEM MONITOR ENGINE (INTERACTIVE PROCESS TREE)
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

  let tempoSearchFilter = '';

  function renderTempoProcessTable() {
    const list = document.getElementById('tempo-process-list');
    if (!list) return;

    list.innerHTML = '';
    const filtered = tempoSearchFilter ? TEMPO_PROCESSES.filter(p => p.name.toLowerCase().includes(tempoSearchFilter.toLowerCase()) || String(p.pid).includes(tempoSearchFilter)) : TEMPO_PROCESSES;

    filtered.forEach(proc => {
      const jitterCpu = Math.max(0.1, proc.cpu + (Math.random() * 0.8 - 0.4)).toFixed(1);
      const tr = document.createElement('tr');
      tr.className = 'process-row' + (window.selectedTempoProcess && window.selectedTempoProcess.pid === proc.pid ? ' selected' : '');
      tr.onclick = function () {
        document.querySelectorAll('#tempo-process-list .process-row').forEach(r => r.classList.remove('selected'));
        tr.classList.add('selected');
        window.selectedTempoProcess = proc;
        const nameEl = document.getElementById('fq-process-name');
        if (nameEl) nameEl.textContent = proc.name;
      };
      tr.ondblclick = function () {
        window.selectedTempoProcess = proc;
        promptForceQuit();
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

  function filterProcesses(query) {
    tempoSearchFilter = query ? query.trim() : '';
    renderTempoProcessTable();
  }
  window.filterProcesses = filterProcesses;

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

  function promptForceQuit() {
    if (!window.selectedTempoProcess && TEMPO_PROCESSES.length > 0) {
      window.selectedTempoProcess = TEMPO_PROCESSES[0];
    }
    const nameEl = document.getElementById('fq-process-name');
    if (nameEl && window.selectedTempoProcess) {
      nameEl.textContent = window.selectedTempoProcess.name;
    }
    const sheet = document.getElementById('tempo-force-quit-sheet');
    if (sheet) sheet.classList.remove('hidden');
    playUiTone([440, 330], 0.12, 'sawtooth', 0.04);
  }
  window.promptForceQuit = promptForceQuit;

  function cancelForceQuit() {
    const sheet = document.getElementById('tempo-force-quit-sheet');
    if (sheet) sheet.classList.add('hidden');
  }
  window.cancelForceQuit = cancelForceQuit;

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
      window.selectedTempoProcess = null;
      renderTempoProcessTable();
      if (typeof window.triggerNotification === 'function') {
        window.triggerNotification(`Force quit ${proc.name} (PID ${proc.pid})`);
      }
      playUiTone([330, 220], 0.2, 'sawtooth', 0.05);

      if (proc.name.includes('Horizon') && typeof window.closeWindow === 'function') window.closeWindow('win-horizon');
      if (proc.name.includes('Scribe') && typeof window.closeWindow === 'function') window.closeWindow('win-scribe');
      if (proc.name.includes('Sonata') && typeof window.closeWindow === 'function') window.closeWindow('win-sonata');
      if (proc.name.includes('Cadence') && typeof window.closeWindow === 'function') window.closeWindow('win-cadence');
      if (proc.name.includes('Settings') && typeof window.closeWindow === 'function') window.closeWindow('win-settings');
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
  // 7. SOLFEGE: SCIENTIFIC KEYPAD, PAPER TAPE & FULL KEYBOARD INPUT (PERSISTENT)
  // ==========================================================================
  let CALC_TAPE = [];
  try {
    const savedTape = localStorage.getItem('toccata_calc_tape');
    CALC_TAPE = savedTape ? JSON.parse(savedTape) : [];
  } catch (e) {
    CALC_TAPE = [];
  }

  function saveCalcTape() {
    try {
      localStorage.setItem('toccata_calc_tape', JSON.stringify(CALC_TAPE));
    } catch (e) {}
  }

  function addCalcTapeEntry(expr, result) {
    CALC_TAPE.unshift({ expr, result, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    if (CALC_TAPE.length > 30) CALC_TAPE.pop();
    saveCalcTape();
    renderCalcTape();
  }

  function clearCalcTape() {
    CALC_TAPE = [];
    saveCalcTape();
    renderCalcTape();
    playUiTone([330], 0.1, 'sine', 0.04);
  }
  window.clearCalcTape = clearCalcTape;

  function renderCalcTape() {
    let tapeEl = document.getElementById('calc-tape-drawer');
    if (!tapeEl) return;

    tapeEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <span style="font-weight: 700; font-size: 11px; text-transform: uppercase; color: var(--text-secondary);">History Tape</span>
        <button class="btn btn-secondary" onclick="clearCalcTape()" style="padding:1px 6px;font-size:10px;">Clear</button>
      </div>
    `;

    if (CALC_TAPE.length === 0) {
      tapeEl.innerHTML += `<div style="font-size:11px;color:var(--text-secondary);opacity:0.7;padding:12px 0;text-align:center;">No recent calculations</div>`;
      return;
    }

    CALC_TAPE.slice(0, 15).forEach(entry => {
      const row = document.createElement('div');
      row.style.cssText = 'padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.06); cursor: pointer;';
      row.onclick = () => {
        const main = document.getElementById('calc-main-display');
        if (main) main.textContent = entry.result;
        playUiTone([659.25], 0.08, 'sine', 0.03);
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
  // 8. PRISM: PHOTO LIBRARY, PRESET COLOR GRADING & ZOOM STUDIO
  // ==========================================================================
  const PRISM_PHOTOS = [
    { id: 'sonata', title: 'Sonata Dynamic Topography', res: '3840 x 2160', color: 'Display P3', bg: 'wallpapers/pearos-light.jpg', grad: 'radial-gradient(circle at 30% 30%, #38bdf8 0%, #007aff 40%, #af52de 85%, #ff2d55 100%)' },
    { id: 'dark-nebula', title: 'Deep Space Nebula HDR', res: '5120 x 2880', color: 'Rec. 2020 HDR', bg: 'wallpapers/pearos-dark.jpg', grad: 'radial-gradient(circle at 70% 30%, #1e1b4b 0%, #0f172a 60%, #000000 100%)' },
    { id: 'abstract', title: 'Acoustic Wave Resonance', res: '4096 x 2304', color: 'Display P3', bg: 'wallpapers/abstract.jpg', grad: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)' }
  ];

  let currentPrismPhotoIdx = 0;
  let prismZoomLevel = 1.0;
  let prismRotation = 0;

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

  function prismZoom(delta) {
    prismZoomLevel = Math.max(0.5, Math.min(3.0, prismZoomLevel + delta));
    applyPrismTransforms();
    playUiTone([659.25], 0.06, 'sine', 0.03);
  }
  window.prismZoom = prismZoom;

  function prismRotate() {
    prismRotation = (prismRotation + 90) % 360;
    applyPrismTransforms();
    playUiTone([523.25], 0.08, 'sine', 0.03);
  }
  window.prismRotate = prismRotate;

  function applyPrismTransforms() {
    const frame = document.getElementById('prism-frame');
    if (frame) {
      const box = frame.querySelector('div');
      if (box) {
        box.style.transform = `scale(${prismZoomLevel}) rotate(${prismRotation}deg)`;
        box.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
      }
    }
  }

  function setPrismFilter(el, filterType) {
    if (el) {
      el.parentElement.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      el.classList.add('active');
    }

    const exp = document.getElementById('prism-slider-exp');
    const con = document.getElementById('prism-slider-con');
    const sat = document.getElementById('prism-slider-sat');
    const blur = document.getElementById('prism-slider-blur');

    if (filterType === 'vivid') {
      if (exp) exp.value = 108;
      if (con) con.value = 120;
      if (sat) sat.value = 135;
      if (blur) blur.value = 0;
    } else if (filterType === 'mono') {
      if (exp) exp.value = 100;
      if (con) con.value = 130;
      if (sat) sat.value = 0;
      if (blur) blur.value = 0;
    } else if (filterType === 'warm') {
      if (exp) exp.value = 105;
      if (con) con.value = 105;
      if (sat) sat.value = 120;
      if (blur) blur.value = 0;
    } else {
      // Normal
      if (exp) exp.value = 100;
      if (con) con.value = 100;
      if (sat) sat.value = 100;
      if (blur) blur.value = 0;
    }
    updatePrismAdjustments();
    playUiTone([587.33], 0.08, 'sine', 0.03);
  }
  window.setPrismFilter = setPrismFilter;

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
    prismZoomLevel = 1.0;
    prismRotation = 0;
    applyPrismTransforms();
    updatePrismAdjustments();
    playUiTone([440], 0.08, 'sine', 0.03);
  }
  window.resetPrismAdjustments = resetPrismAdjustments;

  function togglePrismExif() {
    const exif = document.getElementById('prism-exif-pill');
    if (exif) exif.classList.toggle('hidden');
    playUiTone([659.25], 0.06, 'sine', 0.03);
  }
  window.togglePrismExif = togglePrismExif;

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
  // 9. CHRONICLE: CALENDAR AGENDA & POMODORO FOCUS TIMER (PERSISTENT & INTERACTIVE)
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

  // Add Calendar Event Modal (Prefill Supported)
  function promptAddCalEvent(prefillDate) {
    let modal = document.getElementById('chronicle-add-event-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'chronicle-add-event-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    const defaultDate = prefillDate || '2026-11-01';

    modal.innerHTML = `
      <div class="toccata-modal-sheet" style="width: 380px; padding: 22px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight: 700; font-size: 14px;">Add Calendar Event</span>
          <button class="btn btn-secondary" onclick="this.closest('#chronicle-add-event-modal').remove()" style="padding: 2px 8px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
        </div>
        <div>
          <label style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Event Title</label>
          <input type="text" id="cal-new-title" placeholder="e.g. Master Track Review" style="width: 100%; margin-top: 4px; padding: 8px 10px; background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); outline: none;">
        </div>
        <div style="display: flex; gap: 10px;">
          <div style="flex: 1;">
            <label style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Date</label>
            <input type="date" id="cal-new-date" value="${defaultDate}" style="width: 100%; margin-top: 4px; padding: 6px 8px; background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); outline: none;">
          </div>
          <div style="flex: 1;">
            <label style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Time</label>
            <input type="time" id="cal-new-time" value="16:00" style="width: 100%; margin-top: 4px; padding: 6px 8px; background: rgba(0,0,0,0.15); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); outline: none;">
          </div>
        </div>
        <div>
          <label style="font-size: 11px; color: var(--text-secondary); font-weight: 600;">Category</label>
          <select id="cal-new-cat" style="width: 100%; margin-top: 4px; padding: 6px 8px; background: rgba(0,0,0,0.2); border: 1px solid var(--glass-border); border-radius: 8px; color: var(--text-primary); outline: none;">
            <option value="work">Work & Milestone (Blue)</option>
            <option value="studio">Music & Studio (Purple)</option>
            <option value="personal">Personal & Focus (Green)</option>
          </select>
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
    const catInput = document.getElementById('cal-new-cat');
    const title = titleInput ? titleInput.value.trim() : '';

    if (!title) return;

    const cat = catInput ? catInput.value : 'work';
    const colorMap = { work: '#007aff', studio: '#af52de', personal: '#34c759' };

    const newEv = {
      id: Date.now(),
      title,
      date: dateInput ? dateInput.value : '2026-11-01',
      time: timeInput ? timeInput.value : '16:00',
      cat: cat.charAt(0).toUpperCase() + cat.slice(1),
      color: colorMap[cat] || '#007aff'
    };

    if (window.CAL_EVENTS) {
      window.CAL_EVENTS.unshift(newEv);
      if (typeof window.saveCalEventsToStorage === 'function') window.saveCalEventsToStorage();
    }

    if (typeof window.renderCalendar === 'function' && typeof currentCalYear !== 'undefined') {
      window.renderCalendar(currentCalYear, currentCalMonth);
    }
    if (typeof window.renderCalSidebarEvents === 'function') {
      const parts = newEv.date.split('-');
      const d = parseInt(parts[2], 10);
      window.renderCalSidebarEvents(currentCalYear, currentCalMonth, d);
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
      rating: '4.9 5/5 (1,248 reviews)',
      desc: 'The industry-standard Digital Audio Workstation, featuring native PipeWire ALSA Direct 0.7ms low latency integration, bit-perfect audio export, and high-DPI Wayland scaling.',
      iconBg: 'linear-gradient(135deg, #ff2d55, #ff9500)'
    },
    'VS Code': {
      version: 'v1.95.0 Sovereign Build',
      size: '210 MB',
      dev: 'Microsoft / Sovereign Core',
      rating: '4.8 5/5 (3,420 reviews)',
      desc: 'Zero-telemetry build with pre-configured Rust-Analyzer, Clangd, and JetBrains Mono fonts. Integrated Wayland drag-and-drop file trees.',
      iconBg: 'linear-gradient(135deg, #007aff, #00c6ff)'
    },
    'Blender 4.2': {
      version: 'v4.2.3 LTS',
      size: '520 MB',
      dev: 'Blender Foundation',
      rating: '4.9 5/5 (890 reviews)',
      desc: 'Open-source 3D creation suite powered by Vulkan HipRT compute kernels with real-time viewport raytracing.',
      iconBg: 'linear-gradient(135deg, #ff9500, #ea580c)'
    },
    'Steam + Proton GE': {
      version: 'v9.0-3 GE Custom',
      size: '850 MB',
      dev: 'Valve & GloriousEggroll',
      rating: '4.9 5/5 (5,120 reviews)',
      desc: 'Windows Gaming & DXVK 2.4 DirectX-to-Vulkan translation layer. Run your full Windows Steam catalog on Toccata OS.',
      iconBg: 'linear-gradient(135deg, #1e293b, #3b82f6)'
    }
  };

  function openAppProductSheet(appName) {
    const details = STORE_DETAILS[appName] || {
      version: 'v1.0.0 Native',
      size: '128 MB',
      dev: 'Toccata Studio Developer',
      rating: '4.8 5/5',
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
          <button class="btn btn-secondary" onclick="this.closest('#store-product-sheet-modal').remove()" style="padding:4px 10px;font-size:12px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
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
          <button class="btn btn-secondary" onclick="this.closest('#mail-compose-modal').remove()" style="padding: 2px 8px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
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
          <button class="btn btn-secondary" onclick="this.closest('#hex-inspector-modal').remove()" style="padding:4px 10px;font-size:12px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
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

  // Zorin Exec Guard Rule Database (Reverse-engineered from zorin-exec-guard 1.5)
  const ZORIN_EXEC_GUARD_DB = [
    { pattern: /firefox.*setup/i, name: 'Mozilla Firefox', altName: 'Horizon Web Browser', cat: 'dev', app: 'win-horizon', pkg: 'org.mozilla.firefox' },
    { pattern: /chrome.*setup|google.*chrome/i, name: 'Google Chrome', altName: 'Horizon Web Browser', cat: 'dev', app: 'win-horizon', pkg: 'com.google.Chrome' },
    { pattern: /spotify.*setup/i, name: 'Spotify Native', altName: 'Sonata Acoustic Engine', cat: 'audio', app: 'win-sonata', pkg: 'com.spotify.Client' },
    { pattern: /vlc.*setup|vlc.*installer/i, name: 'VLC Media Player', altName: 'Sonata Hi-Fi / Video Player', cat: 'audio', app: 'win-sonata', pkg: 'org.videolan.VLC' },
    { pattern: /code.*setup|vscode.*setup/i, name: 'Visual Studio Code', altName: 'VS Code (Sovereign Build)', cat: 'dev', app: 'win-scribe', pkg: 'com.visualstudio.code' },
    { pattern: /discord.*setup/i, name: 'Discord for Linux', altName: 'Toccata Messages Bridge', cat: 'dev', app: 'win-messages', pkg: 'com.discordapp.Discord' },
    { pattern: /slack.*setup/i, name: 'Slack for Linux', altName: 'Toccata Messages Bridge', cat: 'dev', app: 'win-messages', pkg: 'com.slack.Slack' },
    { pattern: /steam.*setup/i, name: 'Steam Native Wayland', altName: 'Steam + Proton GE 9', cat: 'proton', app: 'win-tempo', pkg: 'com.valvesoftware.Steam' },
    { pattern: /blender/i, name: 'Blender 3D Suite', altName: 'Blender 4.2 LTS', cat: 'audio', app: 'win-prism', pkg: 'org.blender.Blender' },
    { pattern: /obs.*studio|obs.*setup/i, name: 'OBS Studio', altName: 'OBS Studio (Wayland PipeWire)', cat: 'audio', app: 'win-tempo', pkg: 'com.obsproject.Studio' },
    { pattern: /libreoffice/i, name: 'LibreOffice Suite', altName: 'Scribe Document Studio', cat: 'dev', app: 'win-scribe', pkg: 'org.libreoffice.LibreOffice' },
    { pattern: /gimp/i, name: 'GIMP Image Editor', altName: 'Prism Photos & Vector Studio', cat: 'audio', app: 'win-prism', pkg: 'org.gimp.GIMP' }
  ];

  function openProtonExecutionModal(fileName, sizeStr) {
    let modal = document.getElementById('proton-exec-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'proton-exec-modal';
      modal.className = 'toccata-modal-backdrop';
      document.body.appendChild(modal);
    }

    const matched = ZORIN_EXEC_GUARD_DB.find(rule => rule.pattern.test(fileName));

    if (matched) {
      modal.innerHTML = `
        <div class="toccata-modal-sheet" style="width: 520px; max-width: 90vw; padding: 24px; display: flex; flex-direction: column; gap: 14px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,#007aff,#00c6ff);display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 8px 20px rgba(0,122,255,0.35);">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style="font-weight:700;font-size:15px;">Zorin Windows App Support &mdash; Intelligence Engine</div>
                <div style="font-size:11px;color:var(--text-secondary);">${fileName} &bull; ${sizeStr}</div>
              </div>
            </div>
            <button class="btn btn-secondary" onclick="this.closest('#proton-exec-modal').remove()" style="padding:2px 8px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
          </div>

          <div style="font-size:12.5px;color:var(--text-primary);line-height:1.6;background:rgba(0,122,255,0.08);border:1px solid rgba(0,122,255,0.22);padding:14px;border-radius:10px;">
            <strong style="color:var(--accent-color);">Native Linux Alternative Available:</strong> A high-performance native Linux package for <strong>${matched.name}</strong> is available in Software Gallery. Running native Linux apps provides smooth 120Hz Wayland rendering, native PipeWire 0.7ms audio, and lower battery drain than running Windows binaries.
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--glass-border); padding-top:14px; margin-top:4px;">
            <button class="btn btn-secondary" onclick="simulateProtonLaunch('${fileName}'); this.closest('#proton-exec-modal').remove();" style="font-size:11px;padding:6px 12px;">Run in Proton Anyway</button>
            <button class="btn btn-primary" onclick="if(typeof openWindow === 'function') openWindow('${matched.app || 'win-installer'}'); if(typeof installStoreApp === 'function') installStoreApp(null, '${matched.altName || matched.name}', '${matched.app || 'win-installer'}'); this.closest('#proton-exec-modal').remove();" style="font-weight:700;padding:6px 18px;">Install Native App (${matched.name})</button>
          </div>
        </div>
      `;
      playUiTone([523.25, 659.25, 783.99], 0.2, 'sine', 0.06);
    } else {
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
            <button class="btn btn-secondary" onclick="this.closest('#proton-exec-modal').remove()" style="padding:2px 8px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
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
          <button class="btn btn-secondary" onclick="this.closest('#pdf-viewer-modal').remove()" style="padding:2px 8px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
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
          <button class="btn btn-secondary" onclick="this.closest('#video-player-modal').remove()" style="padding:2px 8px;"><svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg></button>
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

  // ==========================================================================
  // 14. REMINDERS SUITE (PERSISTENT & INTERACTIVE TASK MANAGER)
  // ==========================================================================
  const DEFAULT_TODO_ITEMS = [
    { id: 1, text: 'Master Bit-Perfect Audio Passthrough in PipeWire', list: 'today', cat: 'studio', priority: 'High', due: '4:00 PM', completed: false },
    { id: 2, text: 'Benchmark KWin 120Hz Wayland compositing latency', list: 'today', cat: 'kernel', priority: 'Medium', due: '6:30 PM', completed: false },
    { id: 3, text: 'Verify pearOS Cupertino squircle layout on Retina', list: 'today', cat: 'ui', priority: 'Normal', due: '8:00 PM', completed: false },
    { id: 4, text: 'Package Zorin Exec Guard for native Linux runtime', list: 'scheduled', cat: 'kernel', priority: 'High', due: 'Tomorrow', completed: true },
    { id: 5, text: 'Calibrate XanMod BORE scheduler burst dynamics', list: 'scheduled', cat: 'kernel', priority: 'High', due: 'Nov 6', completed: false },
    { id: 6, text: 'Tune 432Hz acoustic feedback harmonic resonance', list: 'studio', cat: 'studio', priority: 'Normal', due: 'Nov 7', completed: false },
    { id: 7, text: 'Audit 2,220 Windows app regex patterns', list: 'all', cat: 'kernel', priority: 'Low', due: 'Nov 8', completed: true },
    { id: 8, text: 'Test dynamic island audio visualizer with Sonata', list: 'ui', cat: 'ui', priority: 'Normal', due: 'Nov 9', completed: true },
  ];

  let TODO_ITEMS = [];
  try {
    const savedTodo = localStorage.getItem('toccata_todo_items');
    TODO_ITEMS = savedTodo ? JSON.parse(savedTodo) : DEFAULT_TODO_ITEMS;
  } catch (e) {
    TODO_ITEMS = DEFAULT_TODO_ITEMS;
  }

  function saveTodoToStorage() {
    try {
      localStorage.setItem('toccata_todo_items', JSON.stringify(TODO_ITEMS));
    } catch (e) {}
  }

  let currentTodoFilter = 'today';

  function renderTodoList(filter = currentTodoFilter) {
    const listEl = document.getElementById('todo-items-list');
    if (!listEl) return;

    let filtered = TODO_ITEMS;
    if (filter === 'today') filtered = TODO_ITEMS.filter(t => t.list === 'today' || !t.completed);
    else if (filter === 'scheduled') filtered = TODO_ITEMS.filter(t => t.list === 'scheduled' || t.due);
    else if (filter === 'completed') filtered = TODO_ITEMS.filter(t => t.completed);
    else if (filter === 'studio') filtered = TODO_ITEMS.filter(t => t.cat === 'studio');
    else if (filter === 'ui') filtered = TODO_ITEMS.filter(t => t.cat === 'ui');

    listEl.innerHTML = '';
    filtered.forEach(item => {
      const row = document.createElement('div');
      row.className = `todo-item ${item.completed ? 'completed' : ''}`;
      row.innerHTML = `
        <div class="todo-item-check" onclick="toggleTodoItem(${item.id})"></div>
        <div class="todo-item-body">
          <div class="todo-text-title">${item.text}</div>
          <div class="todo-text-meta">
            ${item.due ? `<span><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:3px;"><circle cx="8" cy="8" r="6.5"/><polyline points="8 4 8 8 11 9.5"/></svg>${item.due}</span>` : ''}
            ${item.priority ? `<span style="color:${item.priority === 'High' ? '#ff3b30' : 'var(--text-secondary)'}; font-weight:600;">${item.priority}</span>` : ''}
          </div>
        </div>
        <button class="todo-delete-btn" onclick="deleteTodoItem(${item.id})" title="Delete Reminder">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
        </button>
      `;
      listEl.appendChild(row);
    });

    updateTodoCounts();
  }

  function updateTodoCounts() {
    const todayEl = document.getElementById('todo-count-today');
    if (todayEl) todayEl.textContent = TODO_ITEMS.filter(t => !t.completed).length;
    const schedEl = document.getElementById('todo-count-sched');
    if (schedEl) schedEl.textContent = TODO_ITEMS.filter(t => t.due && !t.completed).length;
    const allEl = document.getElementById('todo-count-all');
    if (allEl) allEl.textContent = TODO_ITEMS.length;
    const doneEl = document.getElementById('todo-count-done');
    if (doneEl) doneEl.textContent = TODO_ITEMS.filter(t => t.completed).length;
  }

  function toggleTodoItem(id) {
    const item = TODO_ITEMS.find(t => t.id === id);
    if (!item) return;
    item.completed = !item.completed;
    saveTodoToStorage();
    playUiTone(item.completed ? [523.25, 659.25] : [330], 0.12, 'sine', 0.05);
    renderTodoList();
  }
  window.toggleTodoItem = toggleTodoItem;

  function deleteTodoItem(id) {
    const idx = TODO_ITEMS.findIndex(t => t.id === id);
    if (idx === -1) return;
    const removedText = TODO_ITEMS[idx].text;
    TODO_ITEMS.splice(idx, 1);
    saveTodoToStorage();
    renderTodoList();
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Deleted: ${removedText.slice(0, 24)}...`);
    }
    playUiTone([330, 220], 0.12, 'sine', 0.04);
  }
  window.deleteTodoItem = deleteTodoItem;

  function switchTodoFilter(filter, el) {
    currentTodoFilter = filter;
    document.querySelectorAll('.todo-smart-card, .todo-sidebar .sidebar-row').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');

    const titleEl = document.getElementById('todo-current-title');
    if (titleEl) {
      const titles = { today: 'Today', scheduled: 'Scheduled', all: 'All Reminders', completed: 'Completed', studio: 'Studio DSP & Audio', ui: 'Cupertino & Zorin UI' };
      titleEl.textContent = titles[filter] || 'Reminders';
    }
    renderTodoList(filter);
    playUiTone([659.25], 0.1, 'sine', 0.04);
  }
  window.switchTodoFilter = switchTodoFilter;

  function addTodoFromInput() {
    const input = document.getElementById('todo-new-input');
    if (!input || !input.value.trim()) return;
    TODO_ITEMS.unshift({
      id: Date.now(),
      text: input.value.trim(),
      list: currentTodoFilter,
      cat: 'user',
      priority: 'Normal',
      due: 'Today',
      completed: false
    });
    saveTodoToStorage();
    input.value = '';
    playUiTone([523.25, 783.99], 0.15, 'sine', 0.06);
    renderTodoList();
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification('Reminder added');
    }
  }
  window.addTodoFromInput = addTodoFromInput;

  function handleTodoInputKey(e) {
    if (e.key === 'Enter') addTodoFromInput();
  }
  window.handleTodoInputKey = handleTodoInputKey;

  function focusTodoInput() {
    const input = document.getElementById('todo-new-input');
    if (input) input.focus();
  }
  window.focusTodoInput = focusTodoInput;

  // ==========================================================================
  // 15. CONTACTS SUITE (pearOS NiceC0re contacts)
  // ==========================================================================
  const CONTACTS_DATA = [
    { id: 'ada', name: 'Ada Lovelace', role: 'Computing Pioneer & Mathematician', phone: '+1 (555) 019-2834', email: 'ada@toccata.os', avatarBg: 'linear-gradient(135deg, #af52de, #ff2d55)', initials: 'AL', notes: 'First computer programmer. Wrote the first algorithm intended for processing on Charles Babbage\'s Analytical Engine.' },
    { id: 'kian', name: 'Kian B.', role: 'Founder & System Architect', phone: '+1 (555) 018-9921', email: 'kian@toccata.os', avatarBg: 'linear-gradient(135deg, #007aff, #00c6ff)', initials: 'KB', notes: 'Architect of Toccata OS, fusing Linux XanMod kernel performance with macOS Cupertino elegance and Zorin Windows app compatibility.' },
    { id: 'linus', name: 'Linus Torvalds', role: 'Linux Kernel Lead Architect', phone: '+1 (555) 012-4820', email: 'torvalds@kernel.org', avatarBg: 'linear-gradient(135deg, #34c759, #30d158)', initials: 'LT', notes: 'Creator of the Linux kernel and Git. Advocate for clean, pragmatic, zero-overhead systems programming.' },
    { id: 'steve', name: 'Steve Wozniak', role: 'Computing Hardware Engineer', phone: '+1 (555) 014-3829', email: 'woz@apple.com', avatarBg: 'linear-gradient(135deg, #ff9500, #ffcc00)', initials: 'SW', notes: 'Pioneer of personal computing and single-board computer design. Pure hardware elegance.' },
    { id: 'zorin', name: 'Zorin OS Team', role: 'Desktop Compatibility Specialists', phone: '+353 (1) 489-1022', email: 'support@zorinos.com', avatarBg: 'linear-gradient(135deg, #00a3ff, #0051d5)', initials: 'ZO', notes: 'Creators of Zorin OS and the 2,220-rule Windows App Support Exec Guard intelligence engine.' },
    { id: 'pearos', name: 'pearOS Developers', role: 'Cupertino UI & Qt6 Artisans', phone: '+33 (1) 942-8821', email: 'team@pearos.xyz', avatarBg: 'linear-gradient(135deg, #5856d6, #af52de)', initials: 'PO', notes: 'Craftsmen behind pearOS NiceC0re Qt6 applications and the Wayland dynamic island notch.' },
  ];

  let currentContactId = 'ada';

  function renderContactsList(query = '') {
    const listEl = document.getElementById('contacts-list');
    if (!listEl) return;

    const filtered = CONTACTS_DATA.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.role.toLowerCase().includes(query.toLowerCase()));
    listEl.innerHTML = '';
    filtered.forEach(c => {
      const row = document.createElement('div');
      row.className = `contact-row ${c.id === currentContactId ? 'active' : ''}`;
      row.innerHTML = `
        <div class="contact-avatar-small" style="background:${c.avatarBg};">${c.initials}</div>
        <div class="contact-row-info">
          <div class="contact-row-name">${c.name}</div>
          <div class="contact-row-sub">${c.role}</div>
        </div>
      `;
      row.onclick = () => selectContact(c.id);
      listEl.appendChild(row);
    });

    renderContactDetail(currentContactId);
  }

  function selectContact(id) {
    currentContactId = id;
    document.querySelectorAll('.contact-row').forEach(r => r.classList.remove('active'));
    const rows = document.querySelectorAll('.contact-row');
    const idx = CONTACTS_DATA.findIndex(c => c.id === id);
    if (rows[idx]) rows[idx].classList.add('active');
    renderContactDetail(id);
    playUiTone([659.25], 0.1, 'sine', 0.04);
  }
  window.selectContact = selectContact;

  function renderContactDetail(id) {
    const pane = document.getElementById('contacts-detail-pane');
    if (!pane) return;
    const c = CONTACTS_DATA.find(x => x.id === id) || CONTACTS_DATA[0];

    pane.innerHTML = `
      <div class="contact-hero">
        <div class="contact-avatar-large" style="background:${c.avatarBg};">${c.initials}</div>
        <div>
          <div style="font-size:22px; font-weight:800; letter-spacing:-0.3px;">${c.name}</div>
          <div style="font-size:13px; color:var(--text-secondary); margin-top:2px;">${c.role}</div>
          <div style="font-size:11px; color:#34c759; font-weight:700; margin-top:6px;">● Available &bull; Local Peer</div>
        </div>
      </div>

      <div class="contact-actions-bar">
        <button class="contact-action-btn" onclick="contactMessage('${c.id}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          <span>Message</span>
        </button>
        <button class="contact-action-btn" onclick="contactCall('${c.id}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          <span>Call</span>
        </button>
        <button class="contact-action-btn" onclick="contactMail('${c.id}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          <span>Email</span>
        </button>
      </div>

      <div class="settings-group-card" style="margin-bottom:14px;">
        <div class="settings-row">
          <div>
            <div class="row-title">Mobile Phone</div>
            <div class="row-desc" style="color:var(--accent-color); font-weight:600;">${c.phone}</div>
          </div>
          <button class="btn btn-secondary" onclick="contactCall('${c.id}')" style="font-size:11px; padding:3px 8px;">Call</button>
        </div>
        <div class="settings-row">
          <div>
            <div class="row-title">Email Address</div>
            <div class="row-desc" style="color:var(--accent-color); font-weight:600;">${c.email}</div>
          </div>
          <button class="btn btn-secondary" onclick="contactMail('${c.id}')" style="font-size:11px; padding:3px 8px;">Compose</button>
        </div>
      </div>

      <div class="settings-group-card">
        <div style="padding:14px;">
          <div style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--text-secondary); margin-bottom:6px;">Notes</div>
          <div style="font-size:13px; line-height:1.6; color:var(--text-primary);">${c.notes}</div>
        </div>
      </div>
    `;
  }

  function filterContactsList(query) {
    renderContactsList(query);
  }
  window.filterContactsList = filterContactsList;

  function contactMessage(id) {
    if (typeof window.openWindow === 'function') window.openWindow('win-messages');
    playUiTone([523.25, 659.25], 0.12, 'sine', 0.05);
  }
  window.contactMessage = contactMessage;

  function contactCall(id) {
    const c = CONTACTS_DATA.find(x => x.id === id);
    if (!c) return;
    playUiTone([440, 480], 0.4, 'sine', 0.08);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification(`Calling ${c.name} (${c.phone})...`);
    }
  }
  window.contactCall = contactCall;

  function contactMail(id) {
    const c = CONTACTS_DATA.find(x => x.id === id);
    if (!c) return;
    if (typeof window.openWindow === 'function') window.openWindow('win-mail');
    const replyInput = document.getElementById('mail-quick-reply');
    if (replyInput) replyInput.value = `Hello ${c.name}, `;
  }
  window.contactMail = contactMail;

  // ==========================================================================
  // 16. ZORIN CONNECT SUITE (zorin-connect Mobile Bridge)
  // ==========================================================================
  function ringPhoneAction() {
    playUiTone([880, 1174.66, 880, 1174.66], 0.5, 'triangle', 0.1);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification('Zorin Connect: iPhone 16 Pro is ringing!');
    }
  }
  window.ringPhoneAction = ringPhoneAction;

  function sendMobileFileAction() {
    playUiTone([587.33, 880], 0.15, 'sine', 0.06);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification('Zorin Connect: File sent to iPhone 16 Pro via Wi-Fi 6E (12.4 MB/s)');
    }
  }
  window.sendMobileFileAction = sendMobileFileAction;

  function syncClipboardAction() {
    playUiTone([523.25, 659.25], 0.12, 'sine', 0.05);
    if (typeof window.triggerNotification === 'function') {
      window.triggerNotification('Zorin Connect: Clipboard synchronized with mobile device');
    }
  }
  window.syncClipboardAction = syncClipboardAction;

  // ==========================================================================
  // 17. WELCOME TOUR SUITE (zorin-os-tour & pearos-welcome)
  // ==========================================================================
  const TOUR_SLIDES = [
    {
      badge: 'Welcome to Toccata OS',
      title: 'The Resonant Operating System',
      desc: 'Crafted from the architectural foundations of Arch Linux, pearOS NiceC0re, and Zorin OS 18. Enjoy 120Hz Wayland fluid animations, zero telemetry tracking, and 0.7ms low-latency studio audio passthrough.',
      icon: `<div style="width:72px; height:72px; border-radius:18px; background:linear-gradient(135deg, #007aff, #af52de); display:flex; align-items:center; justify-content:center; color:white;"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>`,
      action: '<button class="btn btn-primary" onclick="openWindow(\'win-settings\'); switchSettingsTab(\'appearance\');">Explore Appearance</button>'
    },
    {
      badge: 'Desktop Personalities',
      title: 'Switch Layouts Instantly',
      desc: 'Choose between pearOS macOS Sequoia, Windows 11 with Zorin Start Menu, or GNOME 47 Activities without restarting. All your windows and audio graphs preserve state seamlessly.',
      icon: `<div style="width:72px; height:72px; border-radius:18px; background:linear-gradient(135deg, #ff9500, #ff2d55); display:flex; align-items:center; justify-content:center; color:white;"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg></div>`,
      action: '<button class="btn btn-primary" onclick="openWindow(\'win-settings\'); switchSettingsTab(\'desktopdock\');">Switch Layouts</button>'
    },
    {
      badge: 'Compatibility Engine',
      title: 'Zorin Windows App Support',
      desc: 'Drag and drop any Windows installer (.exe / .msi). The reverse-engineered 2,220-rule Exec Guard identifies native Linux alternatives or automatically executes in a hardened Proton GE wine container.',
      icon: `<div style="width:72px; height:72px; border-radius:18px; background:linear-gradient(135deg, #00a3ff, #0051d5); display:flex; align-items:center; justify-content:center; color:white;"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></div>`,
      action: '<button class="btn btn-primary" onclick="openWindow(\'win-installer\');">Browse Software Gallery</button>'
    },
    {
      badge: 'Acoustic Sound Architecture',
      title: 'Bit-Perfect PipeWire 0.7ms DSP',
      desc: 'Hardware passthrough directly into low-jitter memory buffers. Test musical synthesizers with Sonata, Solfege, and feel the porcelain acoustic touch feedback on every interaction.',
      icon: `<div style="width:72px; height:72px; border-radius:18px; background:linear-gradient(135deg, #ff2d55, #fa114f); display:flex; align-items:center; justify-content:center; color:white;"><svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`,
      action: '<button class="btn btn-primary" onclick="openWindow(\'win-sonata\');">Open Sonata Music</button>'
    }
  ];

  let currentTourSlide = 0;

  function renderTourSlide(index = currentTourSlide) {
    const container = document.getElementById('tour-slide-container');
    if (!container) return;
    const slide = TOUR_SLIDES[index];

    container.innerHTML = `
      ${slide.icon}
      <span style="font-size:11px; font-weight:700; text-transform:uppercase; color:var(--accent-color); letter-spacing:1px;">${slide.badge}</span>
      <h2 style="font-size:24px; font-weight:800; margin:0; letter-spacing:-0.5px;">${slide.title}</h2>
      <p style="color:var(--text-secondary); font-size:13px; line-height:1.6; max-width:480px; margin:0;">${slide.desc}</p>
      <div style="margin-top:8px;">${slide.action}</div>
    `;

    document.querySelectorAll('.tour-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });

    const prevBtn = document.getElementById('tour-prev-btn');
    if (prevBtn) prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    const nextBtn = document.getElementById('tour-next-btn');
    if (nextBtn) nextBtn.textContent = index === TOUR_SLIDES.length - 1 ? 'Finish' : 'Next →';
  }

  function nextTourSlide() {
    if (currentTourSlide < TOUR_SLIDES.length - 1) {
      currentTourSlide++;
      renderTourSlide(currentTourSlide);
      playUiTone([659.25], 0.1, 'sine', 0.05);
    } else {
      if (typeof window.closeWindow === 'function') window.closeWindow('win-tour');
      playUiTone([523.25, 659.25, 1046.5], 0.2, 'sine', 0.06);
    }
  }
  window.nextTourSlide = nextTourSlide;

  function prevTourSlide() {
    if (currentTourSlide > 0) {
      currentTourSlide--;
      renderTourSlide(currentTourSlide);
      playUiTone([440], 0.1, 'sine', 0.05);
    }
  }
  window.prevTourSlide = prevTourSlide;

  function gotoTourSlide(index) {
    currentTourSlide = index;
    renderTourSlide(currentTourSlide);
    playUiTone([523.25], 0.1, 'sine', 0.05);
  }
  window.gotoTourSlide = gotoTourSlide;

  // ==========================================================================
  // 18. DYNAMIC ISLAND NOTCH (pearOS NiceC0re notch)
  // ==========================================================================
  function toggleDynamicIsland() {
    const island = document.getElementById('pearos-dynamic-island');
    if (!island) return;
    island.classList.toggle('expanded');
    playUiTone([783.99, 1046.5], 0.12, 'sine', 0.05);
  }
  window.toggleDynamicIsland = toggleDynamicIsland;


  function initSuite() {
    initCadenceContextMenu();
    initScribeNotebook();
    initHorizonTabBar();
    initGlobalDropzone();
    renderTodoList();
    renderContactsList();
    renderTourSlide();
    if (typeof window.renderSonataPlaylist === 'function') {
      window.renderSonataPlaylist();
    }
    if (typeof window.renderCalcTape === 'function') {
      window.renderCalcTape();
    }
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuite);
  } else {
    initSuite();
  }
})();
