"""Warp a flat cover onto the Product box/Blank front face (perspective), output a 2x overlay (3000x4000)."""
import sys
import numpy as np
from PIL import Image, ImageDraw

S = 2  # output scale vs the 1500x2000 frame
# front face corners in the Product box/Blank frame (1500x2000), inset ~3px
QUAD = [(306, 97), (1328, 216), (1335, 1813), (306, 1891)]  # TL, TR, BR, BL

def coeffs(dst, src):
    # PIL PERSPECTIVE wants the map from output (dst) coords to input (src) coords
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    return np.linalg.solve(np.array(A, float), np.array(B, float)).tolist()

def warp(cover_path, out_path):
    cov = Image.open(cover_path).convert('RGBA')
    w, h = cov.size
    W, H = 1500 * S, 2000 * S
    dst = [(x * S, y * S) for x, y in QUAD]
    src = [(0, 0), (w, 0), (w, h), (0, h)]
    warped = cov.transform((W, H), Image.PERSPECTIVE, coeffs(dst, src), Image.BICUBIC)
    # antialiased quad mask at 4x
    k = 4
    m = Image.new('L', (W * k, H * k), 0)
    ImageDraw.Draw(m).polygon([(x * k, y * k) for x, y in dst], fill=255)
    m = m.resize((W, H), Image.LANCZOS)
    a = np.minimum(np.array(warped)[..., 3], np.array(m))
    arr = np.array(warped); arr[..., 3] = a
    Image.fromarray(arr).save(out_path, optimize=True)

if __name__ == '__main__':
    warp(sys.argv[1], sys.argv[2])
