#!/usr/bin/env python3
"""
Toccata OS Live-Sync Daemon (Host -> Running QEMU VM)
Watches `desktop/preview/` on the Windows/WSL host and instantaneously pushes
any file edits into `/usr/share/toccata/desktop/preview/` inside the running VM
over the Toccata Bridge API (`http://127.0.0.1:5050/api/fs/write`), then triggers
an automatic hot-reload in the VM's Chromium kiosk window when files change!
"""

import os
import sys
import time
import json
import hashlib
import urllib.request

PREVIEW_DIR = sys.argv[1] if len(sys.argv) > 1 else os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "desktop", "preview")
)
VM_API = "http://127.0.0.1:5050"
VM_TARGET_DIR = "/usr/share/toccata/desktop/preview"

def vm_online():
    try:
        with urllib.request.urlopen(f"{VM_API}/api/status", timeout=1) as resp:
            return resp.status == 200
    except Exception:
        return False

def push_file(rel_path, full_path):
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        target_path = f"{VM_TARGET_DIR}/{rel_path.replace(os.sep, '/')}"
        payload = json.dumps({"path": target_path, "content": content}).encode("utf-8")
        req = urllib.request.Request(
            f"{VM_API}/api/fs/write",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False

def file_hash(path):
    try:
        with open(path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception:
        return None

def scan_hashes():
    hashes = {}
    for root, _, files in os.walk(PREVIEW_DIR):
        for fname in files:
            if fname.endswith((".html", ".css", ".js", ".svg", ".json")):
                full = os.path.join(root, fname)
                rel = os.path.relpath(full, PREVIEW_DIR)
                h = file_hash(full)
                if h:
                    hashes[rel] = (h, full)
    return hashes

def main():
    last_hashes = {}
    was_online = False
    server_synced = False
    server_py_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "core", "toccata-bridge", "server.py")
    )

    while True:
        time.sleep(1.0)
        if not vm_online():
            was_online = False
            continue

        if not server_synced and os.path.exists(server_py_path):
            try:
                with open(server_py_path, "r", encoding="utf-8") as f:
                    srv_code = f.read()
                payload = json.dumps({
                    "path": "/usr/local/share/toccata/toccata-bridge/server.py",
                    "content": srv_code
                }).encode("utf-8")
                req = urllib.request.Request(f"{VM_API}/api/fs/write", data=payload, headers={"Content-Type": "application/json"})
                urllib.request.urlopen(req, timeout=5)
                restart_payload = json.dumps({"cmd": "systemctl restart toccata-bridge.service &"}).encode("utf-8")
                req2 = urllib.request.Request(f"{VM_API}/api/exec", data=restart_payload, headers={"Content-Type": "application/json"})
                urllib.request.urlopen(req2, timeout=3)
                time.sleep(1.5)
            except Exception:
                pass
            server_synced = True

        current = scan_hashes()
        if not was_online:
            # Initial sync on boot: ensure VM has exact latest host files
            for rel, (h, full) in current.items():
                push_file(rel, full)
            last_hashes = {rel: h for rel, (h, _) in current.items()}
            was_online = True
            continue

        changed = False
        for rel, (h, full) in current.items():
            if last_hashes.get(rel) != h:
                if push_file(rel, full):
                    last_hashes[rel] = h
                    changed = True

        if changed:
            # Send F5 / Ctrl+R or reload signal if xdotool/wtype available, or let user press Ctrl+R / F5
            try:
                cmd_payload = json.dumps({
                    "cmd": "DISPLAY=:0 xdotool key F5 2>/dev/null || true"
                }).encode("utf-8")
                req = urllib.request.Request(
                    f"{VM_API}/api/exec",
                    data=cmd_payload,
                    headers={"Content-Type": "application/json"}
                )
                urllib.request.urlopen(req, timeout=2)
            except Exception:
                pass

if __name__ == "__main__":
    main()
