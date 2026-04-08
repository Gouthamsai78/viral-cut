import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a File or Blob to a base64 data URL
 * Works in both browser and Node.js environments
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  // Browser environment
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Node.js environment (server-side API routes)
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString('base64');
  
  // Determine MIME type
  const mimeType = file.type || 'application/octet-stream';
  return `data:${mimeType};base64,${base64}`;
}
