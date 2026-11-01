"""
Toccata OS - Scribe (Qt6 Native)
macOS TextEdit / Markdown Canvas with Word/Char Counter and File IO.
"""

import sys
import os
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit,
    QPushButton, QFileDialog, QMessageBox
)

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from window_frame import ToccataWindow
import theme

class ScribeEditor(ToccataWindow):
    def __init__(self, initial_file=None):
        super().__init__(title="Scribe — TextEdit", width=780, height=520)
        self.current_file = initial_file
        self.setup_ui()
        if initial_file and os.path.exists(initial_file):
            self.load_file(initial_file)

    def setup_ui(self):
        # 1. Action Toolbar
        toolbar = QHBoxLayout()
        toolbar.setContentsMargins(0, 0, 0, 8)
        toolbar.setSpacing(8)

        btn_new = QPushButton("New")
        btn_new.setStyleSheet(theme.BUTTON_SECONDARY_STYLE)
        btn_new.clicked.connect(self.new_file)
        toolbar.addWidget(btn_new)

        btn_open = QPushButton("Open...")
        btn_open.setStyleSheet(theme.BUTTON_SECONDARY_STYLE)
        btn_open.clicked.connect(self.open_file_dialog)
        toolbar.addWidget(btn_open)

        btn_save = QPushButton("Save")
        btn_save.setStyleSheet(theme.BUTTON_PRIMARY_STYLE)
        btn_save.clicked.connect(self.save_file)
        toolbar.addWidget(btn_save)

        toolbar.addStretch()

        self.stats_lbl = QLabel("0 words • 0 characters")
        self.stats_lbl.setFont(QFont("Inter", 9))
        self.stats_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.5);")
        toolbar.addWidget(self.stats_lbl)

        self.body_layout.addLayout(toolbar)

        # 2. Main Editor Canvas
        self.editor = QTextEdit()
        self.editor.setFont(QFont("Inter, Segoe UI", 11))
        self.editor.setStyleSheet("""
            QTextEdit {
                background: rgba(20, 20, 23, 0.95);
                color: #f4f4f5;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 12px;
                line-height: 1.5;
            }
        """)
        self.editor.textChanged.connect(self.update_stats)
        self.body_layout.addWidget(self.editor)

    def update_stats(self):
        text = self.editor.toPlainText()
        words = len(text.split()) if text.strip() else 0
        chars = len(text)
        self.stats_lbl.setText(f"{words} words • {chars} characters")

    def new_file(self):
        self.editor.clear()
        self.current_file = None
        self.lbl_title.setText("Scribe — Untitled")

    def open_file_dialog(self):
        filename, _ = QFileDialog.getOpenFileName(self, "Open Document", "", "Text Files (*.txt *.md *.py *.sh *.json);;All Files (*)")
        if filename:
            self.load_file(filename)

    def load_file(self, filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                self.editor.setPlainText(f.read())
            self.current_file = filepath
            self.lbl_title.setText(f"Scribe — {os.path.basename(filepath)}")
        except Exception as e:
            QMessageBox.critical(self, "Error Opening File", str(e))

    def save_file(self):
        if not self.current_file:
            filename, _ = QFileDialog.getSaveFileName(self, "Save Document", "", "Markdown Document (*.md);;Text Document (*.txt)")
            if not filename:
                return
            self.current_file = filename

        try:
            with open(self.current_file, "w", encoding="utf-8") as f:
                f.write(self.editor.toPlainText())
            self.lbl_title.setText(f"Scribe — {os.path.basename(self.current_file)}")
            QMessageBox.information(self, "Saved", "File saved successfully.")
        except Exception as e:
            QMessageBox.critical(self, "Error Saving File", str(e))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    scribe = ScribeEditor()
    scribe.show()
    sys.exit(app.exec())
