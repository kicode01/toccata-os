#!/usr/bin/env bash
set -e

# Generate locale
locale-gen

# Set timezone
ln -sf /usr/share/zoneinfo/UTC /etc/localtime

# Compile GLib schemas
glib-compile-schemas /usr/share/glib-2.0/schemas

# Brand GDM with Toccata OS logo
if [ -f /usr/local/share/toccata/toccata-logo.svg ]; then
    mkdir -p /usr/share/pixmaps
    cp -f /usr/local/share/toccata/toccata-logo.svg /usr/share/pixmaps/archlinux-logo-text-dark.svg
    cp -f /usr/local/share/toccata/toccata-logo.svg /usr/share/pixmaps/archlinux-logo-text.svg
    cp -f /usr/local/share/toccata/toccata-logo.svg /usr/share/pixmaps/archlinux-logo.svg
fi

# Enable graphical target, seatd, Toccata Kiosk and IPC Bridge
systemctl set-default graphical.target
systemctl enable seatd.service
systemctl enable toccata-bridge.service
systemctl enable toccata-kiosk.service
systemctl enable NetworkManager.service
systemctl mask systemd-firstboot.service
systemctl mask gdm.service 2>/dev/null || true

# Ensure toccata user groups and permissions
usermod -aG video,audio,input,storage,wheel,seat,render toccata 2>/dev/null || true
mkdir -p /home/toccata/.config/toccata-browser
chown -R toccata:toccata /home/toccata
chmod 755 /home/toccata
chmod 755 /usr/local/bin/*
chmod +x /usr/local/share/toccata/toccata-bridge/server.py 2>/dev/null || true
if [ -f /etc/sudoers.d/toccata ]; then
    chown 0:0 /etc/sudoers.d/toccata
    chmod 440 /etc/sudoers.d/toccata
fi
fc-cache -rf 2>/dev/null || true
