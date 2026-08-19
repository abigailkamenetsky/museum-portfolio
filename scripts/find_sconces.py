"""
Locate Marble's wall sconces so ours can be placed over them.

A lit sconce is unmistakable in the wall scans: a small, very bright, strongly
warm blob against a dark green wall. That is a much cleaner signature than the
picture frames were, because nothing else in the room is both that bright and
that small.

    python3 scripts/find_sconces.py /tmp/wallscan
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

DOWN = 4
MIN_PX, MAX_PX = 12, 900        # at quarter res: a flame cluster, not a window
MAX_ASPECT = 3.5


def main() -> None:
    root = Path(sys.argv[1])
    manifest = json.loads((root / "manifest.json").read_text())
    out = []
    for e in manifest:
        im = Image.open(root / e["file"]).convert("RGB")
        W, H = im.size
        s = np.asarray(im.resize((W // DOWN, H // DOWN), Image.BILINEAR), dtype=np.float32)
        r, g, b = s[..., 0], s[..., 1], s[..., 2]
        lum = r * 0.30 + g * 0.59 + b * 0.11
        hot = (lum > 118) & (r > b + 45) & (r >= g)
        hot = ndimage.binary_closing(hot, np.ones((3, 3), bool))
        lab, _ = ndimage.label(hot)
        boxes = []
        for sl in ndimage.find_objects(lab):
            y_sl, x_sl = sl
            x0, x1, y0, y1 = x_sl.start, x_sl.stop, y_sl.start, y_sl.stop
            bw, bh = x1 - x0, y1 - y0
            n = int((lab[sl] > 0).sum())
            if not (MIN_PX <= n <= MAX_PX):
                continue
            if max(bw / max(bh, 1), bh / max(bw, 1)) > MAX_ASPECT:
                continue
            boxes.append([x0 * DOWN, y0 * DOWN, x1 * DOWN, y1 * DOWN])
        dbg = im.copy()
        d = ImageDraw.Draw(dbg)
        for x0, y0, x1, y1 in boxes:
            d.rectangle([x0, y0, x1, y1], outline=(0, 255, 255), width=3)
        dbg.save(root / ("sconce_" + e["file"]))
        out.append({**e, "boxes": boxes})
        print(f"{e['file']}: {len(boxes)}", file=sys.stderr)
    (root / "sconce_boxes.json").write_text(json.dumps(out, indent=2))
    print(f"total {sum(len(o['boxes']) for o in out)}", file=sys.stderr)


if __name__ == "__main__":
    main()
