# Toccata OS 1.0 - Auto-start Wayland session on TTY1
if [ -z "$WAYLAND_DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    exec /usr/local/bin/toccata-session
fi
