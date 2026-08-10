from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/udoka/Documents/retinaOS")
SOURCE = ROOT / "prediction-markets-truth-layer-background.png"
OUTPUT = ROOT / "prediction-markets-truth-layer-banner.png"
FONT = Path("/System/Library/Fonts/Supplemental/Arial Narrow Bold.ttf")


image = Image.open(SOURCE).convert("RGB")
draw = ImageDraw.Draw(image)

headline = [
    ("PREDICTION", "#F5F7F8"),
    ("MARKETS ARE", "#F5F7F8"),
    ("BECOMING THE", "#F5F7F8"),
    ("INTERNET’S", "#F5F7F8"),
    ("REAL-TIME", "#B8FF00"),
    ("TRUTH LAYER", "#B8FF00"),
]

font = ImageFont.truetype(str(FONT), 76)
x = 82
y = 218
line_height = 83

for line, color in headline:
    draw.text((x + 2, y + 3), line, font=font, fill="#000000", stroke_width=1)
    draw.text((x, y), line, font=font, fill=color)
    y += line_height

image.save(OUTPUT, quality=96)
print(OUTPUT)
