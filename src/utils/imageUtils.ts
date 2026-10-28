/**
 * Image processing utilities for client-side compression and optimization.
 * Prevents localStorage QuotaExceeded errors when uploading photos taken with phone cameras.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (!file.type.startsWith('image/')) {
      reject(new Error('O arquivo selecionado não é uma imagem válida.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Falha ao processar arquivo de imagem.'));
        return;
      }

      // Preserve SVGs and tiny images directly
      if (file.type === 'image/svg+xml' || file.size < 60 * 1024) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate scaled dimensions keeping aspect ratio
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Optional: clear canvas
          ctx.clearRect(0, 0, width, height);

          // If source has alpha transparency and we export to JPEG, fill white background
          if (file.type === 'image/png' || file.type === 'image/webp') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Compress to JPEG for high efficiency and universal compatibility
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          console.warn('Canvas compression error, falling back to original data URL', err);
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        console.warn('Image load error, falling back to data URL');
        resolve(dataUrl);
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      reject(new Error('Erro na leitura do arquivo local.'));
    };

    reader.readAsDataURL(file);
  });
}
