#!/usr/bin/env python3
"""
Toccata OS - Zorin Exec Guard Compatibility Engine
Reverse-engineered from Zorin OS 18.1 Core (zorin-exec-guard 1.5).
Analyzes Windows binaries (.exe, .msi) against the comprehensive 2,220-entry
application database and recommends native Linux/Arch/Flatpak counterparts
or routes to Proton GE 9.0-3 execution container.
"""

import sys
import os
import json
import re
from pathlib import Path
from typing import Dict, Any, Optional

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "assets" / "zorin" / "apps" / "zorin_exec_guard" / "app_db.json"

class ZorinExecGuardEngine:
    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or DEFAULT_DB_PATH
        self.db = []
        self._load_database()

    def _load_database(self):
        if not self.db_path.is_file():
            # Fallback to local path if running from root
            local_fallback = Path("assets/zorin/apps/zorin_exec_guard/app_db.json")
            if local_fallback.is_file():
                self.db_path = local_fallback

        if self.db_path.is_file():
            try:
                with open(self.db_path, "r", encoding="utf-8") as f:
                    self.db = json.load(f)
            except Exception as e:
                print(f"[ExecGuard] Warning: Failed to load app_db.json: {e}", file=sys.stderr)
        else:
            print(f"[ExecGuard] Warning: Database file not found at {self.db_path}", file=sys.stderr)

    def analyze_executable(self, filename: str) -> Dict[str, Any]:
        """
        Match the filename against the 2,220 rules in Zorin app_db.json.
        Returns detection metadata and recommendation.
        """
        clean_name = os.path.basename(filename).strip().lower()
        
        for entry in self.db:
            regex_info = entry.get("regex", {})
            win_pattern = regex_info.get("windows")
            if win_pattern:
                try:
                    if re.search(win_pattern, clean_name, re.IGNORECASE):
                        return {
                            "matched": True,
                            "filename": os.path.basename(filename),
                            "app_name": entry.get("name", "Windows Application"),
                            "flatpak": entry.get("flatpak"),
                            "apt_pkg": entry.get("apt"),
                            "desktop_launcher": entry.get("desktopLauncher"),
                            "alternative": entry.get("alternative"),
                            "web_link": entry.get("webLink"),
                            "custom_message": entry.get("mainMessage"),
                            "action": "native_alternative_available"
                        }
                except re.error:
                    continue

        # If no native replacement was registered in the database, recommend Proton container
        return {
            "matched": False,
            "filename": os.path.basename(filename),
            "app_name": os.path.splitext(os.path.basename(filename))[0].title(),
            "action": "proton_container_execution",
            "runtime": "Proton GE 9.0-3 / DXVK 2.4",
            "message": "No direct Linux native package found. Launching in Proton GE container with low-latency PipeWire audio."
        }

def main():
    if len(sys.argv) < 2:
        print("Usage: zorin_exec_guard.py <file.exe|file.msi>")
        sys.exit(1)

    target_file = sys.argv[1]
    engine = ZorinExecGuardEngine()
    result = engine.analyze_executable(target_file)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
