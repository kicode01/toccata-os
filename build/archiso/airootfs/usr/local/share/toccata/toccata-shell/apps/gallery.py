"""
Toccata OS - Gallery (Qt6 Native)
App Store & Windows Application Sideload Hub (Proton / Wine Containerizer).
"""

import sys
import os
import subprocess
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
        super().__init__(title="Gallery — App Store & Sideload", width=820, height=540)
        self.setup_ui()

    def setup_ui(self):
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("background: transparent; border: none;")

        container = QWidget()
        layout = QVBoxLayout(container)
        layout.setContentsMargins(4, 4, 4, 4)
        layout.setSpacing(16)

        # 1. Hero Sideload Banner (Zorin / SteamOS Superpower)
        hero = QFrame()
        hero.setStyleSheet(f"""
            QFrame {{
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 rgba(0, 122, 255, 0.25), stop:1 rgba(175, 82, 222, 0.25));
                border: 1px solid rgba(255, 255, 255, 0.18);
                border-radius: 12px;
                padding: 16px;
            }}
        """)
        h_layout = QHBoxLayout(hero)
        h_layout.setContentsMargins(14, 12, 14, 12)

        h_info = QVBoxLayout()
        h_title = QLabel("🪟 Windows Sideload Containerizer (Proton / Wine)")
        h_title.setFont(QFont("Inter", 13, QFont.Weight.Bold))
        h_title.setStyleSheet("color: #ffffff; background: transparent;")
        h_desc = QLabel("Run any Windows .exe or .msi directly in an isolated prefix with DXVK graphics acceleration.")
        h_desc.setFont(QFont("Inter", 10))
        h_desc.setStyleSheet("color: rgba(255, 255, 255, 0.7); background: transparent;")
        h_info.addWidget(h_title)
        h_info.addWidget(h_desc)
        h_layout.addLayout(h_info)
        h_layout.addStretch()

        btn_sideload = QPushButton("Browse .exe...")
        btn_sideload.setStyleSheet(theme.BUTTON_PRIMARY_STYLE)
        btn_sideload.clicked.connect(self.sideload_exe)
        h_layout.addWidget(btn_sideload)

        layout.addWidget(hero)

        # 2. Featured Apps Grid
        sec_title = QLabel("First-Party Sovereign Applications")
        sec_title.setFont(QFont("Inter", 13, QFont.Weight.Bold))
        sec_title.setStyleSheet("color: #ffffff;")
        layout.addWidget(sec_title)

        grid = QGridLayout()
        grid.setSpacing(12)

        apps = [
            ("📁", "Cadence", "Finder & File Manager", "cadence"),
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
        icon_lbl.setFont(QFont("Segoe UI Emoji", 22))
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

if __name__ == "__main__":
    app = QApplication(sys.argv)
    gallery = GalleryAppStore()
    gallery.show()
    sys.exit(app.exec())
