"""
Find Marble's painted picture frames in the wall-scan screenshots.

The first pass keyed on "warm and bright" and found window mullions, because
Marble's glazing bars are warm brown wood and read exactly like gold leaf. The
second keyed on "interior darker than border", which fails because half of
Marble's paintings are bright landscapes.

The test that actually holds is the colour of what the gilt encloses:

    a picture frame encloses WARM paint  (r > g > b, varnish under candlelight)
    a window encloses foliage or sky     (g >= r, or bright and desaturated)

So: mask gold, close the gaps so a fragmented border becomes one ring, take
bounding boxes, then keep only boxes whose interior is warm. Cornice and
capitals fall out on aspect ratio and on touching the top edge; sconce flames
fall out on size.

Outputs image-space boxes. Converting those to world positions is a separate
step (scripts/raycast_frames.mjs), because Marble's walls bow and intersecting
a flat plane drifts by tens of centimetres.

    python3 scripts/detect_frames_shots.py /tmp/wallscan
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

DOWN = 4                 # detect at quarter res; frames are hundreds of px wide
MIN_SIDE = 18            # quarter res, so ~72px full res
MAX_SIDE = 190           # quarter res, so 760px: bigger is architecture
MAX_ASPECT = 3.4
CLOSE = 5                # bridges gaps in a fragmented gilt border
MIN_WARMTH = 10          # interior mean r minus mean g
MAX_INTERIOR_L = 210     # a blown-out middle is sky, however warm it reads


def main() -> None:
    root = Path(sys.argv[1])
    manifest = json.loads((root / "manifest.json").read_text())
    found = []

    for entry in manifest:
        im = Image.open(root / entry["file"]).convert("RGB")
        W, H = im.size
        small = np.asarray(im.resize((W // DOWN, H // DOWN), Image.BILINEAR), dtype=np.int16)
        r, g, b = small[..., 0], small[..., 1], small[..., 2]
        lum = (r * 0.30 + g * 0.59 + b * 0.11)

        gold = (lum > 60) & (lum < 252) & (r > b + 34) & (r >= g - 8) & (g > b + 6)
        gold = ndimage.binary_closing(gold, np.ones((CLOSE, CLOSE), bool))

        lab, n = ndimage.label(gold)
        boxes = []
        for y_sl, x_sl in ndimage.find_objects(lab):
            x0, x1, y0, y1 = x_sl.start, x_sl.stop, y_sl.start, y_sl.stop
            bw, bh = x1 - x0, y1 - y0
            if not (MIN_SIDE <= bw <= MAX_SIDE and MIN_SIDE <= bh <= MAX_SIDE):
                continue
            if max(bw / bh, bh / bw) > MAX_ASPECT:
                continue
            if y0 <= 1:                          # welded to the cornice
                continue

            # interior = middle half of the box, safely inside the gilt border
            ix0, ix1 = x0 + bw // 4, x1 - bw // 4
            iy0, iy1 = y0 + bh // 4, y1 - bh // 4
            if (ix1 - ix0) * (iy1 - iy0) < 16:
                continue
            ir = float(r[iy0:iy1, ix0:ix1].mean())
            ig = float(g[iy0:iy1, ix0:ix1].mean())
            ib = float(b[iy0:iy1, ix0:ix1].mean())
            il = float(lum[iy0:iy1, ix0:ix1].mean())
            if il > MAX_INTERIOR_L:
                continue
            if ir - ig < MIN_WARMTH or ig < ib:
                continue

            boxes.append({
                "px": [x0 * DOWN, y0 * DOWN, x1 * DOWN, y1 * DOWN],
                "warmth": round(ir - ig, 1),
                "interior": round(il, 1),
            })

        dbg = im.copy()
        d = ImageDraw.Draw(dbg)
        for bx in boxes:
            x0, y0, x1, y1 = bx["px"]
            d.rectangle([x0, y0, x1, y1], outline=(255, 0, 200), width=3)
            d.text((x0 + 4, y0 + 4), f'w{bx["warmth"]} i{bx["interior"]}', fill=(255, 240, 120))
        dbg.save(root / ("dbg_" + entry["file"]))

        found.append({**entry, "boxes": boxes})
        print(f"{entry['file']}: {len(boxes)}", file=sys.stderr)

    (root / "boxes.json").write_text(json.dumps(found, indent=2))
    print(f"total {sum(len(f['boxes']) for f in found)} boxes", file=sys.stderr)


if __name__ == "__main__":
    main()
