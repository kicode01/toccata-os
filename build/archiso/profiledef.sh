#!/usr/bin/env bash
# Toccata OS 1.0 - Master Archiso Profile Definition
# Optimized for fast decompression, zstd compression, and UEFI/BIOS hybrid booting.

iso_name="toccata-os"
iso_label="TOCCATA_$(date +%Y%m)"
iso_publisher="Toccata OS Project <https://toccata-os.org>"
iso_application="Toccata OS 1.0 Sovereign Desktop Live & Installation Media"
iso_version="$(date +%Y.%m.%d)"
install_dir="toccata"
bootmodes=('bios.syslinux'
           'uefi.systemd-boot')
pacman_conf="pacman.conf"
airootfs_image_type="squashfs"
airootfs_image_tool_options=('-comp' 'zstd' '-Xcompression-level' '15' '-b' '1M')
bootstrap_tarball_compression=('zstd' '-c' '-T0' '--auto-threads=logical' '--long' '-19')

declare -A file_permissions=(
  ["/etc/shadow"]="0:0:400"
  ["/root"]="0:0:750"
  ["/usr/local/bin/toccata-shell"]="0:0:755"
  ["/usr/local/bin/toccata-installer"]="0:0:755"
  ["/usr/local/bin/toccata-session"]="0:0:755"
  ["/usr/local/bin/toccata-open"]="0:0:755"
)
