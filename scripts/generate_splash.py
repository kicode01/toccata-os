#!/usr/bin/env python3
from PIL import Image, ImageDraw, ImageFont

img = Image.new("RGBA", (640, 480), (14, 17, 23, 255))
draw = ImageDraw.Draw(img)

# Deep gradient glow
for y in range(480):
    for x in range(0, 640, 2):
        dist = ((x - 320)**2 + (y - 80)**2)**0.5
        alpha = max(0, min(90, int(90 - dist * 0.18)))
        draw.point((x, y), fill=(10, 132, 255, alpha))

# Brand Title
draw.text((320, 50), "TOCCATA OS 1.0", fill=(255, 255, 255, 240), anchor="mm")
draw.text((320, 75), "Unified Sovereign Desktop: pearOS + Zorin OS + GNOME 47", fill=(170, 185, 210, 200), anchor="mm")

# Inner glass container for Syslinux menu
draw.rounded_rectangle([(30, 120), (610, 440)], radius=12, fill=(20, 24, 34, 210), outline=(255, 255, 255, 45), width=1)

img.save("build/archiso/syslinux/splash.png", "PNG")
print("Toccata OS branded splash.png generated successfully!")
