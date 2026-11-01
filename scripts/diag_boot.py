import subprocess, time, socket, os, urllib.request, json

iso = "/var/tmp/dist/toccata-os-2026.11.02-x86_64.iso"
sock_path = "/tmp/qmp-diag.sock"
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
print("[*] VM launched with hostfwd:15000, PID:", proc.pid)

bridge_up = False
for i in range(120):
    time.sleep(1)
    try:
        req = urllib.request.urlopen("http://127.0.0.1:15000/api/status", timeout=1)
        data = json.loads(req.read().decode())
        print("[+] SUCCESS! Bridge is online:", data)
        bridge_up = True
        break
    except Exception as e:
        if i % 10 == 0:
            print(f"[*] Waiting for bridge ({i}s)...")

if bridge_up:
    # 1. Read /tmp/toccata-kiosk.log
    try:
        req = urllib.request.urlopen("http://127.0.0.1:15000/api/fs/read?path=/tmp/toccata-kiosk.log", timeout=2)
        log_data = json.loads(req.read().decode())
        print("\n--- /tmp/toccata-kiosk.log ---")
        print(log_data.get("content", ""))
        print("------------------------------\n")
    except Exception as e:
        print("[-] Could not read kiosk log:", e)

    # 2. Check journalctl for cage / kiosk service
    try:
        post_data = json.dumps({"cmd": "journalctl -u toccata-kiosk -n 40 --no-pager"}).encode()
        req = urllib.request.Request("http://127.0.0.1:15000/api/exec", data=post_data, headers={"Content-Type": "application/json"})
        resp = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
        print("\n--- journalctl -u toccata-kiosk ---")
        print(resp.get("stdout", "") or resp.get("stderr", ""))
        print("----------------------------------\n")
    except Exception as e:
        print("[-] Could not exec journalctl:", e)

    # 3. Check processes
    try:
        post_data = json.dumps({"cmd": "ps aux | grep -E 'cage|chromium|python' | grep -v grep"}).encode()
        req = urllib.request.Request("http://127.0.0.1:15000/api/exec", data=post_data, headers={"Content-Type": "application/json"})
        resp = json.loads(urllib.request.urlopen(req, timeout=5).read().decode())
        print("\n--- Active Kiosk Processes ---")
        print(resp.get("stdout", ""))
        print("------------------------------\n")
    except Exception as e:
        print("[-] Could not exec ps aux:", e)

proc.terminate()
try: proc.wait(timeout=5)
except: proc.kill()
