"""
Merge raycast hits from overlapping stations into one frame-slot list.

Each frame is usually seen from two or three stations. Those readings agree to
within a few centimetres now, so averaging them is both a merge and a check: the
spread it prints is the honest error bar on the whole pipeline.

    python3 scripts/merge_slots.py /tmp/wallscan > src/data/frameSlots.json
"""
import json
import sys
from pathlib import Path

MERGE_Z = 0.55      # two readings closer than this along the hall are one frame
MERGE_Y = 0.55


def main() -> None:
    root = Path(sys.argv[1])
    hits = [h for h in json.loads((root / "raycast.json").read_text()) if not h.get("miss")]

    clusters = []
    for h in hits:
        side = -1 if h["x"] < 0 else 1
        for c in clusters:
            if c["side"] == side and abs(c["z"] - h["z"]) < MERGE_Z and abs(c["y"] - h["y"]) < MERGE_Y:
                c["members"].append(h)
                c["z"] = sum(m["z"] for m in c["members"]) / len(c["members"])
                c["y"] = sum(m["y"] for m in c["members"]) / len(c["members"])
                break
        else:
            clusters.append({"side": side, "z": h["z"], "y": h["y"], "members": [h]})

    slots = []
    for c in sorted(clusters, key=lambda c: (c["side"], -c["z"])):
        ms = c["members"]
        n = len(ms)
        avg = lambda k: sum(m[k] for m in ms) / n
        spread = max(abs(m["z"] - c["z"]) for m in ms) if n > 1 else 0.0
        slots.append({
            "side": c["side"],
            "x": round(avg("x"), 3),
            "y": round(avg("y"), 3),
            "z": round(avg("z"), 3),
            "w": round(avg("w"), 3),
            "h": round(avg("h"), 3),
            "seen": n,
            "spread": round(spread, 3),
        })

    print(json.dumps(slots, indent=2))
    worst = max((s["spread"] for s in slots), default=0)
    multi = sum(1 for s in slots if s["seen"] > 1)
    print(f"{len(slots)} slots ({multi} confirmed by 2+ stations), worst spread {worst:.3f} m",
          file=sys.stderr)


if __name__ == "__main__":
    main()
