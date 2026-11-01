#!/usr/bin/env python3
"""
Toccata OS - Cutefish & macOS Sequoia Native Qt6 Wayland Desktop Shell
Engineered to strict Apple Human Interface Guidelines (HIG) and Apple Design Resources:
Authentic continuous squircles, 12px window geometry, vector iconography, zero emojis,
and frosted glass vibrancy rendering via Direct3D 12 WSLg on Windows 11.
"""

import sys
import os
import subprocess
from datetime import datetime
from PyQt6.QtCore import Qt, QPoint, QPointF, QRectF, QSize, QTimer, QTime, QDateTime, pyqtSlot
from PyQt6.QtGui import (
    QColor, QFont, QPainter, QBrush, QPen, QLinearGradient, QRadialGradient,
    QPainterPath, QAction, QKeySequence, QShortcut, QPixmap
)
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
    QLabel, QPushButton, QFrame, QMenu, QMessageBox
)

# Set Wayland / WSLg Display configuration
if "XDG_RUNTIME_DIR" not in os.environ and os.path.exists("/mnt/wslg/runtime-dir"):
    os.environ["XDG_RUNTIME_DIR"] = "/mnt/wslg/runtime-dir"
if "WAYLAND_DISPLAY" not in os.environ and os.path.exists("/mnt/wslg/runtime-dir/wayland-0"):
    os.environ["WAYLAND_DISPLAY"] = "wayland-0"
if "DISPLAY" not in os.environ:
    os.environ["DISPLAY"] = ":0"
if "PULSE_SERVER" not in os.environ and os.path.exists("/mnt/wslg/PulseServer"):
    os.environ["PULSE_SERVER"] = "/mnt/wslg/PulseServer"

os.environ["QT_QPA_PLATFORM"] = "wayland;xcb"

sys.path.insert(0, os.path.dirname(__file__))
import theme
from control_center import ControlCenterSheet
from spotlight import SpotlightSearch
from maestro_hud import MaestroHUD

# Import native apps
from apps.solfege import SolfegeCalculator
from apps.cadence import CadenceFileManager
from apps.settings import SystemSettings
from apps.console import ToccataConsole
from apps.scribe import ScribeEditor
from apps.tempo import TempoActivityMonitor
from apps.gallery import GalleryAppStore


class AppleMenuLogoButton(QWidget):
    """Authentic Apple monochrome vector glyph for the top menu bar."""
    def __init__(self, on_click_callback, parent=None):
        super().__init__(parent)
        self.on_click_callback = on_click_callback
        self.setFixedSize(28, 26)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.is_hovered = False

    def enterEvent(self, event):
        self.is_hovered = True
        self.update()

    def leaveEvent(self, event):
        self.is_hovered = False
        self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.on_click_callback()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()

        if self.is_hovered:
            p.setBrush(QBrush(QColor(255, 255, 255, 30)))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawRoundedRect(QRectF(1, 1, w - 2, h - 2), 5, 5)

        # Draw Apple Logo Path
        logo_color = QColor(29, 29, 31, 230) if theme.IS_LIGHT_MODE else QColor(255, 255, 255, 230)
        p.setBrush(QBrush(logo_color))
        p.setPen(Qt.PenStyle.NoPen)
        cx, cy = w / 2, h / 2

        # Silhouette Apple Body
        path = QPainterPath()
        path.moveTo(cx, cy - 6)
        path.cubicTo(cx + 4, cy - 7, cx + 7, cy - 4, cx + 7, cy)
        path.cubicTo(cx + 7, cy + 5, cx + 4, cy + 8, cx, cy + 8)
        path.cubicTo(cx - 4, cy + 8, cx - 7, cy + 5, cx - 7, cy)
        path.cubicTo(cx - 7, cy - 4, cx - 4, cy - 7, cx, cy - 6)
        p.drawPath(path)

        # Leaf
        leaf = QPainterPath()
        leaf.moveTo(cx + 1, cy - 7)
        leaf.quadTo(cx + 4, cy - 10, cx + 5, cy - 8)
        leaf.quadTo(cx + 2, cy - 6, cx + 1, cy - 7)
        p.drawPath(leaf)


class TopBarStatusVector(QWidget):
    """Vector icon renderer for Menubar Status Items (Battery, Wi-Fi, Spotlight, Control Center)."""
    def __init__(self, icon_type="spotlight", on_click=None, tooltip="", parent=None):
        super().__init__(parent)
        self.icon_type = icon_type
        self.on_click = on_click
        self.setToolTip(tooltip)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.is_hovered = False

        if icon_type == "battery":
            self.setFixedSize(62, 24)
        elif icon_type == "maestro":
            self.setFixedSize(80, 22)
        else:
            self.setFixedSize(26, 24)

    def enterEvent(self, event):
        self.is_hovered = True
        self.update()

    def leaveEvent(self, event):
        self.is_hovered = False
        self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton and self.on_click:
            self.on_click()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()
        stroke_color = QColor(29, 29, 31, 230) if theme.IS_LIGHT_MODE else QColor(255, 255, 255, 220)
        dim_color = QColor(0, 0, 0, 40) if theme.IS_LIGHT_MODE else QColor(255, 255, 255, 25)

        if self.is_hovered and self.on_click:
            p.setBrush(QBrush(dim_color))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawRoundedRect(QRectF(1, 1, w - 2, h - 2), 4, 4)

        if self.icon_type == "battery":
            # "100%" text + horizontal battery pill
            p.setFont(QFont("Inter", 9))
            p.setPen(stroke_color)
            p.drawText(QRectF(2, 4, 30, 16), Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignRight, "100%")

            # Battery outline
            bx, by, bw, bh = 36, 6, 20, 11
            p.setPen(QPen(stroke_color, 1.2))
            p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawRoundedRect(QRectF(bx, by, bw, bh), 2.5, 2.5)

            # Battery tip
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(QBrush(stroke_color))
            p.drawRoundedRect(QRectF(bx + bw + 1, by + 3, 1.5, 5), 0.5, 0.5)

            # Battery Green Charge Fill
            p.setBrush(QBrush(QColor(52, 199, 89)))
            p.drawRoundedRect(QRectF(bx + 2, by + 2, bw - 4, bh - 4), 1.5, 1.5)

        elif self.icon_type == "wifi":
            cx, cy = w / 2, h / 2 + 3
            p.setPen(QPen(stroke_color, 1.4, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            p.drawArc(QRectF(cx - 7, cy - 8, 14, 14), 45 * 16, 90 * 16)
            p.drawArc(QRectF(cx - 4.5, cy - 5, 9, 9), 45 * 16, 90 * 16)
            p.setBrush(QBrush(stroke_color))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawEllipse(QPointF(cx, cy + 1), 1.4, 1.4)

        elif self.icon_type == "spotlight":
            cx, cy = w / 2 - 1, h / 2 - 1
            p.setPen(QPen(stroke_color, 1.5, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawEllipse(QPointF(cx, cy), 4.5, 4.5)
            p.drawLine(QPointF(cx + 3.2, cy + 3.2), QPointF(cx + 7.5, cy + 7.5))

        elif self.icon_type == "control_center":
            # Two horizontal capsule sliders
            p.setPen(QPen(stroke_color, 1.2))
            p.setBrush(Qt.BrushStyle.NoBrush)
            # Top slider
            p.drawRoundedRect(QRectF(4, 5, 18, 6), 3, 3)
            p.setBrush(QBrush(stroke_color))
            p.drawEllipse(QRectF(7, 6, 4, 4))
            # Bottom slider
            p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawRoundedRect(QRectF(4, 13, 18, 6), 3, 3)
            p.setBrush(QBrush(stroke_color))
            p.drawEllipse(QRectF(15, 14, 4, 4))

        elif self.icon_type == "maestro":
            # Apple Intelligence glowing pill badge
            pill_rect = QRectF(1, 1, w - 2, h - 2)
            p.setPen(QPen(QColor(0, 122, 255, 80), 1.0))
            p.setBrush(QBrush(QColor(0, 122, 255, 24)))
            p.drawRoundedRect(pill_rect, 10, 10)

            # Glowing Apple Intelligence Orb
            grad = QLinearGradient(6, 6, 18, 18)
            grad.setColorAt(0.0, QColor(255, 45, 85))
            grad.setColorAt(0.5, QColor(175, 82, 222))
            grad.setColorAt(1.0, QColor(0, 122, 255))
            p.setBrush(QBrush(grad))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawEllipse(QPointF(13, h / 2), 5.0, 5.0)

            # "Maestro" typography
            p.setFont(QFont("Inter", 9, QFont.Weight.SemiBold))
            p.setPen(stroke_color)
            p.drawText(QRectF(22, 0, w - 24, h), Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignLeft, "Maestro")


class AppleDockIcon(QWidget):
    """Authentic Apple macOS continuous squircle dock icon (Zero Emojis)."""
    def __init__(self, icon_id, title, on_click, parent=None):
        super().__init__(parent)
        self.icon_id = icon_id
        self.title = title
        self.on_click = on_click
        self.setFixedSize(54, 58)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setToolTip(title)
        self.is_hovered = False
        self.is_running = True

    def enterEvent(self, event):
        self.is_hovered = True
        self.update()

    def leaveEvent(self, event):
        self.is_hovered = False
        self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.on_click()

    def paintEvent(self, event):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)
        w = 48
        h = 48
        x = 3
        y = 0 if self.is_hovered else 4  # 4px lift on hover

        # Base Squircle geometry (approx 22% continuous curvature)
        squircle_rect = QRectF(x, y, w, h)
        radius = 11.0

        if self.icon_id == "finder":
            # Dual-tone smiling face
            # Left Sky Blue
            grad_l = QLinearGradient(x, y, x, y + h)
            grad_l.setColorAt(0, QColor(79, 195, 247))
            grad_l.setColorAt(1, QColor(2, 136, 209))
            p.setBrush(QBrush(grad_l))
            p.setPen(QPen(QColor(255, 255, 255, 50), 1.0))
            p.drawRoundedRect(squircle_rect, radius, radius)

            # Right Royal Blue split
            p.setClipRect(QRectF(x + w / 2, y, w / 2, h))
            grad_r = QLinearGradient(x, y, x, y + h)
            grad_r.setColorAt(0, QColor(30, 136, 229))
            grad_r.setColorAt(1, QColor(13, 71, 161))
            p.setBrush(QBrush(grad_r))
            p.drawRoundedRect(squircle_rect, radius, radius)
            p.setClipping(False)

            # Face lines (center dividing nose + smile)
            p.setPen(QPen(QColor(29, 29, 31), 2.2, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            cx = x + w / 2
            p.drawLine(QPointF(cx, y + 2), QPointF(cx, y + h * 0.52))
            p.drawLine(QPointF(cx, y + h * 0.52), QPointF(cx - 6, y + h * 0.58))

            # Smiling Eyes
            p.setBrush(QBrush(QColor(29, 29, 31)))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawEllipse(QPointF(x + 15, y + 19), 2.5, 2.5)
            p.drawEllipse(QPointF(x + 33, y + 19), 2.5, 2.5)

            # Curved Smiling Mouth
            p.setPen(QPen(QColor(29, 29, 31), 2.4, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawArc(QRectF(x + 12, y + 24, 24, 14), 210 * 16, 120 * 16)

        elif self.icon_id == "settings":
            # Metallic Gear Wheel
            p.setBrush(QBrush(QColor(99, 99, 102)))
            p.setPen(QPen(QColor(255, 255, 255, 40), 1.0))
            p.drawRoundedRect(squircle_rect, radius, radius)

            # Multi-tooth gear spokes
            cx, cy = x + w / 2, y + h / 2
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(QBrush(QColor(220, 220, 225)))
            for angle in [0, 30, 60, 90, 120, 150]:
                p.save()
                p.translate(cx, cy)
                p.rotate(angle)
                p.drawRoundedRect(QRectF(-4, -19, 8, 38), 1.5, 1.5)
                p.restore()

            # Center concentric circles
            p.setBrush(QBrush(QColor(200, 200, 205)))
            p.drawEllipse(QPointF(cx, cy), 13, 13)
            p.setBrush(QBrush(QColor(58, 58, 60)))
            p.drawEllipse(QPointF(cx, cy), 8, 8)
            p.setBrush(QBrush(QColor(28, 28, 30)))
            p.drawEllipse(QPointF(cx, cy), 4, 4)

        elif self.icon_id == "calc":
            # Dark charcoal calculator with orange operation buttons
            grad = QLinearGradient(x, y, x, y + h)
            grad.setColorAt(0, QColor(58, 58, 60))
            grad.setColorAt(1, QColor(28, 28, 30))
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(255, 255, 255, 40), 1.0))
            p.drawRoundedRect(squircle_rect, radius, radius)

            # Circular operation keys
            p.setPen(Qt.PenStyle.NoPen)
            # Top row
            p.setBrush(QBrush(QColor(90, 90, 95)))
            p.drawEllipse(QPointF(x + 13, y + 14), 4.5, 4.5)
            p.drawEllipse(QPointF(x + 24, y + 14), 4.5, 4.5)
            p.setBrush(QBrush(QColor(255, 159, 10)))
            p.drawEllipse(QPointF(x + 35, y + 14), 4.5, 4.5)

            # Middle row
            p.setBrush(QBrush(QColor(110, 110, 115)))
            p.drawEllipse(QPointF(x + 13, y + 25), 4.5, 4.5)
            p.drawEllipse(QPointF(x + 24, y + 25), 4.5, 4.5)
            p.setBrush(QBrush(QColor(255, 159, 10)))
            p.drawEllipse(QPointF(x + 35, y + 25), 4.5, 4.5)

            # Bottom row
            p.setBrush(QBrush(QColor(110, 110, 115)))
            p.drawEllipse(QPointF(x + 13, y + 36), 4.5, 4.5)
            p.drawEllipse(QPointF(x + 24, y + 36), 4.5, 4.5)
            p.setBrush(QBrush(QColor(255, 159, 10)))
            p.drawEllipse(QPointF(x + 35, y + 36), 4.5, 4.5)

        elif self.icon_id == "terminal":
            # Space gray / obsidian squircle with prompt >_
            grad = QLinearGradient(x, y, x, y + h)
            grad.setColorAt(0, QColor(44, 44, 46))
            grad.setColorAt(1, QColor(18, 18, 20))
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(255, 255, 255, 40), 1.0))
            p.drawRoundedRect(squircle_rect, radius, radius)

            # Top header bar
            p.setBrush(QBrush(QColor(58, 58, 60)))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawRoundedRect(QRectF(x, y, w, 11), radius, radius)
            p.drawRect(QRectF(x, y + 6, w, 5))

            # Traffic light micro-dots
            p.setBrush(QBrush(QColor(255, 95, 86)))
            p.drawEllipse(QPointF(x + 7, y + 5.5), 1.5, 1.5)
            p.setBrush(QBrush(QColor(255, 189, 46)))
            p.drawEllipse(QPointF(x + 12, y + 5.5), 1.5, 1.5)
            p.setBrush(QBrush(QColor(39, 201, 63)))
            p.drawEllipse(QPointF(x + 17, y + 5.5), 1.5, 1.5)

            # Prompt >_ in phosphor green
            p.setFont(QFont("SF Mono, Menlo, monospace", 11, QFont.Weight.Bold))
            p.setPen(QColor(52, 199, 89))
            p.drawText(QPointF(x + 9, y + 27), ">_")
            # Cursor block
            p.fillRect(QRectF(x + 29, y + 17, 4.5, 10), QColor(255, 255, 255, 200))

        elif self.icon_id == "notes":
            # Lined legal document pad with stitched header and pencil
            grad = QLinearGradient(x, y, x, y + h)
            grad.setColorAt(0, QColor(255, 249, 196))
            grad.setColorAt(1, QColor(255, 241, 118))
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(255, 255, 255, 40), 1.0))
            p.drawRoundedRect(squircle_rect, radius, radius)

            # Stitched brown leather top band
            p.setBrush(QBrush(QColor(212, 163, 115)))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawRoundedRect(QRectF(x, y, w, 11), radius, radius)
            p.drawRect(QRectF(x, y + 6, w, 5))

            # Notebook blue ruled lines
            p.setPen(QPen(QColor(144, 202, 249), 1.2))
            p.drawLine(QPointF(x + 7, y + 20), QPointF(x + 41, y + 20))
            p.drawLine(QPointF(x + 7, y + 27), QPointF(x + 41, y + 27))
            p.drawLine(QPointF(x + 7, y + 34), QPointF(x + 41, y + 34))
            p.drawLine(QPointF(x + 7, y + 41), QPointF(x + 30, y + 41))

            # Angled pencil
            p.save()
            p.translate(x + 32, y + 20)
            p.rotate(35)
            p.setBrush(QBrush(QColor(255, 183, 77)))
            p.setPen(Qt.PenStyle.NoPen)
            p.drawRect(QRectF(0, 0, 4, 24))
            p.setBrush(QBrush(QColor(229, 115, 115)))
            p.drawRect(QRectF(0, -4, 4, 4))
            p.restore()

        elif self.icon_id == "tempo":
            # Dark technical oscilloscope with neon green ECG heartbeat line
            grad = QLinearGradient(x, y, x, y + h)
            grad.setColorAt(0, QColor(36, 36, 38))
            grad.setColorAt(1, QColor(15, 15, 17))
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(255, 255, 255, 40), 1.0))
            p.drawRoundedRect(squircle_rect, radius, radius)

            # Oscilloscope grid
            p.setPen(QPen(QColor(51, 51, 54), 1.0))
            cx, cy = x + w / 2, y + h / 2
            p.drawLine(QPointF(x + 5, cy), QPointF(x + w - 5, cy))
            p.drawLine(QPointF(cx, y + 5), QPointF(cx, y + h - 5))

            # Neon Green ECG Wave
            p.setPen(QPen(QColor(48, 209, 88), 2.2, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.RoundJoin))
            wave = QPainterPath()
            wave.moveTo(x + 6, cy)
            wave.lineTo(x + 16, cy)
            wave.lineTo(x + 20, cy - 8)
            wave.lineTo(x + 24, cy + 10)
            wave.lineTo(x + 27, cy - 12)
            wave.lineTo(x + 31, cy + 13)
            wave.lineTo(x + 35, cy - 2)
            wave.lineTo(x + 38, cy)
            wave.lineTo(x + w - 6, cy)
            p.drawPath(wave)

        elif self.icon_id == "gallery":
            # Cobalt Blue App Store squircle with white crossing tools A
            grad = QLinearGradient(x, y, x, y + h)
            grad.setColorAt(0, QColor(0, 122, 255))
            grad.setColorAt(1, QColor(0, 81, 213))
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(255, 255, 255, 50), 1.0))
            p.drawRoundedRect(squircle_rect, radius, radius)

            # Classic crossing A bars
            cx, cy = x + w / 2, y + h / 2
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(QBrush(QColor(255, 255, 255)))
            p.save()
            p.translate(cx, cy)
            p.rotate(-30)
            p.drawRoundedRect(QRectF(-2.2, -18, 4.4, 36), 1.5, 1.5)
            p.restore()

            p.save()
            p.translate(cx, cy)
            p.rotate(30)
            p.drawRoundedRect(QRectF(-2.2, -18, 4.4, 36), 1.5, 1.5)
            p.restore()

            # Crossbar
            p.drawRoundedRect(QRectF(cx - 13, cy + 4, 26, 4.4), 1.5, 1.5)

        elif self.icon_id == "wine":
            # Azure squircle with 4-pane Windows logo
            grad = QLinearGradient(x, y, x, y + h)
            grad.setColorAt(0, QColor(2, 132, 199))
            grad.setColorAt(1, QColor(3, 105, 161))
            p.setBrush(QBrush(grad))
            p.setPen(QPen(QColor(255, 255, 255, 50), 1.0))
            p.drawRoundedRect(squircle_rect, radius, radius)

            # 4 Blue/White Windows tiles
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(QBrush(QColor(255, 255, 255, 230)))
            p.drawRect(QRectF(x + 13, y + 13, 10, 10))
            p.drawRect(QRectF(x + 25, y + 13, 10, 10))
            p.drawRect(QRectF(x + 13, y + 25, 10, 10))
            p.drawRect(QRectF(x + 25, y + 25, 10, 10))

        # Active Application Running Indicator Dot
        if self.is_running:
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(QBrush(QColor(255, 255, 255, 200)))
            p.drawEllipse(QPointF(x + w / 2, 54), 2.0, 2.0)


class FrostedTopBar(QWidget):
    """CutefishOS & macOS Sequoia Frosted Glass Top Menu Bar."""
    def __init__(self, desktop_manager, parent=None):
        super().__init__(parent)
        self.dm = desktop_manager
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.SubWindow)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedHeight(28)

        layout = QHBoxLayout(self)
        layout.setContentsMargins(10, 0, 12, 0)
        layout.setSpacing(8)

        # 1. Apple Logo Button (Bespoke Monochrome Vector)
        self.logo_btn = AppleMenuLogoButton(self.show_system_menu, self)
        layout.addWidget(self.logo_btn)

        # 2. Active Application Title (13pt SemiBold)
        self.app_title = QLabel("Finder")
        self.app_title.setFont(QFont("Inter", 10, QFont.Weight.DemiBold))
        text_color = "#1d1d1f" if theme.IS_LIGHT_MODE else "#ffffff"
        self.app_title.setStyleSheet(f"color: {text_color}; padding-left: 2px;")
        layout.addWidget(self.app_title)

        # 3. Global Menu Bar Items (13pt Regular)
        item_color = "rgba(0, 0, 0, 0.85)" if theme.IS_LIGHT_MODE else "rgba(255, 255, 255, 0.88)"
        hover_bg = "rgba(0, 0, 0, 0.08)" if theme.IS_LIGHT_MODE else "rgba(255, 255, 255, 0.14)"
        for item in ["File", "Edit", "View", "Go", "Window", "Help"]:
            btn = QPushButton(item)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background: transparent;
                    border: none;
                    color: {item_color};
                    font-size: 13px;
                    padding: 2px 7px;
                    border-radius: 4px;
                }}
                QPushButton:hover {{
                    background: {hover_bg};
                    color: {text_color};
                }}
            """)
            layout.addWidget(btn)

        layout.addStretch()

        # 4. Status Indicators: Battery Pill, Wi-Fi, Spotlight, Control Center
        self.battery_icon = TopBarStatusVector("battery")
        layout.addWidget(self.battery_icon)

        self.wifi_icon = TopBarStatusVector("wifi", tooltip="Wi-Fi: Connected")
        layout.addWidget(self.wifi_icon)

        self.spotlight_btn = TopBarStatusVector("spotlight", on_click=self.dm.toggle_spotlight, tooltip="Spotlight (Ctrl+Space)")
        layout.addWidget(self.spotlight_btn)

        self.cc_btn = TopBarStatusVector("control_center", on_click=self.show_control_center, tooltip="Control Center")
        layout.addWidget(self.cc_btn)

        self.maestro_btn = TopBarStatusVector("maestro", on_click=self.dm.toggle_maestro, tooltip="Maestro AI Assistant (Ctrl+M)")
        layout.addWidget(self.maestro_btn)

        # 5. Live Clock
        self.clock_label = QLabel()
        self.clock_label.setFont(QFont("Inter", 10, QFont.Weight.Medium))
        self.clock_label.setStyleSheet(f"color: {text_color}; padding-left: 4px;")
        layout.addWidget(self.clock_label)

        # Clock Timer
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_clock)
        self.timer.start(1000)
        self.update_clock()

    def update_clock(self):
        self.clock_label.setText(QDateTime.currentDateTime().toString("ddd MMM d  h:mm AP"))

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        if theme.IS_LIGHT_MODE:
            gradient = QLinearGradient(0, 0, 0, self.height())
            gradient.setColorAt(0, QColor(255, 255, 255, 215))
            gradient.setColorAt(1, QColor(246, 246, 248, 200))
            painter.setBrush(QBrush(gradient))
            painter.setPen(QPen(QColor(0, 0, 0, 22), 0.75))
        else:
            gradient = QLinearGradient(0, 0, 0, self.height())
            gradient.setColorAt(0, QColor(28, 28, 34, 215))
            gradient.setColorAt(1, QColor(18, 18, 22, 235))
            painter.setBrush(QBrush(gradient))
            painter.setPen(QPen(QColor(255, 255, 255, 22), 0.75))
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
                font-size: 13px;
            }
            QMenu::item {
                padding: 6px 24px 6px 12px;
                border-radius: 5px;
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
        about_act = menu.addAction("About This Mac")
        about_act.triggered.connect(lambda: self.dm.launch_app("settings"))
        menu.addSeparator()

        pref_act = menu.addAction("System Settings...")
        pref_act.triggered.connect(lambda: self.dm.launch_app("settings"))

        store_act = menu.addAction("App Store...")
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
    """Cutefish & macOS Sequoia Continuous Floating Dock with Authentic Apple Icons."""
    def __init__(self, desktop_manager, parent=None):
        super().__init__(parent)
        self.dm = desktop_manager
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint | Qt.WindowType.WindowStaysOnTopHint | Qt.WindowType.SubWindow)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground)
        self.setFixedHeight(68)

        self.layout = QHBoxLayout(self)
        self.layout.setContentsMargins(14, 4, 14, 4)
        self.layout.setSpacing(6)

        # Authentic macOS Icon Lineup
        self.apps = [
            ("finder", "Finder (Cadence)", "cadence"),
            ("settings", "System Settings", "settings"),
            ("calc", "Calculator (Solfege)", "solfege"),
            ("terminal", "Terminal (Console)", "console"),
            ("notes", "Notes (Scribe)", "scribe"),
            ("tempo", "Activity Monitor (Tempo)", "tempo"),
            ("gallery", "App Store & Sideload", "gallery"),
            ("wine", "Windows Containerizer", "wine_notepad"),
        ]

        self.buttons = {}
        for icon_id, title, action_id in self.apps:
            btn = AppleDockIcon(icon_id, title, lambda a=action_id: self.dm.launch_app(a), self)
            self.buttons[action_id] = btn
            self.layout.addWidget(btn)

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        if theme.IS_LIGHT_MODE:
            gradient = QLinearGradient(0, 0, 0, self.height())
            gradient.setColorAt(0, QColor(255, 255, 255, 140))
            gradient.setColorAt(1, QColor(255, 255, 255, 95))
            painter.setBrush(QBrush(gradient))
            painter.setPen(QPen(QColor(255, 255, 255, 210), 1.2))
        else:
            gradient = QLinearGradient(0, 0, 0, self.height())
            gradient.setColorAt(0, QColor(36, 36, 44, 210))
            gradient.setColorAt(1, QColor(18, 18, 24, 240))
            painter.setBrush(QBrush(gradient))
            painter.setPen(QPen(QColor(255, 255, 255, 40), 1.0))
        painter.drawRoundedRect(self.rect().adjusted(1, 1, -1, -1), 22, 22)


class ToccataDesktopManager(QMainWindow):
    """Master Compositor Shell coordinating TopBar, Dock, and Applications."""
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Toccata Desktop Shell")
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)

        self.current_layout_mode = "macos"
        self.open_windows = {}

        screen = QApplication.primaryScreen().geometry()
        self.setGeometry(screen)

        # Authentic High-Resolution Wallpaper
        base_dir = os.path.dirname(os.path.abspath(__file__))
        self.wallpaper_path = os.path.join(base_dir, "..", "..", "assets", "wallpapers", "pearos-light.jpg")
        self.wallpaper_pixmap = None
        if os.path.exists(self.wallpaper_path):
            self.wallpaper_pixmap = QPixmap(self.wallpaper_path)

        # 1. Top Bar
        self.top_bar = FrostedTopBar(self, self)
        self.top_bar.setGeometry(0, 0, screen.width(), 28)
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

        # 5. Maestro On-Device Neural Assistant
        self.maestro = MaestroHUD(self)
        self.maestro.action_triggered.connect(self.handle_maestro_action)

        # 6. Global Shortcuts: Ctrl+Space for Spotlight, Ctrl+M for Maestro
        self.shortcut_spotlight = QShortcut(QKeySequence("Ctrl+Space"), self)
        self.shortcut_spotlight.activated.connect(self.toggle_spotlight)

        self.shortcut_maestro = QShortcut(QKeySequence("Ctrl+M"), self)
        self.shortcut_maestro.activated.connect(self.toggle_maestro)

        # Window state tracker timer
        self.state_timer = QTimer(self)
        self.state_timer.timeout.connect(self.sync_active_window_title)
        self.state_timer.start(500)

    def toggle_maestro(self):
        if self.maestro.isVisible():
            self.maestro.hide()
        else:
            screen = QApplication.primaryScreen().geometry()
            x = (screen.width() - self.maestro.width()) // 2
            y = 38
            self.maestro.move(x, y)
            self.maestro.show()
            self.maestro.raise_()
            self.maestro.activateWindow()

    def handle_maestro_action(self, action_type, param):
        print(f"[MAESTRO ACTION DISPATCHED]: {action_type} -> {param}")
        if action_type == "layout":
            self.apply_layout(str(param))
        elif action_type == "wallpaper":
            self.set_wallpaper_image(str(param))
        elif action_type == "theme":
            theme.IS_LIGHT_MODE = (str(param).lower() == "light")
            self.update()
            self.top_bar.update()
            self.dock.update()
        elif action_type == "app":
            self.launch_app(str(param))
        elif action_type == "search":
            self.launch_app("cadence")

    def apply_layout(self, mode):
        self.current_layout_mode = mode
        screen = QApplication.primaryScreen().geometry()
        print(f"[COMPOSITOR] Applying adaptive desktop layout: {mode}")

        if mode in ["macos", "pearos"]:
            self.top_bar.setGeometry(0, 0, screen.width(), 28)
            self.top_bar.show()
            self.update_dock_geometry()
            if mode == "pearos":
                self.set_wallpaper_image("pearos-light.jpg")
            else:
                self.set_wallpaper_image("sequoia-light.svg")
        elif mode == "win11":
            # Centered Windows 11 Taskbar
            dock_w = min(screen.width() - 40, 54 * len(self.dock.apps) + 120)
            self.dock.setGeometry((screen.width() - dock_w) // 2, screen.height() - 58, dock_w, 54)
            self.set_wallpaper_image("zorin-island.jpg")
        elif mode == "win10":
            # Classic Windows 10 left-aligned
            dock_w = min(screen.width(), 54 * len(self.dock.apps) + 200)
            self.dock.setGeometry(0, screen.height() - 48, screen.width(), 48)
            self.set_wallpaper_image("zorin-dark.jpg")
        elif mode == "gnome":
            # GNOME 47 Overview & Vertical Dash
            dash_h = 54 * len(self.dock.apps) + 40
            self.dock.setGeometry(12, (screen.height() - dash_h) // 2, 68, dash_h)
            self.set_wallpaper_image("zorin-island.jpg")
        self.dock.update()
        self.update()

    def set_wallpaper_image(self, filename):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(base_dir, "..", "..", "assets", "wallpapers", filename)
        if os.path.exists(path):
            self.wallpaper_pixmap = QPixmap(path)
            self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        if self.wallpaper_pixmap and not self.wallpaper_pixmap.isNull():
            painter.drawPixmap(self.rect(), self.wallpaper_pixmap)
        else:
            w, h = self.width(), self.height()
            if theme.IS_LIGHT_MODE:
                gradient = QLinearGradient(0, 0, w, h)
                gradient.setColorAt(0.0, QColor(239, 244, 250))
                gradient.setColorAt(0.35, QColor(253, 244, 235))
                gradient.setColorAt(0.70, QColor(248, 237, 235))
                gradient.setColorAt(1.0, QColor(234, 242, 248))
                painter.fillRect(self.rect(), gradient)
            else:
                painter.fillRect(self.rect(), QColor(26, 27, 38))

    def update_dock_geometry(self):
        screen = QApplication.primaryScreen().geometry()
        dock_width = 54 * len(self.dock.apps) + 40
        dock_height = 68
        x = (screen.width() - dock_width) // 2
        y = screen.height() - dock_height - 10
        self.dock.setGeometry(x, y, dock_width, dock_height)

    def toggle_control_center(self, global_pos):
        if self.control_center.isVisible():
            self.control_center.hide()
        else:
            self.control_center.move(global_pos)
            self.control_center.show()
            self.control_center.raise_()

    def toggle_spotlight(self):
        if self.spotlight.isVisible():
            self.spotlight.hide()
        else:
            self.spotlight.show_centered()

    def sync_active_window_title(self):
        active_app = None
        for name, win in self.open_windows.items():
            if win.isActiveWindow() and win.isVisible():
                active_app = name
                break
        if active_app:
            self.top_bar.app_title.setText(active_app.capitalize())
        else:
            self.top_bar.app_title.setText("Finder")

    def launch_app(self, action_id):
        # Bring to front if already open
        if action_id in self.open_windows and self.open_windows[action_id].isVisible():
            win = self.open_windows[action_id]
            win.raise_()
            win.activateWindow()
            return

        # Instantiate app
        win = None
        if action_id == "cadence":
            win = CadenceFileManager()
        elif action_id == "settings":
            win = SystemSettings()
            win.wallpaper_changed.connect(self.set_wallpaper_image)
            win.layout_changed.connect(self.apply_layout)
        elif action_id == "solfege":
            win = SolfegeCalculator()
        elif action_id == "console":
            win = ToccataConsole()
        elif action_id == "scribe":
            win = ScribeEditor()
        elif action_id == "tempo":
            win = TempoActivityMonitor()
        elif action_id == "gallery":
            win = GalleryAppStore()
        elif action_id == "wine_notepad":
            # Launch Windows Notepad container directly
            runner_script = os.path.join(os.path.dirname(__file__), "..", "toccata-bundle", "toccata-wine-runner.py")
            subprocess.Popen([sys.executable, runner_script, "notepad.exe"])
            return

        if win:
            self.open_windows[action_id] = win
            win.show()
            win.raise_()
            win.activateWindow()
            self.top_bar.app_title.setText(action_id.capitalize())


def main():
    app = QApplication(sys.argv)
    app.setFont(QFont("Inter", 10))
    desktop = ToccataDesktopManager()
    desktop.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
