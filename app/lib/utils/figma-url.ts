import { ParsedFigmaUrl } from '../types/figma';

/**
 * Figma URL Parser Utility
 * Handles various Figma URL formats and extracts file information
 */

// Supported Figma URL patterns:
// - https://www.figma.com/file/{fileKey}/{fileName}
// - https://www.figma.com/design/{fileKey}/{fileName}
// - https://www.figma.com/proto/{fileKey}/{fileName}
// - https://www.figma.com/board/{fileKey}/{fileName}
// - With optional node-id query parameter: ?node-id=123-456

const FIGMA_URL_REGEX = /^https?:\/\/(www\.)?figma\.com\/(file|design|proto|board)\/([a-zA-Z0-9]+)(\/[^?]*)?(\?.*)?$/;

/**
 * Validates if a string is a valid Figma URL
 */
export function isValidFigmaUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const trimmedUrl = url.trim();
    return FIGMA_URL_REGEX.test(trimmedUrl);
  } catch {
    return false;
  }
}

/**
 * Parses a Figma URL and extracts the file key and other information
 */
export function parseFigmaUrl(url: string): ParsedFigmaUrl | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const trimmedUrl = url.trim();
    const match = trimmedUrl.match(FIGMA_URL_REGEX);

    if (!match) {
      return null;
    }

    const fileType = match[2] as 'file' | 'design' | 'proto' | 'board';
    const fileKey = match[3];

    // Parse query parameters to extract node-id if present
    let nodeId: string | undefined;

    try {
      const urlObj = new URL(trimmedUrl);
      const nodeIdParam = urlObj.searchParams.get('node-id');
      if (nodeIdParam) {
        nodeId = nodeIdParam;
      }
    } catch {
      // If URL parsing fails, continue without node-id
    }

    return {
      fileKey,
      fileType,
      nodeId,
    };
  } catch {
    return null;
  }
}

/**
 * Extracts just the file key from a Figma URL
 */
export function extractFileKey(url: string): string | null {
  const parsed = parseFigmaUrl(url);
  return parsed?.fileKey ?? null;
}

/**
 * Generates a Figma file URL from a file key
 */
export function generateFigmaUrl(fileKey: string, type: 'file' | 'design' = 'design'): string {
  return `https://www.figma.com/${type}/${fileKey}`;
}

/**
 * Converts a node-id format (e.g., "123-456") to Figma's internal format (e.g., "123:456")
 */
export function normalizeNodeId(nodeId: string): string {
  return nodeId.replace(/-/g, ':');
}

/**
 * Converts Figma's internal node-id format to URL-safe format
 */
export function toUrlSafeNodeId(nodeId: string): string {
  return nodeId.replace(/:/g, '-');
}
