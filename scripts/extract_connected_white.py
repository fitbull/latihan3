#!/usr/bin/env python3
"""Remove only the white background connected to the image border.

Unlike global color-keying, this preserves enclosed white highlights and label
plates on glossy product artwork.
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--threshold", type=int, default=24)
    parser.add_argument("--feather", type=float, default=0.7)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    flood = source.convert("RGB")
    marker = (1, 254, 1)
    ImageDraw.floodfill(flood, (0, 0), marker, thresh=args.threshold)

    flood_pixels = flood.load()
    width, height = source.size
    alpha = Image.new("L", source.size, 255)
    alpha_pixels = alpha.load()
    for y in range(height):
        for x in range(width):
            if flood_pixels[x, y] == marker:
                alpha_pixels[x, y] = 0

    if args.feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(args.feather))
    source.putalpha(alpha)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    source.save(args.output, optimize=True)


if __name__ == "__main__":
    main()
