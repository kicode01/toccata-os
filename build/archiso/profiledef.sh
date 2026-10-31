#!/usr/bin/env bash
# Toccata OS - Archiso Profile Definition

iso_name="toccata-os"
iso_label="TOCCATA_$(date +%Y%m)"
iso_publisher="Toccata OS Project <https://github.com/toccata-os>"
iso_application="Toccata OS Live/Installation Media"
iso_version="$(date +%Y.%m.%d)"
install_dir="arch"
buildmodes=('iso')
bootmodes=('bios.syslinux.mbr' 'bios.syslinux.eltorito'
           'uefi-x64.systemd-boot.esp' 'uefi-x64.systemd-boot.eltorito')
arch="x86_64"
pacman_conf="pacman.conf"
airootfs_image_type="squashfs"
airootfs_image_tool_options=('-comp' 'zstd')
file_permissions=(
  ["/etc/shadow"]="0:0:400"
  ["/root"]="0:0:750"
  ["/usr/local/bin/toccata-open"]="0:0:755"
  ["/usr/local/bin/setup-cmd-keys.sh"]="0:0:755"
)
