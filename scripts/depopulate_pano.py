"""
Remove marble statuary from a Marble panorama.

Marble builds a world from a panorama, so anything in the panorama comes back in
the 3D room. Telling it "no statues" in the text prompt does not work: the image
dominates, and v6 generated them anyway.

White marble reads as bright and desaturated against this room's dark green and
walnut, so the statues can be found by that signature and painted out. Fill
comes from neighbouring floor and wall pixels, never flat colour, because a
black patch would reconstruct as a void in the 3D lift.

    python3 scripts/depopulate_pano.py in.png out.png [preview.jpg]
"""
import sys
from pathlib import Path

from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None

BAND = (0.40, 0.76)      # vertical slice of the equirect holding floor + lower wall
BRIGHT = 118             # marble is far brighter than the walls or parquet
BRIGHT_MAX = 205         # ...but daylight through the windows is brighter still
SAT_MAX = 42             # and close to neutral, unlike the gilt frames
GROW = 9                 # dilate so edges and pedestals go too


def statue_mask(im: Image.Image) -> Image.Image:
    w, h = im.size
    px = im.load()
    mask = Image.new("L", (w, h), 0)
    mp = mask.load()
    y0, y1 = int(h * BAND[0]), int(h * BAND[1])
    for y in range(y0, y1):
        for x in range(w):
            r, g, b = px[x, y]
            v = (r + g + b) / 3
            if v < BRIGHT or v > BRIGHT_MAX:      # skip walls/parquet and blown-out windows
                continue
            if max(r, g, b) - min(r, g, b) > SAT_MAX:   # gilding, not marble
                continue
            mp[x, y] = 255
    return mask.filter(ImageFilter.MaxFilter(GROW)).filter(ImageFilter.GaussianBlur(4))


def main() -> None:
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    im = Image.open(src).convert("RGB")
    mask = statue_mask(im)

    # Fill by cloning the panorama shifted sideways. At the same height an
    # equirect holds the same kind of surface (wall, dado, floor), so this
    # patches with real texture. Blurring only softened the statues into
    # statue-shaped smudges, which Marble happily reconstructed as statues.
    w, _ = im.size
    fill = Image.new("RGB", im.size)
    shift = w // 6
    fill.paste(im.crop((shift, 0, w, im.size[1])), (0, 0))
    fill.paste(im.crop((0, 0, shift, im.size[1])), (w - shift, 0))
    # a light blur hides the seam between cloned and original texture
    out = Image.composite(fill.filter(ImageFilter.GaussianBlur(2)), im, mask)

    out.save(dst)
    covered = sum(mask.getdata()) / 255 / (im.size[0] * im.size[1]) * 100
    print(f"masked {covered:.2f}% of the panorama")
    print(f"written {dst}")

    if len(sys.argv) > 3:
        cmp = Image.new("RGB", (im.size[0], im.size[1] * 2))
        cmp.paste(im, (0, 0)); cmp.paste(out, (0, im.size[1]))
        cmp.thumbnail((1400, 1400))
        cmp.save(sys.argv[3], quality=92)


if __name__ == "__main__":
    main()
