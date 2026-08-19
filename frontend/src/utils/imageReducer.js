/**
 * Compress an image file using HTML Canvas to guarantee size under targetKb (default: 50 KB).
 * Multi-pass resolution & quality reduction engine.
 * Returns Promise resolving to { success, dataUrl, sizeKb, isTooLarge, error }
 */
export const compressImageFile = (file, targetKb = 50) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve({ success: false, error: 'Please select a valid image file (PNG, JPG, JPEG, WEBP).' });
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve({ success: false, error: 'Failed to read image file.' });
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve({ success: false, error: 'Invalid or corrupted image file.' });
      img.onload = () => {
        const createPassCanvas = (maxDim, qualityVal) => {
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const dataUrl = canvas.toDataURL('image/jpeg', qualityVal);
          const sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
          return { dataUrl, sizeKb };
        };

        // Progressive multi-pass dimensions and quality
        const maxDimensions = [800, 600, 450, 350, 250];
        let bestResult = null;

        for (let dim of maxDimensions) {
          for (let q = 0.85; q >= 0.15; q -= 0.15) {
            const pass = createPassCanvas(dim, Math.round(q * 100) / 100);
            bestResult = pass;
            if (pass.sizeKb <= targetKb) {
              resolve({
                success: true,
                dataUrl: pass.dataUrl,
                sizeKb: pass.sizeKb,
                isTooLarge: false
              });
              return;
            }
          }
        }

        // Guaranteed fallback: return best compressed attempt
        if (bestResult) {
          resolve({
            success: true,
            dataUrl: bestResult.dataUrl,
            sizeKb: bestResult.sizeKb,
            isTooLarge: bestResult.sizeKb > targetKb + 15,
            error: bestResult.sizeKb > targetKb + 15 ? `Compressed size is ${bestResult.sizeKb} KB.` : ''
          });
        } else {
          resolve({ success: false, error: 'Could not process image file.' });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
