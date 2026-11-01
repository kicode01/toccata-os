#!/usr/bin/env python3
"""
Toccata OS - Cutefish & macOS Sequoia Native Qt6 Wayland Desktop Shell
Part of Step 2: Native Wayland Shell with Frosted Top Bar, Floating Dock,
Control Center, Spotlight Search, and Zorin Adaptive Layouts.
Renders directly via Direct3D 12 WSLg on Windows 11.
"""

import sys
import os
import subprocess
from PyQt6.QtCore import Qt, QPoint, QSize, QTimer, QTime, pyqtSlot
from PyQt6.QtGui import (
    QColor, QFont, QPainter, QBrush, QPen, QLinearGradient, QAction, QKeySequence, QShortcut
)
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
    QLabel, QPushButton, QFrame, QMenu, QMessageBox
)

# Set Wayland / WSLg Display configuration
os.environ["QT_QPA_PLATFORM"] = "wayland;xcb"

sys.path.insert(0, os.path.dirname(__file__))
import theme
from control_center import ControlCenterSheet
from spotlight import SpotlightSearch

# Import native apps
from apps.solfege import SolfegeCalculator
from apps.cadence import CadenceFileManager
from apps.settings import SystemSettings
from apps.console import ToccataConsole
from apps.scribe import ScribeEditor
from apps.tempo import TempoActivityMonitor
from apps.gallery import GalleryAppStore


class FrostedTopBar(QWidget):
    """CutefishOS & macOS Sequoia Frosted Glass Top Menu Bar."""
    def __init__(self, desktop_manager, parent=None):
        super().__init__(parent)
        self.dm = desktop_manager
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.SubWindow)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedHeight(32)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 0, 14, 0)
        layout.setSpacing(10)

        # 1. Toccata Apple-Style Emblem Button
        self.logo_btn = QPushButton("🎼")
        self.logo_btn.setFixedSize(26, 26)
        self.logo_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                border: none;
                font-size: 16px;
                border-radius: 4px;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.15);
            }
        """)
        self.logo_btn.clicked.connect(self.show_system_menu)
        layout.addWidget(self.logo_btn)

        # 2. Active Application Title
        self.app_title = QLabel("Toccata OS")
        self.app_title.setFont(QFont("Inter", 10, QFont.Weight.Bold))
        self.app_title.setStyleSheet("color: #ffffff; padding-left: 2px;")
        layout.addWidget(self.app_title)

        # 3. Global Menu Bar Items
        for item in ["File", "Edit", "View", "Window", "Help"]:
            btn = QPushButton(item)
            btn.setStyleSheet("""
                QPushButton {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.85);
                    font-size: 12px;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                QPushButton:hover {
                    background: rgba(255, 255, 255, 0.12);
                    color: #ffffff;
                }
            """)
            layout.addWidget(btn)

        layout.addStretch()

        # 4. Spotlight Trigger Button
        self.spotlight_btn = QPushButton("🔍")
        self.spotlight_btn.setToolTip("Spotlight Search (Ctrl+Space)")
        self.spotlight_btn.setFixedSize(24, 24)
        self.spotlight_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                border: none;
                font-size: 12px;
                border-radius: 4px;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.15);
            }
        """)
        self.spotlight_btn.clicked.connect(self.dm.toggle_spotlight)
        layout.addWidget(self.spotlight_btn)

        # 5. Status Indicators: Battery, Control Center, Clock
        self.battery_label = QLabel("100% 🔋")
        self.battery_label.setStyleSheet("color: rgba(255, 255, 255, 0.8); font-size: 11px;")
        layout.addWidget(self.battery_label)

        self.cc_btn = QPushButton("🎛️")
        self.cc_btn.setToolTip("Control Center")
        self.cc_btn.setFixedSize(24, 24)
        self.cc_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                border: none;
                font-size: 13px;
                border-radius: 4px;
            }
            QPushButton:hover {
                background: rgba(255, 255, 255, 0.15);
            }
        """)
        self.cc_btn.clicked.connect(self.show_control_center)
        layout.addWidget(self.cc_btn)

        self.clock_label = QLabel()
        self.clock_label.setStyleSheet("color: #ffffff; font-weight: bold; font-size: 12px;")
        layout.addWidget(self.clock_label)

        # Clock Timer
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_clock)
        self.timer.start(1000)
        self.update_clock()

    def update_clock(self):
        self.clock_label.setText(QTime.currentTime().toString("h:mm AP"))

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        # Apple Frosted Glass Top Bar
        gradient = QLinearGradient(0, 0, 0, self.height())
        gradient.setColorAt(0, QColor(24, 24, 28, 220))
        gradient.setColorAt(1, QColor(16, 16, 20, 240))
        painter.setBrush(QBrush(gradient))
        painter.setPen(QPen(QColor(255, 255, 255, 25), 1))
        painter.drawRect(self.rect())

    def show_system_menu(self):
        menu = QMenu(self)
        menu.setStyleSheet("""
            QMenu {
                background-color: rgba(28, 28, 32, 245);
                border: 1px solid rgba(255, 255, 255, 0.18);
                border-radius: 8px;
                padding: 4px;
                color: #ffffff;
                font-size: 12px;
            }
            QMenu::item {
                padding: 6px 22px 6px 12px;
                border-radius: 4px;
            }
            QMenu::item:selected {
                background-color: #007aff;
            }
            QMenu::separator {
                height: 1px;
                background: rgba(255, 255, 255, 0.12);
                margin: 4px 6px;
            }
        """)
        about_act = menu.addAction("About Toccata OS")
        about_act.triggered.connect(lambda: self.dm.launch_app("settings"))
        menu.addSeparator()

        pref_act = menu.addAction("System Settings...")
        pref_act.triggered.connect(lambda: self.dm.launch_app("settings"))

        store_act = menu.addAction("App Store & Sideload...")
        store_act.triggered.connect(lambda: self.dm.launch_app("gallery"))

        menu.addSeparator()
        spot_act = menu.addAction("Spotlight Search...")
        spot_act.triggered.connect(self.dm.toggle_spotlight)

        menu.addSeparator()
        quit_act = menu.addAction("Shut Down / Exit to Windows")
        quit_act.triggered.connect(QApplication.instance().quit)

        menu.exec(self.logo_btn.mapToGlobal(QPoint(0, self.height() + 2)))

    def show_control_center(self):
        self.dm.toggle_control_center(self.cc_btn.mapToGlobal(QPoint(-290, self.height() + 4)))


class FrostedDock(QWidget):
    """Cutefish & macOS Sequoia Parabolic Floating Dock."""
    def __init__(self, desktop_manager, parent=None):
        super().__init__(parent)
        self.dm = desktop_manager
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.SubWindow)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedHeight(66)

        self.layout = QHBoxLayout(self)
        self.layout.setContentsMargins(14, 6, 14, 6)
        self.layout.setSpacing(10)

        # 11 First-Party Applications + Windows Sideload
        self.apps = [
            ("📁", "Cadence", "#007aff", "cadence"),
            ("⚙️", "Settings", "#8e8e93", "settings"),
            ("🔢", "Solfege", "#ff9500", "solfege"),
            ("💻", "Console", "#18181b", "console"),
            ("📝", "Scribe", "#ff9500", "scribe"),
            ("⚡", "Tempo", "#34c759", "tempo"),
            ("🛍️", "Gallery", "#5856d6", "gallery"),
            ("🪟", "Windows App", "#0284c7", "wine_notepad"),
        ]

        self.buttons = {}
        for icon, title, bg, action_id in self.apps:
            btn = QPushButton(icon)
            btn.setToolTip(f"{title}")
            btn.setFixedSize(50, 50)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background: qlineargradient(x1:0, y1:0, x2:1, y2:1, stop:0 {bg}, stop:1 rgba(0,0,0,0.5));
                    border: 1px solid rgba(255, 255, 255, 0.28);
                    border-radius: 13px;
                    font-size: 22px;
                }}
                QPushButton:hover {{
                    border: 2px solid #ffffff;
                    margin-bottom: 4px;
                }}
                QPushButton:pressed {{
                    background: {bg};
                }}
            """)
            btn.clicked.connect(lambda ch, a=action_id: self.dm.launch_app(a))
            self.buttons[action_id] = btn
            self.layout.addWidget(btn)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        # Frosted glass pill with rim glow
        gradient = QLinearGradient(0, 0, 0, self.height())
        gradient.setColorAt(0, QColor(32, 32, 38, 220))
        gradient.setColorAt(1, QColor(18, 18, 24, 245))
        painter.setBrush(QBrush(gradient))
        painter.setPen(QPen(QColor(255, 255, 255, 45), 1.2))
        painter.drawRoundedRect(self.rect().adjusted(1, 1, -1, -1), 20, 20)


class ToccataDesktopManager(QMainWindow):
    """Master Compositor Shell coordinating TopBar, Dock, and Applications."""
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Toccata Desktop Shell")
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        self.current_layout_mode = "macos"  # macos, win11, win10
        self.open_windows = {}

        screen = QApplication.primaryScreen().geometry()
        self.setGeometry(screen)

        # 1. Top Bar
        self.top_bar = FrostedTopBar(self, self)
        self.top_bar.setGeometry(0, 0, screen.width(), 32)
        self.top_bar.show()

        # 2. Bottom Dock (Centered)
        self.dock = FrostedDock(self, self)
        self.update_dock_geometry()
        self.dock.show()

        # 3. Control Center Sheet (Lazy Pop-up)
        self.control_center = ControlCenterSheet(self)

        # 4. Spotlight Search Overlay
        self.spotlight = SpotlightSearch(self)
        self.spotlight.app_launched.connect(self.launch_app)

        # 5. Global Shortcut: Ctrl+Space for Spotlight
        self.shortcut_spotlight = QShortcut(QKeySequence("Ctrl+Space"), self)
        self.shortcut_spotlight.activated.connect(self.toggle_spotlight)

    def update_dock_geometry(self):
        screen = QApplication.primaryScreen().geometry()
        dock_w = 520
        if self.current_layout_mode == "macos":
            # Floating centered bottom dock
            self.top_bar.show()
            dock_x = (screen.width() - dock_w) // 2
            dock_y = screen.height() - 78
            self.dock.setGeometry(dock_x, dock_y, dock_w, 66)
        elif self.current_layout_mode == "win11":
            # Windows 11: Top bar hidden, dock acts as centered taskbar at bottom
            self.top_bar.hide()
            dock_x = (screen.width() - dock_w) // 2
            dock_y = screen.height() - 66
            self.dock.setGeometry(dock_x, dock_y, dock_w, 66)
        elif self.current_layout_mode == "win10":
            # Windows 10: Left-aligned taskbar at very bottom
            self.top_bar.hide()
            self.dock.setGeometry(0, screen.height() - 66, screen.width(), 66)

    def set_layout_mode(self, mode):
        self.current_layout_mode = mode
        self.update_dock_geometry()

    def toggle_spotlight(self):
        if self.spotlight.isVisible():
            self.spotlight.hide()
        else:
            screen = QApplication.primaryScreen().geometry()
            x = (screen.width() - self.spotlight.width()) // 2
            y = 120
            self.spotlight.move(x, y)
            self.spotlight.show()
            self.spotlight.raise_()

    def toggle_control_center(self, pos):
        if self.control_center.isVisible():
            self.control_center.hide()
        else:
            self.control_center.move(pos)
            self.control_center.show()
            self.control_center.raise_()

    def launch_app(self, action_id):
        # Bring existing open window to front if running
        if action_id in self.open_windows and self.open_windows[action_id].isVisible():
            self.open_windows[action_id].raise_()
            self.open_windows[action_id].activateWindow()
            return

        win = None
        if action_id == "solfege":
            win = SolfegeCalculator()
        elif action_id == "cadence":
            win = CadenceFileManager()
        elif action_id == "settings":
            win = SystemSettings()
            win.layout_changed.connect(self.set_layout_mode)
        elif action_id == "console":
            win = ToccataConsole()
        elif action_id == "scribe":
            win = ScribeEditor()
        elif action_id == "tempo":
            win = TempoActivityMonitor()
        elif action_id == "gallery":
            win = GalleryAppStore()
        elif action_id == "wine_notepad":
            # Windows app runner
            runner_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "toccata-bundle", "toccata-wine-runner.py")
            subprocess.Popen([sys.executable, runner_script, "notepad.exe"])
            return
        elif action_id.startswith("cmd_"):
            # Launch Console running this specific command
            cmd = action_id.replace("cmd_", "")
            win = ToccataConsole()
            win.cmd_input.setText(cmd)
            win.run_command()

        if win:
            self.open_windows[action_id] = win
            # Center window nicely on screen
            screen = QApplication.primaryScreen().geometry()
            x = (screen.width() - win.width()) // 2 + (len(self.open_windows) * 20) % 100
            y = (screen.height() - win.height()) // 2 + (len(self.open_windows) * 20) % 100
            win.move(x, y)
            win.show()
            win.raise_()


def main():
    app = QApplication(sys.argv)
    app.setFont(QFont("Inter Display, Inter, sans-serif", 10))
    manager = ToccataDesktopManager()
    manager.show()

    # Pre-open Cadence Finder and Solfege Calculator for instant live showcase
    manager.launch_app("cadence")
    manager.launch_app("solfege")

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
