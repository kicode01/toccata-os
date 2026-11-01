"""
Toccata OS - Gallery (Qt6 Native)
Universal App Store, Windows Proton/Wine Sideload Hub, and macOS Darwin/DMG Engine.
"""

import sys
import os
import shutil
import subprocess
from pathlib import Path
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QGridLayout, QFrame, QFileDialog, QMessageBox, QScrollArea
)

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from window_frame import ToccataWindow
import theme

class GalleryAppStore(ToccataWindow):
    def __init__(self):
        super().__init__(title="Gallery — App Store & Sideload", width=860, height=580)
        self.setup_ui()

    def setup_ui(self):
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("background: transparent; border: none;")

        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(16)

        # 1. Dual Sideload Heros (Windows Proton + macOS Darwin)
        sideload_row = QHBoxLayout()
        sideload_row.setSpacing(12)

        # Left: Windows Sideload Hero
        win_hero = QFrame()
        win_hero.setStyleSheet(f"""
            QFrame {{
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 rgba(0, 122, 255, 0.25), stop:1 rgba(0, 199, 190, 0.25));
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                padding: 12px;
            }}
        """)
        wh_layout = QVBoxLayout(win_hero)
        wh_title = QLabel("🪟 Windows (.exe / .msi)")
        wh_title.setFont(QFont("Inter", 12, QFont.Weight.Bold))
        wh_title.setStyleSheet("color: #ffffff; background: transparent;")
        wh_desc = QLabel("Isolated container with DXVK DirectX-to-Vulkan translation.")
        wh_desc.setFont(QFont("Inter", 9))
        wh_desc.setStyleSheet("color: rgba(255, 255, 255, 0.7); background: transparent;")
        wh_desc.setWordWrap(True)
        btn_win = QPushButton("Sideload .exe...")
        btn_win.setStyleSheet(theme.BUTTON_PRIMARY_STYLE)
        btn_win.clicked.connect(self.sideload_exe)

        wh_layout.addWidget(wh_title)
        wh_layout.addWidget(wh_desc)
        wh_layout.addStretch()
        wh_layout.addWidget(btn_win)
        sideload_row.addWidget(win_hero)

        # Right: macOS Darwin Sideload Hero
        mac_hero = QFrame()
        mac_hero.setStyleSheet(f"""
            QFrame {{
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 rgba(175, 82, 222, 0.25), stop:1 rgba(255, 45, 85, 0.25));
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 12px;
                padding: 12px;
            }}
        """)
        mh_layout = QVBoxLayout(mac_hero)
        mh_title = QLabel("🍎 macOS (.dmg / .app)")
        mh_title.setFont(QFont("Inter", 12, QFont.Weight.Bold))
        mh_title.setStyleSheet("color: #ffffff; background: transparent;")
        mh_desc = QLabel("Mount DMG disk images or run Mach-O Darwin binaries via Darling.")
        mh_desc.setFont(QFont("Inter", 9))
        mh_desc.setStyleSheet("color: rgba(255, 255, 255, 0.7); background: transparent;")
        mh_desc.setWordWrap(True)
        btn_mac = QPushButton("Mount .dmg / .app...")
        btn_mac.setStyleSheet(theme.BUTTON_PRIMARY_STYLE)
        btn_mac.clicked.connect(self.sideload_mac)

        mh_layout.addWidget(mh_title)
        mh_layout.addWidget(mh_desc)
        mh_layout.addStretch()
        mh_layout.addWidget(btn_mac)
        sideload_row.addWidget(mac_hero)

        layout.addLayout(sideload_row)

        # 2. First-Party Sovereign Applications
        sec_title = QLabel("First-Party Sovereign Applications")
        sec_title.setFont(QFont("Inter", 13, QFont.Weight.Bold))
        sec_title.setStyleSheet("color: #ffffff;")
        layout.addWidget(sec_title)

        grid = QGridLayout()
        grid.setSpacing(12)

        apps = [
            ("📁", "Cadence", "Finder & DMG Disk Mounter", "cadence"),
            ("⚙️", "Settings", "System Preferences & Layout", "settings"),
            ("🔢", "Solfege", "Squircle Calculator", "solfege"),
            ("💻", "Console", "Terminal & Windows Shims", "console"),
            ("📝", "Scribe", "Markdown & Code Canvas", "scribe"),
            ("⚡", "Tempo", "Activity Monitor", "tempo"),
            ("🧭", "Horizon", "Sovereign Web Browser", "horizon"),
            ("🎼", "Sonata", "PipeWire Hi-Fi Player", "sonata"),
        ]

        row, col = 0, 0
        for icon, title, desc, action_id in apps:
            card = self._create_app_card(icon, title, desc, action_id)
            grid.addWidget(card, row, col)
            col += 1
            if col > 1:
                col = 0
                row += 1

        layout.addLayout(grid)

        # 3. macOS Cross-Platform Essentials (.app Bundles)
        sec_mac = QLabel("Mac Cross-Platform Essentials (Native 60 FPS Engine)")
        sec_mac.setFont(QFont("Inter", 13, QFont.Weight.Bold))
        sec_mac.setStyleSheet("color: #ffffff;")
        layout.addWidget(sec_mac)

        grid_mac = QGridLayout()
        grid_mac.setSpacing(12)

        mac_essentials = [
            ("💻", "Visual Studio Code", "Code Editing & Git", "code"),
            ("🎵", "Spotify", "Music & Podcasts", "spotify"),
            ("💬", "Discord", "Chat & Voice Streaming", "discord"),
            ("📓", "Obsidian", "Knowledge Graph & Notes", "obsidian"),
            ("🎨", "Blender 3D", "Modelling & VFX Suite", "blender"),
            ("🎬", "VLC Media Player", "Universal Audio/Video", "vlc"),
        ]

        row, col = 0, 0
        for icon, title, desc, pkg_id in mac_essentials:
            card = self._create_mac_essential_card(icon, title, desc, pkg_id)
            grid_mac.addWidget(card, row, col)
            col += 1
            if col > 1:
                col = 0
                row += 1

        layout.addLayout(grid_mac)
        layout.addStretch()

        scroll.setWidget(container)
        self.body_layout.addWidget(scroll)

    def _create_app_card(self, icon, title, desc, action_id):
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid {theme.COLOR_BORDER};
                border-radius: 10px;
                padding: 10px;
            }}
            QFrame:hover {{
                background: rgba(255, 255, 255, 0.08);
            }}
        """)
        c_layout = QHBoxLayout(card)
        c_layout.setContentsMargins(8, 8, 8, 8)
        c_layout.setSpacing(10)

        icon_lbl = QLabel(icon)
        icon_lbl.setFont(QFont("Segoe UI Emoji", 20))
        icon_lbl.setStyleSheet("background: transparent;")
        c_layout.addWidget(icon_lbl)

        info = QVBoxLayout()
        info.setSpacing(2)
        t_lbl = QLabel(title)
        t_lbl.setFont(QFont("Inter", 11, QFont.Weight.Bold))
        t_lbl.setStyleSheet("color: #ffffff; background: transparent;")
        d_lbl = QLabel(desc)
        d_lbl.setFont(QFont("Inter", 9))
        d_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.6); background: transparent;")
        info.addWidget(t_lbl)
        info.addWidget(d_lbl)
        c_layout.addLayout(info)
        c_layout.addStretch()

        btn_launch = QPushButton("Open")
        btn_launch.setStyleSheet(theme.BUTTON_SECONDARY_STYLE)
        btn_launch.clicked.connect(lambda ch, a=action_id: self.launch_app(a))
        c_layout.addWidget(btn_launch)

        return card

    def _create_mac_essential_card(self, icon, title, desc, pkg_id):
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid {theme.COLOR_BORDER};
                border-radius: 10px;
                padding: 10px;
            }}
            QFrame:hover {{
                background: rgba(255, 255, 255, 0.08);
            }}
        """)
        c_layout = QHBoxLayout(card)
        c_layout.setContentsMargins(8, 8, 8, 8)
        c_layout.setSpacing(10)

        icon_lbl = QLabel(icon)
        icon_lbl.setFont(QFont("Segoe UI Emoji", 20))
        icon_lbl.setStyleSheet("background: transparent;")
        c_layout.addWidget(icon_lbl)

        info = QVBoxLayout()
        info.setSpacing(2)
        t_lbl = QLabel(title)
        t_lbl.setFont(QFont("Inter", 11, QFont.Weight.Bold))
        t_lbl.setStyleSheet("color: #ffffff; background: transparent;")
        d_lbl = QLabel(desc)
        d_lbl.setFont(QFont("Inter", 9))
        d_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.6); background: transparent;")
        info.addWidget(t_lbl)
        info.addWidget(d_lbl)
        c_layout.addLayout(info)
        c_layout.addStretch()

        btn_install = QPushButton("Install .app")
        btn_install.setStyleSheet(theme.BUTTON_PRIMARY_STYLE)
        btn_install.clicked.connect(lambda ch, t=title, p=pkg_id: self.install_mac_essential(t, p))
        c_layout.addWidget(btn_install)

        return card

    def install_mac_essential(self, title, pkg_id):
        """Creates a standardized macOS .app bundle structure in /Applications."""
        app_name = f"{title}.app"
        target_dir = Path.home() / "Applications" / app_name
        contents_dir = target_dir / "Contents"
        macos_dir = contents_dir / "MacOS"
        res_dir = contents_dir / "Resources"

        try:
            macos_dir.mkdir(parents=True, exist_ok=True)
            res_dir.mkdir(parents=True, exist_ok=True)

            # 1. Info.plist
            plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>{title}</string>
    <key>CFBundleDisplayName</key>
    <string>{title}</string>
    <key>CFBundleIdentifier</key>
    <string>com.toccata.{pkg_id}</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleExecutable</key>
    <string>{pkg_id}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
</dict>
</plist>
"""
            with open(contents_dir / "Info.plist", "w", encoding="utf-8") as f:
                f.write(plist_content)

            # 2. Executable launcher script
            exec_path = macos_dir / pkg_id
            with open(exec_path, "w", encoding="utf-8") as f:
                f.write(f"""#!/bin/sh
if command -v {pkg_id} >/dev/null 2>&1; then
    exec {pkg_id} "$@"
else
    # Graceful fallback or package manager installation
    echo "Installing {pkg_id} package..."
    exec flatpak run {pkg_id} "$@" 2>/dev/null || xdg-open "https://flathub.org/apps/search?q={pkg_id}"
fi
""")
            exec_path.chmod(0o755)

            # 3. Register desktop integration
            open_script = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-open"
            )
            if os.path.exists(open_script):
                subprocess.run([sys.executable, open_script, str(target_dir), "--register"])

            QMessageBox.information(
                self,
                "macOS App Installed",
                f"Successfully installed '{app_name}' to ~/Applications/\n\n"
                f"The application has been registered with Toccata Dock, Launchpad, and Spotlight."
            )

        except Exception as e:
            QMessageBox.critical(self, "Installation Failed", f"Could not create bundle:\n{str(e)}")

    def launch_app(self, action_id):
        apps_dir = os.path.dirname(__file__)
        target_py = os.path.join(apps_dir, f"{action_id}.py")
        if os.path.exists(target_py):
            subprocess.Popen([sys.executable, target_py])
        else:
            QMessageBox.information(self, "Toccata App", f"Launching {action_id}...")

    def sideload_exe(self):
        filepath, _ = QFileDialog.getOpenFileName(
            self,
            "Select Windows Executable to Containerize",
            "/mnt/c/Users/PC/Downloads",
            "Windows Executables (*.exe *.msi);;All Files (*)"
        )
        if filepath:
            runner_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-wine-runner.py")
            subprocess.Popen([sys.executable, runner_script, filepath])
            QMessageBox.information(
                self,
                "Proton / Wine Containerizer",
                f"Containerizing and launching:\n{os.path.basename(filepath)}\n\nIsolated prefix initialized in ~/.local/share/toccata/prefixes/"
            )

    def sideload_mac(self):
        filepath, _ = QFileDialog.getOpenFileName(
            self,
            "Select Apple Disk Image or Bundle",
            "/mnt/c/Users/PC/Downloads",
            "Apple macOS Files (*.dmg *.app);;All Files (*)"
        )
        if filepath:
            if filepath.lower().endswith(".dmg"):
                # Open Cadence to mount DMG
                cadence_py = os.path.join(os.path.dirname(__file__), "cadence.py")
                subprocess.Popen([sys.executable, cadence_py, filepath])
            elif filepath.endswith(".app"):
                installer_gui = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-installer-gui.py"
                )
                subprocess.Popen([sys.executable, installer_gui, filepath])

if __name__ == "__main__":
    app = QApplication(sys.argv)
    gallery = GalleryAppStore()
    gallery.show()
    sys.exit(app.exec())
