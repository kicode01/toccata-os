#!/usr/bin/env python3
import os
import struct
import subprocess
from pathlib import Path

def main():
    base_dir = Path("/tmp/toccata-sample-dmg-content")
    app_dir = base_dir / "SampleMacApp.app"
    macos_dir = app_dir / "Contents" / "MacOS"
    res_dir = app_dir / "Contents" / "Resources"

    macos_dir.mkdir(parents=True, exist_ok=True)
    res_dir.mkdir(parents=True, exist_ok=True)

    # 1. Info.plist
    plist_path = app_dir / "Contents" / "Info.plist"
    with open(plist_path, "w", encoding="utf-8") as f:
        f.write("""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>SampleMacApp</string>
    <key>CFBundleDisplayName</key>
    <string>Sample macOS App</string>
    <key>CFBundleIdentifier</key>
    <string>com.toccata.samplemacapp</string>
    <key>CFBundleVersion</key>
    <string>2.1.0</string>
    <key>CFBundleExecutable</key>
    <string>SampleMacApp</string>
</dict>
</plist>
""")

    # 2. 64-bit Mach-O Header Binary (0xfeedfacf)
    bin_path = macos_dir / "SampleMacApp"
    with open(bin_path, "wb") as f:
        f.write(struct.pack(">I", 0xfeedfacf)) # Mach-O 64-bit magic
        f.write(struct.pack(">I", 0x01000007)) # CPU_TYPE_X86_64
        f.write(b"\x00" * 24)                  # Mach-O header padding
        f.write(b"Sample Darwin Mach-O Executable Payload for Toccata OS\n")
    bin_path.chmod(0o755)

    # 3. ReadMe file inside DMG
    with open(base_dir / "ReadMe.txt", "w", encoding="utf-8") as f:
        f.write("Welcome to Toccata OS!\nDouble-click SampleMacApp to install or run via Darling Darwin subsystem.\n")

    # 4. Pack into hybrid disk image (.dmg) via xorriso
    out_dmg = Path("/mnt/c/Users/PC/Desktop/rnd/p3os/SampleMacApp.dmg")
    if out_dmg.exists():
        out_dmg.unlink()
    
    cmd = [
        "xorrisofs",
        "-V", "SampleMacApp",
        "-r", "-J",
        "-o", str(out_dmg),
        str(base_dir)
    ]
    subprocess.run(cmd, check=True)
    print(f"[+] Successfully generated sample Apple disk image at: {out_dmg}")

if __name__ == "__main__":
    main()
