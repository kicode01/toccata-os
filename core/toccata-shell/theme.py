"""
Toccata OS - Cutefish & macOS Sequoia Design Tokens
Unified styling for Qt6 native desktop shell and first-party applications.
Engineered to Apple Design Resources & Sequoia Human Interface Guidelines (Light & Dark).
"""

IS_LIGHT_MODE = True

# Color Palette (Display P3 tuned)
COLOR_BG_DARK = "#09090b"           # Deep Zinc
COLOR_SURFACE_DARK = "#18181b"      # Card Zinc
COLOR_SURFACE_HOVER = "#27272a"     # Hover Zinc
COLOR_BORDER = "rgba(255, 255, 255, 0.12)"
COLOR_BORDER_LIGHT = "rgba(255, 255, 255, 0.20)"

# Apple macOS Sequoia Light Mode Tokens
COLOR_BG_LIGHT = "#f5f5f7"          # Apple Warm Silver
COLOR_SURFACE_LIGHT = "rgba(255, 255, 255, 0.88)"
COLOR_SURFACE_HOVER_LIGHT = "rgba(0, 0, 0, 0.05)"
COLOR_BORDER_LIGHT_THEME = "rgba(0, 0, 0, 0.12)"
COLOR_TEXT_PRIMARY_LIGHT = "#1d1d1f"
COLOR_TEXT_SECONDARY_LIGHT = "rgba(0, 0, 0, 0.58)"
COLOR_TEXT_MUTED_LIGHT = "rgba(0, 0, 0, 0.40)"

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

# Global Window Styling (Light Mode by Default)
WINDOW_BASE_STYLE_LIGHT = f"""
QWidget#WindowRoot {{
    background-color: rgba(255, 255, 255, 0.90);
    border: 1px solid {COLOR_BORDER_LIGHT_THEME};
    border-radius: 12px;
}}

QScrollBar:vertical {{
    background: transparent;
    width: 8px;
    margin: 4px 2px 4px 2px;
}}
QScrollBar::handle:vertical {{
    background: rgba(0, 0, 0, 0.20);
    min-height: 24px;
    border-radius: 4px;
}}
QScrollBar::handle:vertical:hover {{
    background: rgba(0, 0, 0, 0.35);
}}
QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
    height: 0px;
}}
"""

WINDOW_BASE_STYLE_DARK = f"""
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

WINDOW_BASE_STYLE = WINDOW_BASE_STYLE_LIGHT

# Cutefish Inset Settings Card Styling
CARD_STYLE_LIGHT = f"""
QFrame.SettingsCard {{
    background-color: rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 10px;
    padding: 10px;
}}
"""

CARD_STYLE_DARK = f"""
QFrame.SettingsCard {{
    background-color: rgba(39, 39, 42, 0.7);
    border: 1px solid {COLOR_BORDER};
    border-radius: 10px;
    padding: 10px;
}}
"""

CARD_STYLE = CARD_STYLE_LIGHT

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
    background-color: rgba(0, 0, 0, 0.06);
    color: {COLOR_TEXT_PRIMARY_LIGHT};
    font-size: 13px;
    border: 1px solid {COLOR_BORDER_LIGHT_THEME};
    border-radius: 8px;
    padding: 6px 14px;
}}
QPushButton:hover {{
    background-color: rgba(0, 0, 0, 0.10);
}}
QPushButton:pressed {{
    background-color: rgba(0, 0, 0, 0.15);
}}
"""
