/**
 * Processes a base64 image string to improve OCR accuracy.
 * Applies a grayscale filter then a binarization threshold 
 * to make the gold/yellow text turn pure black against a white background.
 */
export const preprocessImage = (base64Str: string, threshold: number = 170): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(base64Str); // Fallback
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Perceived Luminance calculation
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        // Binarize: if luminance is lower than threshold (darker), snap to black. Else white.
        const val = luminance < threshold ? 0 : 255;

        data[i] = val;       // R
        data[i + 1] = val;   // G
        data[i + 2] = val;   // B
        // Alpha (data[i + 3]) stays the same
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg'));
    };
    
    img.onerror = (err) => {
      console.error('Failed to load image for preprocessing:', err);
      resolve(base64Str); // Fallback to raw if logic fails
    };
    
    img.src = base64Str;
  });
};
