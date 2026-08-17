"""
Merge free-wall patches into the frame-slot list, so all 40 pieces can hang.

Marble painted 29 frames and Abby has 40 pieces. Since each painting now carries
its own carved moulding, the extra 11 do not need a painted frame underneath,
only clear flat wall, which is what find_free_wall.py located.

Selection is deliberately conservative: a patch has to be flat (a low depth
spread across its corners, so it is not straddling a pilaster or a window
reveal), inside the hangable band between dado and cornice, clear of every
existing slot, and clear of every other patch chosen. Among the survivors the
sharp middle of the hall wins, because that is where Marble's reconstruction
holds up.

    python3 scripts/add_free_slots.py /tmp/wallscan /tmp/free <count>
"""
import json
import sys
from pathlib import Path

MAX_SPREAD = 0.09      # corners must land on one plane: higher means a recess
Y_LO, Y_HI = 1.35, 5.00
MIN_W, MIN_H = 0.55, 0.60
GAP = 0.22             # clear metres required between neighbouring frames


def sharpness(z: float) -> float:
    """Measured detail along the hall; see the wall-scan survey."""
    if 5 >= z >= -15:
        return 2.0
    if 11 >= z > 5 or -15 > z >= -19:
        return 1.0
    return 0.0


def overlaps(a, b) -> bool:
    if a["side"] != b["side"]:
        return False
    dz = abs(a["z"] - b["z"]) - (a["w"] + b["w"]) / 2
    dy = abs(a["y"] - b["y"]) - (a["h"] + b["h"]) / 2
    return dz < GAP and dy < GAP


def main() -> None:
    slots_path = Path("src/data/frameSlots.json")
    existing = json.loads(slots_path.read_text())
    want = int(sys.argv[3]) if len(sys.argv) > 3 else 11

    hits = [h for h in json.loads((Path(sys.argv[2]) / "raycast.json").read_text())
            if not h.get("miss")]

    cands = []
    for h in hits:
        if h["spread"] > MAX_SPREAD:
            continue
        if not (Y_LO <= h["y"] <= Y_HI):
            continue
        if h["w"] < MIN_W or h["h"] < MIN_H:
            continue
        cands.append({
            "side": -1 if h["x"] < 0 else 1,
            "x": h["x"], "y": h["y"], "z": h["z"],
            "w": round(h["w"], 3), "h": round(h["h"], 3),
            "seen": 1, "spread": h["spread"], "kind": "free",
        })

    # best first: sharp wall, then large, then flattest
    cands.sort(key=lambda c: (-sharpness(c["z"]), -(c["w"] * c["h"]), c["spread"]))

    chosen = []
    for c in cands:
        if len(chosen) >= want:
            break
        if any(overlaps(c, e) for e in existing):
            continue
        if any(overlaps(c, k) for k in chosen):
            continue
        chosen.append(c)

    for e in existing:
        e.setdefault("kind", "marble")
    merged = existing + chosen
    merged.sort(key=lambda s: (s["side"], -s["z"], -s["y"]))
    slots_path.write_text(json.dumps(merged, indent=2) + "\n")

    zones = {2.0: "sharp", 1.0: "ok", 0.0: "soft"}
    from collections import Counter
    print(f"{len(cands)} usable free patches, added {len(chosen)}, total {len(merged)}",
          file=sys.stderr)
    print("  added by zone: "
          + str(dict(Counter(zones[sharpness(c['z'])] for c in chosen))), file=sys.stderr)
    print("  all slots by zone: "
          + str(dict(Counter(zones[sharpness(s['z'])] for s in merged))), file=sys.stderr)


if __name__ == "__main__":
    main()
