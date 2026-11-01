"""
Toccata OS - Frosted Glass Base Window Frame
Provides frameless window with macOS Sequoia / Cutefish inset traffic lights and smooth window dragging.
"""

from PyQt6.QtCore import Qt, QPoint
from PyQt6.QtGui import QFont, QColor, QPainter, QBrush, QPen
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QFrame
)
import theme

class ToccataWindow(QWidget):
    """Base class for all Toccata first-party Qt6 applications."""
    def __init__(self, title="Toccata App", width=720, height=520, parent=None):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.resize(width, height)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.Window)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)

        self._drag_pos = None

        # Root container
        self.root_layout = QVBoxLayout(self)
        self.root_layout.setContentsMargins(10, 10, 10, 10)

        self.container = QFrame(self)
        self.container.setObjectName("WindowRoot")
        self.container.setStyleSheet(theme.WINDOW_BASE_STYLE)
        self.root_layout.addWidget(self.container)

        self.container_layout = QVBoxLayout(self.container)
        self.container_layout.setContentsMargins(0, 0, 0, 0)
        self.container_layout.setSpacing(0)

        # 1. Custom Title Bar
        self.title_bar = QWidget(self.container)
        self.title_bar.setFixedHeight(38)
        self.title_bar.setStyleSheet("""
            QWidget {
                background: transparent;
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }
        """)
        tb_layout = QHBoxLayout(self.title_bar)
        tb_layout.setContentsMargins(14, 0, 14, 0)
        tb_layout.setSpacing(8)

        # Traffic lights
        self.btn_close = QPushButton(self.title_bar)
        self.btn_close.setObjectName("btn_close")
        self.btn_close.setToolTip("Close")
        self.btn_close.clicked.connect(self.close)

        self.btn_min = QPushButton(self.title_bar)
        self.btn_min.setObjectName("btn_min")
        self.btn_min.setToolTip("Minimize")
        self.btn_min.clicked.connect(self.showMinimized)

        self.btn_max = QPushButton(self.title_bar)
        self.btn_max.setObjectName("btn_max")
        self.btn_max.setToolTip("Zoom / Maximize")
        self.btn_max.clicked.connect(self.toggle_maximize)

        tb_layout.addWidget(self.btn_close)
        tb_layout.addWidget(self.btn_min)
        tb_layout.addWidget(self.btn_max)
        self.title_bar.setStyleSheet(self.title_bar.styleSheet() + theme.TRAFFIC_LIGHTS_STYLE)

        tb_layout.addSpacing(12)

        # Window Title
        self.lbl_title = QLabel(title, self.title_bar)
        self.lbl_title.setFont(QFont("Inter", 11, QFont.Weight.Medium))
        self.lbl_title.setStyleSheet("color: rgba(255, 255, 255, 0.85); background: transparent;")
        self.lbl_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        tb_layout.addWidget(self.lbl_title)

        # Spacer on right to balance traffic lights
        tb_layout.addSpacing(60)

        self.container_layout.addWidget(self.title_bar)

        # 2. Body container for app content
        self.body = QWidget(self.container)
        self.body.setStyleSheet("background: transparent;")
        self.body_layout = QVBoxLayout(self.body)
        self.body_layout.setContentsMargins(16, 16, 16, 16)
        self.container_layout.addWidget(self.body)

    def toggle_maximize(self):
        if self.isMaximized():
            self.showNormal()
        else:
            self.showMaximized()

    # Window Dragging
    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton and event.position().y() <= 48:
            self._drag_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if self._drag_pos is not None and event.buttons() == Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag_pos)
            event.accept()

    def mouseReleaseEvent(self, event):
        self._drag_pos = None
