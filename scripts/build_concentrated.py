"""
Build the concentrated hang: all 40 pieces inside the sharp band.

Marble's reconstruction only holds up between z +5 and -15, and 18 of the 40
paintings currently sit outside it on soft wall. This packs every piece into that
20m stretch instead, which is 40m of wall run across both walls and supports
three tiers, the salon hang the Mauritshuis actually uses.

Marble's own painted frames are preferred over bare wall, then the biggest and
flattest patches, so the best 40 of the candidates win rather than the first 40.

    python3 scripts/build_concentrated.py /tmp/sharp > src/data/frameSlotsConcentrated.json
"""
import json
import sys
from pathlib import Path

SHARP_HI, SHARP_LO = 6.0, -17.0   # detail survey: 40+ down to -15, still ~30 at -17
MAX_SPREAD = 0.09
Y_LO, Y_HI = 1.30, 5.05
MIN_W, MIN_H = 0.55, 0.60
GAP = 0.12          # tighter than the spread-out hang: this is a salon wall


def overlaps(a, b):
    if a["side"] != b["side"]:
        return False
    dz = abs(a["z"] - b["z"]) - (a["w"] + b["w"]) / 2
    dy = abs(a["y"] - b["y"]) - (a["h"] + b["h"]) / 2
    return dz < GAP and dy < GAP


def main() -> None:
    want = 40
    existing = json.loads(Path("src/data/frameSlots.json").read_text())
    marble = [s for s in existing
              if s.get("kind", "marble") == "marble" and SHARP_HI >= s["z"] >= SHARP_LO]
    for m in marble:
        m["kind"] = "marble"

    hits = [h for h in json.loads((Path(sys.argv[1]) / "raycast.json").read_text())
            if not h.get("miss")]
    free = []
    for h in hits:
        if h["spread"] > MAX_SPREAD or not (Y_LO <= h["y"] <= Y_HI):
            continue
        if h["w"] < MIN_W or h["h"] < MIN_H or not (SHARP_HI >= h["z"] >= SHARP_LO):
            continue
        free.append({
            "side": -1 if h["x"] < 0 else 1,
            "x": h["x"], "y": h["y"], "z": h["z"],
            "w": round(h["w"], 3), "h": round(h["h"], 3),
            "seen": 1, "spread": h["spread"], "kind": "free",
        })
    # biggest and flattest first
    free.sort(key=lambda c: (-(c["w"] * c["h"]), c["spread"]))

    chosen = []
    for c in marble + free:            # Marble's real frames get first refusal
        if len(chosen) >= want:
            break
        if any(overlaps(c, k) for k in chosen):
            continue
        chosen.append(c)

    # Top up from the wider hall if the band cannot take all 40, nearest-first so
    # anything that has to sit outside sits as close to the sharp wall as it can.
    if len(chosen) < want:
        outside = [s for s in existing if not (SHARP_HI >= s["z"] >= SHARP_LO)]
        outside.sort(key=lambda s: min(abs(s["z"] - SHARP_HI), abs(s["z"] - SHARP_LO)))
        for c in outside:
            if len(chosen) >= want:
                break
            if any(overlaps(c, k) for k in chosen):
                continue
            c = {**c, "kind": c.get("kind", "marble") + "-outside"}
            chosen.append(c)

    chosen.sort(key=lambda s: (s["side"], -s["z"], -s["y"]))
    print(json.dumps(chosen, indent=2))

    from collections import Counter
    print(f"{len(chosen)} of {want} placed "
          f"({len(marble)} Marble frames + {len(free)} free patches available)", file=sys.stderr)
    print("  by kind: " + str(dict(Counter(c["kind"] for c in chosen))), file=sys.stderr)
    zs = [c["z"] for c in chosen]
    print(f"  z span {min(zs):.1f} .. {max(zs):.1f}", file=sys.stderr)


if __name__ == "__main__":
    main()
