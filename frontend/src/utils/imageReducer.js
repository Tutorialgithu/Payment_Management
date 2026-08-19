/**
 * Compress an image file using HTML Canvas to reduce its size under targetKb (default: 50 KB).
 * Performs multi-pass quality & dimension scaling.
 * Returns { success, dataUrl, sizeKb, isTooLarge, error }
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
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let sizeKb = Math.round((dataUrl.length * 0.75) / 1024);

        // Pass 1: Reduce quality
        while (sizeKb > targetKb && quality > 0.15) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
        }

        // Pass 2: If size is still larger than targetKb + 10, scale resolution down
        if (sizeKb > targetKb + 10) {
          const smallCanvas = document.createElement('canvas');
          const smallWidth = Math.round(width * 0.6);
          const smallHeight = Math.round(height * 0.6);
          smallCanvas.width = smallWidth;
          smallCanvas.height = smallHeight;
          const smallCtx = smallCanvas.getContext('2d');
          smallCtx.fillStyle = '#FFFFFF';
          smallCtx.fillRect(0, 0, smallWidth, smallHeight);
          smallCtx.drawImage(img, 0, 0, smallWidth, smallHeight);

          quality = 0.6;
          dataUrl = smallCanvas.toDataURL('image/jpeg', quality);
          sizeKb = Math.round((dataUrl.length * 0.75) / 1024);

          while (sizeKb > targetKb && quality > 0.1) {
            quality -= 0.15;
            dataUrl = smallCanvas.toDataURL('image/jpeg', quality);
            sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
          }
        }

        // Strict limit check: If sizeKb > 60 KB, warn user
        if (sizeKb > 60) {
          resolve({
            success: false,
            dataUrl,
            sizeKb,
            isTooLarge: true,
            error: `Please reduce image size. File is too large (${sizeKb} KB) to compress under 50KB.`
          });
        } else {
          resolve({
            success: true,
            dataUrl,
            sizeKb,
            isTooLarge: false
          });
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
