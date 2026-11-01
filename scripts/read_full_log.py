import subprocess, time, socket, os, urllib.request, json

iso = "/var/tmp/dist/toccata-os-2026.11.02-x86_64.iso"

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
    "-net", "user,hostfwd=tcp:127.0.0.1:15000-:5000"
]

proc = subprocess.Popen(cmd)
print("[*] VM launched with PID:", proc.pid)

for i in range(90):
    time.sleep(1)
    try:
        req = urllib.request.urlopen("http://127.0.0.1:15000/api/status", timeout=1)
        if req.status == 200:
            print(f"[+] Bridge online at {i}s! Waiting 20s for full kiosk log...")
            time.sleep(20)
            break
    except:
        pass

# 1. Fetch entire /tmp/toccata-kiosk.log
try:
    req = urllib.request.urlopen("http://127.0.0.1:15000/api/fs/read?path=/tmp/toccata-kiosk.log", timeout=3)
    data = json.loads(req.read().decode())
    print("\n================ FULL KIOSK LOG ================")
    print(data.get("content", ""))
    print("================================================\n")
except Exception as e:
    print("[-] Log read error:", e)

# 2. Check all processes
try:
    post_data = json.dumps({"cmd": "ps aux"}).encode()
    req = urllib.request.Request("http://127.0.0.1:15000/api/exec", data=post_data, headers={"Content-Type": "application/json"})
    resp = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
    print("\n================ PROCESS LIST ================")
    print(resp.get("stdout", ""))
    print("==============================================\n")
except Exception as e:
    print("[-] ps aux error:", e)

proc.terminate()
try: proc.wait(timeout=5)
except: proc.kill()
