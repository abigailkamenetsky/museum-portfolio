"""
Derive frame slots from the Marble panorama.

Marble paints its picture frames into the texture, so there is no geometry to
measure. But the panorama is equirectangular: every pixel is a known ray from
the capture point, and a ray intersecting the wall plane gives a real 3D
position. Gilt frames are bright and strongly warm against dark green walls,
which makes them findable.

Emits frame slots in WORLD space, already through the museumWorldRoot transform
(scale, rotation.x = PI, position.y), so they can be pasted into the registry.

    python3 scripts/detect_frames.py panorama.png > src/data/frameSlots.json
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

WALL_X_RAW = 1.07        # measured from the collider: walls sit here pre-scale
SCALE = 4.0              # museumWorldRoot scale
POS_Y = 2.4              # museumWorldRoot position.y, applied after rotation.x = PI
STEP = 6                 # pixel stride; frames are large, so this is plenty
MIN_PX = 900             # ignore specks and candle flames


def is_gilt(r: int, g: int, b: int) -> bool:
    """Gold: bright, warm, and clearly not the green wall or white marble."""
    v = (r + g + b) / 3
    return 88 < v < 235 and r > b + 26 and r >= g >= b


def ray(u: float, v: float) -> tuple[float, float, float]:
    """Equirect pixel fraction -> unit direction."""
    lon = (u - 0.5) * 2 * math.pi
    lat = (0.5 - v) * math.pi
    return (math.cos(lat) * math.sin(lon), math.sin(lat), math.cos(lat) * math.cos(lon))


def main() -> None:
    im = Image.open(sys.argv[1]).convert("RGB")
    W, H = im.size
    px = im.load()

    # collect gilt pixels that actually hit a side wall
    pts = []
    for y in range(int(H * 0.30), int(H * 0.62), STEP):
        for x in range(0, W, STEP):
            if not is_gilt(*px[x, y]):
                continue
            dx, dy, dz = ray(x / W, y / H)
            if abs(dx) < 0.28:            # grazing the wall, or aimed down the hall
                continue
            t = WALL_X_RAW / abs(dx)
            if t <= 0 or t > 12:
                continue
            side = 1 if dx > 0 else -1
            pts.append((side, t * dy, t * dz, x, y))

    # cluster per wall by position along the hall and height
    slots = []
    for side in (-1, 1):
        wall = [p for p in pts if p[0] == side]
        clusters = []
        for _, wy, wz, _, _ in wall:
            for c in clusters:
                if abs(c["z"] - wz) < 0.55 and abs(c["y"] - wy) < 0.55:
                    c["y0"] = min(c["y0"], wy); c["y1"] = max(c["y1"], wy)
                    c["z0"] = min(c["z0"], wz); c["z1"] = max(c["z1"], wz)
                    c["y"] = (c["y0"] + c["y1"]) / 2
                    c["z"] = (c["z0"] + c["z1"]) / 2
                    c["n"] += 1
                    break
            else:
                clusters.append({"y": wy, "z": wz, "y0": wy, "y1": wy,
                                 "z0": wz, "z1": wz, "n": 1})
        for c in clusters:
            if c["n"] * STEP * STEP < MIN_PX:
                continue
            # raw -> world: scale, then rotation.x = PI (negates y and z), then +POS_Y
            wx = side * WALL_X_RAW * SCALE
            wy = -c["y"] * SCALE + POS_Y
            wz = -c["z"] * SCALE
            h = (c["y1"] - c["y0"]) * SCALE
            w = (c["z1"] - c["z0"]) * SCALE
            if h < 0.35 or w < 0.35:
                continue
            slots.append({
                "side": side, "position": [round(wx, 2), round(wy, 2), round(wz, 2)],
                "interiorWidth": round(w, 2), "interiorHeight": round(h, 2),
            })

    slots.sort(key=lambda s: (s["side"], -s["position"][2]))
    print(json.dumps(slots, indent=2))
    print(f"\n{len(slots)} frame slots", file=sys.stderr)


if __name__ == "__main__":
    main()
