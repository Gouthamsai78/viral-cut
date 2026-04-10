/**
 * Security utilities for URL validation and SSRF protection.
 */

/**
 * Validates a URL and checks if it's safe to fetch from.
 * Blocks private IP ranges, localhost, and cloud metadata endpoints.
 * 
 * @param url The URL to validate
 * @returns The validated URL string if safe
 * @throws Error if URL is invalid or points to a restricted address
 */
export function validateAndSanitizeUrl(url: string): string {
  let parsedUrl: URL;
  
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Only allow http and https protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP and HTTPS protocols are allowed');
  }

  // Block localhost, loopback, and other special addresses
  const hostname = parsedUrl.hostname.toLowerCase();
  
  const blockedHostnames = [
    'localhost',
    '127.0.0.1',
    '::1',
    '0.0.0.0',
    'metadata.google.internal',
    '169.254.169.254',
  ];

  if (blockedHostnames.includes(hostname)) {
    throw new Error('URL points to a restricted address');
  }

  // Check for private IP ranges
  if (isPrivateIP(hostname)) {
    throw new Error('URL points to a private IP address');
  }

  return url;
}

/**
 * Checks if an IP address is in a private range.
 * Handles IPv4 and IPv6 private ranges.
 */
function isPrivateIP(hostname: string): boolean {
  // IPv4 private ranges
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    
    // 10.0.0.0/8
    if (a === 10) return true;
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    // 127.0.0.0/8 (loopback)
    if (a === 127) return true;
    // 169.254.0.0/16 (link-local)
    if (a === 169 && b === 254) return true;
    // 0.0.0.0/8
    if (a === 0) return true;
  }

  // IPv6 private ranges
  if (hostname.includes(':')) {
    // ::1 (loopback)
    if (hostname === '::1' || hostname === '0:0:0:0:0:0:0:1') return true;
    // fc00::/7 (unique local)
    if (hostname.startsWith('fc') || hostname.startsWith('fd')) return true;
    // fe80::/10 (link-local)
    if (hostname.startsWith('fe80') || hostname.startsWith('fe9') || 
        hostname.startsWith('fea') || hostname.startsWith('feb')) return true;
    // ::ffff:127.0.0.1 (IPv4-mapped)
    if (hostname.includes('::ffff:127.') || hostname.includes('::ffff:10.') ||
        hostname.includes('::ffff:192.168.') || hostname.includes('::ffff:172.')) {
      return true;
    }
  }

  return false;
}

/**
 * Maximum allowed file size for uploads (100MB)
 */
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Validates file size and type.
 * 
 * @param file The file to validate
 * @param allowedPrefixes Allowed MIME type prefixes (e.g., ['video/', 'image/'])
 * @param maxSize Maximum file size in bytes (default: MAX_FILE_SIZE)
 */
export function validateFile(
  file: File,
  allowedPrefixes: string[],
  maxSize: number = MAX_FILE_SIZE
): void {
  // Check file size
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    throw new Error(`File size exceeds maximum allowed size of ${sizeMB}MB`);
  }

  // Check MIME type
  const mimeType = file.type.toLowerCase();
  const isAllowed = allowedPrefixes.some(prefix => mimeType.startsWith(prefix));
  
  if (!isAllowed) {
    throw new Error(`File type '${file.type}' is not allowed. Allowed types: ${allowedPrefixes.join(', ')}`);
  }
}

/**
 * Magic byte signatures for common file types.
 * Used to verify actual file content matches claimed MIME type.
 */
export const MAGIC_BYTES = {
  video: {
    mp4: [
      [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // fttyp
      [0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70], // fttyp
    ],
    webm: [0x1a, 0x45, 0xdf, 0xa3],
    mov: [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70], // ftyp
  },
  image: {
    png: [0x89, 0x50, 0x4e, 0x47],
    jpg: [0xff, 0xd8, 0xff],
    webp: [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50], // RIFF....WEBP
  },
} as const;

/**
 * Validates file content by checking magic bytes.
 * 
 * @param buffer The file content buffer
 * @param claimedType The claimed MIME type
 * @returns true if magic bytes match the claimed type
 */
export function validateMagicBytes(buffer: Buffer, claimedType: string): boolean {
  const category = claimedType.split('/')[0];
  
  if (category === 'video') {
    if (claimedType.includes('mp4') || claimedType.includes('quicktime')) {
      // Check for ftyp box (bytes 4-7 should be "ftyp")
      if (buffer.length >= 8) {
        return buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70;
      }
      return false;
    }
    if (claimedType.includes('webm')) {
      return checkMagicBytes(buffer, [MAGIC_BYTES.video.webm]);
    }
  }
  
  if (category === 'image') {
    if (claimedType.includes('png')) {
      return checkMagicBytes(buffer, [MAGIC_BYTES.image.png]);
    }
    if (claimedType.includes('jpeg') || claimedType.includes('jpg')) {
      return checkMagicBytes(buffer, [MAGIC_BYTES.image.jpg]);
    }
    if (claimedType.includes('webp')) {
      return checkMagicBytes(buffer, [MAGIC_BYTES.image.webp]);
    }
  }

  // Deny unknown types by default (security-first approach)
  console.warn(`[Security] No magic bytes validator for: ${claimedType}`);
  return false;
}

function checkMagicBytes(buffer: Buffer, signatures: number[][]): boolean {
  return signatures.some(sig => {
    if (buffer.length < sig.length) return false;
    return sig.every((byte, i) => buffer[i] === byte);
  });
}
