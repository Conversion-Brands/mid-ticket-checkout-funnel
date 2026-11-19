#!/usr/bin/env python3
"""Pick a brand colour from a logo file (PNG, JPG, WEBP or SVG).

Usage: python3 brand_color.py path/to/logo.png
Prints JSON: {"brandHex": "#1F6FEB", "candidates": [...], "neutralOnly": false}

Rules: ignore transparent pixels and near-neutral colours (white, black, greys,
low saturation); weight the rest by pixel count times saturation; return the top
colour. When the logo is only black/white/grey, neutralOnly is true and the
caller should ask for a brand colour (or keep the template accent).
"""
import colorsys
import json
import re
import sys
from collections import Counter


def is_neutral(r, g, b):
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    return s < 0.18 or l < 0.08 or l > 0.94


def from_svg(text):
    found = Counter()
    for m in re.finditer(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', text):
        h = m.group(1)
        if len(h) == 3:
            h = ''.join(c * 2 for c in h)
        found[h.upper()] += 1
    for m in re.finditer(r'rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)', text):
        found['%02X%02X%02X' % tuple(int(x) for x in m.groups())] += 1
    scored = []
    for h, n in found.items():
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        if is_neutral(r, g, b):
            continue
        s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)[2]
        scored.append((n * (0.5 + s), '#' + h))
    return sorted(scored, reverse=True)


def from_raster(path):
    from PIL import Image
    im = Image.open(path).convert('RGBA')
    im.thumbnail((256, 256))
    px = [p for p in im.getdata() if p[3] > 200]
    if not px:
        return []
    q = Image.new('RGB', (len(px), 1))
    q.putdata([p[:3] for p in px])
    q = q.quantize(colors=12, method=Image.Quantize.MEDIANCUT).convert('RGB')
    counts = Counter(q.getdata())
    scored = []
    for (r, g, b), n in counts.items():
        if is_neutral(r, g, b):
            continue
        s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)[2]
        scored.append((n * (0.5 + s), '#%02X%02X%02X' % (r, g, b)))
    return sorted(scored, reverse=True)


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    path = sys.argv[1]
    if path.lower().endswith('.svg'):
        with open(path, encoding='utf-8', errors='ignore') as f:
            scored = from_svg(f.read())
    else:
        scored = from_raster(path)
    out = {
        'brandHex': scored[0][1] if scored else None,
        'candidates': [h for _, h in scored[:5]],
        'neutralOnly': not scored,
    }
    print(json.dumps(out))


if __name__ == '__main__':
    main()
