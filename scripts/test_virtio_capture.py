import subprocess, time, socket, os, urllib.request, json
from PIL import Image

iso = "/var/tmp/dist/toccata-os-2026.11.02-x86_64.iso"
sock_path = "/tmp/qmp-virtio.sock"
if os.path.exists(sock_path): os.remove(sock_path)

cmd = [
    "qemu-system-x86_64",
    "-enable-kvm", "-cpu", "host",
    "-bios", "/usr/share/edk2/x64/OVMF.4m.fd",
    "-m", "4096",
    "-smp", "4",
    "-cdrom", iso,
    "-boot", "d",
    "-vga", "virtio",
    "-display", "none",
    "-net", "nic,model=virtio",
    "-net", "user,hostfwd=tcp:127.0.0.1:15000-:5000",
    "-qmp", f"unix:{sock_path},server,nowait"
]

proc = subprocess.Popen(cmd)
print("[*] VM launched with -vga virtio, PID:", proc.pid)

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
            print(f"[+] Bridge online at {i}s! Waiting 20s for desktop paint...")
            time.sleep(20)
            break
    except:
        pass

# Screendump
ppm_path = "/tmp/virtio-cap.ppm"
png_path = "/mnt/c/Users/PC/Desktop/rnd/p3os/dist/toccata-virtio-rendered.png"

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
