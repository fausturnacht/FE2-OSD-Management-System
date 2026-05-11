/**
 * Processes a base64 image string to improve OCR accuracy.
 *
 * Instead of a harsh global binarization (pure B&W), this uses a multi-step
 * pipeline that gracefully handles shadows and uneven lighting:
 *
 *   1. Convert to grayscale (perceived luminance).
 *   2. Apply adaptive (local-mean) thresholding so that regions in shadow
 *      are evaluated relative to their local neighborhood instead of a
 *      single global cutoff.
 *   3. Use the `strength` parameter (0–255, default 128) as a contrast
 *      enhancement knob:
 *        - Low  values → softer contrast, more gray tones preserved.
 *        - High values → stronger contrast, closer to B&W but never the
 *          brutal snap of global binarization.
 *
 * The result is a clean grayscale image where text stands out even when
 * a phone shadow falls across part of the ID.
 */
export const preprocessImage = (
  base64Str: string,
  strength: number = 128,
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    img.onload = () => {
      const w = img.width;
      const h = img.height;

      // --- source canvas ---
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = w;
      srcCanvas.height = h;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) return resolve(base64Str);

      srcCtx.drawImage(img, 0, 0);
      const srcData = srcCtx.getImageData(0, 0, w, h);
      const pixels = srcData.data;

      // Step 1 — Grayscale luminance buffer
      const gray = new Uint8Array(w * h);
      for (let i = 0; i < gray.length; i++) {
        const off = i * 4;
        gray[i] = Math.round(
          0.2126 * pixels[off] +
          0.7152 * pixels[off + 1] +
          0.0722 * pixels[off + 2],
        );
      }

      // Step 2 — Build integral image for fast local-mean computation
      const integral = new Float64Array(w * h);
      for (let y = 0; y < h; y++) {
        let rowSum = 0;
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          rowSum += gray[idx];
          integral[idx] = rowSum + (y > 0 ? integral[(y - 1) * w + x] : 0);
        }
      }

      /**
       * Returns the mean gray value inside the rectangle (x1,y1)–(x2,y2)
       * in O(1) using the integral image.
       */
      const regionMean = (x1: number, y1: number, x2: number, y2: number): number => {
        const a = y1 > 0 && x1 > 0 ? integral[(y1 - 1) * w + (x1 - 1)] : 0;
        const b = y1 > 0 ? integral[(y1 - 1) * w + x2] : 0;
        const c = x1 > 0 ? integral[y2 * w + (x1 - 1)] : 0;
        const d = integral[y2 * w + x2];
        const area = (x2 - x1 + 1) * (y2 - y1 + 1);
        return (d - b - c + a) / area;
      };

      // Adaptive window size — ~1/8 of the smaller dimension, at least 15px, always odd
      let radius = Math.max(7, Math.round(Math.min(w, h) / 16));
      if (radius % 2 === 0) radius++;

      // Map strength (0–255) to a contrast factor.
      //   0   → very soft (factor ≈ 0.3, almost flat gray)
      //   128 → moderate  (factor ≈ 1.6)
      //   255 → strong    (factor ≈ 3.0, very high contrast but still not binary)
      const factor = 0.3 + (strength / 255) * 2.7;

      // A small constant (k) biases the local threshold slightly darker
      // so that thin text strokes aren't washed out. Range ≈ 5–15 depending on strength.
      const k = 5 + (strength / 255) * 10;

      // Step 3 — Adaptive contrast-enhanced output
      const out = srcCtx.createImageData(w, h);
      const od = out.data;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const g = gray[idx];

          // Local neighborhood bounds (clamped to image edges)
          const x1 = Math.max(0, x - radius);
          const y1 = Math.max(0, y - radius);
          const x2 = Math.min(w - 1, x + radius);
          const y2 = Math.min(h - 1, y + radius);

          const localMean = regionMean(x1, y1, x2, y2);

          // Difference from local mean (negative = darker than surroundings)
          const diff = g - (localMean - k);

          // Apply contrast factor and center around 128 (mid-gray)
          let val = 128 + diff * factor;

          // Clamp to [0, 255]
          val = val < 0 ? 0 : val > 255 ? 255 : val;

          const pix = idx * 4;
          od[pix]     = val; // R
          od[pix + 1] = val; // G
          od[pix + 2] = val; // B
          od[pix + 3] = 255; // A
        }
      }

      srcCtx.putImageData(out, 0, 0);
      resolve(srcCanvas.toDataURL('image/jpeg'));
    };

    img.onerror = (err) => {
      console.error('Failed to load image for preprocessing:', err);
      resolve(base64Str); // Fallback to raw if logic fails
    };

    img.src = base64Str;
  });
};
