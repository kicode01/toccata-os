#!/usr/bin/env bash
# Toccata OS - Master ISO Build Script
# Requires: archiso, root/sudo privileges or Docker container

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORK_DIR="/tmp/toccata-build"
OUT_DIR="$PROJECT_ROOT/out"

echo "================================================="
echo "   Building Toccata OS (Live Installation ISO)   "
echo "================================================="

if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run as root (or inside Docker/WSL with sudo)."
    exit 1
fi

mkdir -p "$WORK_DIR" "$OUT_DIR"

# Stage Toccata core tools into the live rootfs
AIROOTFS="$SCRIPT_DIR/archiso/airootfs"
mkdir -p "$AIROOTFS/usr/local/bin"
cp "$PROJECT_ROOT/core/toccata-bundle/toccata-open" "$AIROOTFS/usr/local/bin/toccata-open"
chmod +x "$AIROOTFS/usr/local/bin/toccata-open"

cp "$PROJECT_ROOT/desktop/keymap/setup-cmd-keys.sh" "$AIROOTFS/usr/local/bin/setup-cmd-keys.sh"
chmod +x "$AIROOTFS/usr/local/bin/setup-cmd-keys.sh"

echo "[1/2] Generating ISO with mkarchiso..."
mkarchiso -v -w "$WORK_DIR" -o "$OUT_DIR" "$SCRIPT_DIR/archiso"

echo "[2/2] Success! Bootable ISO generated in: $OUT_DIR"
