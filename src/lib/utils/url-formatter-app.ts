import process from 'process';

// Get MinIO base URL from environment variables
function getMinioBaseUrl(): string {
  const isBrowser = typeof window !== 'undefined';
  const env = isBrowser ? ((window as any).__ENV || {}) : process.env;
  
  const endpoint = env.MINIO_ENDPOINT || 'localhost';
  const port = env.MINIO_PORT || '9000';
  const useSSL = isBrowser 
    ? env.MINIO_USE_SSL === 'true'
    : env.MINIO_USE_SSL?.toLowerCase() === 'true';
  
  return `${useSSL ? 'https' : 'http'}://${endpoint}:${port}`;
}

// Helper for unescaping HTML entities in URLs
export function unescapeHtmlUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  return url
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Normalize a media URL for frontend use
export function normalizeAppMediaUrl(url: string | null | undefined): string {
  // Handle empty input
  if (!url) return '';
  
  // Get MinIO base URL once for this function call
  const minioBaseUrl = getMinioBaseUrl();
  
  // Step 1: Fix duplicated URLs
  const fixedUrl = fixDuplicatedUrls(url, minioBaseUrl);
  
  // Step 2: Unescape HTML entities
  const unescaped = unescapeHtmlUrl(fixedUrl)
    .replace(/&quot;/g, '"'); // Additional specific replacement
  
  // Step 3: Extract full URL if one exists in the string
  const extractedUrl = extractHttpUrl(unescaped);
  if (extractedUrl) return extractedUrl;
  
  // Step 4: Clean and normalize the path
  const cleanPath = cleanUrlPath(unescaped);
  
  // Step 5: Return full URL with base
  return `${minioBaseUrl}/${cleanPath}`;
}

// Extract a complete HTTP URL if present in a string
function extractHttpUrl(text: string): string | null {
  const httpMatch = text.match(/(https?:\/\/[^"\s]+)/);
  return httpMatch 
    ? httpMatch[1].replace(/["']+$/, '') 
    : null;
}

// Clean up a URL path for proper formatting
function cleanUrlPath(path: string): string {
  // Handle absolute URLs
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove quotes at the end
  let clean = path.endsWith('"') ? path.slice(0, -1) : path;
  
  // Remove leading ./ or /
  if (clean.startsWith('./')) {
    clean = clean.substring(2);
  } else if (clean.startsWith('/')) {
    clean = clean.substring(1);
  }
  
  return clean;
}

// Fix URLs with duplicated base parts
function fixDuplicatedUrls(url: string, baseUrl: string): string {
  // Fix complete duplicated base URL
  if (url.includes(`${baseUrl}/${baseUrl}/`)) {
    return url.replace(`${baseUrl}/${baseUrl}/`, `${baseUrl}/`);
  }
  
  // Fix protocol/domain duplication
  const urlParts = baseUrl.split('://');
  if (urlParts.length === 2) {
    const protocol = urlParts[0];
    const domain = urlParts[1];
    const duplicatePattern = `${protocol}://${domain}/${protocol}://${domain}/`;
    
    if (url.includes(duplicatePattern)) {
      return url.replace(duplicatePattern, `${protocol}://${domain}/`);
    }
  }
  
  return url;
}

// Check if a string is a valid URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
