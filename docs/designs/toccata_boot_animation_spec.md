# Toccata OS Boot Animation Architecture Specification

## 1. Context & Objectives
Toccata OS uses a sovereign desktop environment based on KWin Wayland with a 0.7ms PipeWire audio engine. On system launch or boot splash replay, the system presents an intro animation designed to communicate acoustic precision and minimalist hardware elegance (matching macOS / After Effects quality standards).

## 2. Visual Architecture & Geometry
The animation operates inside `#toccata-boot-splash` (`fixed`, `inset: 0`, background `#000000`, `z-index: 9999999`).

### 2.1 The Seed Stage (0.00s – 0.72s)
- **Element**: `.boot-seed-pill` (DOM `div`, base circular dimension `22px × 22px`, `border-radius: 999px`, background `#FFFFFF`).
- **Kinematics & Pure GPU Compositing (Zero CPU Layout Reflow)**:
  - `0.00s`: Starts at `translateY(-85px)` with elongation `scale(0.64, 1.91)` accelerating under physical gravity (`cubic-bezier(0.55, 0.055, 0.675, 0.19)`).
  - `0.20s` (`28%`): Impacts center (`translateY(0px)`) with compression squash `scale(1.36, 0.68)` and rebounds (`cubic-bezier(0.215, 0.61, 0.355, 1)`).
  - `0.35s` (`48%`): Elastic rebound to `translateY(-14px)` with elongation `scale(0.85, 1.15)`.
  - `0.49s` (`68%`): Secondary settlement at `translateY(0px)` with dampening `scale(1.10, 0.90)` (`cubic-bezier(0.16, 1, 0.3, 1)`).
  - `0.62s` (`86%`): Settled into exact circular seed node (`scale(1.0, 1.0)`, `22px × 22px`).
  - `0.70s` – `0.72s`: Seamless 1:1 liquid morph handoff to `.boot-svg-emblem` at identical coordinate and scale.

### 2.2 The Emblem Expansion Stage (0.70s – 1.45s)
- **Element**: `.boot-svg-emblem` (`136px × 136px`, `viewBox="0 0 256 256"`).
- **Coordinate System**:
  - Center of canvas: `(128, 128)`.
  - Top T-Bar: `rect` at `x=64, y=56, width=128, height=32, rx=15`.
  - Tuning Fork U: `path` at `x=83..188, y=106..206`.
- **Kinematics**:
  - `0.70s`: Starts at `scale(0.162)` (`136px * 0.162 = 22.03px`, matching the 22px circular seed to within sub-pixel tolerance).
  - `0.79s` (`12%`): Expands smoothly to `scale(0.24)` with `opacity: 1`.
  - `1.15s` (`60%`): Spring overshoots gently to `scale(1.03)` using Apple's `cubic-bezier(0.16, 1, 0.3, 1)`.
  - `1.40s` – `1.45s`: Settles cleanly at resting `scale(1.0)`.
  - During expansion, `.boot-part-bar` glides from `translateY(14px) scaleX(0.4)` to resting, while `.boot-part-fork` glides from `translateY(-12px) scale(0.4)` to resting, avoiding any internal gap or shape ghosting.

### 2.3 The Volumetric Ray Sweep (1.40s – 3.10s)
- **Element**: `.boot-volumetric-stack` holding 4 progressive hardware-optimized SVG `<use href="#toccata-monolith-shape">` clones (`echo-1` through `echo-4`).
- **Timing Synchronization**:
  - Starts sweeping at `1.40s`, strictly *after* the foreground monolith has settled, eliminating projection ghosting.
- **Ray Extrusion Math (Optimized 4-Layer GPU Fill-Rate)**:
  - Echo 1: `d=0.25`, `blur=4px`, `opacity=0.44`
  - Echo 2: `d=0.55`, `blur=10px`, `opacity=0.30`
  - Echo 3: `d=0.90`, `blur=20px`, `opacity=0.18`
  - Echo 4: `d=1.35`, `blur=34px`, `opacity=0.08`
- **Orbit Vectors**:
  - `0%` (`1.40s`): Origin `(0, 0)`.
  - `20%`: Translates `(-42px * d, 16px * d)` with scale expansion `1 + 0.14 * d`.
  - `45%`: Translates `(-24px * d, -34px * d)` with scale expansion `1 + 0.18 * d`.
  - `72%`: Translates `(40px * d, 24px * d)` with scale expansion `1 + 0.16 * d`.
  - `92%`: Collapses back to `(12px * d, 6px * d)` with scale `1 + 0.04 * d`.
  - `100%` (`3.10s`): Resolves to origin `(0, 0)` and contracts into the silhouette.

### 2.4 Final Resolve, Dismissal & Compositor Teardown (3.10s – 3.35s)
- At `3.35s`, `dismissBootSplash()` is called by `app.js`.
- The pentatonic chord chime (`[330, 440, 554.37, 659.25, 880]`) sounds.
- `#toccata-boot-splash` fades out via `opacity: 0; visibility: hidden;` (`transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0.6s`).
- At `+650ms`, `splash.style.display = 'none'` completely detaches the overlay from compositor VRAM.

## 3. Implementation Constraints & Invariants
1. **Compositing Efficiency**: Strict Invariant 1 adherence — zero CPU re-layouts during the animation loop. Animated properties are exclusively GPU-composited (`transform: translateY(...) scale(...)`, `opacity`).
2. **Kinematic Realism**: Physical gravity acceleration on initial drop, damping spring deceleration on rebound.
3. **GPU Layer De-allocation**: Mandatory `visibility: hidden` and `display: none` post-fade to prevent VRAM / FBO retention on low-spec VMs.
4. **Accessibility**: Reduced motion query (`@media (prefers-reduced-motion: reduce)`) gracefully bypasses translational orbits and seed drops in favor of a serene 0.4s static fade-in.
