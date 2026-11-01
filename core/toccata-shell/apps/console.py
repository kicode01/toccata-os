"""
Toccata OS - Console (Qt6 Native)
macOS Terminal style with dual-personality command bridge (POSIX + Windows shims).
"""

import sys
import os
import subprocess
from PyQt6.QtCore import Qt, QProcess
from PyQt6.QtGui import QFont, QTextCursor
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit, QLineEdit, QFrame
)

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from window_frame import ToccataWindow
import theme

class ToccataConsole(ToccataWindow):
    def __init__(self):
        super().__init__(title="Console — toccata@toccata-os:~", width=760, height=480)
        self.history = []
        self.history_index = -1
        self.current_cwd = os.path.expanduser("~")
        self.setup_ui()
        self.print_welcome()

    def setup_ui(self):
        # 1. Terminal Output Box
        self.output_box = QTextEdit()
        self.output_box.setReadOnly(True)
        self.output_box.setFont(QFont("Consolas, Menlo, Monaco, monospace", 11))
        self.output_box.setStyleSheet("""
            QTextEdit {
                background: rgba(12, 12, 14, 0.95);
                color: #38bdf8;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 10px;
            }
        """)
        self.body_layout.addWidget(self.output_box)

        # 2. Prompt Bar
        prompt_bar = QHBoxLayout()
        prompt_bar.setContentsMargins(0, 6, 0, 0)
        prompt_bar.setSpacing(8)

        self.prompt_lbl = QLabel("toccata ❯")
        self.prompt_lbl.setFont(QFont("Consolas, monospace", 11, QFont.Weight.Bold))
        self.prompt_lbl.setStyleSheet("color: #34c759; background: transparent;")
        prompt_bar.addWidget(self.prompt_lbl)

        self.cmd_input = QLineEdit()
        self.cmd_input.setFont(QFont("Consolas, monospace", 11))
        self.cmd_input.setStyleSheet("""
            QLineEdit {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 6px;
                color: #ffffff;
                padding: 4px 8px;
            }
        """)
        self.cmd_input.returnPressed.connect(self.run_command)
        prompt_bar.addWidget(self.cmd_input)

        self.body_layout.addLayout(prompt_bar)

    def print_welcome(self):
        banner = (
            "🎼 Toccata OS 1.0 (x86_64-archlinux-wsl2)\n"
            "   Dual-Personality Engine: Sourced bash + Windows Shims (dir, ipconfig, cls)\n"
            "   Type 'help', 'fastfetch', 'dir', 'ipconfig', or any Linux/Windows command.\n"
            "────────────────────────────────────────────────────────────────────────────\n"
        )
        self.output_box.append(banner)

    def run_command(self):
        cmd = self.cmd_input.text().strip()
        self.cmd_input.clear()
        if not cmd:
            return

        self.history.append(cmd)
        self.history_index = len(self.history)
        self.output_box.append(f"<span style='color: #34c759;'>toccata ❯</span> <span style='color: #ffffff;'>{cmd}</span>")

        # Built-in clear / cls
        if cmd in ["clear", "cls"]:
            self.output_box.clear()
            return

        if cmd.startswith("cd "):
            target = cmd[3:].strip()
            target_path = os.path.expanduser(target)
            if os.path.isdir(target_path):
                self.current_cwd = os.path.abspath(target_path)
                self.output_box.append(f"Working directory: {self.current_cwd}")
            else:
                self.output_box.append(f"<span style='color: #ff3b30;'>cd: no such file or directory: {target}</span>")
            return

        # Execute through bash with shims sourced
        script = f"source ~/.bashrc 2>/dev/null; cd '{self.current_cwd}'; {cmd}"
        try:
            res = subprocess.run(
                ["bash", "-c", script],
                capture_output=True,
                text=True,
                timeout=15
            )
            if res.stdout:
                self.output_box.append(res.stdout.strip())
            if res.stderr:
                self.output_box.append(f"<span style='color: #ff9500;'>{res.stderr.strip()}</span>")
        except Exception as e:
            self.output_box.append(f"<span style='color: #ff3b30;'>Execution error: {str(e)}</span>")

        self.output_box.moveCursor(QTextCursor.MoveOperation.End)

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Up:
            if self.history and self.history_index > 0:
                self.history_index -= 1
                self.cmd_input.setText(self.history[self.history_index])
        elif event.key() == Qt.Key.Key_Down:
            if self.history and self.history_index < len(self.history) - 1:
                self.history_index += 1
                self.cmd_input.setText(self.history[self.history_index])
            else:
                self.history_index = len(self.history)
                self.cmd_input.clear()
        else:
            super().keyPressEvent(event)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    con = ToccataConsole()
    con.show()
    sys.exit(app.exec())
