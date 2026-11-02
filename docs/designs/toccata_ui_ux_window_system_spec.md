# Toccata OS UI/UX Architecture & Window System Specification

## 1. Executive Summary & Design Invariants
Toccata OS is a sovereign desktop environment engineered for acoustic precision, visual clarity, and fluid 120Hz/144Hz physics. This specification defines the universal geometry, container layout hierarchy, and responsive constraints for all 13 first-party desktop applications.

### Core Invariants:
1. **Container Isolation & Universal Body Contract**: Every `.window` is a flex container with a fixed 40px `.window-titlebar` and a flex-1 `.window-body`. No window shall use ad-hoc `height: calc(100% - 42px)` inline styles.
2. **Specialized Class-Based Min/Max Bounds**: Calculator (`.calc-window`) and compact widgets must not inherit general window constraints. `.window:not(.calc-window)` enforces a 380px min-width, while `.calc-window` enforces strict 260px–340px portrait bounds.
3. **Safe Desktop Viewport Clamping**: Windows spawned on any screen (from 1280×720 up to 3840×2160 4K) must respect the top 28px Global Menu Bar and bottom 80px Dock clearance. Window height must never exceed `calc(100vh - 120px)` on spawn.
4. **Independent Viewport Scrolling**: Sidebars, master lists, and detail viewports must manage their own `overflow-y: auto` with macOS-style slim overlay scrollbars; window containers must never spill outside their frame.
5. **Zero Layout Thrashing**: All window movements, resizes, minimizations, and spring pops utilize GPU-composited transforms and cached bounding geometries.

---

## 2. Window Geometry & Proportion Matrix

| Window ID | Application Name | Default Width | Default Height | Min W × Min H | Spawn Offset (X, Y) | Layout Archetype |
|---|---|---|---|---|---|---|
| `win-cadence` | **Cadence** (Finder) | 860px | 520px | 560px × 360px | Centered (calc(50vw - 430px), 64px) | 2-Pane: 200px Sidebar + Icon Grid / List |
| `win-calc` | **Calculator** | 280px | 420px | 260px × 380px | Centered-Right (calc(50vw + 120px), 80px) | Single Column Portrait Keypad |
| `win-settings` | **System Settings** | 840px | 540px | 640px × 420px | Centered (calc(50vw - 420px), 68px) | 2-Pane: 220px Sidebar + Preference Scroll |
| `win-horizon` | **Horizon** (Browser) | 940px | 580px | 600px × 400px | Centered (calc(50vw - 470px), 56px) | Header URL bar + Sandboxed Viewport |
| `win-console` | **Console** (Terminal) | 720px | 460px | 480px × 300px | Offset (calc(50vw - 360px), 90px) | Fixed-Pitch 80×24 ANSI Terminal |
| `win-sonata` | **Sonata** (Music & DSP) | 700px | 460px | 520px × 340px | Offset (calc(50vw - 350px), 85px) | 2-Pane: 280px Player/DSP + 420px Queue |
| `win-tempo` | **Tempo** (Activity Monitor) | 760px | 500px | 560px × 360px | Offset (calc(50vw - 380px), 76px) | Resource Graph Cards + Process Table |
| `win-scribe` | **Scribe** (TextEdit) | 740px | 510px | 480px × 340px | Offset (calc(50vw - 370px), 80px) | Toolbar + Focused Typography Canvas |
| `win-messages` | **Messages** (Encrypted Bridge) | 680px | 480px | 500px × 360px | Offset (calc(50vw - 340px), 84px) | 2-Pane: 230px Thread List + 450px Stream |
| `win-mail` | **Mail** | 820px | 520px | 600px × 380px | Offset (calc(50vw - 410px), 72px) | 3-Pane: 180px Folders + 260px List + Reading |
| `win-installer` | **Gallery** (Software Center) | 820px | 530px | 580px × 380px | Offset (calc(50vw - 410px), 70px) | 2-Pane: 190px Categories + 630px App Grid |
| `win-prism` | **Prism** (Asset Viewer) | 780px | 520px | 500px × 360px | Offset (calc(50vw - 390px), 75px) | Canvas Stage + Collapsible Metadata |
| `win-chronicle` | **Chronicle** (Calendar) | 780px | 520px | 560px × 380px | Offset (calc(50vw - 390px), 72px) | 2-Pane: 500px Month Grid + 280px Agenda |

---

## 3. Container Hierarchy & Layout Rules

### 3.1 Universal Window Shell
```css
.window {
  position: absolute;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.14), var(--glass-rim-light);
  backdrop-filter: blur(40px) saturate(190%);
  -webkit-backdrop-filter: blur(40px) saturate(190%);
  transition: box-shadow 0.25s ease, border-radius 0.25s ease;
  will-change: transform, opacity, left, top;
}

/* Distinct constraint tiers */
.window:not(.calc-window) {
  min-width: 480px;
  min-height: 320px;
  max-width: 96vw;
  max-height: calc(100vh - 100px);
}

.calc-window {
  min-width: 260px !important;
  max-width: 320px !important;
  min-height: 390px !important;
  max-height: 480px !important;
}
```

### 3.2 Titlebar Alignment
- Height: Fixed `40px` (standard macOS Ventura/Sonoma proportion).
- Inset traffic lights: Red (#FF5F56), Yellow (#FFBD2E), Green (#27C93F) at `12px × 12px`, with 8px gap and authentic hover glyphs.
- Title & Proxy Icon: Centered or left-aligned depending on archetype, with subtle text-shadow and typography matching San Francisco / Inter.

### 3.3 Universal Body Contract
```css
.window-body {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  position: relative;
  background: transparent;
}
```

### 3.4 Responsive Clamping & Multi-Monitor Viewport Rules
1. On initial load or viewport resize, window positions are clamped:
   - `top = Math.max(34, Math.min(top, window.innerHeight - height - 85))`
   - `left = Math.max(10, Math.min(left, window.innerWidth - width - 10))`
2. Maximize state cleanly toggles between:
   - Restored: Original dataset coordinates (`origTop`, `origLeft`, `origWidth`, `origHeight`).
   - Maximized: `top: 28px; left: 0; width: 100vw; height: calc(100vh - 28px - 78px); border-radius: 0;` (Leaving dock visible in standard desktop mode or full screen if dock auto-hides).
