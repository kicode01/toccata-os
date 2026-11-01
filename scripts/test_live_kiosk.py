import subprocess, time, socket, os, urllib.request, json
from PIL import Image

iso = "/var/tmp/dist/toccata-os-2026.11.02-x86_64.iso"
sock_path = "/tmp/qmp-live-sudo.sock"
if os.path.exists(sock_path): os.remove(sock_path)

cmd = [
    "qemu-system-x86_64",
    "-enable-kvm", "-cpu", "host",
    "-bios", "/usr/share/edk2/x64/OVMF.4m.fd",
    "-m", "4096",
    "-smp", "4",
    "-cdrom", iso,
    "-boot", "d",
    "-vga", "qxl",
    "-display", "none",
    "-net", "nic,model=virtio",
    "-net", "user,hostfwd=tcp:127.0.0.1:15000-:5000",
    "-qmp", f"unix:{sock_path},server,nowait"
]

proc = subprocess.Popen(cmd)
print("[*] VM launched with PID:", proc.pid)

for _ in range(25):
    if os.path.exists(sock_path): break
    time.sleep(0.5)

s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect(sock_path)
s.recv(1024)
s.sendall(b'{"execute": "qmp_capabilities"}\n')
s.recv(1024)

# Wait for bridge
for i in range(90):
    time.sleep(1)
    try:
        req = urllib.request.urlopen("http://127.0.0.1:15000/api/status", timeout=1)
        if req.status == 200:
            print(f"[+] Bridge online at {i}s!")
            break
    except:
        pass

# Update /usr/local/bin/toccata-kiosk-session live using SUDO
updated_script = """#!/usr/bin/env bash
set -e
exec > /tmp/toccata-kiosk.log 2>&1
echo "[*] Live Kiosk Session Initializing with Software EGL..."

unset WAYLAND_DISPLAY
export XDG_RUNTIME_DIR=/run/toccata
export XDG_CURRENT_DESKTOP=Toccata
export MOZ_ENABLE_WAYLAND=1
export QT_QPA_PLATFORM=wayland
export WLR_BACKENDS=drm
export LIBSEAT_BACKEND=seatd
export WLR_RENDERER_ALLOW_SOFTWARE=1
export WLR_NO_HARDWARE_CURSORS=1

for i in {1..30}; do
    if curl -s http://127.0.0.1:5000/api/status >/dev/null 2>&1; then break; fi
    sleep 0.1
done

exec cage -d -s -- chromium \\
    --kiosk \\
    --ozone-platform=wayland \\
    --enable-features=UseOzonePlatform,OverlayScrollbar \\
    --ignore-gpu-blocklist \\
    --enable-gpu-rasterization \\
    --enable-zero-copy \\
    --disable-gpu-watchdog \\
    --disable-dev-shm-usage \\
    --no-first-run \\
    --no-default-browser-check \\
    --password-store=basic \\
    --disable-translate \\
    --disable-features=Translate \\
    --autoplay-policy=no-user-gesture-required \\
    --disable-infobars \\
    --disable-session-crashed-bubble \\
    --user-data-dir=/home/toccata/.config/toccata-browser \\
    http://localhost:5000/
"""

cmd_str = f"sudo bash -c 'cat << \"EOF\" > /usr/local/bin/toccata-kiosk-session\n{updated_script}\nEOF\nchmod +x /usr/local/bin/toccata-kiosk-session\nsystemctl restart toccata-kiosk'"
post_data = json.dumps({"cmd": cmd_str}).encode()

req = urllib.request.Request("http://127.0.0.1:15000/api/exec", data=post_data, headers={"Content-Type": "application/json"})
resp = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
print("[+] Sudo update response:", resp)

print("[*] Waiting 16s for Cage to restart with WLR_RENDERER_ALLOW_SOFTWARE=1...")
time.sleep(16)

# Read /tmp/toccata-kiosk.log
try:
    req = urllib.request.urlopen("http://127.0.0.1:15000/api/fs/read?path=/tmp/toccata-kiosk.log", timeout=3)
    data = json.loads(req.read().decode())
    print("\n--- NEW KIOSK LOG (WITH SOFTWARE EGL) ---")
    print(data.get("content", ""))
    print("-------------------------------------------\n")
except Exception as e:
    print("[-] Read log error:", e)

# Capture frame
ppm_path = "/tmp/live-egl.ppm"
png_path = "/mnt/c/Users/PC/Desktop/rnd/p3os/dist/live-desktop-egl.png"

s.sendall(f'{{"execute": "screendump", "arguments": {{"filename": "{ppm_path}"}}}}\n'.encode())
time.sleep(2)
try: s.recv(1024)
except: pass

s.close()
proc.terminate()
try: proc.wait(timeout=5)
except: proc.kill()

if os.path.exists(ppm_path):
    Image.open(ppm_path).save(png_path)
    print(f"[+] Screen capture saved: {png_path} ({os.path.getsize(png_path)} bytes)")
