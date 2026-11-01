#!/usr/bin/env python3
"""
Toccata OS - Maestro On-Device Neural Assistant HUD
Native Qt6 Floating HUD with Apple Intelligence Aura, Zero Telemetry & Action Execution.
"""

import sys
import os
from PyQt6.QtCore import Qt, QPoint, QPointF, QRectF, QSize, QTimer, pyqtSignal
from PyQt6.QtGui import (
    QFont, QColor, QPainter, QBrush, QPen, QLinearGradient, QRadialGradient,
    QPainterPath, QKeySequence, QShortcut
)
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton,
    QScrollArea, QFrame, QSizePolicy
)

# Import Maestro AI Engine
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "toccata-ai"))
from maestro_engine import MaestroEngine, MaestroResponse, MaestroAction
import theme


class MaestroOrbWidget(QWidget):
    """Animated Apple Intelligence fluid aura orb."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedSize(32, 32)
        self.angle = 0
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.rotate_aura)
        self.timer.start(50)

    def rotate_aura(self):
        self.angle = (self.angle + 4) % 360
        self.update()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        cx, cy = self.width() / 2, self.height() / 2

        p.save()
        p.translate(cx, cy)
        p.rotate(self.angle)

        # Multi-chromatic Siri / Apple Intelligence fluid gradient
        grad = QLinearGradient(-14, -14, 14, 14)
        grad.setColorAt(0.0, QColor(255, 45, 85))    # Sunset Pink
        grad.setColorAt(0.4, QColor(175, 82, 222))   # Electric Purple
        grad.setColorAt(0.8, QColor(0, 122, 255))    # Sapphire Blue
        grad.setColorAt(1.0, QColor(56, 189, 248))   # Cyan Spark

        p.setBrush(QBrush(grad))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawEllipse(QPointF(0, 0), 12.5, 12.5)

        # Specular white highlight
        p.setBrush(QBrush(QColor(255, 255, 255, 90)))
        p.drawEllipse(QPointF(-3.5, -3.5), 4.5, 4.5)
        p.restore()


class MaestroHUD(QWidget):
    """
    Floating Maestro Neural Assistant HUD.
    Receives voice/text queries, parses natural language intents, and
    emits actionable signals directly to the desktop compositor.
    """
    action_triggered = pyqtSignal(str, object)  # (action_type, parameter)

    def __init__(self, desktop_manager, parent=None):
        super().__init__(parent)
        self.dm = desktop_manager
        self.engine = MaestroEngine()

        self.setWindowFlags(Qt.WindowType.Popup | Qt.WindowType.FramelessWindowHint)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedSize(620, 480)

        self.setup_ui()

        # Keyboard shortcuts
        self.shortcut_esc = QShortcut(QKeySequence("Esc"), self)
        self.shortcut_esc.activated.connect(self.hide)

    def setup_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(10, 10, 10, 10)

        card = QFrame(self)
        card.setObjectName("MaestroCard")
        bg_col = "rgba(248, 248, 250, 0.95)" if theme.IS_LIGHT_MODE else "rgba(24, 24, 28, 0.95)"
        border_col = "rgba(0, 0, 0, 0.14)" if theme.IS_LIGHT_MODE else "rgba(255, 255, 255, 0.16)"
        card.setStyleSheet(f"""
            QFrame#MaestroCard {{
                background-color: {bg_col};
                border: 1px solid {border_col};
                border-radius: 18px;
            }}
        """)
        main_layout.addWidget(card)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(18, 16, 18, 16)
        layout.setSpacing(12)

        # 1. Header Row
        header_row = QHBoxLayout()
        header_row.setSpacing(10)

        self.orb = MaestroOrbWidget(self)
        header_row.addWidget(self.orb)

        title_box = QVBoxLayout()
        title_box.setSpacing(2)
        t_lbl = QLabel("Maestro")
        t_lbl.setFont(QFont("Inter", 14, QFont.Weight.Bold))
        text_col = "#1d1d1f" if theme.IS_LIGHT_MODE else "#ffffff"
        t_lbl.setStyleSheet(f"color: {text_col}; background: transparent;")
        title_box.addWidget(t_lbl)

        sub_lbl = QLabel("On-Device Neural Assistant • 100% Offline • Zero Telemetry")
        sub_lbl.setFont(QFont("Inter", 9))
        sub_lbl.setStyleSheet("color: #34c759; background: transparent;")
        title_box.addWidget(sub_lbl)
        header_row.addLayout(title_box)

        header_row.addStretch()

        btn_close = QPushButton("✕")
        btn_close.setFixedSize(24, 24)
        btn_close.setStyleSheet("""
            QPushButton {
                background: rgba(120, 120, 128, 0.15);
                border: none;
                border-radius: 12px;
                color: #8e8e93;
                font-size: 11px;
            }
            QPushButton:hover {
                background: rgba(255, 59, 48, 0.8);
                color: #ffffff;
            }
        """)
        btn_close.clicked.connect(self.hide)
        header_row.addWidget(btn_close)
        layout.addLayout(header_row)

        # 2. Conversation Scroll Area
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setStyleSheet("""
            QScrollArea {
                background: transparent;
                border: none;
            }
            QScrollBar:vertical {
                border: none;
                background: transparent;
                width: 6px;
                margin: 0;
            }
            QScrollBar::handle:vertical {
                background: rgba(120, 120, 128, 0.4);
                border-radius: 3px;
                min-height: 20px;
            }
        """)

        self.chat_container = QWidget()
        self.chat_container.setStyleSheet("background: transparent;")
        self.chat_layout = QVBoxLayout(self.chat_container)
        self.chat_layout.setContentsMargins(4, 4, 4, 4)
        self.chat_layout.setSpacing(12)
        self.chat_layout.addStretch()

        self.scroll_area.setWidget(self.chat_container)
        layout.addWidget(self.scroll_area, 1)

        # Initial Welcome Message
        self.append_maestro_message(
            "Hello! I am **Maestro**, your private on-device intelligence. "
            "I can adjust desktop layouts, switch wallpapers, launch applications, "
            "inspect hardware pressure, and help you navigate Toccata OS without sending a single byte of telemetry.",
            action=None
        )

        # 3. Suggestion Chips Row
        self.sugg_layout = QHBoxLayout()
        self.sugg_layout.setSpacing(6)
        self.populate_suggestions([
            "Switch to Windows 11",
            "Set Zorin Island wallpaper",
            "Turn on Dark Mode",
            "Check system resources"
        ])
        layout.addLayout(self.sugg_layout)

        # 4. Input Row
        input_frame = QFrame()
        input_frame.setStyleSheet(f"""
            QFrame {{
                background: rgba(120, 120, 128, 0.12);
                border: 1px solid {border_col};
                border-radius: 20px;
                padding: 2px 10px;
            }}
        """)
        input_layout = QHBoxLayout(input_frame)
        input_layout.setContentsMargins(6, 4, 6, 4)
        input_layout.setSpacing(8)

        orb_mini = QLabel("✨")
        orb_mini.setStyleSheet("background: transparent;")
        input_layout.addWidget(orb_mini)

        self.input_field = QLineEdit()
        self.input_field.setPlaceholderText("Ask Maestro anything or control desktop...")
        self.input_field.setFont(QFont("Inter", 11))
        self.input_field.setStyleSheet(f"""
            QLineEdit {{
                background: transparent;
                border: none;
                color: {text_col};
                padding: 4px;
            }}
        """)
        self.input_field.returnPressed.connect(self.send_message)
        input_layout.addWidget(self.input_field, 1)

        btn_send = QPushButton("↑")
        btn_send.setFixedSize(28, 28)
        btn_send.setFont(QFont("Inter", 13, QFont.Weight.Bold))
        btn_send.setStyleSheet("""
            QPushButton {
                background-color: #007aff;
                border: none;
                border-radius: 14px;
                color: #ffffff;
            }
            QPushButton:hover {
                background-color: #0062cc;
            }
        """)
        btn_send.clicked.connect(self.send_message)
        input_layout.addWidget(btn_send)

        layout.addWidget(input_frame)

    def populate_suggestions(self, suggestions):
        # Clear existing
        while self.sugg_layout.count():
            item = self.sugg_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        for s in suggestions[:4]:
            btn = QPushButton(s)
            btn.setFont(QFont("Inter", 9))
            btn.setStyleSheet("""
                QPushButton {
                    background: rgba(0, 122, 255, 0.12);
                    border: 1px solid rgba(0, 122, 255, 0.25);
                    border-radius: 12px;
                    color: #007aff;
                    padding: 4px 10px;
                }
                QPushButton:hover {
                    background: rgba(0, 122, 255, 0.22);
                    border-color: #007aff;
                }
            """)
            btn.clicked.connect(lambda ch, text=s: self.handle_suggestion_click(text))
            self.sugg_layout.addWidget(btn)

    def handle_suggestion_click(self, text):
        self.input_field.setText(text)
        self.send_message()

    def send_message(self):
        text = self.input_field.text().strip()
        if not text:
            return

        self.input_field.clear()
        self.append_user_message(text)

        # Process with on-device engine
        response = self.engine.process_query(text)
        self.append_maestro_message(response.text, response.action)

        if response.suggestions:
            self.populate_suggestions(response.suggestions)

        # Trigger automatic action if present
        if response.action:
            self.action_triggered.emit(response.action.action_type, response.action.parameter)

    def append_user_message(self, text):
        row = QHBoxLayout()
        row.addStretch()

        bubble = QLabel(text)
        bubble.setFont(QFont("Inter", 10))
        bubble.setWordWrap(True)
        bubble.setMaximumWidth(420)
        bubble.setStyleSheet("""
            QLabel {
                background-color: #007aff;
                color: #ffffff;
                border-radius: 14px;
                padding: 8px 14px;
            }
        """)
        row.addWidget(bubble)
        self.chat_layout.insertLayout(self.chat_layout.count() - 1, row)
        self.scroll_to_bottom()

    def append_maestro_message(self, text, action=None):
        container = QVBoxLayout()
        container.setSpacing(6)

        bubble = QLabel()
        bubble.setFont(QFont("Inter", 10))
        bubble.setWordWrap(True)
        bubble.setMaximumWidth(480)
        bubble.setTextFormat(Qt.TextFormat.MarkdownText)
        bubble.setText(text)

        text_col = "#1d1d1f" if theme.IS_LIGHT_MODE else "#e5e5ea"
        bg_bubble = "rgba(0, 0, 0, 0.05)" if theme.IS_LIGHT_MODE else "rgba(255, 255, 255, 0.08)"
        border_bubble = "rgba(0, 0, 0, 0.08)" if theme.IS_LIGHT_MODE else "rgba(255, 255, 255, 0.10)"

        bubble.setStyleSheet(f"""
            QLabel {{
                background-color: {bg_bubble};
                border: 1px solid {border_bubble};
                color: {text_col};
                border-radius: 14px;
                padding: 10px 14px;
            }}
        """)
        container.addWidget(bubble)

        # Action execution chip if action attached
        if action:
            action_btn = QPushButton(f"⚡ Action Executed: {action.description}")
            action_btn.setFont(QFont("Inter", 9, QFont.Weight.Medium))
            action_btn.setStyleSheet("""
                QPushButton {
                    background: rgba(52, 199, 89, 0.15);
                    border: 1px solid rgba(52, 199, 89, 0.35);
                    border-radius: 8px;
                    color: #34c759;
                    padding: 5px 12px;
                    text-align: left;
                }
                QPushButton:hover {
                    background: rgba(52, 199, 89, 0.25);
                }
            """)
            action_btn.clicked.connect(lambda ch, a=action: self.action_triggered.emit(a.action_type, a.parameter))
            container.addWidget(action_btn)

        row = QHBoxLayout()
        row.addLayout(container)
        row.addStretch()
        self.chat_layout.insertLayout(self.chat_layout.count() - 1, row)
        self.scroll_to_bottom()

    def scroll_to_bottom(self):
        QTimer.singleShot(50, lambda: self.scroll_area.verticalScrollBar().setValue(
            self.scroll_area.verticalScrollBar().maximum()
        ))
