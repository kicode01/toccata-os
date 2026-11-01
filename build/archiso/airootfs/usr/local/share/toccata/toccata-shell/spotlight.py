"""
Toccata OS - Cutefish & macOS Spotlight Search Overlay
Instant keyboard-driven application and command launcher.
"""

import sys
import os
import subprocess
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QKeyEvent
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QListWidget, QListWidgetItem, QFrame
)
import theme

class SpotlightSearch(QWidget):
    """Floating Spotlight search palette."""
    app_launched = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(Qt.WindowType.Popup | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedWidth(560)

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(10, 10, 10, 10)

        card = QFrame(self)
        card.setObjectName("SpotlightCard")
        card.setStyleSheet(f"""
            QFrame#SpotlightCard {{
                background-color: rgba(26, 26, 30, 0.96);
                border: 1px solid {theme.COLOR_BORDER_LIGHT};
                border-radius: 14px;
            }}
        """)
        main_layout.addWidget(card)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(14, 14, 14, 14)
        layout.setSpacing(10)

        # 1. Search Input Bar
        search_row = QHBoxLayout()
        search_row.setSpacing(10)

        search_icon = QLabel("🔍")
        search_icon.setFont(QFont("Segoe UI Emoji", 16))
        search_icon.setStyleSheet("color: rgba(255, 255, 255, 0.6); background: transparent;")
        search_row.addWidget(search_icon)

        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Spotlight Search (apps, files, settings, shims)...")
        self.input_field.setFont(QFont("Inter", 13))
        self.input_field.setStyleSheet("""
            QLineEdit {
                background: transparent;
                border: none;
                color: #ffffff;
                padding: 4px;
            }
        """)
        self.input_field.textChanged.connect(self.filter_items)
        self.input_field.returnPressed.connect(self.activate_selected)
        search_row.addWidget(self.input_field)

        badge = QLabel("ESC to close")
        badge.setFont(QFont("Inter", 9))
        badge.setStyleSheet("color: rgba(255, 255, 255, 0.35); background: transparent;")
        search_row.addWidget(badge)
        layout.addLayout(search_row)

        # 2. Separator line
        sep = QFrame()
        sep.setFixedHeight(1)
        sep.setStyleSheet("background: rgba(255, 255, 255, 0.1);")
        layout.addWidget(sep)

        # 3. Results List
        self.results_list = QListWidget()
        self.results_list.setFont(QFont("Inter", 11))
        self.results_list.setStyleSheet(f"""
            QListWidget {{
                background: transparent;
                border: none;
                color: #ffffff;
            }}
            QListWidget::item {{
                padding: 8px 12px;
                border-radius: 8px;
            }}
            QListWidget::item:selected {{
                background-color: {theme.COLOR_ACCENT_BLUE};
                color: #ffffff;
            }}
            QListWidget::item:hover {{
                background-color: rgba(255, 255, 255, 0.08);
            }}
        """)
        self.results_list.itemDoubleClicked.connect(self.activate_item)
        layout.addWidget(self.results_list)

        # Populate Index
        self.catalog = [
            ("📁 Cadence", "Finder & File Manager with Windows C: Drive bridge", "cadence"),
            ("⚙️ System Settings", "macOS preferences & Zorin adaptive layout switcher", "settings"),
            ("🔢 Solfege Calculator", "Apple-style squircle arithmetic calculator", "solfege"),
            ("💻 Console", "Dual-personality shell with Windows command shims", "console"),
            ("📝 Scribe", "Markdown notes & code editor canvas", "scribe"),
            ("⚡ Tempo", "Activity Monitor & real-time CPU/RAM inspector", "tempo"),
            ("🧭 Horizon", "Sovereign web browser with zero telemetry", "horizon"),
            ("🎼 Sonata", "Hi-Fi PipeWire audio player & Bach synthesizer", "sonata"),
            ("💎 Prism", "Photo & vector graphic inspector with P3 color", "prism"),
            ("📅 Chronicle", "Calendar & acoustic Pomodoro focus clock", "chronicle"),
            ("🛍️ Gallery", "App store & Windows .exe containerizer (Proton/Wine)", "gallery"),
            ("🪟 Windows Notepad", "Run Windows notepad via isolated prefix container", "wine_notepad"),
            ("🌐 ipconfig", "Show network adapters using Windows shim", "cmd_ipconfig"),
            ("📂 dir", "List directory with Windows command bridge", "cmd_dir"),
        ]

        self.filter_items("")

    def showEvent(self, event):
        super().showEvent(event)
        self.input_field.clear()
        self.input_field.setFocus()
        self.filter_items("")

    def keyPressEvent(self, event: QKeyEvent):
        if event.key() == Qt.Key.Key_Escape:
            self.close()
        elif event.key() == Qt.Key.Key_Down:
            idx = self.results_list.currentRow()
            if idx < self.results_list.count() - 1:
                self.results_list.setCurrentRow(idx + 1)
        elif event.key() == Qt.Key.Key_Up:
            idx = self.results_list.currentRow()
            if idx > 0:
                self.results_list.setCurrentRow(idx - 1)
        else:
            super().keyPressEvent(event)

    def filter_items(self, text):
        self.results_list.clear()
        query = text.strip().lower()
        count = 0
        for name, desc, action_id in self.catalog:
            if not query or query in name.lower() or query in desc.lower():
                item = QListWidgetItem(f"{name}  —  {desc}")
                item.setData(Qt.ItemDataRole.UserRole, action_id)
                self.results_list.addItem(item)
                count += 1
        
        if count > 0:
            self.results_list.setCurrentRow(0)
            self.results_list.setFixedHeight(min(count * 38 + 10, 260))
        else:
            self.results_list.setFixedHeight(30)
            no_match = QListWidgetItem("No matching applications or shims found")
            no_match.setFlags(Qt.ItemFlag.NoItemFlags)
            self.results_list.addItem(no_match)

    def activate_selected(self):
        item = self.results_list.currentItem()
        if item:
            self.activate_item(item)

    def activate_item(self, item):
        action_id = item.data(Qt.ItemDataRole.UserRole)
        if action_id:
            self.app_launched.emit(action_id)
            self.close()
