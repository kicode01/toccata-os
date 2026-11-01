#!/usr/bin/env python3
"""
Toccata OS - macOS Application Bundle Installer Sheet (`toccata-installer-gui`)
Authentic macOS Sequoia Light Mode sheet presented when an .app bundle is opened
from a mounted disk image (.dmg), downloads folder, or external volume.
"""

import sys
import os
import shutil
import plistlib
import subprocess
from pathlib import Path

from PyQt6.QtCore import Qt, QRectF, QPointF
from PyQt6.QtGui import (
    QFont, QColor, QPainter, QBrush, QPen, QLinearGradient
)
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QPushButton, QFrame, QButtonGroup, QMessageBox
)

def parse_plist(plist_path: Path) -> dict:
    if not plist_path.is_file():
        return {}
    try:
        with open(plist_path, "rb") as f:
            return plistlib.load(f)
    except Exception:
        # Fallback text parsing
        data = {}
        try:
            with open(plist_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if "=" in line:
                        k, v = line.strip().split("=", 1)
                        data[k.strip()] = v.strip().strip('"').strip("'")
        except Exception:
            pass
        return data

class SelectionBadge(QWidget):
    """Bespoke Apple-style circular checkmark indicator."""
    def __init__(self, is_selected=False, parent=None):
        super().__init__(parent)
        self.is_selected = is_selected
        self.setFixedSize(22, 22)

    def set_selected(self, selected):
        self.is_selected = selected
        self.update()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()

        if self.is_selected:
            p.setBrush(QBrush(QColor(0, 122, 255)))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawEllipse(QRectF(1, 1, w - 2, h - 2))

            p.setPen(QPen(QColor(255, 255, 255), 2.2, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin))
            p.drawLine(QPointF(w * 0.28, h * 0.52), QPointF(w * 0.44, h * 0.68))
            p.drawLine(QPointF(w * 0.44, h * 0.68), QPointF(w * 0.72, h * 0.36))
        else:
            p.setBrush(QBrush(QColor(255, 255, 255, 180)))
            p.setPen(QPen(QColor(0, 0, 0, 50), 1.5))
            p.drawEllipse(QRectF(1, 1, w - 2, h - 2))

class TargetOptionCard(QFrame):
    """Interactive target option card."""
    def __init__(self, title_text, desc_text, target_val, is_selected=False, parent=None):
        super().__init__(parent)
        self.target_val = target_val
        self.setObjectName("OptionCard")
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(54)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(14, 8, 14, 8)
        layout.setSpacing(12)

        v_text = QVBoxLayout()
        v_text.setSpacing(2)
        v_text.setAlignment(Qt.AlignmentFlag.AlignVCenter)

        self.title_lbl = QLabel(title_text)
        self.title_lbl.setFont(QFont("Inter Display, Inter", 10, QFont.Weight.DemiBold))
        self.title_lbl.setStyleSheet("color: #1d1d1f; border: none; background: transparent;")

        self.desc_lbl = QLabel(desc_text)
        self.desc_lbl.setFont(QFont("Inter", 8))
        self.desc_lbl.setStyleSheet("color: #86868b; border: none; background: transparent;")

        v_text.addWidget(self.title_lbl)
        v_text.addWidget(self.desc_lbl)
        layout.addLayout(v_text)
        layout.addStretch()

        self.badge = SelectionBadge(is_selected=is_selected)
        layout.addWidget(self.badge)

        self.set_selected(is_selected)

    def set_selected(self, selected):
        self.badge.set_selected(selected)
        if selected:
            self.setStyleSheet("""
                QFrame#OptionCard {
                    background: #ffffff;
                    border: 2px solid #007aff;
                    border-radius: 9px;
                }
            """)
        else:
            self.setStyleSheet("""
                QFrame#OptionCard {
                    background: #f2f2f7;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    border-radius: 9px;
                }
                QFrame#OptionCard:hover {
                    background: #e5e5ea;
                }
            """)

class AppInstallerSheet(QWidget):
    """Native macOS Sequoia Light Mode App Installer Sheet."""
    def __init__(self, bundle_path: Path):
        super().__init__()
        self.bundle_path = bundle_path.resolve()
        self.contents_dir = self.bundle_path / "Contents"
        self.info_plist = self.contents_dir / "Info.plist"
        self.meta = parse_plist(self.info_plist)

        self.app_name = (
            self.meta.get("CFBundleDisplayName")
            or self.meta.get("CFBundleName")
            or self.bundle_path.stem
        )
        self.version = self.meta.get("CFBundleVersion", "1.0.0")
        self.bundle_id = self.meta.get("CFBundleIdentifier", f"org.toccata.{self.app_name.lower()}")

        self.selected_target = "/Applications"
        self.setup_ui()

    def setup_ui(self):
        self.setWindowTitle(f"Install {self.app_name} — Toccata")
        self.setFixedSize(540, 360)
        self.setStyleSheet("""
            QWidget {
                background: #fbfbfd;
                color: #1d1d1f;
                font-family: 'Inter Display', 'Inter', -apple-system, sans-serif;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 22, 28, 22)
        layout.setSpacing(14)

        # Header Row
        h_row = QHBoxLayout()
        h_row.setSpacing(16)

        # Icon widget
        icon_box = QWidget()
        icon_box.setFixedSize(56, 56)
        def paint_icon(event):
            p = QPainter(icon_box)
            p.setRenderHint(QPainter.RenderHint.Antialiasing)
            w, h = icon_box.width(), icon_box.height()

            # Elegant squircle with deep blue/indigo gradient
            grad = QLinearGradient(0, 0, w, h)
            grad.setColorAt(0, QColor(0, 122, 255))
            grad.setColorAt(1, QColor(88, 86, 214))
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(255, 255, 255, 60), 1.2))
            p.drawRoundedRect(QRectF(2, 2, w - 4, h - 4), 14, 14)

            # Monogram letter
            p.setPen(QColor(255, 255, 255))
            p.setFont(QFont("Inter Display", 22, QFont.Weight.Bold))
            p.drawText(QRectF(0, 0, w, h), Qt.AlignmentFlag.AlignCenter, self.app_name[:1].upper())

        icon_box.paintEvent = paint_icon
        h_row.addWidget(icon_box)

        # Title and version
        v_meta = QVBoxLayout()
        v_meta.setSpacing(3)
        lbl_title = QLabel(f"Install {self.app_name}")
        lbl_title.setFont(QFont("Inter Display", 16, QFont.Weight.Bold))
        lbl_title.setStyleSheet("color: #1d1d1f;")
        v_meta.addWidget(lbl_title)

        lbl_sub = QLabel(f"Version {self.version} • macOS Application Bundle")
        lbl_sub.setFont(QFont("Inter", 10))
        lbl_sub.setStyleSheet("color: #86868b;")
        v_meta.addWidget(lbl_sub)

        h_row.addLayout(v_meta)
        h_row.addStretch()
        layout.addLayout(h_row)

        # Divider
        div = QFrame()
        div.setFrameShape(QFrame.Shape.HLine)
        div.setStyleSheet("background: rgba(0, 0, 0, 0.08); max-height: 1px;")
        layout.addWidget(div)

        # Instruction label
        prompt = QLabel("Where would you like to install this application?")
        prompt.setFont(QFont("Inter", 10, QFont.Weight.Medium))
        prompt.setStyleSheet("color: #333336;")
        layout.addWidget(prompt)

        # Option cards
        self.card_sys = TargetOptionCard(
            "System Applications (/Applications)",
            "Available to all users on this computer (Recommended)",
            "/Applications",
            is_selected=True
        )
        self.card_user = TargetOptionCard(
            "User Applications (~/Applications)",
            "Available only for your current user account",
            str(Path.home() / "Applications"),
            is_selected=False
        )

        self.card_sys.mousePressEvent = lambda e: self.select_target("/Applications")
        self.card_user.mousePressEvent = lambda e: self.select_target(str(Path.home() / "Applications"))

        layout.addWidget(self.card_sys)
        layout.addWidget(self.card_user)

        layout.addStretch()

        # Bottom buttons
        btn_row = QHBoxLayout()
        
        self.btn_run_once = QPushButton("Run Once")
        self.btn_run_once.setFixedSize(90, 32)
        self.btn_run_once.setStyleSheet("""
            QPushButton {
                background: #e5e5ea;
                border: none;
                border-radius: 7px;
                color: #1d1d1f;
                font-weight: 500;
            }
            QPushButton:hover {
                background: #d1d1d6;
            }
        """)
        self.btn_run_once.clicked.connect(self.run_once)
        btn_row.addWidget(self.btn_run_once)

        btn_row.addStretch()

        self.btn_cancel = QPushButton("Cancel")
        self.btn_cancel.setFixedSize(85, 32)
        self.btn_cancel.setStyleSheet("""
            QPushButton {
                background: #e5e5ea;
                border: none;
                border-radius: 7px;
                color: #1d1d1f;
                font-weight: 500;
            }
            QPushButton:hover {
                background: #d1d1d6;
            }
        """)
        self.btn_cancel.clicked.connect(self.close)
        btn_row.addWidget(self.btn_cancel)

        self.btn_install = QPushButton("Install Application")
        self.btn_install.setFixedSize(145, 32)
        self.btn_install.setStyleSheet("""
            QPushButton {
                background: #0071e3;
                border: none;
                border-radius: 7px;
                color: #ffffff;
                font-weight: 600;
            }
            QPushButton:hover {
                background: #0077ed;
            }
        """)
        self.btn_install.clicked.connect(self.do_install)
        btn_row.addWidget(self.btn_install)

        layout.addLayout(btn_row)

    def select_target(self, target_path):
        self.selected_target = target_path
        if target_path == "/Applications":
            self.card_sys.set_selected(True)
            self.card_user.set_selected(False)
        else:
            self.card_sys.set_selected(False)
            self.card_user.set_selected(True)

    def run_once(self):
        self.close()
        # Launch directly
        open_script = Path(__file__).parent / "toccata-open"
        if open_script.is_file():
            subprocess.Popen([sys.executable, str(open_script), str(self.bundle_path)])

    def do_install(self):
        target_dir = Path(self.selected_target)
        try:
            target_dir.mkdir(parents=True, exist_ok=True)
            dest_app = target_dir / self.bundle_path.name
            if dest_app.exists():
                shutil.rmtree(dest_app)
            
            # Copy bundle tree
            shutil.copytree(self.bundle_path, dest_app)

            # Register desktop shortcut
            open_script = Path(__file__).parent / "toccata-open"
            if open_script.is_file():
                subprocess.run([sys.executable, str(open_script), str(dest_app), "--register"])

            # Success message
            msg = QMessageBox(self)
            msg.setWindowTitle("Installed Successfully")
            msg.setText(f"{self.app_name} has been installed to {self.selected_target}.")
            msg.setInformativeText("The application is now available in your Dock, Spotlight, and Applications menu.")
            msg.setStandardButtons(QMessageBox.StandardButton.Open | QMessageBox.StandardButton.Ok)
            res = msg.exec()

            if res == QMessageBox.StandardButton.Open:
                subprocess.Popen([sys.executable, str(open_script), str(dest_app)])

            self.close()

        except Exception as e:
            QMessageBox.critical(self, "Installation Failed", f"Could not install {self.app_name}:\n{str(e)}")

def main():
    if len(sys.argv) < 2:
        print("Usage: toccata-installer-gui <PathToApp.app>")
        sys.exit(1)

    app = QApplication.instance() or QApplication(sys.argv)
    app.setFont(QFont("Inter Display, Inter, sans-serif", 10))

    bundle_path = Path(sys.argv[1])
    installer = AppInstallerSheet(bundle_path)
    installer.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
