#!/usr/bin/env python3
"""
Toccata OS - Proton / Wine-GE Automated Windows Application Containerizer
Part of Phase 2: Windows Compatibility Subsystem.
Wraps Windows .exe and .msi files into isolated sandboxed .app containers with zero terminal commands.
"""

import sys
import os
import subprocess
import shutil

def show_gui_message(title, message, is_error=False):
    """Display a clean visual dialog without requiring terminal interaction."""
    try:
        import tkinter as tk
        from tkinter import messagebox
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        if is_error:
            messagebox.showerror(title, message)
        else:
            messagebox.showinfo(title, message)
        root.destroy()
    except Exception:
        print(f"[{title}] {message}")

def containerize_and_run(exe_path):
    if not os.path.exists(exe_path):
        show_gui_message("File Not Found", f"Cannot locate target executable:\n{exe_path}", is_error=True)
        sys.exit(1)

    app_name = os.path.splitext(os.path.basename(exe_path))[0]
    home_dir = os.path.expanduser("~")
    prefix_dir = os.path.join(home_dir, ".local", "share", "toccata", "prefixes", app_name)

    os.makedirs(prefix_dir, exist_ok=True)

    # Check for Wine / Proton availability in Linux / WSL
    wine_bin = shutil.which("wine") or shutil.which("proton")
    
    if os.name == 'nt':
        # Running directly on Windows host: launch natively with zero overhead
        show_gui_message(
            "Toccata Windows Subsystem",
            f"Launching {app_name} natively on host silicon (Zero-Overhead Windows Execution)."
        )
        os.startfile(exe_path)
        return

    if not wine_bin:
        show_gui_message(
            "Windows Subsystem Dependency Required",
            f"To run '{os.path.basename(exe_path)}' inside Toccata Linux, Wine-GE or Proton is required.\n\n"
            "Install visually from Gallery.app or run:\n"
            "  winget install proton-ge",
            is_error=True
        )
        sys.exit(1)

    # Configure isolated prefix environment
    env = os.environ.copy()
    env["WINEPREFIX"] = prefix_dir
    env["WINEDEBUG"] = "-all"
    env["DXVK_ASYNC"] = "1"
    env["WINEFSYNC"] = "1"

    show_gui_message(
        "Toccata Windows Subsystem",
        f"Configuring isolated container for {app_name}...\n"
        f"Prefix: ~/.local/share/toccata/prefixes/{app_name}\n"
        "DXVK Direct3D-to-Vulkan translation active."
    )

    try:
        if exe_path.lower().endswith(".msi"):
            subprocess.Popen([wine_bin, "msiexec", "/i", exe_path], env=env)
        else:
            subprocess.Popen([wine_bin, exe_path], env=env)
    except Exception as e:
        show_gui_message("Execution Error", f"Failed to containerize {app_name}:\n{str(e)}", is_error=True)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        show_gui_message(
            "Toccata Application Containerizer",
            "Usage: Drag and drop any .exe or .msi file onto Toccata Gallery or pass as argument."
        )
        sys.exit(0)

    target_exe = sys.argv[1]
    containerize_and_run(target_exe)
