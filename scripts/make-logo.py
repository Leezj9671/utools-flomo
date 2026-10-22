"""Render public/logo.png: a green rounded square with three memo lines (matches <Mark/>)."""
import pathlib

from PIL import Image, ImageDraw

SIZE, SCALE = 256, 4
S = SIZE * SCALE
out = pathlib.Path(__file__).resolve().parent.parent / "public" / "logo.png"

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# vertical gradient green square
top, bottom = (68, 182, 128), (40, 146, 98)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.28), fill=255)
grad = Image.new("RGBA", (S, S))
gd = ImageDraw.Draw(grad)
for y in range(S):
    t = y / (S - 1)
    gd.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
img.paste(grad, (0, 0), mask)

# memo lines, last one shorter
w = int(S * 0.075)
x0 = int(S * 0.297)
for y, x1 in ((0.344, 0.703), (0.5, 0.703), (0.656, 0.516)):
    yy = int(S * y)
    d.rounded_rectangle([x0 - w // 2, yy - w // 2, int(S * x1) + w // 2, yy + w // 2], radius=w // 2, fill="white")

img.resize((SIZE, SIZE), Image.LANCZOS).save(out)
print(out)
