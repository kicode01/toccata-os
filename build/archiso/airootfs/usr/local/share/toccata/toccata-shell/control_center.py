"""
Toccata OS - Cutefish & macOS Sequoia Control Center
Interactive quick toggles, sliders, and media status in a frosted glass flyout.
"""

from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QPainter, QBrush, QPen, QLinearGradient
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QSlider, QFrame
)
import theme

class TogglePill(QPushButton):
    """Pill toggle button for Wi-Fi, Bluetooth, etc."""
    def __init__(self, icon, label, sublabel="On", is_active=True, parent=None):
        super().__init__(parent)
        self.is_active = is_active
        self.setFixedHeight(54)
        self.setCheckable(True)
        self.setChecked(is_active)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 6, 12, 6)
        layout.setSpacing(10)

        self.icon_lbl = QLabel(icon)
        self.icon_lbl.setFont(QFont("Segoe UI Emoji", 16))
        layout.addWidget(self.icon_lbl)

        text_layout = QVBoxLayout()
        text_layout.setSpacing(2)
        text_layout.setAlignment(Qt.AlignmentFlag.AlignVCenter)

        self.title_lbl = QLabel(label)
        self.title_lbl.setFont(QFont("Inter", 10, QFont.Weight.Bold))
        text_layout.addWidget(self.title_lbl)

        self.sub_lbl = QLabel(sublabel)
        self.sub_lbl.setFont(QFont("Inter", 9))
        text_layout.addWidget(self.sub_lbl)

        layout.addLayout(text_layout)
        layout.addStretch()

        self.update_style()
        self.clicked.connect(self.toggle_state)

    def toggle_state(self):
        self.is_active = not self.is_active
        self.update_style()

    def update_style(self):
        if self.is_active:
            self.setStyleSheet(f"""
                QPushButton {{
                    background-color: {theme.COLOR_ACCENT_BLUE};
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                }}
            """)
            self.title_lbl.setStyleSheet("color: #ffffff; background: transparent;")
            self.sub_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.85); background: transparent;")
        else:
            self.setStyleSheet("""
                QPushButton {{
                    background-color: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                }}
                QPushButton:hover {{
                    background-color: rgba(255, 255, 255, 0.14);
                }}
            """)
            self.title_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.9); background: transparent;")
            self.sub_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.5); background: transparent;")


class MiniToggle(QPushButton):
    """Square icon toggle (Dark Mode, Night Shift, DND, AirDrop)."""
    def __init__(self, icon, label, is_active=False, parent=None):
        super().__init__(parent)
        self.is_active = is_active
        self.setFixedHeight(54)
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(6, 6, 6, 6)
        layout.setSpacing(2)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self.icon_lbl = QLabel(icon)
        self.icon_lbl.setFont(QFont("Segoe UI Emoji", 14))
        self.icon_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.icon_lbl)

        self.title_lbl = QLabel(label)
        self.title_lbl.setFont(QFont("Inter", 8, QFont.Weight.Medium))
        self.title_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.title_lbl)

        self.update_style()
        self.clicked.connect(self.toggle_state)

    def toggle_state(self):
        self.is_active = not self.is_active
        self.update_style()

    def update_style(self):
        if self.is_active:
            self.setStyleSheet(f"""
                QPushButton {{
                    background-color: {theme.COLOR_ACCENT_BLUE};
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                }}
            """)
            self.title_lbl.setStyleSheet("color: #ffffff; background: transparent;")
        else:
            self.setStyleSheet("""
                QPushButton {{
                    background-color: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                }}
                QPushButton:hover {{
                    background-color: rgba(255, 255, 255, 0.14);
                }}
            """)
            self.title_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.8); background: transparent;")


class ControlCenterSheet(QWidget):
    """Cutefish / macOS Sequoia Glass Control Center Panel."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowFlags(Qt.WindowType.Popup | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedWidth(330)

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(8, 8, 8, 8)

        card = QFrame(self)
        card.setObjectName("ControlCenterCard")
        card.setStyleSheet(f"""
            QFrame#ControlCenterCard {{
                background-color: rgba(28, 28, 32, 0.96);
                border: 1px solid {theme.COLOR_BORDER_LIGHT};
                border-radius: 16px;
            }}
        """)
        main_layout.addWidget(card)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(14, 14, 14, 14)
        layout.setSpacing(12)

        # 1. Connectivity Grid (Wi-Fi, Bluetooth)
        grid_conn = QHBoxLayout()
        grid_conn.setSpacing(8)
        self.wifi_btn = TogglePill("📶", "Wi-Fi", "Toccata-Mesh (6 GHz)", True)
        self.bt_btn = TogglePill("🌐", "Bluetooth", "AirPods Pro", True)
        grid_conn.addWidget(self.wifi_btn)
        grid_conn.addWidget(self.bt_btn)
        layout.addLayout(grid_conn)

        # 2. Four Mini Toggles
        mini_layout = QHBoxLayout()
        mini_layout.setSpacing(8)
        self.dark_mode_btn = MiniToggle("🌙", "Dark Mode", True)
        self.night_btn = MiniToggle("🌆", "Night Shift", False)
        self.dnd_btn = MiniToggle("🔕", "Focus", False)
        self.airdrop_btn = MiniToggle("📡", "AirDrop", True)
        mini_layout.addWidget(self.dark_mode_btn)
        mini_layout.addWidget(self.night_btn)
        mini_layout.addWidget(self.dnd_btn)
        mini_layout.addWidget(self.airdrop_btn)
        layout.addLayout(mini_layout)

        # 3. Display Brightness Slider Card
        disp_card = QFrame()
        disp_card.setStyleSheet("background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 6px;")
        disp_layout = QVBoxLayout(disp_card)
        disp_layout.setContentsMargins(8, 6, 8, 6)
        disp_layout.setSpacing(4)
        
        disp_label = QLabel("🔆 Display Brightness")
        disp_label.setFont(QFont("Inter", 9, QFont.Weight.Medium))
        disp_label.setStyleSheet("color: rgba(255, 255, 255, 0.7); background: transparent;")
        disp_layout.addWidget(disp_label)

        self.disp_slider = QSlider(Qt.Orientation.Horizontal)
        self.disp_slider.setRange(10, 100)
        self.disp_slider.setValue(85)
        self.disp_slider.setStyleSheet(self._slider_style())
        disp_layout.addWidget(self.disp_slider)
        layout.addWidget(disp_card)

        # 4. Sound Volume Slider Card
        vol_card = QFrame()
        vol_card.setStyleSheet("background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 6px;")
        vol_layout = QVBoxLayout(vol_card)
        vol_layout.setContentsMargins(8, 6, 8, 6)
        vol_layout.setSpacing(4)

        vol_label = QLabel("🔊 Sound Volume (PipeWire 96kHz)")
        vol_label.setFont(QFont("Inter", 9, QFont.Weight.Medium))
        vol_label.setStyleSheet("color: rgba(255, 255, 255, 0.7); background: transparent;")
        vol_layout.addWidget(vol_label)

        self.vol_slider = QSlider(Qt.Orientation.Horizontal)
        self.vol_slider.setRange(0, 100)
        self.vol_slider.setValue(72)
        self.vol_slider.setStyleSheet(self._slider_style())
        vol_layout.addWidget(self.vol_slider)
        layout.addWidget(vol_card)

        # 5. Now Playing Mini Card
        media_card = QFrame()
        media_card.setStyleSheet("background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 8px;")
        media_layout = QHBoxLayout(media_card)
        media_layout.setContentsMargins(8, 6, 8, 6)
        media_layout.setSpacing(10)

        art_lbl = QLabel("🎼")
        art_lbl.setFont(QFont("Segoe UI Emoji", 20))
        media_layout.addWidget(art_lbl)

        track_layout = QVBoxLayout()
        track_layout.setSpacing(2)
        track_title = QLabel("Toccata and Fugue in D minor")
        track_title.setFont(QFont("Inter", 10, QFont.Weight.Bold))
        track_title.setStyleSheet("color: #ffffff; background: transparent;")
        track_sub = QLabel("J.S. Bach • Sonata Hi-Fi Engine")
        track_sub.setFont(QFont("Inter", 9))
        track_sub.setStyleSheet("color: rgba(255, 255, 255, 0.6); background: transparent;")
        track_layout.addWidget(track_title)
        track_layout.addWidget(track_sub)
        media_layout.addLayout(track_layout)
        media_layout.addStretch()

        play_btn = QPushButton("▶")
        play_btn.setFixedSize(32, 32)
        play_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: {theme.COLOR_ACCENT_BLUE};
                color: #ffffff;
                border-radius: 16px;
                font-size: 13px;
                border: none;
            }}
        """)
        media_layout.addWidget(play_btn)
        layout.addWidget(media_card)

    def _slider_style(self):
        return f"""
            QSlider::groove:horizontal {{
                background: rgba(255, 255, 255, 0.15);
                height: 12px;
                border-radius: 6px;
            }}
            QSlider::sub-page:horizontal {{
                background: {theme.COLOR_ACCENT_BLUE};
                border-radius: 6px;
            }}
            QSlider::handle:horizontal {{
                background: #ffffff;
                width: 18px;
                margin-top: -3px;
                margin-bottom: -3px;
                border-radius: 9px;
            }}
        """
