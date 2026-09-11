import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { refineTransparentEdge } from "./lib/refine-transparent-edge.mjs";

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const inputPath = argument("input");
const cutoutPath = argument("cutout");
const backgroundPath = argument("background");
const outputDirectory = argument("out-dir") ?? "artifacts/catalog-product-test";
const template = argument("template") ?? "earrings-front";
const templates = {
  "earrings-front": {
    widthRatio: 0.773 * 0.85,
    centre: [0.502, 0.506],
    outputStem: "earrings",
  },
  "earrings-oval-front": {
    // Oval studs need a larger individual face and a tighter pair spacing than
    // the taller pear-cut reference. The outer pair remains restrained.
    widthRatio: 0.62,
    centre: [0.502, 0.506],
    componentGapRatio: 0.53,
    outputStem: "earrings",
  },
  "bracelet-oval": {
    widthRatio: 0.8766741071428571,
    centre: [0.5075334821428571, 0.49854166666666666],
    outputStem: "bracelet",
  },
};

if ((!inputPath && !cutoutPath) || !backgroundPath) {
  throw new Error("Usage: node scripts/prepare-catalog-product.mjs (--input IMAGE | --cutout RGBA_PNG) --background BACKGROUND --template earrings-front [--out-dir DIR]");
}

if (!templates[template]) {
  throw new Error(`Unsupported template: ${template}`);
}

const templateConfig = templates[template];

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const smoothstep = (edge0, edge1, value) => {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return amount * amount * (3 - 2 * amount);
};

function boundsFromMask(mask, width, height, threshold = 8) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (mask[y * width + x] <= threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) throw new Error("No product pixels found");
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}

function convexHull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (origin, a, b) => (a[0] - origin[0]) * (b[1] - origin[1])
    - (a[1] - origin[1]) * (b[0] - origin[0]);
  const lower = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower.at(-2), lower.at(-1), point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper = [];
  for (const point of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper.at(-2), upper.at(-1), point) <= 0) upper.pop();
    upper.push(point);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function estimateWhiteBackground(pixels, width, height) {
  const strip = Math.max(12, Math.round(Math.min(width, height) * 0.025));
  const samples = [[], [], []];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x >= strip && x < width - strip && y >= strip && y < height - strip) continue;
      const offset = (y * width + x) * 3;
      samples[0].push(pixels[offset]);
      samples[1].push(pixels[offset + 1]);
      samples[2].push(pixels[offset + 2]);
    }
  }
  return samples.map((channel) => {
    channel.sort((a, b) => a - b);
    return channel[Math.floor(channel.length / 2)];
  });
}

async function removeWhiteBackground(input) {
  const { data: pixels, info } = await sharp(input)
    .rotate()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const background = estimateWhiteBackground(pixels, width, height);
  const evidence = new Float32Array(width * height);

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 3;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const distance = Math.sqrt(
      (red - background[0]) ** 2
      + (green - background[1]) ** 2
      + (blue - background[2]) ** 2,
    );
    const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
    evidence[pixel] = Math.max(distance, chroma * 0.72);
  }

  // Locate the two strong components independently. This prevents faint JPEG
  // variation in the white background from becoming part of the cut-out.
  const componentRanges = [
    { start: Math.round(width * 0.08), end: Math.round(width * 0.49) },
    { start: Math.round(width * 0.51), end: Math.round(width * 0.92) },
  ];
  const componentBounds = [];
  const componentPolygons = [];

  for (const range of componentRanges) {
    let left = range.end;
    let right = range.start;
    let top = height;
    let bottom = -1;
    for (let y = Math.round(height * 0.2); y < Math.round(height * 0.82); y += 1) {
      for (let x = range.start; x <= range.end; x += 1) {
        if (evidence[y * width + x] < 12) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
    if (bottom < top) throw new Error("Could not isolate both earrings");
    const outlinePoints = [];
    for (let y = top; y <= bottom; y += 1) {
      let rowLeft = right;
      let rowRight = left;
      let hits = 0;
      for (let x = left; x <= right; x += 1) {
        if (evidence[y * width + x] < 12) continue;
        rowLeft = Math.min(rowLeft, x);
        rowRight = Math.max(rowRight, x);
        hits += 1;
      }
      if (hits < 2 || rowRight < rowLeft) continue;
      outlinePoints.push([rowLeft, y], [rowRight, y]);
    }
    componentPolygons.push(convexHull(outlinePoints));
    componentBounds.push({ left, right, top, bottom, width: right - left + 1, height: bottom - top + 1 });
  }

  const silhouetteSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="black"/>
    ${componentPolygons.map((polygon) => `<polygon points="${polygon.map(([x, y]) => `${x},${y}`).join(" ")}" fill="white"/>`).join("\n")}
  </svg>`);
  const softenedSilhouette = await sharp(silhouetteSvg)
    .blur(0.75)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const innerSilhouette = await sharp(silhouetteSvg)
    .erode(6)
    .blur(0.6)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const alpha = Buffer.alloc(width * height);
  const rgba = Buffer.alloc(width * height * 4);

  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const offset = pixel * 3;
    const outputOffset = pixel * 4;
    const evidenceAlpha = smoothstep(3.8, 15, evidence[pixel]) * 255;
    const silhouetteAlpha = softenedSilhouette[pixel];
    const edgeAlpha = Math.min(evidenceAlpha, silhouetteAlpha);
    const finalAlpha = silhouetteAlpha > 1
      ? Math.round(Math.max(edgeAlpha, innerSilhouette[pixel]))
      : 0;
    alpha[pixel] = finalAlpha;

    const normalizedAlpha = finalAlpha / 255;
    for (let channel = 0; channel < 3; channel += 1) {
      const observed = pixels[offset + channel] / 255;
      const matte = background[channel] / 255;
      let recovered = observed;
      if (normalizedAlpha > 0.025 && normalizedAlpha < 0.995) {
        recovered = clamp((observed - (1 - normalizedAlpha) * matte) / normalizedAlpha, 0, 1);
        const correction = smoothstep(0.04, 0.32, normalizedAlpha);
        recovered = observed + (recovered - observed) * correction;
      }
      rgba[outputOffset + channel] = Math.round(recovered * 255);
    }
    rgba[outputOffset + 3] = finalAlpha < 3 ? 0 : finalAlpha;
  }

  const product = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
  return { product, alpha, width, height, background, bounds: boundsFromMask(alpha, width, height), componentBounds };
}

async function loadTransparentCutout(input) {
  const { data: cleanedPixels, info: cleanedInfo } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const product = await sharp(cleanedPixels, {
    raw: { width: cleanedInfo.width, height: cleanedInfo.height, channels: 4 },
  }).png().toBuffer();
  const { data: pixels, info } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const alpha = Buffer.alloc(width * height);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    alpha[pixel] = pixels[pixel * 4 + 3];
  }
  const bounds = boundsFromMask(alpha, width, height);
  const splitX = Math.round(bounds.left + bounds.width / 2);
  const componentBounds = [
    { start: bounds.left, end: splitX - 1 },
    { start: splitX, end: bounds.right },
  ].map(({ start, end }) => {
    let left = end;
    let top = bounds.bottom;
    let right = start;
    let bottom = bounds.top;
    for (let y = bounds.top; y <= bounds.bottom; y += 1) {
      for (let x = start; x <= end; x += 1) {
        if (alpha[y * width + x] <= 8) continue;
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
  });
  return { product, alpha, width, height, background: null, bounds, componentBounds };
}

async function repackEarringPair(cutout, gapRatio) {
  if (cutout.componentBounds.length !== 2) return cutout;
  const [leftBounds, rightBounds] = cutout.componentBounds;
  const padding = 6;
  const minimumTop = Math.min(leftBounds.top, rightBounds.top);
  const maximumBottom = Math.max(leftBounds.bottom, rightBounds.bottom);
  const desiredGap = Math.round(((leftBounds.width + rightBounds.width) / 2) * gapRatio);
  const leftExtract = {
    left: Math.max(0, leftBounds.left - padding),
    top: Math.max(0, minimumTop - padding),
    width: Math.min(cutout.width, leftBounds.right + padding + 1) - Math.max(0, leftBounds.left - padding),
    height: Math.min(cutout.height, maximumBottom + padding + 1) - Math.max(0, minimumTop - padding),
  };
  const rightExtract = {
    left: Math.max(0, rightBounds.left - padding),
    top: Math.max(0, minimumTop - padding),
    width: Math.min(cutout.width, rightBounds.right + padding + 1) - Math.max(0, rightBounds.left - padding),
    height: Math.min(cutout.height, maximumBottom + padding + 1) - Math.max(0, minimumTop - padding),
  };
  const leftImage = await sharp(cutout.product).extract(leftExtract).png().toBuffer();
  const rightImage = await sharp(cutout.product).extract(rightExtract).png().toBuffer();
  const width = leftExtract.width + desiredGap + rightExtract.width;
  const height = Math.max(leftExtract.height, rightExtract.height);
  const rightLeft = leftExtract.width + desiredGap;
  const product = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: leftImage, left: 0, top: 0 },
      { input: rightImage, left: rightLeft, top: 0 },
    ])
    .png()
    .toBuffer();
  const { data: pixels } = await sharp(product).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = Buffer.alloc(width * height);
  for (let pixel = 0; pixel < width * height; pixel += 1) alpha[pixel] = pixels[pixel * 4 + 3];
  const bounds = boundsFromMask(alpha, width, height);
  const componentBounds = [
    {
      left: leftBounds.left - leftExtract.left,
      right: leftBounds.right - leftExtract.left,
      top: leftBounds.top - leftExtract.top,
      bottom: leftBounds.bottom - leftExtract.top,
      width: leftBounds.width,
      height: leftBounds.height,
    },
    {
      left: rightLeft + rightBounds.left - rightExtract.left,
      right: rightLeft + rightBounds.right - rightExtract.left,
      top: rightBounds.top - rightExtract.top,
      bottom: rightBounds.bottom - rightExtract.top,
      width: rightBounds.width,
      height: rightBounds.height,
    },
  ];
  return { ...cutout, product, alpha, width, height, bounds, componentBounds };
}

function earringsShadowSvg({ canvasWidth, canvasHeight, componentBounds }) {
  const ellipses = componentBounds.map((bounds, index) => {
    const centreX = bounds.left + bounds.width / 2;
    const contactY = bounds.bottom + bounds.height * 0.012;
    return `
      <radialGradient id="contact-${index}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#655958" stop-opacity="0.105"/>
        <stop offset="42%" stop-color="#655958" stop-opacity="0.058"/>
        <stop offset="78%" stop-color="#655958" stop-opacity="0.014"/>
        <stop offset="100%" stop-color="#655958" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="haze-${index}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#786d6c" stop-opacity="0.014"/>
        <stop offset="100%" stop-color="#786d6c" stop-opacity="0"/>
      </radialGradient>
      <ellipse cx="${centreX}" cy="${contactY}" rx="${bounds.width * 0.43}" ry="${bounds.height * 0.035}" fill="url(#contact-${index})"/>
      <ellipse cx="${centreX}" cy="${bounds.bottom + bounds.height * 0.005}" rx="${bounds.width * 0.62}" ry="${bounds.height * 0.07}" fill="url(#haze-${index})"/>`;
  }).join("\n");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
    <defs>${ellipses}</defs>
    ${componentBounds.map((bounds, index) => {
      const centreX = bounds.left + bounds.width / 2;
      return `<ellipse cx="${centreX}" cy="${bounds.bottom + bounds.height * 0.012}" rx="${bounds.width * 0.43}" ry="${bounds.height * 0.035}" fill="url(#contact-${index})"/>
      <ellipse cx="${centreX}" cy="${bounds.bottom + bounds.height * 0.005}" rx="${bounds.width * 0.62}" ry="${bounds.height * 0.07}" fill="url(#haze-${index})"/>`;
    }).join("\n")}
  </svg>`);
}

function smoothSeries(values, radius) {
  const output = new Float32Array(values.length);
  for (let index = 0; index < values.length; index += 1) {
    let total = 0;
    let weightTotal = 0;
    for (let offset = -radius; offset <= radius; offset += 1) {
      const sampleIndex = clamp(index + offset, 0, values.length - 1);
      const weight = radius + 1 - Math.abs(offset);
      total += values[sampleIndex] * weight;
      weightTotal += weight;
    }
    output[index] = total / weightTotal;
  }
  return output;
}

function braceletBottomEnvelope(alpha, canvasWidth, bounds) {
  const rawBottom = new Float32Array(bounds.width);
  rawBottom.fill(Number.NaN);
  for (let x = bounds.left; x <= bounds.right; x += 1) {
    for (let y = bounds.bottom; y >= bounds.top; y -= 1) {
      if (alpha[y * canvasWidth + x] > 32) {
        rawBottom[x - bounds.left] = y;
        break;
      }
    }
  }

  // Fill narrow transparent gaps between links before smoothing. This avoids
  // turning every gap between stones into an artificial vertical shadow spike.
  let previous = -1;
  for (let index = 0; index < rawBottom.length; index += 1) {
    if (!Number.isNaN(rawBottom[index])) {
      if (previous >= 0 && index - previous > 1) {
        const start = rawBottom[previous];
        const end = rawBottom[index];
        for (let gap = previous + 1; gap < index; gap += 1) {
          rawBottom[gap] = start + (end - start) * ((gap - previous) / (index - previous));
        }
      }
      previous = index;
    }
  }
  const first = rawBottom.findIndex((value) => !Number.isNaN(value));
  if (first < 0) throw new Error("Could not derive bracelet contact contour");
  for (let index = 0; index < first; index += 1) rawBottom[index] = rawBottom[first];
  for (let index = previous + 1; index < rawBottom.length; index += 1) rawBottom[index] = rawBottom[previous];
  // Jewellery details are intentionally averaged into one physical support
  // curve. The shadow must describe the bracelet's oval, not every stone.
  return smoothSeries(rawBottom, Math.max(24, Math.round(bounds.width * 0.030)));
}

async function blurredMask(mask, width, height, sigma) {
  return sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(sigma)
    .extractChannel(0)
    .raw()
    .toBuffer();
}

async function braceletContactShadow({ canvasWidth, canvasHeight, bounds, alpha }) {
  const envelope = braceletBottomEnvelope(alpha, canvasWidth, bounds);
  const contactSource = Buffer.alloc(canvasWidth * canvasHeight);
  const hazeSource = Buffer.alloc(canvasWidth * canvasHeight);
  const centreX = bounds.left + bounds.width / 2;

  for (let x = bounds.left; x <= bounds.right; x += 1) {
    const bottom = envelope[x - bounds.left];
    const depth = smoothstep(bounds.top + bounds.height * 0.42, bounds.bottom, bottom);
    const lateral = Math.abs((x - centreX) / (bounds.width / 2));
    // The centre/front row carries most of the weight. The outer bends retain
    // enough contact to feel grounded without creating a gray side halo.
    const strength = clamp(0.50 + depth * 0.50 + Math.max(0, lateral - 0.82) * 0.35, 0.48, 1);
    const contactThickness = Math.round(4 + depth * 4);
    const hazeThickness = Math.round(8 + depth * 6);
    for (let y = Math.round(bottom + 1); y <= Math.round(bottom + contactThickness); y += 1) {
      if (y >= 0 && y < canvasHeight) contactSource[y * canvasWidth + x] = Math.round(94 * strength);
    }
    for (let y = Math.round(bottom + 1); y <= Math.round(bottom + hazeThickness); y += 1) {
      if (y >= 0 && y < canvasHeight) hazeSource[y * canvasWidth + x] = Math.round(44 * strength);
    }
  }

  const contact = await blurredMask(contactSource, canvasWidth, canvasHeight, Math.max(8, bounds.height * 0.016));
  const haze = await blurredMask(hazeSource, canvasWidth, canvasHeight, Math.max(20, bounds.height * 0.046));
  const rgba = Buffer.alloc(canvasWidth * canvasHeight * 4);
  const extension = Math.round(bounds.width * 0.045);

  for (let y = Math.max(0, bounds.top); y < Math.min(canvasHeight, bounds.bottom + bounds.height * 0.18); y += 1) {
    for (let x = Math.max(0, bounds.left - extension); x <= Math.min(canvasWidth - 1, bounds.right + extension); x += 1) {
      const envelopeIndex = clamp(x - bounds.left, 0, envelope.length - 1);
      const floorY = envelope[envelopeIndex];
      // Directional floor mask: blur may travel sideways and down, but never
      // upward around the outside of the bracelet.
      const belowFloor = smoothstep(floorY - 1, floorY + Math.max(5, bounds.height * 0.012), y);
      if (belowFloor <= 0) continue;
      const pixel = y * canvasWidth + x;
      const contactAlpha = contact[pixel] / 255;
      const hazeAlpha = haze[pixel] / 255;
      const combined = (1 - (1 - contactAlpha) * (1 - hazeAlpha)) * belowFloor;
      if (combined <= 0.001) continue;
      const output = pixel * 4;
      rgba[output] = 96;
      rgba[output + 1] = 82;
      rgba[output + 2] = 81;
      rgba[output + 3] = Math.round(combined * 255);
    }
  }

  return sharp(rgba, { raw: { width: canvasWidth, height: canvasHeight, channels: 4 } })
    .png()
    .toBuffer();
}

function braceletInnerAmbientSvg({ canvasWidth, canvasHeight, bounds }) {
  const centreX = bounds.left + bounds.width / 2;
  const centreY = bounds.top + bounds.height * 0.49;
  const colour = "#6d605f";
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
    <defs>
      <filter id="soft-floor" x="-30%" y="-60%" width="160%" height="220%">
        <feGaussianBlur stdDeviation="${Math.max(14, bounds.height * 0.032)}"/>
      </filter>
      <radialGradient id="floor-fill" cx="50%" cy="58%" r="58%">
        <stop offset="0%" stop-color="${colour}" stop-opacity="0.044"/>
        <stop offset="58%" stop-color="${colour}" stop-opacity="0.022"/>
        <stop offset="100%" stop-color="${colour}" stop-opacity="0"/>
      </radialGradient>
      <clipPath id="inner-hole">
        <ellipse cx="${centreX}" cy="${centreY}" rx="${bounds.width * 0.395}" ry="${bounds.height * 0.235}"/>
      </clipPath>
    </defs>
    <ellipse cx="${centreX}" cy="${centreY}" rx="${bounds.width * 0.385}" ry="${bounds.height * 0.215}"
      fill="none" stroke="${colour}" stroke-opacity="0.180" stroke-width="${bounds.height * 0.052}"
      filter="url(#soft-floor)" clip-path="url(#inner-hole)"/>
    <ellipse cx="${centreX}" cy="${centreY + bounds.height * 0.018}" rx="${bounds.width * 0.37}" ry="${bounds.height * 0.205}"
      fill="url(#floor-fill)" clip-path="url(#inner-hole)"/>
  </svg>`);
}

async function projectedShadowLayer({
  alpha,
  canvasWidth,
  canvasHeight,
  offsetX,
  offsetY,
  sigma,
  opacity,
  colour,
}) {
  const shifted = Buffer.alloc(canvasWidth * canvasHeight);
  for (let y = 0; y < canvasHeight; y += 1) {
    const targetY = y + offsetY;
    if (targetY < 0 || targetY >= canvasHeight) continue;
    for (let x = 0; x < canvasWidth; x += 1) {
      const targetX = x + offsetX;
      if (targetX < 0 || targetX >= canvasWidth) continue;
      shifted[targetY * canvasWidth + targetX] = Math.round(alpha[y * canvasWidth + x] * opacity);
    }
  }
  const blurred = await blurredMask(shifted, canvasWidth, canvasHeight, sigma);
  const rgba = Buffer.alloc(canvasWidth * canvasHeight * 4);
  for (let pixel = 0; pixel < canvasWidth * canvasHeight; pixel += 1) {
    const output = pixel * 4;
    rgba[output] = colour[0];
    rgba[output + 1] = colour[1];
    rgba[output + 2] = colour[2];
    rgba[output + 3] = blurred[pixel];
  }
  return sharp(rgba, { raw: { width: canvasWidth, height: canvasHeight, channels: 4 } })
    .png()
    .toBuffer();
}

async function braceletProjectedShadowLayers({ canvasWidth, canvasHeight, bounds, alpha }) {
  // Both layers come from the same vertical projection of the product mask.
  // Two blur radii model a large studio source: a small contact penumbra plus
  // a very soft ambient projection, without independent painted ellipses.
  const colour = [105, 92, 91];
  const contact = await projectedShadowLayer({
    alpha,
    canvasWidth,
    canvasHeight,
    offsetX: 0,
    offsetY: Math.round(bounds.height * 0.024),
    sigma: Math.max(8, bounds.height * 0.015),
    opacity: 0.110,
    colour,
  });
  const ambient = await projectedShadowLayer({
    alpha,
    canvasWidth,
    canvasHeight,
    offsetX: 0,
    offsetY: Math.round(bounds.height * 0.060),
    sigma: Math.max(22, bounds.height * 0.048),
    opacity: 0.070,
    colour: [116, 104, 103],
  });
  return [ambient, contact];
}

await mkdir(outputDirectory, { recursive: true });
const background = await readFile(backgroundPath);
const backgroundMetadata = await sharp(background).metadata();
const canvasWidth = backgroundMetadata.width;
const canvasHeight = backgroundMetadata.height;
if (!canvasWidth || !canvasHeight) throw new Error("Could not read background dimensions");

const initialProduct = cutoutPath
  ? cutoutPath
  : (await removeWhiteBackground(inputPath)).product;
// Mandatory shared pass for earrings and bracelets. It also follows automatic
// white-background removal, so every route reaches placement with identical
// edge-quality guarantees.
const refinedProduct = await refineTransparentEdge(initialProduct);
let cutout = await loadTransparentCutout(refinedProduct);
if (templateConfig.componentGapRatio) {
  cutout = await repackEarringPair(cutout, templateConfig.componentGapRatio);
}
const targetWidthRatio = templateConfig.widthRatio;
const targetWidth = canvasWidth * targetWidthRatio;
const targetCentreX = canvasWidth * templateConfig.centre[0];
const targetCentreY = canvasHeight * templateConfig.centre[1];
const scale = targetWidth / cutout.bounds.width;
const resizedWidth = Math.round(cutout.width * scale);
const resizedHeight = Math.round(cutout.height * scale);
const scaledProduct = await sharp(cutout.product)
  .resize({ width: resizedWidth, height: resizedHeight, fit: "fill", kernel: sharp.kernel.lanczos3 })
  .png()
  .toBuffer();
const sourceCentreX = cutout.bounds.left + cutout.bounds.width / 2;
const sourceCentreY = cutout.bounds.top + cutout.bounds.height / 2;
const cropLeft = Math.round(sourceCentreX * scale - targetCentreX);
const cropTop = Math.round(sourceCentreY * scale - targetCentreY);
let overlayProduct = scaledProduct;
let overlayLeft = -cropLeft;
let overlayTop = -cropTop;
let overlayWidth = resizedWidth;
let overlayHeight = resizedHeight;
if (overlayLeft < 0 || overlayTop < 0 || overlayLeft + overlayWidth > canvasWidth || overlayTop + overlayHeight > canvasHeight) {
  const sourceLeft = Math.max(0, -overlayLeft);
  const sourceTop = Math.max(0, -overlayTop);
  const visibleLeft = Math.max(0, overlayLeft);
  const visibleTop = Math.max(0, overlayTop);
  overlayWidth = Math.min(resizedWidth - sourceLeft, canvasWidth - visibleLeft);
  overlayHeight = Math.min(resizedHeight - sourceTop, canvasHeight - visibleTop);
  overlayProduct = await sharp(scaledProduct)
    .extract({ left: sourceLeft, top: sourceTop, width: overlayWidth, height: overlayHeight })
    .png()
    .toBuffer();
  overlayLeft = visibleLeft;
  overlayTop = visibleTop;
}
const productCanvas = await sharp({
  create: { width: canvasWidth, height: canvasHeight, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: overlayProduct, left: overlayLeft, top: overlayTop }])
  .png()
  .toBuffer();
const { data: productCanvasPixels } = await sharp(productCanvas)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const productCanvasAlpha = Buffer.alloc(canvasWidth * canvasHeight);
for (let pixel = 0; pixel < canvasWidth * canvasHeight; pixel += 1) {
  productCanvasAlpha[pixel] = productCanvasPixels[pixel * 4 + 3];
}
const placedBounds = boundsFromMask(productCanvasAlpha, canvasWidth, canvasHeight);
const placedComponents = cutout.componentBounds.map((bounds) => ({
  left: bounds.left * scale - cropLeft,
  right: bounds.right * scale - cropLeft,
  top: bounds.top * scale - cropTop,
  bottom: bounds.bottom * scale - cropTop,
  width: bounds.width * scale,
  height: bounds.height * scale,
}));
const shadowLayers = template === "bracelet-oval"
  ? await braceletProjectedShadowLayers({
    canvasWidth,
    canvasHeight,
    bounds: placedBounds,
    alpha: productCanvasAlpha,
  })
  : [earringsShadowSvg({ canvasWidth, canvasHeight, componentBounds: placedComponents })];

const output = await sharp(background)
  .composite([
    ...shadowLayers.map((shadow) => ({ input: shadow, left: 0, top: 0, blend: "multiply" })),
    { input: productCanvas, left: 0, top: 0 },
  ])
  .webp({ quality: 95, smartSubsample: true, effort: 6 })
  .toBuffer();

const darkPreviewCanvas = await sharp({
  create: { width: canvasWidth, height: canvasHeight, channels: 3, background: "#173947" },
})
  .composite([{ input: productCanvas, left: 0, top: 0 }])
  .png()
  .toBuffer();
const darkPreview = await sharp(darkPreviewCanvas)
  .resize({ width: 900 })
  .png()
  .toBuffer();

const cutoutName = `${templateConfig.outputStem}-cutout.png`;
const placedName = `${templateConfig.outputStem}-placed.png`;
const edgeName = `${templateConfig.outputStem}-edge-check.png`;
const outputName = `${templateConfig.outputStem}-catalog-v1.webp`;
await writeFile(path.join(outputDirectory, cutoutName), cutout.product);
await writeFile(path.join(outputDirectory, placedName), productCanvas);
await writeFile(path.join(outputDirectory, edgeName), darkPreview);
await writeFile(path.join(outputDirectory, outputName), output);
if (template === "bracelet-oval") {
  await writeFile(path.join(outputDirectory, "bracelet-shadow-inner.png"), shadowLayers[0]);
  await writeFile(path.join(outputDirectory, "bracelet-shadow-contact.png"), shadowLayers[1]);
}

console.log(JSON.stringify({
  input: { width: cutout.width, height: cutout.height, estimatedBackground: cutout.background, bounds: cutout.bounds },
  template,
  output: { width: canvasWidth, height: canvasHeight, targetWidthRatio, targetCentre: templateConfig.centre, placedBounds },
  files: [cutoutName, placedName, edgeName, outputName],
}, null, 2));
