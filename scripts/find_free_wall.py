"""
Find clear stretches of wall to hang extra paintings on.

Marble only painted 29 frames, and Abby has 40 pieces. Fitting INSIDE Marble's
painted frames was only ever a constraint because our canvases had no frame of
their own; now that each painting carries real carved moulding, any clear patch
of wall is hangable, including above and below the existing rows.

Bare wall in these scans is unmistakable: it is dark and it is smooth. Every
picture frame, window, sconce, capital and cornice carries detail, so a local
standard deviation threshold separates them cleanly (measured: bare wall sd 3-7,
everything else sd > 15).

Emits image-space boxes for scripts/raycast_frames.mjs to turn into world slots.

    python3 scripts/find_free_wall.py /tmp/wallscan
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

MAX_LUM = 30            # bare wall sits at 7-12; allow headroom for sconce spill
MAX_SD = 11             # bare wall 3-7, any ornament or artwork is well above
WIN = 9                 # local window for the std, in downsampled pixels
DOWN = 4

# candidate painting sizes in FULL-res pixels (~6.2mm/px across, 7.3mm/px up)
SIZES = [(190, 210), (165, 175), (140, 150), (120, 125), (100, 108), (86, 92)]
# Large panels for resurfacing blurred wall, rather than hanging something on it
PANEL_SIZES = [(560, 420), (430, 380), (330, 300), (250, 240)]
MARGIN = 9              # clear border required around a candidate, full-res px
X_LO, X_HI = 190, 1410  # ignore the extreme edges: too oblique to measure well


def main() -> None:
    root = Path(sys.argv[1])
    global PANELS
    PANELS = len(sys.argv) > 2 and sys.argv[2] == "panels"
    manifest = json.loads((root / "manifest.json").read_text())
    out = []

    for entry in manifest:
        im = Image.open(root / entry["file"]).convert("RGB")
        W, H = im.size
        small = np.asarray(im.resize((W // DOWN, H // DOWN), Image.BILINEAR), dtype=np.float32)
        lum = small[..., 0] * 0.30 + small[..., 1] * 0.59 + small[..., 2] * 0.11

        mean = ndimage.uniform_filter(lum, WIN)
        sq = ndimage.uniform_filter(lum * lum, WIN)
        sd = np.sqrt(np.maximum(0.0, sq - mean * mean))

        free = (lum < MAX_LUM) & (sd < MAX_SD)
        # integral image so a rectangle's fill fraction is O(1)
        integ = free.astype(np.int32).cumsum(0).cumsum(1)

        def filled(x0, y0, x1, y1):
            x0, y0 = max(0, x0), max(0, y0)
            x1, y1 = min(free.shape[1] - 1, x1), min(free.shape[0] - 1, y1)
            if x1 <= x0 or y1 <= y0:
                return 0.0
            tot = (integ[y1, x1] - integ[y0, x1] - integ[y1, x0] + integ[y0, x0])
            return tot / float((x1 - x0) * (y1 - y0))

        taken = []
        boxes = []
        for bw, bh in (PANEL_SIZES if PANELS else SIZES):                       # largest first
            sw, sh = bw // DOWN, bh // DOWN
            m = MARGIN // DOWN
            step = max(6, sw // 3)
            for y in range(m, free.shape[0] - sh - m, step):
                for x in range(X_LO // DOWN, min(X_HI // DOWN, free.shape[1]) - sw - m, step):
                    # the painting's own footprint AND a clear margin around it
                    if filled(x - m, y - m, x + sw + m, y + sh + m) < 0.985:
                        continue
                    box = (x * DOWN, y * DOWN, (x + sw) * DOWN, (y + sh) * DOWN)
                    if any(not (box[2] < t[0] or box[0] > t[2] or box[3] < t[1] or box[1] > t[3])
                           for t in taken):
                        continue
                    taken.append(box)
                    boxes.append(list(box))

        dbg = im.copy()
        d = ImageDraw.Draw(dbg)
        for x0, y0, x1, y1 in boxes:
            d.rectangle([x0, y0, x1, y1], outline=(0, 220, 255), width=3)
        dbg.save(root / (("panel_" if PANELS else "free_") + entry["file"]))

        out.append({**entry, "boxes": boxes})
        print(f"{entry['file']}: {len(boxes)} free patches", file=sys.stderr)

    (root / ("panel_boxes.json" if PANELS else "free_boxes.json")).write_text(json.dumps(out, indent=2))
    print(f"total {sum(len(o['boxes']) for o in out)}", file=sys.stderr)


if __name__ == "__main__":
    main()
