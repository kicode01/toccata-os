import subprocess, time, socket, os, glob

isos = glob.glob("/mnt/c/Users/PC/Desktop/rnd/p3os/dist/toccata-os-*.iso")
if not isos:
    print("No ISO found!")
    exit(1)
iso = max(isos, key=os.path.getctime)
print("[*] Testing ISO:", iso)
sock_path = "/tmp/qmp-test.sock"
ppm_path = "/tmp/test-boot.ppm"
png_path = "/mnt/c/Users/PC/Desktop/rnd/p3os/dist/boot-test.png"

if os.path.exists(sock_path):
    os.remove(sock_path)
if os.path.exists(ppm_path):
    os.remove(ppm_path)

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

for _ in range(15):
    if os.path.exists(sock_path):
        break
    time.sleep(0.5)

s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
s.connect(sock_path)
s.recv(1024)
s.sendall(b'{"execute": "qmp_capabilities"}\n')
s.recv(1024)

print("[*] Waiting 48 seconds for desktop rendering...")
time.sleep(48)

s.sendall(f'{{"execute": "screendump", "arguments": {{"filename": "{ppm_path}"}}}}\n'.encode())
time.sleep(2)
resp = s.recv(1024)
print("[*] Screendump response:", resp)

s.close()
proc.terminate()
try:
    proc.wait(timeout=5)
except:
    proc.kill()

if os.path.exists(ppm_path):
    size = os.path.getsize(ppm_path)
    print(f"[+] Success! Screen dump size: {size} bytes")
    try:
        from PIL import Image
        im = Image.open(ppm_path)
        im.save(png_path)
        print(f"[+] PNG generated: {png_path} ({os.path.getsize(png_path)} bytes)")
    except Exception as e:
        print("PIL error:", e)
