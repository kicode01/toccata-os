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

# Enable graphical target and display manager
systemctl set-default graphical.target
systemctl enable gdm.service
systemctl enable NetworkManager.service
systemctl mask systemd-firstboot.service

# Ensure toccata user ownership
chown -R toccata:toccata /home/toccata
chmod 755 /home/toccata
chmod 755 /usr/local/bin/*
