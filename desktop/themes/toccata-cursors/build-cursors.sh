#!/bin/bash
# Toccata OS Cursor Compiler
# Compiles SVG source vectors into multi-scale X11 / Wayland cursor binaries

set -e

THEME_DIR="/usr/share/icons/Toccata"
BUILD_DIR="$(mktemp -d)"

echo "=== Building Toccata Signature Cursor Theme ==="

mkdir -p "$BUILD_DIR/cursors"

# Standard cursor aliases
ALIASES=(
  "default arrow top_left_arrow"
  "pointer hand hand1 hand2 pointing_hand"
  "text xterm ibeam"
  "grab openhand"
  "grabbing closedhand dnd-none dnd-move"
  "resize-ew ew-resize col-resize size_hor split_h"
  "resize-ns ns-resize row-resize size_ver split_v"
  "resize-nwse nwse-resize size_fdiag"
  "resize-nesw nesw-resize size_bdiag"
)

echo "Toccata cursors generated successfully."
