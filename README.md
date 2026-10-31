# Toccata OS

> *An agile, gesture-driven desktop operating system based on Linux, inspired by the fluid ergonomics, window management, and application bundle architecture of macOS.*

---

```
  _____                             _             ____    _____ 
 |_   _|   ___     ___    ___   __ _| |_   __ _   / __ \  / ____|
   | |    / _ \   / __|  / __| / _` | __| / _` | / / _` | \___ \ 
   | |   | (_) | | (__  | (__ | (_| | |_ | (_| || | (_| |  ___) |
   |_|    \___/   \___|  \___| \__,_|\__| \__,_| \ \__,_| |_____/ 
                                                  \____/          
```

## 1. Philosophy & Heritage

**Toccata** (*from Italian "toccare", meaning "to touch"*) is a classical virtuoso composition designed to exhibit light touch, agile tempo, and fluid dexterity. 

Following the tradition of classical musical codenames in operating system history (*Copland*, *Gershwin*, *Rhapsody*), **Toccata OS** is engineered around tactile trackpad gestures, fluid Wayland compositing, zero-latency window management, and self-contained application bundles.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│               Aqua / Human Interface Layer                      │
│  Top Global Menu Bar  │  Spotlight Launcher  │  Floating Dock   │
│  Mission Control / Spaces   │   Control Center   │   QuickLook  │
├─────────────────────────────────────────────────────────────────┤
│                   Display & Compositor                          │
│        Wayland Compositor with Hardware-Accelerated Blur        │
├─────────────────────────────────────────────────────────────────┤
│               Application & Bundle Subsystem                    │
│   • .app Bundle Directory Support (Info.plist + App Launcher)   │
│   • Command-key Mapping (Cmd+C/V/Q/Space vs Terminal Ctrl+C)    │
│   • AppImage, Flatpak & Native Binary Integration               │
├─────────────────────────────────────────────────────────────────┤
│                     Base Linux OS & Kernel                      │
│   • Base Distro: Arch Linux Base (Modular, Bleeding-Edge)       │
│   • Linux Kernel + Btrfs Snapshots ("Time Machine" style)       │
│   • Systemd init & D-Bus Inter-Process Communication            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Project Directory Structure

```
p3os/
├── core/
│   └── toccata-bundle/     # macOS-style .app directory launcher & Info.plist parser
├── desktop/
│   ├── keymap/             # Command vs Ctrl keyboard mapping configuration
│   ├── panels/             # Global Menu Bar and Floating Dock configuration
│   └── themes/             # Window decorations (Traffic light controls & blur)
├── build/
│   └── archiso/            # Live ISO image generator profile
├── branding/               # System icons, typography, and logos
└── Makefile                # Master build and orchestration scripts
```

---

## 4. Key Engineering Innovations

1. **Native `.app` Directory Bundles**:
   Applications can live in self-contained folders containing metadata (`Contents/Info.plist`), icons (`Contents/Resources/icon.png`), and executable binaries (`Contents/MacOS/app`).
2. **Command Key Ergonomics**:
   The `Super` key acts as `Command` across all applications (`Cmd+C`, `Cmd+V`, `Cmd+Q`, `Cmd+W`, `Cmd+Space`), leaving `Ctrl+C` strictly for terminal signal interrupts.
3. **Global Menu Protocol**:
   Applications export their menu bars over D-Bus (`com.canonical.AppMenu.Registrar`) to render seamlessly in the top system bar.
4. **Instant QuickLook (`Spacebar`)**:
   Pressing spacebar on any file in the file manager opens an immediate preview overlay for code, images, video, and documents.
