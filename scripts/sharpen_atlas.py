"""
Sharpen a Marble mesh's texture atlas.

Marble's textured mesh is derived from its Gaussian splat, so the atlas itself
is soft: a door occupying 400x400 real pixels still has no crisp edges. That
softness, not geometry, is what makes the room look blurry. Recovering apparent
detail in the atlas therefore improves the whole room at once.

Unsharp masking only amplifies detail that survived; it cannot invent what was
never captured. A learned upscaler (Real-ESRGAN) would hallucinate plausible
micro-detail and do better, at the cost of a heavier toolchain.

    python3 scripts/sharpen_atlas.py in_atlas.png out_atlas.png
"""
import sys
from PIL import Image, ImageFilter, ImageEnhance

Image.MAX_IMAGE_PIXELS = None   # 8192x8192 exceeds Pillow's decompression guard


def sharpen(img: Image.Image) -> Image.Image:
    # coarse pass rebuilds edge contrast, fine pass restores micro-detail
    out = img.filter(ImageFilter.UnsharpMask(radius=2.0, percent=140, threshold=2))
    out = ImageEnhance.Contrast(out).enhance(1.08)
    return out.filter(ImageFilter.UnsharpMask(radius=0.8, percent=90, threshold=1))


def main() -> None:
    src, dst = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert("RGB")
    print(f"atlas {im.size[0]}x{im.size[1]}")
    sharpen(im).save(dst)
    print(f"written {dst}")


if __name__ == "__main__":
    main()
