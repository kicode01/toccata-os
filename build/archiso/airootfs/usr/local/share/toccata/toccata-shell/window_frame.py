"""
Toccata OS - Frosted Glass Base Window Frame
Provides frameless window with authentic macOS Sequoia inset traffic lights,
hover micro-glyphs (✕, −, ⤢), and smooth frameless window dragging.
"""

from PyQt6.QtCore import Qt, QPoint, QPointF, QRectF
from PyQt6.QtGui import QFont, QColor, QPainter, QBrush, QPen
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QFrame
)
import theme

class TrafficLightButton(QPushButton):
    """Authentic Apple macOS Sequoia Inset Traffic Light with Micro-Glyphs on Hover."""
    def __init__(self, kind="close", tooltip="Close", parent=None):
        super().__init__(parent)
        self.kind = kind
        self.setToolTip(tooltip)
        self.setFixedSize(12, 12)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.is_hovered = False

    def enterEvent(self, event):
        self.is_hovered = True
        self.update()

    def leaveEvent(self, event):
        self.is_hovered = False
        self.update()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()

        if self.kind == "close":
            bg = QColor(255, 95, 87)
            border = QColor(224, 68, 62)
            glyph_color = QColor(74, 0, 2)
        elif self.kind == "min":
            bg = QColor(254, 188, 46)
            border = QColor(216, 158, 36)
            glyph_color = QColor(85, 51, 0)
        else: # max/zoom
            bg = QColor(40, 200, 64)
            border = QColor(26, 171, 41)
            glyph_color = QColor(0, 60, 10)

        # Base colored circle
        p.setBrush(QBrush(bg))
        p.setPen(QPen(border, 0.75))
        p.drawEllipse(QRectF(0.5, 0.5, w - 1, h - 1))

        # Micro-glyphs reveal on hover
        if self.is_hovered:
            p.setPen(QPen(glyph_color, 1.2, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            if self.kind == "close":
                p.drawLine(QPointF(3.5, 3.5), QPointF(8.5, 8.5))
                p.drawLine(QPointF(8.5, 3.5), QPointF(3.5, 8.5))
            elif self.kind == "min":
                p.drawLine(QPointF(3.0, 6.0), QPointF(9.0, 6.0))
            else: # zoom (opposing arrows)
                p.drawLine(QPointF(3.5, 8.5), QPointF(8.5, 3.5))
                p.drawLine(QPointF(8.5, 3.5), QPointF(6.0, 3.5))
                p.drawLine(QPointF(8.5, 3.5), QPointF(8.5, 6.0))
                p.drawLine(QPointF(3.5, 8.5), QPointF(6.0, 8.5))
                p.drawLine(QPointF(3.5, 8.5), QPointF(3.5, 6.0))

class ToccataWindow(QWidget):
    """Base class for all Toccata first-party Qt6 applications."""
    def __init__(self, title="Toccata App", width=740, height=520, parent=None):
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

        # Authentic Inset Traffic lights
        self.btn_close = TrafficLightButton("close", "Close", self.title_bar)
        self.btn_close.clicked.connect(self.close)

        self.btn_min = TrafficLightButton("min", "Minimize", self.title_bar)
        self.btn_min.clicked.connect(self.showMinimized)

        self.btn_max = TrafficLightButton("max", "Zoom / Fullscreen", self.title_bar)
        self.btn_max.clicked.connect(self.toggle_maximize)

        tb_layout.addWidget(self.btn_close)
        tb_layout.addWidget(self.btn_min)
        tb_layout.addWidget(self.btn_max)

        tb_layout.addSpacing(12)

        # Window Title (13pt SemiBold)
        self.lbl_title = QLabel(title, self.title_bar)
        self.lbl_title.setFont(QFont("Inter", 11, QFont.Weight.DemiBold))
        self.lbl_title.setStyleSheet("color: rgba(255, 255, 255, 0.9); background: transparent;")
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
        if event.button() == Qt.MouseButton.LeftButton and event.position().y() <= 44:
            self._drag_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            event.accept()

    def mouseMoveEvent(self, event):
        if self._drag_pos is not None and event.buttons() == Qt.MouseButton.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag_pos)
            event.accept()

    def mouseReleaseEvent(self, event):
        self._drag_pos = None
