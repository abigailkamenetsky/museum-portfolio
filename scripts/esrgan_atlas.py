"""
Enhance a Marble mesh texture atlas with Real-ESRGAN.

Marble's textured mesh is derived from its Gaussian splat, so the atlas is soft:
a door occupying 400x400 real pixels still has no crisp edges. That softness,
not geometry, is what makes the room look blurry, so improving the atlas
improves every surface at once.

Upscaling 8192 by 4x would produce a 32768px image (several GB), so this works
in tiles: each tile is upscaled 4x then resampled back down. The downsample
keeps the detail ESRGAN synthesised while holding the atlas at its original
size, which matters because texture dimensions are capped on mobile GPUs.

Tiles overlap and are centre-cropped, otherwise ESRGAN's edge handling leaves
visible seams every tile boundary.

    python3 scripts/esrgan_atlas.py in.png out.png [tile] [model]
"""
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

BIN = Path("/Applications/Upscayl.app/Contents/Resources/bin/upscayl-bin")
MODELS = Path("/Applications/Upscayl.app/Contents/Resources/models")
SCALE = 4
OVERLAP = 64          # source pixels of context on each side, discarded after


def upscale(src: Path, dst: Path, model: str) -> None:
    subprocess.run(
        [str(BIN), "-i", str(src), "-o", str(dst),
         "-m", str(MODELS), "-n", model, "-s", str(SCALE)],
        check=True, capture_output=True,
    )


def main() -> None:
    src_path, dst_path = Path(sys.argv[1]), Path(sys.argv[2])
    tile = int(sys.argv[3]) if len(sys.argv) > 3 else 2048
    model = sys.argv[4] if len(sys.argv) > 4 else "high-fidelity-4x"

    atlas = Image.open(src_path).convert("RGB")
    W, H = atlas.size
    out = Image.new("RGB", (W, H))
    cols, rows = (W + tile - 1) // tile, (H + tile - 1) // tile
    print(f"atlas {W}x{H}  tiles {cols}x{rows} of {tile}px  model {model}", flush=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        n = 0
        for ry in range(rows):
            for rx in range(cols):
                x0, y0 = rx * tile, ry * tile
                # expand by OVERLAP so ESRGAN sees context past the seam
                ex0, ey0 = max(0, x0 - OVERLAP), max(0, y0 - OVERLAP)
                ex1, ey1 = min(W, x0 + tile + OVERLAP), min(H, y0 + tile + OVERLAP)
                piece = atlas.crop((ex0, ey0, ex1, ey1))
                pin, pout = tmp / "in.png", tmp / "out.png"
                piece.save(pin)
                upscale(pin, pout, model)
                big = Image.open(pout).convert("RGB")
                # drop the context margin, then return to source scale
                cx0, cy0 = (x0 - ex0) * SCALE, (y0 - ey0) * SCALE
                cw, ch = min(tile, W - x0), min(tile, H - y0)
                big = big.crop((cx0, cy0, cx0 + cw * SCALE, cy0 + ch * SCALE))
                out.paste(big.resize((cw, ch), Image.LANCZOS), (x0, y0))
                n += 1
                print(f"  tile {n}/{cols*rows}", flush=True)

    out.save(dst_path)
    print(f"written {dst_path}", flush=True)


if __name__ == "__main__":
    main()
