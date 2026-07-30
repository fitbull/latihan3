#!/usr/bin/env python3
"""Crop transparent padding from a PNG while keeping a small safe margin."""

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--padding", type=int, default=8)
    args = parser.parse_args()

    image = Image.open(args.input).convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise SystemExit("Image is fully transparent")

    left, top, right, bottom = bbox
    padding = max(0, args.padding)
    crop = (
        max(0, left - padding),
        max(0, top - padding),
        min(image.width, right + padding),
        min(image.height, bottom + padding),
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    image.crop(crop).save(args.output, optimize=True)


if __name__ == "__main__":
    main()
