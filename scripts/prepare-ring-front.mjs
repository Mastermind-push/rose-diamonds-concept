import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { refineTransparentEdge } from "./lib/refine-transparent-edge.mjs";

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const cutoutPath = argument("cutout");
const backgroundPath = argument("background");
const outputDirectory = argument("out-dir") ?? "artifacts/catalog-ring-front";

if (!cutoutPath || !backgroundPath) {
  throw new Error(
    "Usage: node scripts/prepare-ring-front.mjs --cutout RING.png --background BACKGROUND.png [--out-dir DIR]",
  );
}

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const smoothstep = (edge0, edge1, value) => {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

function alphaBounds(data, width, height, threshold = 32) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) throw new Error("No visible ring pixels found");
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}

async function placeRing(product, width, height) {
  const { data, info } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sourceBounds = alphaBounds(data, info.width, info.height);

  // Calibrated from the approved Our Selection composition.
  const targetWidth = width * 0.779;
  const targetCentreX = width * 0.508;
  const targetCentreY = height * 0.515;
  const scale = targetWidth / sourceBounds.width;
  const resizedWidth = Math.round(info.width * scale);
  const resizedHeight = Math.round(info.height * scale);
  const resized = await sharp(product)
    .resize({ width: resizedWidth, height: resizedHeight, fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  const left = Math.round(targetCentreX - (sourceBounds.left + sourceBounds.width / 2) * scale);
  const top = Math.round(targetCentreY - (sourceBounds.top + sourceBounds.height / 2) * scale);

  const sourceLeft = Math.max(0, -left);
  const sourceTop = Math.max(0, -top);
  const destinationLeft = Math.max(0, left);
  const destinationTop = Math.max(0, top);
  const cropWidth = Math.min(resizedWidth - sourceLeft, width - destinationLeft);
  const cropHeight = Math.min(resizedHeight - sourceTop, height - destinationTop);
  const visible = await sharp(resized)
    .extract({ left: sourceLeft, top: sourceTop, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();

  const canvas = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: visible, left: destinationLeft, top: destinationTop }])
    .png()
    .toBuffer();
  const { data: canvasPixels } = await sharp(canvas)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { canvas, bounds: alphaBounds(canvasPixels, width, height), scale };
}

async function ringZoneMasks(product, width, height, bounds) {
  const { data } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const shank = Buffer.from(data);
  const headLower = Buffer.from(data);
  const contact = Buffer.from(data);
  const centreX = bounds.left + bounds.width / 2;
  const headHalfWidth = bounds.width * 0.165;
  const lowerHeadStart = bounds.top + bounds.height * 0.43;
  const contactStart = bounds.bottom - bounds.height * 0.115;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const inHead = Math.abs(x - centreX) <= headHalfWidth;

      if (inHead) shank[offset + 3] = 0;
      if (!inHead || y < lowerHeadStart) headLower[offset + 3] = 0;
      if (!inHead || y < contactStart) contact[offset + 3] = 0;
    }
  }

  const options = { raw: { width, height, channels: 4 } };
  return Promise.all([
    sharp(shank, options).png().toBuffer(),
    sharp(headLower, options).png().toBuffer(),
    sharp(contact, options).png().toBuffer(),
  ]);
}

async function projectedShadow(product, width, height, {
  dx,
  dy,
  blur,
  opacity,
  maskClose = 0,
  gateStart = 0,
  gateFeather = 1,
  colour = { r: 103, g: 92, b: 91 },
}) {
  let alpha = sharp(product).extractChannel(3);
  if (maskClose > 0) {
    // Fill only the small transparent seams between pavé details before the
    // shadow is blurred. The large opening inside the ring remains untouched.
    alpha = alpha.blur(maskClose).threshold(36);
  }

  const { data: blurred } = await alpha
    .blur(blur)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const shifted = Buffer.alloc(width * height);

  for (let y = 0; y < height; y += 1) {
    const sourceY = y - dy;
    if (sourceY < 0 || sourceY >= height) continue;
    const gate = smoothstep(gateStart, gateStart + gateFeather, y);
    if (gate <= 0) continue;

    for (let x = 0; x < width; x += 1) {
      const sourceX = x - dx;
      if (sourceX < 0 || sourceX >= width) continue;
      shifted[y * width + x] = Math.round(
        blurred[sourceY * width + sourceX] * opacity * gate,
      );
    }
  }

  return sharp({
    create: { width, height, channels: 3, background: colour },
  })
    .joinChannel(shifted, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

async function centralGroundContact(product, width, height, bounds) {
  const { data } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const centreX = bounds.left + bounds.width / 2;
  const outerBottoms = [];
  for (let x = bounds.left; x <= bounds.right; x += 1) {
    if (Math.abs(x - centreX) < bounds.width * 0.22) continue;
    for (let y = bounds.bottom; y >= bounds.top; y -= 1) {
      if (data[(y * width + x) * 4 + 3] > 42) {
        outerBottoms.push(y);
        break;
      }
    }
  }
  outerBottoms.sort((a, b) => a - b);
  const shankBottom = outerBottoms.length
    ? outerBottoms[Math.floor(outerBottoms.length / 2)]
    : bounds.top + bounds.height * 0.58;
  const protrusionStart = shankBottom + bounds.height * 0.035;
  let headLeft = bounds.right;
  let headRight = bounds.left;
  for (let y = Math.round(protrusionStart); y <= bounds.bottom; y += 1) {
    for (let x = Math.round(centreX - bounds.width * 0.26);
      x <= Math.round(centreX + bounds.width * 0.26);
      x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 42) continue;
      headLeft = Math.min(headLeft, x);
      headRight = Math.max(headRight, x);
    }
  }
  const detectedHeadWidth = headRight >= headLeft
    ? headRight - headLeft + 1
    : bounds.width * 0.30;
  const centreY = bounds.bottom - bounds.height * 0.002;
  const radiusX = clamp(detectedHeadWidth * 0.30, bounds.width * 0.035, bounds.width * 0.12);
  const radiusY = clamp(bounds.height * 0.012, 5, 14);
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${centreX}" cy="${centreY}" rx="${radiusX}" ry="${radiusY}"
        fill="rgb(94,84,83)" fill-opacity="0.12"/>
    </svg>
  `);

  return sharp(svg)
    .blur(width * 0.0035)
    .png()
    .toBuffer();
}

async function ambientFloorHaze(width, height, bounds) {
  const centreX = bounds.left + bounds.width / 2;
  const centreY = bounds.bottom - bounds.height * 0.006;
  const radiusX = bounds.width * 0.34;
  const radiusY = bounds.height * 0.031;
  const svg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${centreX}" cy="${centreY}" rx="${radiusX}" ry="${radiusY}"
        fill="rgb(112,103,102)" fill-opacity="0.018"/>
    </svg>
  `);

  return sharp(svg)
    .blur(width * 0.015)
    .png()
    .toBuffer();
}

async function shankContourShadow(product, width, height, bounds) {
  const { data } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const centreX = bounds.left + bounds.width / 2;
  const headHalfWidth = bounds.width * 0.165;
  const scanTop = Math.round(bounds.top + bounds.height * 0.24);
  const scanBottom = Math.round(bounds.top + bounds.height * 0.76);
  const bottom = new Array(width).fill(null);

  for (let x = bounds.left; x <= bounds.right; x += 1) {
    if (Math.abs(x - centreX) <= headHalfWidth) continue;
    for (let y = scanBottom; y >= scanTop; y -= 1) {
      if (data[(y * width + x) * 4 + 3] > 42) {
        bottom[x] = y;
        break;
      }
    }
  }

  // Smooth the lower silhouette horizontally. This intentionally removes
  // prong/stone gaps that should not appear as white stripes in a floor shadow.
  const smoothed = new Array(width).fill(null);
  const radius = Math.max(9, Math.round(bounds.width * 0.012));
  for (let x = bounds.left; x <= bounds.right; x += 1) {
    if (bottom[x] === null) continue;
    let total = 0;
    let count = 0;
    for (let sampleX = Math.max(bounds.left, x - radius);
      sampleX <= Math.min(bounds.right, x + radius);
      sampleX += 1) {
      if (bottom[sampleX] === null) continue;
      total += bottom[sampleX];
      count += 1;
    }
    if (count) smoothed[x] = total / count;
  }

  const strip = Buffer.alloc(width * height);
  const verticalOffset = Math.round(bounds.height * 0.010);
  const halfThickness = Math.max(5, Math.round(bounds.height * 0.008));
  for (let x = bounds.left; x <= bounds.right; x += 1) {
    if (smoothed[x] === null) continue;
    const centreY = Math.round(smoothed[x] + verticalOffset);
    for (let y = centreY - halfThickness; y <= centreY + halfThickness; y += 1) {
      if (y < 0 || y >= height) continue;
      strip[y * width + x] = 205;
    }
  }

  const alpha = await sharp(strip, { raw: { width, height, channels: 1 } })
    .blur(width * 0.013)
    .extractChannel(0)
    .raw()
    .toBuffer();

  return sharp({
    create: { width, height, channels: 3, background: { r: 104, g: 94, b: 93 } },
  })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

async function projectedPlaneShadow(product, width, height, bounds) {
  const { data: pixels } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const centreX = bounds.left + bounds.width / 2;
  const headHalfWidth = bounds.width * 0.20;
  let shankTop = bounds.bottom;
  let shankBottom = bounds.top;
  const shankRgba = Buffer.from(pixels);

  for (let y = bounds.top; y <= bounds.bottom; y += 1) {
    for (let x = bounds.left; x <= bounds.right; x += 1) {
      const offset = (y * width + x) * 4;
      if (Math.abs(x - centreX) <= headHalfWidth) {
        shankRgba[offset + 3] = 0;
        continue;
      }
      if (shankRgba[offset + 3] > 42) {
        shankTop = Math.min(shankTop, y);
        shankBottom = Math.max(shankBottom, y);
      }
    }
  }

  const shankHeight = Math.max(1, shankBottom - shankTop + 1);
  const croppedMask = await sharp(shankRgba, {
    raw: { width, height, channels: 4 },
  })
    .extract({ left: bounds.left, top: shankTop, width: bounds.width, height: shankHeight })
    .extractChannel(3)
    // Close only small jewellery gaps; the large opening inside the ring remains.
    .blur(Math.max(2, bounds.width * 0.0025))
    .threshold(18)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const projectedHeight = Math.max(64, Math.round(shankHeight * 0.25));
  const { data: projected } = await sharp(croppedMask, {
    raw: { width: bounds.width, height: shankHeight, channels: 1 },
  })
    .resize({ width: bounds.width, height: projectedHeight, fit: "fill", kernel: sharp.kernel.lanczos3 })
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const planeMask = Buffer.alloc(width * height);
  const left = Math.round(bounds.left - bounds.width * 0.012);
  const top = Math.round(shankBottom - projectedHeight + shankHeight * 0.035);

  for (let sourceY = 0; sourceY < projectedHeight; sourceY += 1) {
    const distanceFade = 0.42 + 0.58 * (sourceY / Math.max(1, projectedHeight - 1));
    const destinationY = top + sourceY;
    if (destinationY < 0 || destinationY >= height) continue;
    for (let sourceX = 0; sourceX < bounds.width; sourceX += 1) {
      const destinationX = left + sourceX;
      if (destinationX < 0 || destinationX >= width) continue;
      planeMask[destinationY * width + destinationX] = Math.round(
        projected[sourceY * bounds.width + sourceX] * 0.18 * distanceFade,
      );
    }
  }

  // Blur only after positioning on the full canvas, otherwise the cropped
  // projection clips the blur and reveals a rectangular band.
  const alpha = await sharp(planeMask, { raw: { width, height, channels: 1 } })
    .blur(width * 0.010)
    .extractChannel(0)
    .raw()
    .toBuffer();

  return sharp({
    create: { width, height, channels: 3, background: { r: 104, g: 94, b: 93 } },
  })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

async function ringShadowLayers(product, width, height, bounds) {
  const { data } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const centreX = bounds.left + bounds.width / 2;
  const bottoms = new Array(width).fill(null);

  for (let x = bounds.left; x <= bounds.right; x += 1) {
    for (let y = bounds.bottom; y >= bounds.top; y -= 1) {
      if (data[(y * width + x) * 4 + 3] <= 42) continue;
      bottoms[x] = y;
      break;
    }
  }

  const percentile = (values, amount) => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.round((sorted.length - 1) * amount)];
  };

  // Estimate the shank from the two shoulder regions. The centre is excluded
  // because its stone/head can be much taller or lower than the band.
  const shoulderBottoms = [];
  for (let x = bounds.left; x <= bounds.right; x += 1) {
    const distance = Math.abs(x - centreX) / bounds.width;
    if (distance < 0.21 || distance > 0.46 || bottoms[x] === null) continue;
    shoulderBottoms.push(bottoms[x]);
  }
  const shankBaseline = percentile(shoulderBottoms, 0.58)
    ?? bounds.top + bounds.height * 0.58;

  // Estimate only the width of the central head. We deliberately do not turn
  // the product alpha into a shadow: doing so would reproduce pavé gaps,
  // openings and edge noise as dirty white/grey stripes.
  const protrusionMargin = Math.max(10, bounds.height * 0.035);
  const searchHalfWidth = Math.round(bounds.width * 0.28);
  let headLeft = Math.round(centreX - bounds.width * 0.09);
  let headRight = Math.round(centreX + bounds.width * 0.09);
  for (let x = Math.round(centreX - searchHalfWidth);
    x <= Math.round(centreX + searchHalfWidth);
    x += 1) {
    if (bottoms[x] !== null && bottoms[x] > shankBaseline + protrusionMargin) {
      headLeft = Math.min(headLeft, x);
      headRight = Math.max(headRight, x);
    }
  }
  const headPadding = Math.round(bounds.width * 0.018);
  headLeft = Math.max(bounds.left, headLeft - headPadding);
  headRight = Math.min(bounds.right, headRight + headPadding);
  const headWidth = headRight - headLeft + 1;

  const shadowColour = { r: 96, g: 87, b: 87 };
  const colourise = (alpha) => sharp({
    create: { width, height, channels: 3, background: shadowColour },
  })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();

  const ellipseAlpha = ({ centreX: x0, centreY: y0, radiusX, radiusY, peak }) => {
    const alpha = Buffer.alloc(width * height);
    const horizontalLimit = radiusX * 2.8;
    const verticalLimit = radiusY * 2.8;
    for (let y = Math.max(0, Math.floor(y0 - verticalLimit));
      y <= Math.min(height - 1, Math.ceil(y0 + verticalLimit));
      y += 1) {
      for (let x = Math.max(0, Math.floor(x0 - horizontalLimit));
        x <= Math.min(width - 1, Math.ceil(x0 + horizontalLimit));
        x += 1) {
        const dx = (x - x0) / radiusX;
        const dy = (y - y0) / radiusY;
        alpha[y * width + x] = Math.round(
          peak * Math.exp(-2.15 * (dx * dx + dy * dy)),
        );
      }
    }
    return alpha;
  };

  // One intentionally generic studio shadow below the shank. Its geometry is
  // smooth by construction and scales only from the ring footprint.
  const ambientAlpha = Buffer.alloc(width * height);
  ellipseAlpha({
    centreX,
    centreY: shankBaseline + Math.max(8, bounds.height * 0.035),
    radiusX: bounds.width * 0.47,
    radiusY: Math.max(58, bounds.width * 0.052),
    peak: 14,
  }).copy(ambientAlpha);

  // A separate compact ellipse anchors the lowest point of the setting. It is
  // sized from the detected head, so a heart receives a smaller contact than
  // a large oval while both keep exactly the same visual treatment.
  const contactCentreX = (headLeft + headRight) / 2;
  const contactRadiusY = Math.max(16, bounds.width * 0.014);
  const contactAlpha = ellipseAlpha({
    centreX: contactCentreX,
    centreY: bounds.bottom - contactRadiusY * 0.22,
    radiusX: clamp(headWidth * 0.34, bounds.width * 0.055, bounds.width * 0.16),
    radiusY: contactRadiusY,
    peak: 28,
  });

  return Promise.all([
    colourise(ambientAlpha),
    colourise(contactAlpha),
  ]);
}

await mkdir(outputDirectory, { recursive: true });

const backgroundMetadata = await sharp(backgroundPath).metadata();
const width = backgroundMetadata.width;
const height = backgroundMetadata.height;
if (!width || !height) throw new Error("Could not read background dimensions");

// Mandatory shared pass: edge cleanup always happens at source resolution,
// before the ring is scaled or any shadow is derived from its silhouette.
const cleaned = await refineTransparentEdge(cutoutPath);
const { canvas: product, bounds, scale } = await placeRing(cleaned, width, height);
const shadows = await ringShadowLayers(product, width, height, bounds);
const final = await sharp(backgroundPath)
  .composite([
    ...shadows.map((input) => ({ input, left: 0, top: 0, blend: "multiply" })),
    { input: product, left: 0, top: 0 },
  ])
  .webp({ quality: 95, smartSubsample: true, effort: 6 })
  .toBuffer();

await Promise.all([
  writeFile(path.join(outputDirectory, "ring-clean.png"), cleaned),
  writeFile(path.join(outputDirectory, "ring-positioned.png"), product),
  ...shadows.map((shadow, index) => writeFile(
    path.join(outputDirectory, `ring-shadow-${index + 1}.png`),
    shadow,
  )),
  writeFile(path.join(outputDirectory, "ring-catalog-v1.webp"), final),
]);

console.log(JSON.stringify({
  canvas: `${width}x${height}`,
  bounds,
  scale,
  output: path.join(outputDirectory, "ring-catalog-v1.webp"),
}, null, 2));
