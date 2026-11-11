/**
 * Compresses an image file from mobile phone camera or gallery
 * to optimize upload speed and storage while maintaining high inspection quality.
 */
export async function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  initialQuality = 0.82
): Promise<{ dataUrl: string; width: number; height: number; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context 생성 실패'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Firestore document limit is 1,048,576 bytes.
        // We ensure dataUrl string length stays strictly under 750,000 characters (~560KB binary)
        // for safe network transit, low memory, and Firestore document ceiling.
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        const MAX_BASE64_LENGTH = 750000;

        // Adaptive step-down if image has very dense detail
        if (dataUrl.length > MAX_BASE64_LENGTH) {
          quality = 0.72;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > MAX_BASE64_LENGTH) {
          // Scale down dimensions by 25% if still dense
          const scaledCanvas = document.createElement('canvas');
          scaledCanvas.width = Math.round(width * 0.75);
          scaledCanvas.height = Math.round(height * 0.75);
          const sCtx = scaledCanvas.getContext('2d');
          if (sCtx) {
            sCtx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
            dataUrl = scaledCanvas.toDataURL('image/jpeg', 0.70);
            width = scaledCanvas.width;
            height = scaledCanvas.height;
          }
        }

        const size = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          width,
          height,
          size,
        });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
