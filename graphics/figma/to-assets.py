"""Turn the PNGs the fill scripts exported into the funnel's graphics, at the sizes the page expects.

Usage, from the repository root:
  python3 graphics/figma/to-assets.py <course-prefix> <brand-slug>
    <course-prefix>  the "export.prefix" of the course portal brief (files <prefix>-laptop@2x.png ...)
    <brand-slug>     the info brand brief's brand in lower-case-with-dashes (files <slug>-coaching@2x.png ...)
Reads graphics/figma/exports/, writes WebP files into assets/graphics/. Needs Pillow (pip install pillow).
Missing exports are skipped, so run it after either script, or both.
"""
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXPORTS = os.path.join(ROOT, 'graphics', 'figma', 'exports')
ASSETS = os.path.join(ROOT, 'assets', 'graphics')

course, brand = (sys.argv[1:3] + ['', ''])[:2]
# exported file -> (asset name, width the page uses)
MAP = [
    (f'{course}-laptop@2x.png', 'course-portal-laptop.webp', 828),
    (f'{course}-tablet@2x.png', 'course-portal-tablet.webp', 404),
    (f'{course}-phone@2x.png', 'course-portal-phone.webp', 168),
    (f'{course}-all-devices@2x.png', 'course-portal-devices.webp', 992),
    (f'{brand}-modules@2x.png', 'course-modules.webp', 611),
    (f'{brand}-coaching@2x.png', 'group-coaching-call.webp', 616),
    (f'{brand}-community@2x.png', 'community-members.webp', 658),
    (f'{brand}-support@2x.png', 'support-chat.webp', 996),
    (f'{brand}-oneOnOne@2x.png', 'one-on-one-call.webp', 640),
]
done = 0
for src, dst, width in MAP:
    path = os.path.join(EXPORTS, src)
    if not os.path.exists(path):
        continue
    im = Image.open(path).convert('RGBA')
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(os.path.join(ASSETS, dst), quality=88, method=6)
    print(f'{src} -> assets/graphics/{dst} ({im.width}x{im.height})')
    done += 1
print(f'{done} graphics written. The video call grid, the bundle shot and the bonus boxes are exported by hand (see graphics/README.md).')
