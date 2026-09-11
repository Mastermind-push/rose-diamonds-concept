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
const referencePath = argument("reference");
const outputDirectory = argument("out-dir") ?? "artifacts/catalog-pendant-reference";

if (!cutoutPath || !backgroundPath || !referencePath) {
  throw new Error(
    "Usage: node scripts/prepare-pendant-reference.mjs --cutout PRODUCT.png --background BACKGROUND.png --reference REFERENCE.webp [--out-dir DIR]",
  );
}

const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

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

  if (right < left || bottom < top) throw new Error("No visible product pixels found");
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}

async function placeToReferenceTemplate(product, width, height) {
  const { data, info } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bounds = alphaBounds(data, info.width, info.height);

  // Calibrated from the approved website reference.  The chain is allowed to
  // continue beyond the top edge, which makes the pendant feel editorial and
  // gives the centre stone enough visual authority without making it bulky.
  const targetWidth = width * 0.858;
  const targetBottom = height * 0.823;
  // Scale is anchored by the pendant's vertical size and baseline.  The
  // necklace reference has a wider drape than the new render, so enlarging by
  // overall width would make the centre stone noticeably oversized.
  const scale = targetBottom / bounds.bottom;
  const resizedWidth = Math.round(info.width * scale);
  const resizedHeight = Math.round(info.height * scale);
  const left = Math.round(width / 2 - (bounds.left + bounds.width / 2) * scale);
  const top = Math.round(targetBottom - bounds.bottom * scale);
  const resized = await sharp(product)
    .resize({ width: resizedWidth, height: resizedHeight, fit: "fill", kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const sourceLeft = Math.max(0, -left);
  const sourceTop = Math.max(0, -top);
  const destinationLeft = Math.max(0, left);
  const destinationTop = Math.max(0, top);
  const cropWidth = Math.min(resizedWidth - sourceLeft, width - destinationLeft);
  const cropHeight = Math.min(resizedHeight - sourceTop, height - destinationTop);
  const visibleProduct = await sharp(resized)
    .extract({ left: sourceLeft, top: sourceTop, width: cropWidth, height: cropHeight })
    .png()
    .toBuffer();

  const baseCanvas = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: visibleProduct, left: destinationLeft, top: destinationTop }])
    .raw()
    .toBuffer();

  // Open the two chain sides to the reference width while keeping every link
  // and the pendant at their correct scale.  The displacement fades to zero
  // before the chain reaches the halo setting, so the jewellery itself is not
  // stretched or deformed.
  const baseVisibleWidth = bounds.width * scale;
  const maximumShift = Math.max(0, (targetWidth - baseVisibleWidth) / 2);
  const taperEnd = targetBottom * 0.84;
  const openedCanvas = Buffer.alloc(width * height * 4);
  const centreX = width / 2;

  for (let y = 0; y < height; y += 1) {
    const progress = clamp(y / taperEnd, 0, 1);
    const smoothProgress = progress * progress * (3 - 2 * progress);
    const shift = maximumShift * (1 - smoothProgress);

    for (let x = 0; x < width; x += 1) {
      const direction = x < centreX ? -1 : 1;
      const sourceX = x - direction * shift;
      if (sourceX < 0 || sourceX >= width - 1) continue;
      const x0 = Math.floor(sourceX);
      const x1 = x0 + 1;
      const mix = sourceX - x0;
      const leftOffset = (y * width + x0) * 4;
      const rightOffset = (y * width + x1) * 4;
      const destinationOffset = (y * width + x) * 4;
      const leftAlpha = baseCanvas[leftOffset + 3] / 255;
      const rightAlpha = baseCanvas[rightOffset + 3] / 255;
      const outputAlpha = leftAlpha * (1 - mix) + rightAlpha * mix;
      if (outputAlpha <= 0.0001) continue;

      // Interpolate premultiplied colour to prevent transparent white RGB from
      // reappearing as a fringe during the geometric chain opening.
      for (let channel = 0; channel < 3; channel += 1) {
        const premultiplied = baseCanvas[leftOffset + channel] * leftAlpha * (1 - mix)
          + baseCanvas[rightOffset + channel] * rightAlpha * mix;
        openedCanvas[destinationOffset + channel] = Math.round(premultiplied / outputAlpha);
      }
      openedCanvas[destinationOffset + 3] = Math.round(outputAlpha * 255);
    }
  }

  const canvas = await sharp(openedCanvas, {
    raw: { width, height, channels: 4 },
  }).png().toBuffer();

  return { canvas, targetBottom, targetWidth, scale, maximumShift };
}

async function projectedMask(product, width, height, { dx, dy, blur, opacity }) {
  const { data: blurred } = await sharp(product)
    .extractChannel(3)
    .blur(blur)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const shifted = Buffer.alloc(width * height);

  for (let y = Math.max(0, dy); y < height; y += 1) {
    const sourceY = y - dy;
    if (sourceY < 0 || sourceY >= height) continue;
    for (let x = Math.max(0, dx); x < width; x += 1) {
      const sourceX = x - dx;
      if (sourceX < 0 || sourceX >= width) continue;
      shifted[y * width + x] = Math.round(blurred[sourceY * width + sourceX] * opacity);
    }
  }

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 103, g: 93, b: 92 },
    },
  })
    .joinChannel(shifted, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
}

async function splitChainAndPendant(product, width, height, targetBottom, targetWidth) {
  const { data } = await sharp(product)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const chain = Buffer.from(data);
  const pendant = Buffer.from(data);
  const pendantTop = targetBottom - height * 0.18;
  const pendantHalfWidth = targetWidth * 0.14;
  const centreX = width / 2;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const inPendantZone = y >= pendantTop && Math.abs(x - centreX) <= pendantHalfWidth;
      if (inPendantZone) {
        chain[offset + 3] = 0;
      } else {
        pendant[offset + 3] = 0;
      }
    }
  }

  const options = { raw: { width, height, channels: 4 } };
  return Promise.all([
    sharp(chain, options).png().toBuffer(),
    sharp(pendant, options).png().toBuffer(),
  ]);
}

async function necklaceShadowLayers({ product, width, height, targetBottom, targetWidth }) {
  // Both passes are projections of the same silhouette and therefore share a
  // single top-left light direction.  This prevents impossible shadow lobes
  // from appearing above the chain while retaining the reference's soft depth.
  const [chain, pendant] = await splitChainAndPendant(
    product,
    width,
    height,
    targetBottom,
    targetWidth,
  );
  const [chainContact, chainAmbient, pendantContact] = await Promise.all([
    projectedMask(chain, width, height, {
      dx: Math.round(width * 0.0045),
      dy: Math.round(height * 0.0048),
      blur: width * 0.0032,
      opacity: 0.086,
    }),
    projectedMask(chain, width, height, {
      dx: Math.round(width * 0.009),
      dy: Math.round(height * 0.010),
      blur: width * 0.011,
      opacity: 0.034,
    }),
    projectedMask(pendant, width, height, {
      dx: Math.round(width * 0.003),
      dy: Math.round(height * 0.0042),
      blur: width * 0.0027,
      opacity: 0.155,
    }),
  ]);

  return [chainAmbient, chainContact, pendantContact];
}

await mkdir(outputDirectory, { recursive: true });

const backgroundMetadata = await sharp(backgroundPath).metadata();
const width = backgroundMetadata.width;
const height = backgroundMetadata.height;
if (!width || !height) throw new Error("Could not read background dimensions");

// Mandatory shared pass: no category can bypass edge cleanup before scaling,
// the chain opening transform or shadow generation.
const cleanedOriginal = await refineTransparentEdge(cutoutPath);
// The reference is intentionally read as a calibration source rather than
// copied into the output.  Its old object pixels and background compression
// can therefore never leak into a new catalogue image.
await sharp(referencePath).metadata();
const {
  canvas: product,
  targetBottom,
  targetWidth,
  scale,
  maximumShift,
} = await placeToReferenceTemplate(cleanedOriginal, width, height);
const shadowLayers = await necklaceShadowLayers({
  product,
  width,
  height,
  targetBottom,
  maximumShift,
  targetWidth,
});

const final = await sharp(backgroundPath)
  .composite([
    ...shadowLayers.map((input) => ({ input, left: 0, top: 0, blend: "multiply" })),
    { input: product, left: 0, top: 0 },
  ])
  .webp({ quality: 95, smartSubsample: true, effort: 6 })
  .toBuffer();

await Promise.all([
  writeFile(path.join(outputDirectory, "pendant-clean.png"), cleanedOriginal),
  writeFile(path.join(outputDirectory, "pendant-positioned.png"), product),
  ...shadowLayers.map((shadow, index) => writeFile(
    path.join(outputDirectory, `pendant-shadow-${index + 1}.png`),
    shadow,
  )),
  writeFile(path.join(outputDirectory, "pendant-catalog-v1.webp"), final),
]);

console.log(JSON.stringify({
  canvas: `${width}x${height}`,
  scale,
  targetWidth,
  targetBottom,
  output: path.join(outputDirectory, "pendant-catalog-v1.webp"),
}, null, 2));
