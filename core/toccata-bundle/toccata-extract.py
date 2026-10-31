#!/usr/bin/env python3
"""
Toccata OS - Zero-Terminal Archive Extractor (`toccata-extract`)
Double-click archive unpacker with graphical progress bar.
Supports .zip, .tar.gz, .tgz, .tar.bz2, .tar.xz, and .tar.
Completely replaces the need for terminal commands (tar, unzip).
"""

import sys
import os
import shutil
import zipfile
import tarfile
import threading
from pathlib import Path

try:
    import tkinter as tk
    from tkinter import ttk, messagebox
except ImportError:
    print("[toccata-extract] Error: tkinter not available", file=sys.stderr)
    sys.exit(1)

class ArchiveExtractorGUI:
    def __init__(self, root: tk.Tk, archive_path: Path, dest_dir: Path = None):
        self.root = root
        self.archive_path = archive_path.resolve()
        
        # Default destination: Subfolder named after archive stem in same directory
        stem = self.archive_path.stem
        if stem.endswith(".tar"):
            stem = stem[:-4]
        self.dest_dir = (dest_dir or (self.archive_path.parent / stem)).resolve()

        self.root.title("Extracting Archive — Toccata")
        self.root.geometry("440x210")
        self.root.resizable(False, False)
        self.root.configure(bg="#1c1c1e")

        self.center_window()
        self.setup_ui()
        self.start_extraction()

    def center_window(self):
        self.root.update_idletasks()
        w = 440
        h = 210
        sw = self.root.winfo_screenwidth()
        sh = self.root.winfo_screenheight()
        x = (sw - w) // 2
        y = (sh - h) // 2
        self.root.geometry(f"{w}x{h}+{x}+{y}")

    def setup_ui(self):
        # Header banner
        header = tk.Frame(self.root, bg="#2c2c2e", padx=16, pady=12)
        header.pack(fill=tk.X)

        tk.Label(
            header,
            text=f"📦 Unpacking {self.archive_path.name}",
            font=("Segoe UI", 11, "bold"),
            bg="#2c2c2e",
            fg="#ffffff"
        ).pack(anchor="w")

        tk.Label(
            header,
            text=f"Extracting to: {self.dest_dir.name}/",
            font=("Segoe UI", 9),
            bg="#2c2c2e",
            fg="#98989d"
        ).pack(anchor="w")

        # Body container
        body = tk.Frame(self.root, bg="#1c1c1e", padx=20, pady=16)
        body.pack(fill=tk.BOTH, expand=True)

        self.status_label = tk.Label(
            body,
            text="Preparing extraction...",
            font=("Segoe UI", 9),
            bg="#1c1c1e",
            fg="#cccccc"
        )
        self.status_label.pack(anchor="w", pady=(0, 8))

        # Progress bar
        self.prog_var = tk.DoubleVar(value=0)
        self.prog_bar = ttk.Progressbar(
            body,
            orient="horizontal",
            mode="determinate",
            variable=self.prog_var,
            length=400
        )
        self.prog_bar.pack(fill=tk.X, pady=(0, 14))

        # Buttons
        btn_frame = tk.Frame(body, bg="#1c1c1e")
        btn_frame.pack(fill=tk.X)

        self.cancel_btn = tk.Button(
            btn_frame,
            text="Cancel",
            font=("Segoe UI", 9),
            bg="#3a3a3c",
            fg="#ffffff",
            relief=tk.FLAT,
            padx=14,
            pady=4,
            command=self.root.destroy
        )
        self.cancel_btn.pack(side=tk.RIGHT)

    def start_extraction(self):
        self.is_cancelled = False
        threading.Thread(target=self._run_extraction, daemon=True).start()

    def _run_extraction(self):
        try:
            self.dest_dir.mkdir(parents=True, exist_ok=True)
            suffix = self.archive_path.suffix.lower()

            if suffix == ".zip":
                with zipfile.ZipFile(self.archive_path, "r") as zf:
                    members = zf.infolist()
                    total = len(members)
                    for idx, member in enumerate(members):
                        if self.is_cancelled:
                            return
                        zf.extract(member, self.dest_dir)
                        pct = ((idx + 1) / total) * 100
                        self.root.after(0, self._update_ui, pct, member.filename)
            elif ".tar" in self.archive_path.name or suffix in (".tgz", ".tar", ".gz", ".bz2", ".xz"):
                with tarfile.open(self.archive_path, "r:*") as tf:
                    members = tf.getmembers()
                    total = len(members)
                    for idx, member in enumerate(members):
                        if self.is_cancelled:
                            return
                        # Security: Prevent path traversal
                        target_path = (self.dest_dir / member.name).resolve()
                        if not str(target_path).startswith(str(self.dest_dir)):
                            continue
                        tf.extract(member, self.dest_dir)
                        pct = ((idx + 1) / total) * 100
                        self.root.after(0, self._update_ui, pct, member.name)
            else:
                raise ValueError(f"Unsupported archive format: {suffix}")

            self.root.after(0, self._extraction_complete)
        except Exception as e:
            self.root.after(0, self._extraction_error, str(e))

    def _update_ui(self, pct: float, filename: str):
        self.prog_var.set(pct)
        # Shorten filename if too long
        display_name = filename if len(filename) < 38 else f"...{filename[-35:]}"
        self.status_label.config(text=f"Extracting: {display_name}")

    def _extraction_complete(self):
        self.status_label.config(text="Extraction finished successfully! 🎉", fg="#34c759")
        self.prog_var.set(100)
        self.cancel_btn.config(text="Open Folder", bg="#007aff", command=self._open_destination)
        # Auto-open or prompt
        self._notify_desktop(f"Extracted {self.archive_path.name}")

    def _extraction_error(self, err_msg: str):
        self.status_label.config(text=f"Extraction failed: {err_msg}", fg="#ff453a")
        messagebox.showerror("Extraction Error", f"Could not extract archive:\n{err_msg}")

    def _open_destination(self):
        import subprocess
        if sys.platform == "win32":
            os.startfile(str(self.dest_dir))
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(self.dest_dir)])
        else:
            subprocess.Popen(["xdg-open", str(self.dest_dir)])
        self.root.destroy()

    def _notify_desktop(self, msg: str):
        try:
            import subprocess
            if sys.platform != "win32":
                subprocess.Popen(["notify-send", "Toccata Archive Engine", msg])
        except Exception:
            pass

def main():
    if len(sys.argv) < 2:
        print("Usage: toccata-extract <path_to_archive> [dest_directory]")
        sys.exit(1)

    archive = Path(sys.argv[1])
    dest = Path(sys.argv[2]) if len(sys.argv) > 2 else None

    root = tk.Tk()
    app = ArchiveExtractorGUI(root, archive, dest)
    root.mainloop()

if __name__ == "__main__":
    main()
