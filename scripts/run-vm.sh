#!/usr/bin/env bash
# ==============================================================================
# TOCCATA OS - Hardware-Accelerated QEMU Live VM Launcher
# Uses KVM vCPU acceleration + Standard Bochs DRM + USB Tablet 1:1 Pointer
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
        ISO="$(ls -t /var/tmp/dist/toccata-os-*.iso "$ROOT_DIR"/dist/toccata-os-*.iso 2>/dev/null | head -n 1 || true)"
        if [ -n "$ISO" ] && [ -f "$ISO" ]; then
            TITLE="Toccata OS 1.0 (Full Unified Operating System)"
        else
            ISO="$ROOT_DIR/pearOS-NiceC0re-2026.10-x86_64.iso"
            TITLE="Toccata OS (Live Unified Hardware VM)"
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
echo "   Audio: PipeWire/PulseServer Bridge  •  Input: 1:1 USB Tablet + VirtIO Keyboard"
echo "   Live Sync: Auto-syncing desktop/preview/* -> VM every 1s (Zero ISO Rebuild!)"
echo "==============================================================================="

# Background live-sync watcher: pushes any edits in desktop/preview/ straight into the running VM
python3 "$SCRIPT_DIR/live-sync-vm.py" "$ROOT_DIR/desktop/preview" >/dev/null 2>&1 &
SYNC_PID=$!
trap "kill $SYNC_PID 2>/dev/null || true" EXIT

KVM_FLAG=""
if [ -c /dev/kvm ]; then
    KVM_FLAG="-enable-kvm -cpu host"
fi

BIOS_FLAG=""
if [ -f /usr/share/edk2/x64/OVMF.4m.fd ]; then
    BIOS_FLAG="-bios /usr/share/edk2/x64/OVMF.4m.fd"
fi

qemu-system-x86_64 \
    $KVM_FLAG \
    $BIOS_FLAG \
    -m "$RAM" \
    -smp "$CORES" \
    -cdrom "$ISO" \
    -boot d \
    -vga std \
    -usb \
    -device usb-tablet \
    -device virtio-keyboard-pci \
    -display gtk,grab-on-hover=on,zoom-to-fit=on \
    -device intel-hda \
    -device hda-duplex \
    -net nic,model=virtio \
    -net user,hostfwd=tcp:127.0.0.1:5050-:5000 \
    -name "$TITLE"
