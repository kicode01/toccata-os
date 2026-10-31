#!/usr/bin/env bash
# Toccata OS - Command Key Ergonomics Setup
# Maps Super (Command) to primary GUI actions while reserving Ctrl for terminal control.

set -e

echo "[Toccata OS] Configuring Command Key Shortcuts..."

# 1. Configure GTK key theme to emulate Mac shortcuts
mkdir -p "$HOME/.config/gtk-3.0" "$HOME/.config/gtk-4.0"

cat << 'EOF' > "$HOME/.config/gtk-3.0/gtk.css"
/* Toccata OS GTK Keybindings: Command key bindings */
@binding-set mac-gui-bindings {
    bind "<Super>c" { "copy-clipboard" () };
    bind "<Super>v" { "paste-clipboard" () };
    bind "<Super>x" { "cut-clipboard" () };
    bind "<Super>a" { "select-all" (1) };
    bind "<Super>z" { "undo" () };
}

entry, textview {
    -gtk-key-bindings: mac-gui-bindings;
}
EOF

# Link for GTK4
cp "$HOME/.config/gtk-3.0/gtk.css" "$HOME/.config/gtk-4.0/gtk.css" 2>/dev/null || true

# 2. Configure KWin / Wayland Global Shortcuts
# Super+Space -> KRunner (Spotlight)
# Super+Q -> Close Window
# Super+Tab -> Task Switcher
# Ctrl+Up -> Present Windows / Mission Control

if command -v kwriteconfig6 >/dev/null 2>&1; then
    KCONFIG="kwriteconfig6"
elif command -v kwriteconfig5 >/dev/null 2>&1; then
    KCONFIG="kwriteconfig5"
else
    KCONFIG=""
fi

if [ -n "$KCONFIG" ]; then
    echo "[Toccata OS] Configuring KWin shortcuts..."
    # Spotlight launcher on Super+Space
    $KCONFIG --file kglobalshortcutsrc --group org.kde.krunner.desktop --key _launch "Super+Space,Meta+Space,KRunner"
    # Close window on Super+W
    $KCONFIG --file kglobalshortcutsrc --group kwin --key "Window Close" "Super+W,Alt+F4,Close Window"
    # Mission Control / Exposé on Ctrl+Up
    $KCONFIG --file kglobalshortcutsrc --group kwin --key "Expose" "Ctrl+Up,Ctrl+F9,Toggle Present Windows (Current desktop)"
    # Spaces overview on Ctrl+Down
    $KCONFIG --file kglobalshortcutsrc --group kwin --key "Overview" "Ctrl+Down,Meta+W,Toggle Overview"
fi

echo "[Toccata OS] Command key configuration complete."
