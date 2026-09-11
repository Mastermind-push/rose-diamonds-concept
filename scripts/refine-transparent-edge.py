#!/usr/bin/env python3
"""Deterministically refine noisy RGBA jewellery cut-outs.

The input is expected to contain a useful first-pass alpha channel.  This pass
removes disconnected low-alpha residue, regularises the antialiased contour,
and replaces matte-contaminated edge colour from nearby opaque product pixels.
It deliberately avoids global erosion so thin chains and prongs stay intact.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def smoothstep(edge0: float, edge1: float, values: np.ndarray) -> np.ndarray:
    amount = np.clip((values - edge0) / (edge1 - edge0), 0.0, 1.0)
    return amount * amount * (3.0 - 2.0 * amount)


def keep_supported_alpha(alpha: np.ndarray) -> tuple[np.ndarray, dict[str, int]]:
    # The hard core identifies real product pixels.  A three-pixel support band
    # retains genuine antialiasing but rejects the vast detached alpha-noise
    # field produced by the first background-removal pass.
    core = alpha >= (24.0 / 255.0)
    labels, count = ndimage.label(core, structure=np.ones((3, 3), dtype=bool))
    sizes = np.bincount(labels.ravel())
    strong = alpha >= (150.0 / 255.0)
    strong_labels = np.unique(labels[strong])

    keep = np.zeros(count + 1, dtype=bool)
    keep[strong_labels] = True
    keep |= sizes >= 18
    keep[0] = False
    retained_core = keep[labels]
    support = ndimage.binary_dilation(retained_core, iterations=3)

    supported = np.where(support, alpha, 0.0)
    return supported, {
        "components_found": int(count),
        "components_retained": int(np.count_nonzero(keep)),
    }


def refine_alpha(alpha: np.ndarray) -> np.ndarray:
    supported, _ = keep_supported_alpha(alpha)

    # Subpixel smoothing is intentionally below half a pixel.  It removes the
    # one-pixel staircase without rounding away narrow chain gaps.
    softened = ndimage.gaussian_filter(supported, sigma=0.34, mode="nearest")
    cleaned = smoothstep(0.026, 0.965, softened)

    # Preserve the original dense interior and only regularise the boundary.
    interior = supported >= 0.94
    cleaned[interior] = np.maximum(cleaned[interior], supported[interior])
    cleaned[cleaned < 0.008] = 0.0
    return cleaned


def refine_edge_colour(rgb: np.ndarray, alpha: np.ndarray, cleaned_alpha: np.ndarray) -> np.ndarray:
    opaque = alpha >= 0.92
    if not np.any(opaque):
        opaque = alpha >= 0.65

    # Nearest dense product colour is stable at very low alpha, where direct
    # unmatting would amplify compression and removal noise.
    _, indices = ndimage.distance_transform_edt(~opaque, return_indices=True)
    nearest = rgb[indices[0], indices[1]]

    safe_alpha = np.maximum(alpha[..., None], 0.055)
    white_matte = np.ones_like(rgb)
    unmatted = np.clip((rgb - (1.0 - safe_alpha) * white_matte) / safe_alpha, 0.0, 1.0)

    stable_unmatte = smoothstep(0.16, 0.68, alpha)[..., None]
    recovered = nearest * (1.0 - stable_unmatte) + unmatted * stable_unmatte

    # Dense facets are source truth.  Only the antialiased edge is replaced.
    edge_weight = (1.0 - smoothstep(0.78, 0.98, alpha))[..., None]
    result = rgb * (1.0 - edge_weight) + recovered * edge_weight
    result[cleaned_alpha <= 0.0] = 0.0
    return np.clip(result, 0.0, 1.0)


def composite_preview(rgb: np.ndarray, alpha: np.ndarray, background: tuple[int, int, int]) -> Image.Image:
    bg = np.asarray(background, dtype=np.float32) / 255.0
    composed = rgb * alpha[..., None] + bg * (1.0 - alpha[..., None])
    return Image.fromarray(np.round(np.clip(composed, 0.0, 1.0) * 255).astype(np.uint8), "RGB")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--preview-dark", type=Path)
    parser.add_argument("--preview-warm", type=Path)
    args = parser.parse_args()

    image = Image.open(args.input).convert("RGBA")
    rgba = np.asarray(image).astype(np.float32) / 255.0
    rgb = rgba[..., :3]
    alpha = rgba[..., 3]

    supported, component_stats = keep_supported_alpha(alpha)
    cleaned_alpha = refine_alpha(alpha)
    cleaned_rgb = refine_edge_colour(rgb, supported, cleaned_alpha)
    output = np.dstack((cleaned_rgb, cleaned_alpha))
    output_u8 = np.round(np.clip(output, 0.0, 1.0) * 255).astype(np.uint8)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(output_u8, "RGBA").save(args.output, optimize=True)
    if args.preview_dark:
        args.preview_dark.parent.mkdir(parents=True, exist_ok=True)
        composite_preview(cleaned_rgb, cleaned_alpha, (43, 40, 42)).save(args.preview_dark, optimize=True)
    if args.preview_warm:
        args.preview_warm.parent.mkdir(parents=True, exist_ok=True)
        composite_preview(cleaned_rgb, cleaned_alpha, (251, 249, 247)).save(args.preview_warm, optimize=True)

    print({
        "size": image.size,
        "alpha_nonzero_before": int(np.count_nonzero(alpha)),
        "alpha_nonzero_after": int(np.count_nonzero(cleaned_alpha)),
        **component_stats,
        "output": str(args.output),
    })


if __name__ == "__main__":
    main()
