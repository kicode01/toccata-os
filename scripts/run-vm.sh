#!/usr/bin/env bash
# ==============================================================================
# TOCCATA OS - Hardware-Accelerated QEMU Live VM Launcher
# Uses KVM vCPU acceleration + Direct3D 12 VirtIO GPU via WSLg
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

export DISPLAY="${DISPLAY:-:0}"
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-0}"
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/mnt/wslg/runtime-dir}"
export PULSE_SERVER="${PULSE_SERVER:-/mnt/wslg/PulseServer}"

TARGET="${1:-toccata}"
RAM="${2:-4096}"
CORES="${3:-4}"

case "$TARGET" in
    pearos|pear)
        ISO="$ROOT_DIR/pearOS-NiceC0re-2026.10-x86_64.iso"
        TITLE="pearOS NiceC0re Live Environment (Arch/Cupertino)"
        ;;
    zorin)
        ISO="$ROOT_DIR/Zorin-OS-18.1-Core-64-bit.iso"
        TITLE="Zorin OS 18.1 Core Live Environment (GNOME/Adaptive)"
        ;;
    toccata|*)
        ISO="$(ls -t "$ROOT_DIR"/dist/toccata-os-*.iso 2>/dev/null | head -n 1 || true)"
        if [ -z "$ISO" ] || [ ! -f "$ISO" ]; then
            echo "[!] No compiled Toccata OS ISO found in dist/. Booting pearOS live environment..."
            ISO="$ROOT_DIR/pearOS-NiceC0re-2026.10-x86_64.iso"
            TITLE="pearOS NiceC0re Live Environment"
        else
            TITLE="Toccata OS 1.0 (Bare-Metal Production Build)"
        fi
        ;;
esac

if [ ! -f "$ISO" ]; then
    echo "[-] Error: ISO not found: $ISO"
    exit 1
fi

echo "==============================================================================="
echo "   Starting Real OS Virtual Machine: $TITLE"
echo "   Image: $ISO"
echo "   Specs: $RAM MB RAM • $CORES vCPUs (KVM Hardware Accelerated)"
echo "   Audio: PipeWire/PulseServer Bridge  •  Display: VirtIO Direct3D 12"
echo "==============================================================================="

KVM_FLAG=""
if [ -c /dev/kvm ]; then
    KVM_FLAG="-enable-kvm -cpu host"
fi

exec qemu-system-x86_64 \
    $KVM_FLAG \
    -m "$RAM" \
    -smp "$CORES" \
    -cdrom "$ISO" \
    -boot d \
    -vga virtio \
    -display gtk,gl=on \
    -device intel-hda \
    -device hda-duplex \
    -net nic,model=virtio \
    -net user \
    -name "$TITLE"
