"""
Toccata OS - Solfege Calculator (Qt6 Native)
Apple-style compact squircle arithmetic calculator.
"""

import sys
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QGridLayout, QLabel, QPushButton
)
import os

# Allow running standalone or as module
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from window_frame import ToccataWindow
import theme

class SolfegeCalculator(ToccataWindow):
    def __init__(self):
        super().__init__(title="Calculator", width=280, height=390)
        self.expression = "0"
        self.new_entry = True

        self.setup_ui()

    def setup_ui(self):
        # 1. LCD Display
        self.display = QLabel(self.expression)
        self.display.setFont(QFont("Inter", 32, QFont.Weight.Light))
        self.display.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        self.display.setStyleSheet("""
            QLabel {
                color: #ffffff;
                background: transparent;
                padding: 10px 8px;
            }
        """)
        self.body_layout.addWidget(self.display)

        # 2. Keypad Grid
        grid = QGridLayout()
        grid.setSpacing(8)

        buttons = [
            ("AC", 0, 0, "#a5a5a5", "#000000"),
            ("±",  0, 1, "#a5a5a5", "#000000"),
            ("%",  0, 2, "#a5a5a5", "#000000"),
            ("÷",  0, 3, theme.COLOR_ACCENT_ORANGE, "#ffffff"),

            ("7",  1, 0, "#333333", "#ffffff"),
            ("8",  1, 1, "#333333", "#ffffff"),
            ("9",  1, 2, "#333333", "#ffffff"),
            ("×",  1, 3, theme.COLOR_ACCENT_ORANGE, "#ffffff"),

            ("4",  2, 0, "#333333", "#ffffff"),
            ("5",  2, 1, "#333333", "#ffffff"),
            ("6",  2, 2, "#333333", "#ffffff"),
            ("-",  2, 3, theme.COLOR_ACCENT_ORANGE, "#ffffff"),

            ("1",  3, 0, "#333333", "#ffffff"),
            ("2",  3, 1, "#333333", "#ffffff"),
            ("3",  3, 2, "#333333", "#ffffff"),
            ("+",  3, 3, theme.COLOR_ACCENT_ORANGE, "#ffffff"),

            ("0",  4, 0, "#333333", "#ffffff", 1, 2),
            (".",  4, 2, "#333333", "#ffffff"),
            ("=",  4, 3, theme.COLOR_ACCENT_ORANGE, "#ffffff"),
        ]

        for item in buttons:
            text = item[0]
            r, c = item[1], item[2]
            bg, fg = item[3], item[4]
            rspan = item[5] if len(item) > 5 else 1
            cspan = item[6] if len(item) > 6 else 1

            btn = QPushButton(text)
            btn.setFont(QFont("Inter", 14, QFont.Weight.Medium))
            btn.setFixedSize(54 * cspan + (cspan - 1) * 8, 48)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {bg};
                    color: {fg};
                    border-radius: 24px;
                    border: none;
                }}
                QPushButton:hover {{
                    opacity: 0.9;
                }}
                QPushButton:pressed {{
                    background-color: #ffffff;
                    color: #000000;
                }}
            """)
            btn.clicked.connect(lambda ch, t=text: self.on_button_press(t))
            grid.addWidget(btn, r, c, rspan, cspan)

        self.body_layout.addLayout(grid)

    def on_button_press(self, text):
        if text == "AC":
            self.expression = "0"
            self.new_entry = True
        elif text == "±":
            if self.expression != "0":
                if self.expression.startswith("-"):
                    self.expression = self.expression[1:]
                else:
                    self.expression = "-" + self.expression
        elif text == "%":
            try:
                self.expression = str(float(self.expression) / 100)
            except Exception:
                self.expression = "Error"
        elif text in ["+", "-", "×", "÷"]:
            op = text.replace("×", "*").replace("÷", "/")
            self.expression += f" {op} "
            self.new_entry = False
        elif text == "=":
            try:
                expr = self.expression.replace("×", "*").replace("÷", "/")
                result = eval(expr)
                if isinstance(result, float) and result.is_integer():
                    result = int(result)
                self.expression = str(result)
                self.new_entry = True
            except Exception:
                self.expression = "Error"
                self.new_entry = True
        else:
            if self.expression == "0" or self.new_entry:
                self.expression = text
                self.new_entry = False
            else:
                self.expression += text

        self.display.setText(self.expression)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    calc = SolfegeCalculator()
    calc.show()
    sys.exit(app.exec())
