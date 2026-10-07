// Raster helpers for the photo path.
//
// The only external dependency is ffmpeg, which the GIF path already requires.
// Decoding through `-f rawvideo -pix_fmt rgb24` removes any need for an image
// library, which matters because every dependency here is borne by every
// consumer of the plugin.

export const RGB = 3;

export function createRaster(width, height, fill = 0) {
  return { width, height, data: new Uint8Array(width * height * RGB).fill(fill) };
}

export function cloneRaster(raster) {
  return { width: raster.width, height: raster.height, data: Uint8Array.from(raster.data) };
}

// Exact output dimensions with the source aspect preserved, so the caller never
// has to probe the file to know what it decoded.
export function decodeArgs({ input, width, height, outputPath }) {
  const scale = `scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos`;
  const pad = `pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`;
  return [
    '-y',
    '-v', 'error',
    '-i', input,
    '-vf', `${scale},${pad}`,
    '-frames:v', '1',
    '-f', 'rawvideo',
    '-pix_fmt', 'rgb24',
    outputPath,
  ];
}

export function probeSizeArgs(input) {
  return [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-of', 'csv=s=x:p=0',
    input,
  ];
}

export function parseProbeSize(stdout) {
  const match = /^(\d+)x(\d+)/m.exec(String(stdout).trim());
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

export function rasterFromBuffer(buffer, width, height) {
  const expected = width * height * RGB;
  if (buffer.length !== expected) {
    throw new Error(`decoded ${buffer.length} bytes, expected ${expected} for ${width}x${height}`);
  }
  return { width, height, data: Uint8Array.from(buffer) };
}

function clamp(value, low, high) {
  return value < low ? low : value > high ? high : value;
}

// Bilinear sample, clamped to the given bounds. Clamping rather than wrapping
// is what makes small displacements read cleanly: the vacated sliver is filled
// with the region's own border pixels instead of whatever sat behind it, which
// a single photograph does not know.
export function sampleClamped(raster, x, y, bounds) {
  const minX = bounds ? bounds.x : 0;
  const minY = bounds ? bounds.y : 0;
  const maxX = (bounds ? bounds.x + bounds.width : raster.width) - 1;
  const maxY = (bounds ? bounds.y + bounds.height : raster.height) - 1;
  const fx = clamp(x, minX, maxX);
  const fy = clamp(y, minY, maxY);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, maxX);
  const y1 = Math.min(y0 + 1, maxY);
  const tx = fx - x0;
  const ty = fy - y0;
  const out = [0, 0, 0];
  for (let channel = 0; channel < RGB; channel += 1) {
    const p00 = raster.data[(y0 * raster.width + x0) * RGB + channel];
    const p10 = raster.data[(y0 * raster.width + x1) * RGB + channel];
    const p01 = raster.data[(y1 * raster.width + x0) * RGB + channel];
    const p11 = raster.data[(y1 * raster.width + x1) * RGB + channel];
    const top = p00 + (p10 - p00) * tx;
    const bottom = p01 + (p11 - p01) * tx;
    out[channel] = top + (bottom - top) * ty;
  }
  return out;
}

export function regionPixels(rect, width, height) {
  const x = Math.round(rect[0] * width);
  const y = Math.round(rect[1] * height);
  const w = Math.max(1, Math.round(rect[2] * width));
  const h = Math.max(1, Math.round(rect[3] * height));
  return {
    x: clamp(x, 0, width - 1),
    y: clamp(y, 0, height - 1),
    width: Math.min(w, width - clamp(x, 0, width - 1)),
    height: Math.min(h, height - clamp(y, 0, height - 1)),
  };
}

// Applies an affine transform to one region, in place on `target`, reading from
// `source`. Everything outside the region is untouched, which is what lets the
// converter treat the rest of the frame as static.
export function warpRegion({ source, target, bounds, translate = [0, 0], scale = [1, 1], rotate = 0 }) {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const cos = Math.cos(-rotate);
  const sin = Math.sin(-rotate);
  const invScaleX = 1 / (scale[0] || 1);
  const invScaleY = 1 / (scale[1] || 1);
  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const dx = x - cx - translate[0];
      const dy = y - cy - translate[1];
      const rx = (dx * cos - dy * sin) * invScaleX;
      const ry = (dx * sin + dy * cos) * invScaleY;
      const [r, g, b] = sampleClamped(source, cx + rx, cy + ry, bounds);
      const offset = (y * target.width + x) * RGB;
      target.data[offset] = r;
      target.data[offset + 1] = g;
      target.data[offset + 2] = b;
    }
  }
  return target;
}

// A blink is an eyelid descending, not a rectangle of flat colour. Sampling
// the lid colour per column preserves the shading that runs across the face;
// a single averaged colour reads as a censor bar, which is exactly what the
// first attempt looked like.
export function lowerLid({ source, target, bounds, amount, sampleRows = 3 }) {
  const lidBottom = bounds.y + amount * bounds.height;
  for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let step = 1; step <= sampleRows; step += 1) {
      const y = Math.max(0, bounds.y - step);
      const offset = (y * source.width + x) * RGB;
      r += source.data[offset];
      g += source.data[offset + 1];
      b += source.data[offset + 2];
      count += 1;
    }
    const lid = [r / count, g / count, b / count];
    for (let y = bounds.y; y < lidBottom && y < bounds.y + bounds.height; y += 1) {
      // Feather the leading edge so the lid does not step down in hard bands.
      const edge = Math.min(1, lidBottom - y);
      const offset = (y * target.width + x) * RGB;
      for (let channel = 0; channel < RGB; channel += 1) {
        const current = target.data[offset + channel];
        target.data[offset + channel] = current + (lid[channel] - current) * edge;
      }
    }
  }
  return target;
}
