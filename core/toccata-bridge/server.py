#!/usr/bin/env python3
"""
Toccata OS 1.0 - Native Kiosk IPC Bridge & High-Performance Web Host
Bridges the web desktop shell (HTML5/CSS3/JS) directly to the Linux Kernel,
Wayland Compositor, Wine/Proton subsystem, PipeWire audio, and real filesystems.
Zero external dependencies: uses Python standard library.
"""

import os
import sys
import json
import time
import shutil
import urllib.parse
import subprocess
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

PORT = 5000
CANDIDATE_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "desktop", "preview")),
    "/usr/share/toccata/desktop/preview",
    "/usr/local/share/toccata/desktop/preview",
    "/home/toccata/desktop/preview"
]
BASE_DIR = next((d for d in CANDIDATE_DIRS if os.path.isdir(d)), "/usr/share/toccata/desktop/preview")

class ToccataBridgeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # 1. Bridge Status API
        if path == "/api/status":
            return self._send_json({
                "status": "online",
                "os": "Toccata OS 1.0 (Virtuosic Edition)",
                "kernel": os.uname().release if hasattr(os, "uname") else "Linux",
                "hostname": os.uname().nodename if hasattr(os, "uname") else "toccata",
                "uptime": time.time() - BOOT_TIME
            })

        # 2. Live System Metrics API (for Tempo / Topbar)
        if path == "/api/system":
            return self._send_json(self.get_system_metrics())

        # 3. Real Filesystem List API (for Cadence Finder)
        if path == "/api/fs/list":
            target_dir = query.get("path", [os.path.expanduser("~")])[0]
            if not os.path.exists(target_dir):
                return self._send_json({"error": "Directory not found"}, 404)
            items = []
            try:
                for entry in os.scandir(target_dir):
                    try:
                        stat = entry.stat()
                        items.append({
                            "name": entry.name,
                            "path": entry.path,
                            "is_dir": entry.is_dir(),
                            "size": stat.st_size,
                            "mtime": stat.st_mtime,
                            "is_app": entry.name.endswith(".app") or entry.name.endswith(".dmg"),
                            "is_exe": entry.name.endswith(".exe")
                        })
                    except Exception:
                        pass
                items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
                return self._send_json({"path": target_dir, "items": items})
            except PermissionError:
                return self._send_json({"error": "Permission denied"}, 403)

        # 4. File Read API (for Scribe / QuickLook)
        if path == "/api/fs/read":
            target_file = query.get("path", [""])[0]
            if not os.path.isfile(target_file):
                return self._send_json({"error": "File not found"}, 404)
            try:
                with open(target_file, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read(500000) # 500KB preview limit
                return self._send_json({"path": target_file, "content": content})
            except Exception as e:
                return self._send_json({"error": str(e)}, 500)

        # Static assets fallback
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(length) if length > 0 else b"{}"
        try:
            payload = json.loads(post_data.decode("utf-8"))
        except Exception:
            payload = {}

        # 1. Real Command Execution API (for Console / Apps)
        if path == "/api/exec":
            cmd = payload.get("cmd", "")
            if not cmd:
                return self._send_json({"error": "Empty command"}, 400)
            try:
                proc = subprocess.run(
                    cmd, shell=True,
                    capture_output=True, text=True, timeout=15,
                    cwd=os.path.expanduser("~")
                )
                return self._send_json({
                    "stdout": proc.stdout,
                    "stderr": proc.stderr,
                    "exit_code": proc.returncode
                })
            except subprocess.TimeoutExpired:
                return self._send_json({"error": "Command timed out (15s)"}, 504)
            except Exception as e:
                return self._send_json({"error": str(e)}, 500)

        # 2. File Save API (for Scribe Editor)
        if path == "/api/fs/write":
            target_file = payload.get("path", "")
            content = payload.get("content", "")
            if not target_file:
                return self._send_json({"error": "Missing file path"}, 400)
            try:
                os.makedirs(os.path.dirname(os.path.abspath(target_file)), exist_ok=True)
                with open(target_file, "w", encoding="utf-8") as f:
                    f.write(content)
                return self._send_json({"success": True, "path": target_file})
            except Exception as e:
                return self._send_json({"error": str(e)}, 500)

        # 3. Application Launcher Bridge (Wine / macOS .app / Linux)
        if path == "/api/app/launch":
            app_path = payload.get("path", "")
            if app_path.endswith(".exe"):
                subprocess.Popen(["wine", app_path], start_new_session=True)
                return self._send_json({"launched": "wine", "path": app_path})
            elif app_path.endswith(".app") or app_path.endswith(".dmg"):
                subprocess.Popen(["toccata-open", app_path], start_new_session=True)
                return self._send_json({"launched": "toccata-bundle", "path": app_path})
            else:
                subprocess.Popen([app_path], shell=True, start_new_session=True)
                return self._send_json({"launched": "native", "path": app_path})

        # 4. Audio Control API (PipeWire / WirePlumber)
        if path == "/api/audio/volume":
            vol = payload.get("volume", 50) # 0 to 100
            factor = max(0.0, min(1.0, vol / 100.0))
            subprocess.run(f"wpctl set-volume @DEFAULT_AUDIO_SINK@ {factor:.2f}", shell=True, capture_output=True)
            return self._send_json({"volume": vol})

        # 5. System Power API
        if path == "/api/system/power":
            action = payload.get("action", "")
            if action == "restart":
                subprocess.Popen(["systemctl", "reboot"])
            elif action == "shutdown":
                subprocess.Popen(["systemctl", "poweroff"])
            return self._send_json({"action": action, "scheduled": True})

        return self._send_json({"error": "Unknown API route"}, 404)

    def get_system_metrics(self):
        cpu_pct = 0.0
        mem_used = 0
        mem_total = 1
        try:
            with open("/proc/stat", "r") as f:
                fields = [float(x) for x in f.readline().strip().split()[1:5]]
                idle = fields[3]
                total = sum(fields)
                cpu_pct = round(100.0 * (1.0 - idle / max(1.0, total)), 1)
        except Exception:
            pass

        try:
            with open("/proc/meminfo", "r") as f:
                mem = {}
                for line in f:
                    parts = line.split(":")
                    if len(parts) == 2:
                        mem[parts[0].strip()] = int(parts[1].split()[0])
                mem_total = mem.get("MemTotal", 1024)
                mem_free = mem.get("MemAvailable", mem.get("MemFree", 0))
                mem_used = mem_total - mem_free
        except Exception:
            pass

        disk_total, disk_used, disk_free = 100, 20, 80
        try:
            usage = shutil.disk_usage("/")
            disk_total = round(usage.total / (1024**3), 1)
            disk_used = round(usage.used / (1024**3), 1)
            disk_free = round(usage.free / (1024**3), 1)
        except Exception:
            pass

        return {
            "cpu_percent": cpu_pct,
            "mem_used_mb": round(mem_used / 1024),
            "mem_total_mb": round(mem_total / 1024),
            "mem_percent": round(100.0 * mem_used / max(1, mem_total), 1),
            "disk_total_gb": disk_total,
            "disk_used_gb": disk_used,
            "disk_free_gb": disk_free
        }

BOOT_TIME = time.time()

def main():
    print(f"[*] Starting Toccata Native Kiosk Bridge on port {PORT}...")
    print(f"[*] Serving web desktop from: {BASE_DIR}")
    server = ThreadingHTTPServer(("0.0.0.0", PORT), ToccataBridgeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[*] Stopping Toccata Bridge.")
        server.server_close()

if __name__ == "__main__":
    main()
