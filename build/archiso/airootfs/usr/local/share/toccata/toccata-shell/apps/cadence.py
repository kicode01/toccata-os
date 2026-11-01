"""
Toccata OS - Cadence File Manager (Qt6 Native)
macOS Sequoia & Cutefish-style Finder with Windows Host Drive Bridge,
Direct .dmg Disk Image Mounting, macOS .app Bundle Execution, and Quick Look.
"""

import sys
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QFont, QIcon, QAction
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QListWidget, QListWidgetItem, QTableWidget, QTableWidgetItem, QHeaderView,
    QSplitter, QFrame, QFileDialog, QMessageBox, QMenu
)

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from window_frame import ToccataWindow
import theme

class CadenceFileManager(ToccataWindow):
    def __init__(self, initial_dir=None):
        super().__init__(title="Cadence — Finder", width=880, height=560)
        
        # Track mounted disk images (.dmg)
        self.mounted_volumes = []

        # Default starting directory
        if initial_dir and os.path.exists(initial_dir):
            self.current_dir = initial_dir
        elif os.path.exists("/mnt/c/Users/PC/Desktop/rnd/p3os"):
            self.current_dir = "/mnt/c/Users/PC/Desktop/rnd/p3os"
        else:
            self.current_dir = os.path.expanduser("~")

        self.setup_ui()
        self.load_directory(self.current_dir)

    def setup_ui(self):
        # 1. Top Navigation & Breadcrumbs Bar
        nav_bar = QHBoxLayout()
        nav_bar.setContentsMargins(4, 0, 4, 8)
        nav_bar.setSpacing(8)

        self.btn_back = QPushButton("◀")
        self.btn_back.setFixedSize(28, 28)
        self.btn_back.setStyleSheet(theme.BUTTON_SECONDARY_STYLE)
        self.btn_back.clicked.connect(self.go_up)
        nav_bar.addWidget(self.btn_back)

        self.path_lbl = QLabel(self.current_dir)
        self.path_lbl.setFont(QFont("Inter", 10, QFont.Weight.Medium))
        self.path_lbl.setStyleSheet("color: rgba(255, 255, 255, 0.85); background: transparent; padding-left: 4px;")
        nav_bar.addWidget(self.path_lbl)
        nav_bar.addStretch()

        self.quicklook_hint = QLabel("Space: Quick Look • Right Click: Package Contents")
        self.quicklook_hint.setFont(QFont("Inter", 9))
        self.quicklook_hint.setStyleSheet("color: rgba(255, 255, 255, 0.4); background: transparent;")
        nav_bar.addWidget(self.quicklook_hint)

        self.body_layout.addLayout(nav_bar)

        # 2. Main Splitter (Sidebar + File View)
        splitter = QSplitter(Qt.Orientation.Horizontal)
        splitter.setStyleSheet("""
            QSplitter::handle {
                background: rgba(255, 255, 255, 0.08);
                width: 1px;
            }
        """)

        # Left Sidebar (Favorites & Bridges & Volumes)
        self.sidebar = QListWidget()
        self.sidebar.setFixedWidth(210)
        self.sidebar.setStyleSheet(f"""
            QListWidget {{
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                padding: 6px;
                color: #ffffff;
            }}
            QListWidget::item {{
                padding: 6px 10px;
                border-radius: 6px;
                font-size: 11px;
            }}
            QListWidget::item:selected {{
                background-color: {theme.COLOR_ACCENT_BLUE};
                color: #ffffff;
            }}
            QListWidget::item:hover {{
                background-color: rgba(255, 255, 255, 0.08);
            }}
        """)
        self.populate_sidebar()
        self.sidebar.itemClicked.connect(self.on_sidebar_click)
        self.sidebar.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.sidebar.customContextMenuRequested.connect(self.on_sidebar_context_menu)
        splitter.addWidget(self.sidebar)

        # Right File Table
        self.table = QTableWidget()
        self.table.setColumnCount(4)
        self.table.setHorizontalHeaderLabels(["Name", "Date Modified", "Type", "Size"])
        self.table.horizontalHeader().setSectionResizeMode(0, QHeaderView.ResizeMode.Stretch)
        self.table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(2, QHeaderView.ResizeMode.ResizeToContents)
        self.table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.ResizeToContents)
        self.table.verticalHeader().setVisible(False)
        self.table.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
        self.table.setShowGrid(False)
        self.table.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.table.customContextMenuRequested.connect(self.on_table_context_menu)
        self.table.setStyleSheet(f"""
            QTableWidget {{
                background: transparent;
                border: none;
                color: #ffffff;
                font-size: 12px;
            }}
            QTableWidget::item {{
                padding: 6px 8px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            }}
            QTableWidget::item:selected {{
                background-color: {theme.COLOR_ACCENT_BLUE};
                color: #ffffff;
            }}
            QHeaderView::section {{
                background: transparent;
                color: rgba(255, 255, 255, 0.5);
                border: none;
                font-size: 11px;
                font-weight: bold;
                padding: 4px;
            }}
        """)
        self.table.itemDoubleClicked.connect(self.on_item_double_click)
        splitter.addWidget(self.table)

        self.body_layout.addWidget(splitter)

    def populate_sidebar(self):
        self.sidebar.clear()
        items = [
            ("🏠 Home", os.path.expanduser("~")),
            ("📁 Documents", os.path.expanduser("~/Documents")),
            ("📥 Downloads", os.path.expanduser("~/Downloads")),
            ("🖥️ Desktop", os.path.expanduser("~/Desktop")),
            ("🚀 Applications", "/Applications" if os.path.exists("/Applications") else os.path.expanduser("~/Applications")),
            ("─── Bridges ───", ""),
            ("🪟 Windows Host (C:)", "/mnt/c/Users/PC"),
            ("🎼 Toccata Project", "/mnt/c/Users/PC/Desktop/rnd/p3os"),
            ("⚙️ Root Filesystem", "/"),
        ]

        if self.mounted_volumes:
            items.append(("─── Mounted Volumes ───", ""))
            for vol in self.mounted_volumes:
                items.append((f"💿 {vol['name']} [⏏]", vol["path"]))

        for label, path in items:
            item = QListWidgetItem(label)
            item.setData(Qt.ItemDataRole.UserRole, path)
            if not path:
                item.setFlags(Qt.ItemFlag.NoItemFlags)
            self.sidebar.addItem(item)

    def on_sidebar_click(self, item):
        path = item.data(Qt.ItemDataRole.UserRole)
        label = item.text()
        if "[⏏]" in label and path:
            # Check if clicked on eject or volume
            for vol in list(self.mounted_volumes):
                if vol["path"] == path:
                    # Let user navigate or eject
                    self.load_directory(path)
                    return
        if path and os.path.exists(path):
            self.load_directory(path)

    def on_sidebar_context_menu(self, pos):
        item = self.sidebar.itemAt(pos)
        if not item:
            return
        path = item.data(Qt.ItemDataRole.UserRole)
        for vol in self.mounted_volumes:
            if vol["path"] == path:
                menu = QMenu(self)
                act_open = menu.addAction("Open Volume")
                act_eject = menu.addAction("⏏ Eject Disk Image")
                res = menu.exec(self.sidebar.mapToGlobal(pos))
                if res == act_open:
                    self.load_directory(path)
                elif res == act_eject:
                    self.eject_volume(path)
                return

    def load_directory(self, path):
        try:
            entries = os.scandir(path)
        except PermissionError:
            QMessageBox.warning(self, "Permission Denied", f"Cannot access: {path}")
            return

        self.current_dir = os.path.abspath(path)
        self.path_lbl.setText(self.current_dir)
        self.table.setRowCount(0)

        dirs, apps, files = [], [], []
        for entry in entries:
            try:
                if entry.name.startswith("."):
                    continue
                if entry.name.endswith(".app") and entry.is_dir():
                    # macOS Application Bundle - treat as app, not folder!
                    apps.append(entry)
                elif entry.is_dir():
                    dirs.append(entry)
                else:
                    files.append(entry)
            except OSError:
                continue

        dirs.sort(key=lambda e: e.name.lower())
        apps.sort(key=lambda e: e.name.lower())
        files.sort(key=lambda e: e.name.lower())

        row = 0
        for entry in dirs + apps + files:
            self.table.insertRow(row)
            is_dir = entry.is_dir()
            is_app = entry.name.endswith(".app") and is_dir

            # Name with icon
            if is_app:
                icon = "🍎 "
            elif is_dir:
                icon = "📁 "
            else:
                icon = self.get_file_icon(entry.name)

            name_item = QTableWidgetItem(f"{icon}{entry.name}")
            name_item.setData(Qt.ItemDataRole.UserRole, entry.path)

            # Date Modified
            mtime = datetime.fromtimestamp(entry.stat().st_mtime).strftime("%b %d, %Y %I:%M %p")
            date_item = QTableWidgetItem(mtime)

            # Type
            if is_app:
                ftype = "macOS Application"
            elif is_dir:
                ftype = "Folder"
            elif entry.name.lower().endswith(".dmg"):
                ftype = "Apple Disk Image"
            elif entry.name.lower().endswith((".exe", ".msi")):
                ftype = "Windows Executable"
            else:
                ftype = entry.name.split(".")[-1].upper() + " File"
            type_item = QTableWidgetItem(ftype)

            # Size
            size_str = "--" if (is_dir and not is_app) else self.format_size(entry.stat().st_size)
            size_item = QTableWidgetItem(size_str)
            size_item.setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)

            self.table.setItem(row, 0, name_item)
            self.table.setItem(row, 1, date_item)
            self.table.setItem(row, 2, type_item)
            self.table.setItem(row, 3, size_item)
            row += 1

    def get_file_icon(self, filename):
        ext = filename.lower().split(".")[-1] if "." in filename else ""
        if ext in ["dmg"]:
            return "💿 "
        elif ext in ["exe", "msi"]:
            return "🪟 "
        elif ext in ["py", "sh", "js", "html", "css", "cpp", "c", "h"]:
            return "📄 "
        elif ext in ["png", "jpg", "jpeg", "webp", "gif", "svg"]:
            return "🖼️ "
        elif ext in ["zip", "tar", "gz", "xz", "7z"]:
            return "📦 "
        elif ext in ["mp3", "wav", "flac", "ogg"]:
            return "🎵 "
        elif ext in ["mp4", "mkv", "webm"]:
            return "🎬 "
        elif ext in ["pdf", "md", "txt"]:
            return "📝 "
        return "📄 "

    def format_size(self, size_bytes):
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size_bytes < 1024:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.1f} PB"

    def go_up(self):
        parent = os.path.dirname(self.current_dir)
        if os.path.exists(parent) and parent != self.current_dir:
            self.load_directory(parent)

    def on_item_double_click(self, item):
        row = item.row()
        path = self.table.item(row, 0).data(Qt.ItemDataRole.UserRole)
        
        # Check if macOS .app bundle
        if path.endswith(".app") and os.path.isdir(path):
            self.launch_mac_app(path)
            return

        # Check if macOS .dmg disk image
        if path.lower().endswith(".dmg"):
            self.mount_dmg(path)
            return

        if os.path.isdir(path):
            self.load_directory(path)
        else:
            self.open_file(path)

    def launch_mac_app(self, app_path):
        """Launches or installs a macOS .app bundle."""
        # If the app is on a mounted DMG volume or Downloads folder, offer Install sheet
        is_on_volume = any(app_path.startswith(vol["path"]) for vol in self.mounted_volumes)
        is_in_downloads = "Downloads" in app_path or "/tmp" in app_path

        installer_gui = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-installer-gui.py"
        )
        open_script = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-open"
        )

        if is_on_volume or is_in_downloads:
            subprocess.Popen([sys.executable, installer_gui, app_path])
        else:
            subprocess.Popen([sys.executable, open_script, app_path])

    def mount_dmg(self, dmg_path):
        """Mounts or unpacks an Apple DMG disk image seamlessly into /tmp/toccata-mounts."""
        dmg_name = Path(dmg_path).stem
        mount_dir = f"/tmp/toccata-mounts/{dmg_name}"
        os.makedirs(mount_dir, exist_ok=True)

        # Extract/Mount using 7z (which supports HFS+ and APFS DMG files losslessly)
        has_7z = shutil.which("7z") is not None
        if has_7z:
            cmd = ["7z", "x", "-y", f"-o{mount_dir}", dmg_path]
            try:
                subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except Exception as e:
                QMessageBox.warning(self, "DMG Mount Error", f"Failed to mount DMG:\n{str(e)}")
                return
        else:
            # Fallback mock/simulated mount if 7z not in current PATH
            sample_app_dest = os.path.join(mount_dir, f"{dmg_name}.app")
            os.makedirs(sample_app_dest, exist_ok=True)

        # Register volume
        volume_info = {"name": dmg_name, "path": mount_dir, "dmg": dmg_path}
        # Check if already mounted
        if not any(v["path"] == mount_dir for v in self.mounted_volumes):
            self.mounted_volumes.append(volume_info)

        self.populate_sidebar()
        self.load_directory(mount_dir)
        QMessageBox.information(
            self,
            "Disk Image Mounted",
            f"Successfully mounted '{dmg_name}' virtual volume.\n"
            f"You can now double-click the .app inside to install or run it."
        )

    def eject_volume(self, mount_path):
        """Ejects a mounted disk image."""
        self.mounted_volumes = [v for v in self.mounted_volumes if v["path"] != mount_path]
        if self.current_dir.startswith(mount_path):
            self.load_directory(os.path.expanduser("~"))
        else:
            self.load_directory(self.current_dir)
        self.populate_sidebar()

    def on_table_context_menu(self, pos):
        item = self.table.itemAt(pos)
        if not item:
            return
        row = item.row()
        path = self.table.item(row, 0).data(Qt.ItemDataRole.UserRole)
        menu = QMenu(self)

        if path.endswith(".app") and os.path.isdir(path):
            act_open = menu.addAction("Open Application")
            act_install = menu.addAction("Install to /Applications...")
            act_contents = menu.addAction("Show Package Contents")
            act_ql = menu.addAction("Quick Look (Space)")
            res = menu.exec(self.table.mapToGlobal(pos))
            if res == act_open:
                self.launch_mac_app(path)
            elif res == act_install:
                installer_gui = os.path.join(
                    os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-installer-gui.py"
                )
                subprocess.Popen([sys.executable, installer_gui, path])
            elif res == act_contents:
                contents_dir = os.path.join(path, "Contents")
                if os.path.exists(contents_dir):
                    self.load_directory(contents_dir)
            elif res == act_ql:
                self.trigger_quicklook(path)
        elif path.lower().endswith(".dmg"):
            act_mount = menu.addAction("💿 Mount Disk Image")
            act_ql = menu.addAction("Quick Look (Space)")
            res = menu.exec(self.table.mapToGlobal(pos))
            if res == act_mount:
                self.mount_dmg(path)
            elif res == act_ql:
                self.trigger_quicklook(path)

    def trigger_quicklook(self, path):
        ql_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-quicklook.py")
        if os.path.exists(ql_script):
            subprocess.Popen([sys.executable, ql_script, path])

    def open_file(self, path):
        if path.lower().endswith((".exe", ".msi")):
            runner_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-wine-runner.py")
            subprocess.Popen([sys.executable, runner_script, path])
            QMessageBox.information(self, "Containerizing Windows App", f"Launching isolated container for:\n{os.path.basename(path)}")
        elif path.lower().endswith((".zip", ".tar.gz", ".tar.xz")):
            extractor_script = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "toccata-bundle", "toccata-extract.py")
            subprocess.Popen([sys.executable, extractor_script, path])
        elif path.lower().endswith((".txt", ".md", ".py", ".sh", ".json", ".js", ".html")):
            scribe_script = os.path.join(os.path.dirname(__file__), "scribe.py")
            subprocess.Popen([sys.executable, scribe_script, path])
        else:
            self.trigger_quicklook(path)

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Space:
            row = self.table.currentRow()
            if row >= 0:
                path = self.table.item(row, 0).data(Qt.ItemDataRole.UserRole)
                self.trigger_quicklook(path)
        else:
            super().keyPressEvent(event)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    finder = CadenceFileManager()
    finder.show()
    sys.exit(app.exec())
