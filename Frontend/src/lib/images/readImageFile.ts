const ACCEPTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
]);

const MAX_BYTES = 512 * 1024;

export type ImageFileError = 'type' | 'size' | 'read';

export function validateImageFile(file: File): ImageFileError | null {
  if (!ACCEPTED_TYPES.has(file.type)) return 'type';
  if (file.size > MAX_BYTES) return 'size';
  return null;
}

export function imageFileErrorMessage(code: ImageFileError): string {
  switch (code) {
    case 'type':
      return 'Use PNG, JPG, WebP, or SVG.';
    case 'size':
      return 'Logo must be 512 KB or smaller.';
    case 'read':
      return 'Could not read the file. Try another image.';
  }
}

export function readImageFileAsDataUrl(file: File): Promise<string> {
  const validation = validateImageFile(file);
  if (validation) {
    return Promise.reject(new Error(imageFileErrorMessage(validation)));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error(imageFileErrorMessage('read')));
      }
    };
    reader.onerror = () => reject(new Error(imageFileErrorMessage('read')));
    reader.readAsDataURL(file);
  });
}
