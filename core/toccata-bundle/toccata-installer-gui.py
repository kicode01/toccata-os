#!/usr/bin/env python3
"""
Toccata OS - Graphical Application Installer
Presents a native, friendly GUI sheet when a user double-clicks an application bundle.
No terminal required.
"""

import sys
import os
import shutil
import plistlib
from pathlib import Path

# Use tkinter as standard GUI framework available across all platforms
import tkinter as tk
from tkinter import ttk, messagebox

def parse_plist(plist_path: Path) -> dict:
    if not plist_path.is_file():
        return {}
    try:
        with open(plist_path, "rb") as f:
            return plistlib.load(f)
    except Exception:
        return {}

class ToccataInstallerDialog:
    def __init__(self, root: tk.Tk, bundle_path: Path):
        self.root = root
        self.bundle_path = bundle_path
        self.contents_dir = bundle_path / "Contents"
        self.info_plist = self.contents_dir / "Info.plist"
        self.meta = parse_plist(self.info_plist)

        self.app_name = (
            self.meta.get("CFBundleDisplayName")
            or self.meta.get("CFBundleName")
            or self.bundle_path.stem
        )
        self.version = self.meta.get("CFBundleVersion", "1.0.0")
        self.bundle_id = self.meta.get("CFBundleIdentifier", f"org.toccata.{self.app_name.lower()}")

        self.setup_ui()

    def setup_ui(self):
        self.root.title(f"Install {self.app_name}")
        self.root.geometry("460x280")
        self.root.resizable(False, False)

        # Style configuration
        self.root.configure(bg="#f6f6f6")

        # Top Banner / Header Frame
        header = tk.Frame(self.root, bg="#f6f6f6", padx=20, pady=15)
        header.pack(fill=tk.X)

        # App Title & Version
        title_label = tk.Label(
            header,
            text=f"Install {self.app_name}",
            font=("Segoe UI", 14, "bold"),
            bg="#f6f6f6",
            fg="#1a1a1a"
        )
        title_label.pack(anchor="w")

        subtitle_label = tk.Label(
            header,
            text=f"Version {self.version} • Application Bundle",
            font=("Segoe UI", 9),
            bg="#f6f6f6",
            fg="#666666"
        )
        subtitle_label.pack(anchor="w", pady=(2, 0))

        # Divider line
        divider = tk.Frame(self.root, height=1, bg="#e0e0e0")
        divider.pack(fill=tk.X)

        # Content area
        content = tk.Frame(self.root, bg="#f6f6f6", padx=20, pady=15)
        content.pack(fill=tk.BOTH, expand=True)

        desc_label = tk.Label(
            content,
            text="Would you like to install this application to your system or run it directly?",
            font=("Segoe UI", 9),
            bg="#f6f6f6",
            fg="#333333",
            wraplength=420,
            justify="left"
        )
        desc_label.pack(anchor="w", pady=(0, 15))

        # Target Destination Selection
        self.install_location = tk.StringVar(value="user")
        
        rb1 = tk.Radiobutton(
            content,
            text="Install for current user only (~/Applications)",
            variable=self.install_location,
            value="user",
            bg="#f6f6f6",
            font=("Segoe UI", 9)
        )
        rb1.pack(anchor="w")

        rb2 = tk.Radiobutton(
            content,
            text="Install for all users (/Applications - Administrator)",
            variable=self.install_location,
            value="system",
            bg="#f6f6f6",
            font=("Segoe UI", 9)
        )
        rb2.pack(anchor="w", pady=(5, 0))

        # Bottom Button Bar Frame
        btn_bar = tk.Frame(self.root, bg="#ebebeb", padx=20, pady=12)
        btn_bar.pack(fill=tk.X, side=tk.BOTTOM)

        # Buttons (Cancel, Run Once, Install)
        btn_cancel = tk.Button(
            btn_bar,
            text="Cancel",
            width=9,
            relief="groove",
            command=self.root.destroy
        )
        btn_cancel.pack(side=tk.LEFT)

        btn_run = tk.Button(
            btn_bar,
            text="Run Without Installing",
            relief="groove",
            command=self.on_run_once
        )
        btn_run.pack(side=tk.LEFT, padx=10)

        btn_install = tk.Button(
            btn_bar,
            text="Install to Applications",
            bg="#007aff",
            fg="white",
            relief="flat",
            padx=10,
            font=("Segoe UI", 9, "bold"),
            command=self.on_install
        )
        btn_install.pack(side=tk.RIGHT)

    def on_run_once(self):
        self.root.destroy()
        launcher = self.bundle_path.parent / "toccata-open"
        if not launcher.exists():
            launcher = Path("/usr/local/bin/toccata-open")
        os.system(f'python3 "{launcher}" "{self.bundle_path}"')

    def on_install(self):
        if self.install_location.get() == "system":
            dest_dir = Path("/Applications")
        else:
            dest_dir = Path.home() / "Applications"

        dest_dir.mkdir(parents=True, exist_ok=True)
        target_dest = dest_dir / self.bundle_path.name

        try:
            if target_dest.exists():
                shutil.rmtree(target_dest)
            shutil.copytree(self.bundle_path, target_dest)
            
            # Register desktop shortcut
            launcher = Path(__file__).parent / "toccata-open"
            os.system(f'python3 "{launcher}" "{target_dest}" --register')

            messagebox.showinfo(
                "Installation Successful",
                f"'{self.app_name}' has been successfully installed to your Applications folder and pinned to your launcher!"
            )
            self.root.destroy()
        except Exception as e:
            messagebox.showerror("Installation Failed", f"Could not install bundle: {e}")

def main():
    if len(sys.argv) < 2:
        print("Usage: toccata-installer-gui <path-to-app.app>")
        sys.exit(1)

    app_path = Path(sys.argv[1]).resolve()
    if not app_path.exists():
        print(f"Error: Path {app_path} does not exist.")
        sys.exit(1)

    root = tk.Tk()
    app = ToccataInstallerDialog(root, app_path)
    root.mainloop()

if __name__ == "__main__":
    main()
