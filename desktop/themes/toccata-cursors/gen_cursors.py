import os
import base64

cursor_dir = r"c:\Users\PC\Desktop\rnd\p3os\desktop\preview\cursors"
hotspots = {
    "default": (3, 2),
    "pointer": (8, 2),
    "text": (13, 15),
    "grab": (12, 12),
    "grabbing": (12, 12),
    "resize-ew": (16, 16),
    "resize-ns": (16, 16),
    "resize-nwse": (14, 14),
    "resize-nesw": (18, 14),
}

output_lines = []
for f in sorted(os.listdir(cursor_dir)):
    if f.endswith(".svg"):
        name = os.path.splitext(f)[0]
        hx, hy = hotspots.get(name, (0, 0))
        path = os.path.join(cursor_dir, f)
        b64 = base64.b64encode(open(path, "rb").read()).decode("utf-8")
        data_uri = f"data:image/svg+xml;base64,{b64}"
        output_lines.append(f"  --cursor-{name}: url('{data_uri}') {hx} {hy}, url('cursors/{f}') {hx} {hy};")

with open(r"c:\Users\PC\Desktop\rnd\p3os\desktop\preview\cursors\cursors.css", "w", encoding="utf-8") as out:
    out.write(":root {\n" + "\n".join(output_lines) + "\n}\n")

print(f"Generated {len(output_lines)} cursor definitions in cursors.css")
