"""
Toccata OS - Cutefish & macOS Sequoia Design Tokens
Unified styling for Qt6 native desktop shell and first-party applications.
"""

# Color Palette (Display P3 tuned)
COLOR_BG_DARK = "#09090b"           # Deep Zinc
COLOR_SURFACE_DARK = "#18181b"      # Card Zinc
COLOR_SURFACE_HOVER = "#27272a"     # Hover Zinc
COLOR_BORDER = "rgba(255, 255, 255, 0.12)"
COLOR_BORDER_LIGHT = "rgba(255, 255, 255, 0.20)"

COLOR_ACCENT_BLUE = "#007aff"
COLOR_ACCENT_GREEN = "#34c759"
COLOR_ACCENT_ORANGE = "#ff9500"
COLOR_ACCENT_RED = "#ff3b30"
COLOR_ACCENT_PURPLE = "#af52de"
COLOR_ACCENT_CYAN = "#38bdf8"

COLOR_TEXT_PRIMARY = "#ffffff"
COLOR_TEXT_SECONDARY = "rgba(255, 255, 255, 0.65)"
COLOR_TEXT_MUTED = "rgba(255, 255, 255, 0.40)"

# Inset Traffic Lights Styling
TRAFFIC_LIGHTS_STYLE = """
QPushButton#btn_close {
    background-color: #ff5f56;
    border: 1px solid #e0443e;
    border-radius: 6px;
    max-width: 12px;
    max-height: 12px;
    min-width: 12px;
    min-height: 12px;
}
QPushButton#btn_close:hover {
    background-color: #ff3b30;
}
QPushButton#btn_minimize {
    background-color: #ffbd2e;
    border: 1px solid #dea123;
    border-radius: 6px;
    max-width: 12px;
    max-height: 12px;
    min-width: 12px;
    min-height: 12px;
}
QPushButton#btn_minimize:hover {
    background-color: #ff9500;
}
QPushButton#btn_maximize {
    background-color: #27c93f;
    border: 1px solid #1aab29;
    border-radius: 6px;
    max-width: 12px;
    max-height: 12px;
    min-width: 12px;
    min-height: 12px;
}
QPushButton#btn_maximize:hover {
    background-color: #34c759;
}
"""

# Global Window Styling
WINDOW_BASE_STYLE = f"""
QWidget#WindowRoot {{
    background-color: rgba(24, 24, 27, 0.94);
    border: 1px solid {COLOR_BORDER};
    border-radius: 12px;
}}

QScrollBar:vertical {{
    background: transparent;
    width: 8px;
    margin: 4px 2px 4px 2px;
}}
QScrollBar::handle:vertical {{
    background: rgba(255, 255, 255, 0.2);
    min-height: 24px;
    border-radius: 4px;
}}
QScrollBar::handle:vertical:hover {{
    background: rgba(255, 255, 255, 0.35);
}}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
    height: 0px;
}}
"""

# Cutefish Inset Settings Card Styling
CARD_STYLE = f"""
QFrame.SettingsCard {{
    background-color: rgba(39, 39, 42, 0.7);
    border: 1px solid {COLOR_BORDER};
    border-radius: 10px;
    padding: 10px;
}}
"""

BUTTON_PRIMARY_STYLE = f"""
QPushButton {{
    background-color: {COLOR_ACCENT_BLUE};
    color: #ffffff;
    font-weight: 600;
    font-size: 13px;
    border: none;
    border-radius: 8px;
    padding: 6px 16px;
}}
QPushButton:hover {{
    background-color: #2563eb;
}}
QPushButton:pressed {{
    background-color: #1d4ed8;
}}
"""

BUTTON_SECONDARY_STYLE = f"""
QPushButton {{
    background-color: rgba(255, 255, 255, 0.08);
    color: #ffffff;
    font-size: 13px;
    border: 1px solid {COLOR_BORDER};
    border-radius: 8px;
    padding: 6px 14px;
}}
QPushButton:hover {{
    background-color: rgba(255, 255, 255, 0.15);
}}
QPushButton:pressed {{
    background-color: rgba(255, 255, 255, 0.20);
}}
"""
