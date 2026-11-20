import process from 'process';

// Helper function to get the MinIO base URL from environment variables
function getMinioBaseUrl(): string {
  const endpoint = process.env.MINIO_ENDPOINT;
  const port = process.env.MINIO_PORT;
  const useSSL = process.env.MINIO_USE_SSL?.toLowerCase() === 'true';
  
  return `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
}

/**
 * Extracts filename from a MinIO/Azure URL
 * @param url Complete URL with signature parameters
 * @returns Filename without parameters
 */
export function extractFilenameFromUrl(url: string): string {
  if (!url) return '';
  
  // Remove query parameters and extract filename
  const baseUrl = url.split('?')[0];
  return baseUrl.split('/').pop() || '';
}

/**
 * Normalizes a media URL for frontend display
 * @param url Media URL (can be a JSON string or direct URL)
 * @returns Normalized URL ready for use in image/audio src
 */
export function normalizeMediaUrl(url: string | null): string {
  if (!url) return '';
  
  // Handle JSON string format
  let processed = url;
  if (url.startsWith('"') && url.endsWith('"')) {
    try {
      processed = JSON.parse(url);
    } catch {
      // Keep original if parsing fails
    }
  }
  
  // Remove quotes if present
  if (typeof processed === 'string' && (processed.startsWith('"') && processed.endsWith('"'))) {
    processed = processed.slice(1, -1);
  }
  
  // Return as-is if it's an absolute URL
  if (typeof processed === 'string' && (processed.startsWith('http://') || processed.startsWith('https://'))) {
    return processed;
  }
  
  // Clean up URL path
  if (typeof processed === 'string') {
    if (processed.startsWith('./')) {
      processed = processed.substring(2);
    }
    
    if (processed.startsWith('/')) {
      processed = processed.substring(1);
    }
    
    // Construct full URL
    const minioBaseUrl = getMinioBaseUrl();
    return `${minioBaseUrl}/${processed}`;
  }
  
  return processed as string;
}

/**
 * Formats a URL for safe display (without exposing credentials)
 * @param url Complete URL
 * @returns Simplified URL for display
 */
export function formatUrlForDisplay(url: string): string {
  if (!url) return '';
  return url.split('?')[0];
}
