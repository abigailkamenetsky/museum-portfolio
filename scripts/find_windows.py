"""
Locate Marble's window openings.

A window is the one thing in this room that is large AND bright: daylight through
glazing against a dark green wall. That separates it from everything else without
any tuning, which the sconces and the frames both needed.

    python3 scripts/find_windows.py /tmp/wallscan
"""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

DOWN = 4
MIN_AREA = 2600          # quarter res: a real opening, not a highlight
MIN_H = 60               # and tall


def main() -> None:
    root = Path(sys.argv[1]); out = []
    for e in json.loads((root / "manifest.json").read_text()):
        im = Image.open(root / e["file"]).convert("RGB")
        W, H = im.size
        s = np.asarray(im.resize((W // DOWN, H // DOWN), Image.BILINEAR), dtype=np.float32)
        lum = s[..., 0] * 0.30 + s[..., 1] * 0.59 + s[..., 2] * 0.11
        bright = lum > 78
        bright = ndimage.binary_closing(bright, np.ones((7, 7), bool))
        bright = ndimage.binary_opening(bright, np.ones((5, 5), bool))
        lab, _ = ndimage.label(bright)
        boxes = []
        for sl in ndimage.find_objects(lab):
            y_sl, x_sl = sl
            x0, x1, y0, y1 = x_sl.start, x_sl.stop, y_sl.start, y_sl.stop
            bw, bh = x1 - x0, y1 - y0
            if int((lab[sl] > 0).sum()) < MIN_AREA or bh < MIN_H:
                continue
            if bw > bh * 1.6:                       # openings are taller than wide
                continue
            if x0 < 12 or x1 > lum.shape[1] - 12:   # cut off at the frame edge
                continue
            # Grow DOWN to the sill. The bright mask stops where daylight falls
            # off behind the glazing bars, well above the actual opening, so the
            # box covered the arched head and missed the lower third. Walk down
            # the column while it stays brighter than the surrounding wall.
            col = lum[:, x0:x1]
            wall = float(np.median(lum[lum < 40])) if (lum < 40).any() else 12.0
            yy = y1
            while yy < lum.shape[0] - 1 and float(col[yy].mean()) > wall + 14:
                yy += 1
            y1 = yy
            boxes.append([x0 * DOWN, y0 * DOWN, x1 * DOWN, y1 * DOWN])
        dbg = im.copy(); d = ImageDraw.Draw(dbg)
        for b in boxes:
            d.rectangle(b, outline=(255, 120, 0), width=4)
        dbg.save(root / ("win_" + e["file"]))
        out.append({**e, "boxes": boxes})
        print(f"{e['file']}: {len(boxes)}", file=sys.stderr)
    (root / "window_boxes.json").write_text(json.dumps(out, indent=2))
    print(f"total {sum(len(o['boxes']) for o in out)}", file=sys.stderr)


if __name__ == "__main__":
    main()
