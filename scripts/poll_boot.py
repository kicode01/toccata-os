import subprocess, time, socket, os, glob
from PIL import Image

iso = "/var/tmp/dist/toccata-os-2026.11.02-x86_64.iso"
sock_path = "/tmp/qmp-poll.sock"
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
    "-qmp", f"unix:{sock_path},server,nowait"
]

proc = subprocess.Popen(cmd)
print("[*] VM launched with PID", proc.pid)
for _ in range(20):
    if os.path.exists(sock_path): break
    time.sleep(0.5)

s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect(sock_path)
s.recv(1024)
s.sendall(b'{"execute": "qmp_capabilities"}\n')
s.recv(1024)

for wait_time in [50, 65, 80]:
    sleep_delta = 50 if wait_time == 50 else 15
    print(f"[*] Sleeping {sleep_delta}s (target: {wait_time}s)...")
    time.sleep(sleep_delta)
    ppm = f"/tmp/frame_{wait_time}.ppm"
    s.sendall(f'{{"execute": "screendump", "arguments": {{"filename": "{ppm}"}}}}\n'.encode())
    time.sleep(1)
    try: s.recv(1024)
    except: pass
    if os.path.exists(ppm):
        png = f"/mnt/c/Users/PC/Desktop/rnd/p3os/dist/frame_{wait_time}.png"
        Image.open(ppm).save(png)
        print(f"[+] Frame {wait_time} saved to {png} ({os.path.getsize(png)} bytes)")

s.close()
proc.terminate()
try: proc.wait(timeout=5)
except: proc.kill()
