#!/usr/bin/env python3
"""
Toccata OS - Zorin OS Design Asset Extractor & Inspector
Extracts icons, GTK/CSS themes, wallpapers, sounds, and layout configs
from a local Zorin OS ISO or directly from official ZorinOS GitHub repositories.
"""

import sys
import os
import shutil
import subprocess
from pathlib import Path

DEST_DIR = Path("/mnt/c/Users/PC/Desktop/rnd/p3os/assets/zorin")

def extract_from_iso(iso_path_str: str):
    iso_path = Path(iso_path_str).resolve()
    if not iso_path.is_file():
        print(f"[-] Error: ISO file not found at: {iso_path}")
        return False

    print(f"[*] Scanning Zorin OS ISO: {iso_path.name}")
    temp_extract = Path("/tmp/zorin-iso-extract")
    shutil.rmtree(temp_extract, ignore_errors=True)
    temp_extract.mkdir(parents=True, exist_ok=True)

    # 1. Extract casper/filesystem.squashfs from ISO using 7z
    print("[*] Step 1/3: Extracting live filesystem from ISO image...")
    cmd_iso = ["7z", "x", "-y", f"-o{temp_extract}", str(iso_path), "casper/filesystem.squashfs"]
    subprocess.run(cmd_iso, check=True)

    squashfs_file = temp_extract / "casper" / "filesystem.squashfs"
    if not squashfs_file.is_file():
        print("[-] Error: casper/filesystem.squashfs not found in ISO.")
        return False

    # 2. Extract design assets from SquashFS
    print("[*] Step 2/3: Unpacking themes, icons, backgrounds, and sounds...")
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    asset_paths = [
        "usr/share/themes/Zorin*",
        "usr/share/icons/Zorin*",
        "usr/share/backgrounds/*",
        "usr/share/sounds/zorin/*"
    ]
    for pattern in asset_paths:
        cmd_extract = ["7z", "x", "-y", f"-o{DEST_DIR}", str(squashfs_file), pattern]
        subprocess.run(cmd_extract, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 3. Clean up
    shutil.rmtree(temp_extract, ignore_errors=True)
    print(f"[+] Step 3/3: Successfully extracted Zorin OS design assets to: {DEST_DIR}")
    return True

def extract_from_upstream():
    print("[*] Fetching official Zorin OS design suites directly from Zorin upstream...")
    DEST_DIR.mkdir(parents=True, exist_ok=True)

    repos = [
        ("zorin-desktop-themes", "https://github.com/ZorinOS/zorin-desktop-themes.git", DEST_DIR / "themes"),
        ("zorin-icon-themes", "https://github.com/ZorinOS/zorin-icon-themes.git", DEST_DIR / "icons"),
        ("zorin-taskbar", "https://github.com/ZorinOS/zorin-taskbar.git", DEST_DIR / "layouts")
    ]

    for name, url, target_path in repos:
        print(f"[*] Cloning {name}...")
        if target_path.exists():
            shutil.rmtree(target_path, ignore_errors=True)
        cmd = ["git", "clone", "--depth", "1", url, str(target_path)]
        subprocess.run(cmd, check=True)
        print(f"[+] Downloaded {name} -> {target_path}")

    print(f"\n[+] All official Zorin OS design assets acquired at: {DEST_DIR}")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] != "--upstream":
        extract_from_iso(sys.argv[1])
    else:
        extract_from_upstream()
