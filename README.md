# Toccata OS 1.0 (Virtuosic Edition)

> *The Sovereign Unified Operating System — Combining the speed of Linux, the polish of pearOS / macOS Cupertino ergonomics, the adaptive workflows of Zorin OS, and the modern compositor architecture of GNOME 47.*

---

```
  _____                             _             ____    _____ 
 |_   _|   ___     ___    ___   __ _| |_   __ _   / __ \  / ____|
   | |    / _ \   / __|  / __| / _` | __| / _` | / / _` | \___ \ 
   | |   | (_) | | (__  | (__ | (_| | |_ | (_| || | (_| |  ___) |
   |_|    \___/   \___|  \___| \__,_|\__| \__,_| \ \__,_| |_____/ 
                                                  \____/          
```

[![Release](https://img.shields.io/badge/Release-v1.0--Virtuosic-00d2ff?style=for-the-badge)](https://github.com/kicode01/toccata-os)
[![Base](https://img.shields.io/badge/Base-Arch%20Linux%20Rolling-1793d1?style=for-the-badge&logo=archlinux)](https://archlinux.org)
[![Desktop](https://img.shields.io/badge/Desktop-GNOME%2047%20%2B%20Mutter-4a154b?style=for-the-badge&logo=gnome)](https://www.gnome.org)
[![Audio](https://img.shields.io/badge/Audio-PipeWire%200.7ms%20Pro-e91e63?style=for-the-badge)](https://pipewire.org)

---

## 1. Philosophy & Heritage

**Toccata** (*from Italian "toccare", meaning "to touch"*) is a classical virtuoso composition engineered to exhibit light touch, agile tempo, and fluid dexterity. Following the tradition of classical musical codenames in operating system history (*Copland*, *Gershwin*, *Rhapsody*), **Toccata OS** is built around fluid Wayland compositing, zero-latency window management, native macOS ergonomics, and adaptive Linux power.

Instead of fragmenting the user experience into multiple separate desktop modes or distros, Toccata OS unites them into **one sovereign, coherent operating system**:
* **Cupertino Polish**: Sleek top menu bar, dynamic floating dock, left-side traffic light window controls (`close,minimize,maximize:`), and Inter Display typography.
* **Zorin OS Adaptive Workflows**: Zorin Appearance layout switcher, wobbly window physics, magic lamp (genie) window minimize effect, and intelligent application launcher.
* **GNOME 47 Core**: Pure Wayland Mutter compositor, high-DPI scaling, hardware acceleration, and modern seat management.
* **SteamOS-Class Gaming & Subsystem**: Proton / Wine bridge, low-latency PipeWire Pro audio (0.7ms ALSA direct), and kernel game optimizations.

---

## 2. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Toccata Unified Human Interface Layer             │
│  Top Global Menu Bar  │  Spotlight Launcher  │  Dynamic Floating Dock  │
│  Zorin Menu & Layouts │  Control Center HUD  │  QuickLook (Spacebar)   │
├────────────────────────────────────────────────────────────────────────┤
│                     Display & Compositing Engine                       │
│        Wayland Mutter 47 Compositor • Hardware Blur Shaders            │
│        Magic Lamp Genie Minimize • Wobbly Window Physics               │
├────────────────────────────────────────────────────────────────────────┤
│                       First-Party Application Suite                    │
│   • Cadence: Dual-pane File Manager with macOS tags & tabs             │
│   • Scribe: Modern Markdown & document editor                         │
│   • Tempo: Activity Monitor & real-time resource visualizer            │
│   • Solfege: PipeWire Hi-Fi audio player                               │
│   • Gallery: Hardware-accelerated image viewer                         │
│   • Toccata Console: GPU-accelerated terminal emulator                 │
│   • Settings & Zorin Appearance: Full system configuration             │
│   • Maestro: Local neural assist & command orchestrator                │
├────────────────────────────────────────────────────────────────────────┤
│                     Application & Bundle Subsystems                    │
│   • .app Bundle Directory Support (Info.plist + App Executable)        │
│   • Windows Application Bridge (Wine / Proton)                         │
│   • Native Arch Packages, Flatpak & AppImage Support                   │
├────────────────────────────────────────────────────────────────────────┤
│                     Base Linux Kernel & Boot Infrastructure            │
│   • Arch Linux Rolling Release Engine • Linux Kernel 6.x / 7.x         │
│   • Dual Bootloaders: UEFI OVMF (systemd-boot) + BIOS (Syslinux)       │
│   • GDM Display Manager with Toccata OS Neon Vector Branding           │
│   • PipeWire Low-Latency Audio Subsystem                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Layout

```
p3os/
├── build/
│   ├── archiso/            # Master Archiso OS build profile
│   │   ├── airootfs/       # Root filesystem overlay (/etc, /usr, /home)
│   │   ├── efiboot/        # UEFI systemd-boot loader configuration
│   │   ├── syslinux/       # BIOS Syslinux bootloader configuration
│   │   ├── packages.x86_64 # Full package manifest
│   │   └── profiledef.sh   # Archiso profile definition and permissions
│   └── build-iso.sh        # Automated fast ext4 ISO compilation script
├── core/
│   ├── toccata-shell/      # Toccata Shell UI components & apps
│   ├── toccata-bundle/     # macOS .app bundle runner & Info.plist parser
│   ├── toccata-compat/     # Windows command shims & compatibility bridges
│   ├── toccata-ai/         # Maestro AI local neural engine
│   └── toccata-logo.svg    # Official Toccata OS vector insignia
├── assets/
│   ├── wallpapers/         # 4K Dynamic Day/Night wallpapers (pearOS & Zorin)
│   ├── sounds/             # Authentic stereo boot chime and UI event sounds
│   ├── themes/             # GTK and Shell themes
│   └── icons/              # Cupertino & WhiteSur vector icon suites
├── scripts/
│   ├── run-vm.sh           # Hardware-accelerated QEMU virtual machine launcher
│   └── generate_splash.py  # Bespoke 640x480 bootloader splash generator
└── boot-real-os.bat        # 1-Click Windows launcher for the real operating system
```

---

## 4. Building the Master ISO

To compile the bare-metal bootable ISO from source:

```bash
# 1. Run pre-flight integrity check
sudo bash build/build-iso.sh validate

# 2. Compile master ISO (zstd compressed, multi-threaded)
sudo bash build/build-iso.sh build
```

The resulting ISO will be placed in `dist/toccata-os-<date>-x86_64.iso`.

---

## 5. Running the Real Operating System

### On Windows
Double-click `boot-real-os.bat` or run:
```cmd
.\boot-real-os.bat
```

### On Linux / WSL
```bash
bash scripts/run-vm.sh toccata
```

---

## 6. License & Heritage

Toccata OS is licensed under the MIT License. Derived desktop components and assets respect their upstream open-source licenses (GPL-3.0 / LGPL / Apache 2.0).
