#!/usr/bin/env bash
set -e

cat << 'EOF' > /etc/fonts/local.conf
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>/mnt/c/Windows/Fonts</dir>
  <match target="pattern">
    <test qual="any" name="family"><string>sans-serif</string></test>
    <edit name="family" mode="prepend" binding="strong">
      <string>Segoe UI</string>
      <string>DejaVu Sans</string>
      <string>Noto Sans</string>
    </edit>
  </match>
</fontconfig>
EOF

fc-cache -f /mnt/c/Windows/Fonts /usr/share/fonts
echo "Fonts configured successfully."
