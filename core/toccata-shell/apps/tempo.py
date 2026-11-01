"""
Toccata OS - Tempo Activity Monitor (Qt6 Native)
macOS Activity Monitor style with real-time CPU/RAM meters and searchable process table.
"""

import sys
import os
import subprocess
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QTableWidget, QTableWidgetItem, QHeaderView, QFrame, QMessageBox
)

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from window_frame import ToccataWindow
import theme

class TempoActivityMonitor(ToccataWindow):
    def __init__(self):
        super().__init__(title="Tempo — Activity Monitor", width=780, height=520)
        self.setup_ui()
        self.refresh_metrics()

        # Update timer every 2.5s
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.refresh_metrics)
        self.timer.start(2500)

    def setup_ui(self):
        # 1. Top Metrics Cards (CPU, RAM, Processes)
        metrics_row = QHBoxLayout()
        metrics_row.setSpacing(12)

        self.cpu_card = self._create_metric_card("CPU Load", "1.2%", theme.COLOR_ACCENT_BLUE)
        self.ram_card = self._create_metric_card("Memory Used", "820 MB", theme.COLOR_ACCENT_GREEN)
        self.proc_card = self._create_metric_card("Total Tasks", "84", theme.COLOR_ACCENT_PURPLE)

        metrics_row.addWidget(self.cpu_card)
        metrics_row.addWidget(self.ram_card)
        metrics_row.addWidget(self.proc_card)
        self.body_layout.addLayout(metrics_row)

        # 2. Search & Action Bar
        action_bar = QHBoxLayout()
        action_bar.setContentsMargins(0, 8, 0, 8)
        action_bar.setSpacing(10)

        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Filter processes by name or PID...")
        self.search_input.setFont(QFont("Inter", 10))
        self.search_input.setStyleSheet("""
            QLineEdit {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 6px;
                color: #ffffff;
                padding: 4px 8px;
            }
        """)
        self.search_input.textChanged.connect(self.filter_processes)
        action_bar.addWidget(self.search_input)

        btn_quit = QPushButton("Force Quit")
        btn_quit.setStyleSheet(f"""
            QPushButton {{
                background-color: {theme.COLOR_ACCENT_RED};
                color: #ffffff;
                font-weight: bold;
                border: none;
                border-radius: 6px;
                padding: 6px 14px;
            }}
            QPushButton:hover {{
                background-color: #dc2626;
            }}
        """)
        btn_quit.clicked.connect(self.force_quit_selected)
        action_bar.addWidget(btn_quit)

        self.body_layout.addLayout(action_bar)

        # 3. Process Table
        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["Process Name", "PID", "User", "CPU %", "Memory"])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(4, QHeaderView.ResizeMode.ResizeToContents)
        self.table.verticalHeader().setVisible(False)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setShowGrid(False)
        self.table.setStyleSheet(f"""
            QTableWidget {{
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                color: #ffffff;
                font-size: 11px;
            }}
            QTableWidget::item {{
                padding: 5px 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.03);
            }}
            QTableWidget::item:selected {{
                background-color: {theme.COLOR_ACCENT_BLUE};
                color: #ffffff;
            }}
            QHeaderView::section {{
                background: rgba(255, 255, 255, 0.04);
                color: rgba(255, 255, 255, 0.6);
                border: none;
                font-weight: bold;
                padding: 6px;
            }}
        """)
        self.body_layout.addWidget(self.table)

    def _create_metric_card(self, title, val, color):
        card = QFrame()
        card.setFixedHeight(64)
        card.setStyleSheet(f"""
            QFrame {{
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 8px;
            }}
        """)
        c_layout = QVBoxLayout(card)
        c_layout.setContentsMargins(6, 4, 6, 4)
        c_layout.setSpacing(2)

        t_lbl = QLabel(title)
        t_lbl.setFont(QFont("Inter", 9))
        t_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.5); background: transparent;")
        c_layout.addWidget(t_lbl)

        v_lbl = QLabel(val)
        v_lbl.setFont(QFont("Inter", 15, QFont.Weight.Bold))
        v_lbl.setStyleSheet(f"color: {color}; background: transparent;")
        c_layout.addWidget(v_lbl)
        card.value_label = v_lbl
        return card

    def refresh_metrics(self):
        # 1. Read /proc/meminfo or free
        try:
            with open("/proc/meminfo", "r") as f:
                lines = f.readlines()
            mem_total = 0
            mem_avail = 0
            for line in lines:
                if line.startswith("MemTotal:"):
                    mem_total = int(line.split()[1]) // 1024
                elif line.startswith("MemAvailable:"):
                    mem_avail = int(line.split()[1]) // 1024
            mem_used = mem_total - mem_avail
            self.ram_card.value_label.setText(f"{mem_used} MB / {mem_total} MB")
        except Exception:
            pass

        # 2. Get process list via ps
        try:
            res = subprocess.run(
                ["ps", "-eo", "comm,pid,user,%cpu,%mem", "--sort=-%cpu"],
                capture_output=True,
                text=True
            )
            lines = res.stdout.strip().split("\n")[1:]
            self.proc_card.value_label.setText(str(len(lines)))

            self.all_processes = []
            for line in lines[:100]:
                parts = line.split(None, 4)
                if len(parts) >= 5:
                    self.all_processes.append(parts)

            self.filter_processes(self.search_input.text())
        except Exception:
            pass

    def filter_processes(self, text):
        query = text.strip().lower()
        self.table.setRowCount(0)
        row = 0
        for parts in getattr(self, "all_processes", []):
            name, pid, user, cpu, mem = parts[0], parts[1], parts[2], parts[3], parts[4]
            if not query or query in name.lower() or query in pid:
                self.table.insertRow(row)
                self.table.setItem(row, 0, QTableWidgetItem(name))
                self.table.setItem(row, 1, QTableWidgetItem(pid))
                self.table.setItem(row, 2, QTableWidgetItem(user))
                self.table.setItem(row, 3, QTableWidgetItem(f"{cpu}%"))
                self.table.setItem(row, 4, QTableWidgetItem(f"{mem}%"))
                row += 1

    def force_quit_selected(self):
        row = self.table.currentRow()
        if row < 0:
            QMessageBox.warning(self, "No Selection", "Please select a process to terminate.")
            return

        pid = self.table.item(row, 1).text()
        name = self.table.item(row, 0).text()

        confirm = QMessageBox.question(
            self,
            "Force Quit Process",
            f"Are you sure you want to quit '{name}' (PID: {pid})?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if confirm == QMessageBox.StandardButton.Yes:
            try:
                subprocess.run(["kill", "-9", pid])
                self.refresh_metrics()
            except Exception as e:
                QMessageBox.critical(self, "Error", f"Failed to kill process: {e}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    tempo = TempoActivityMonitor()
    tempo.show()
    sys.exit(app.exec())
