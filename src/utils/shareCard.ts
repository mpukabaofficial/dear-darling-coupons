/**
 * Utilities for sharing redemption cards
 */

/**
 * Checks if the Web Share API is available (typically on mobile)
 */
export const canUseWebShare = (): boolean => {
  return typeof navigator !== 'undefined' && 'share' in navigator;
};

/**
 * Checks if the browser can share files (images)
 */
export const canShareFiles = (): boolean => {
  return (
    typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator &&
    navigator.canShare({ files: [] })
  );
};

/**
 * Converts an HTML element to a canvas, then to a blob
 */
export const elementToBlob = async (
  element: HTMLElement,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  quality: number = 0.95
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Dynamically import html2canvas to keep bundle size small
      const html2canvas = (await import('html2canvas')).default;

      // Convert element to canvas with high quality
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // High resolution for better quality
        useCORS: true, // Allow cross-origin images
        logging: false,
      });

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        format,
        quality
      );
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Shares a card using the Web Share API (mobile)
 */
export const shareCardViaNative = async (
  blob: Blob,
  title: string,
  text?: string
): Promise<void> => {
  if (!canShareFiles()) {
    throw new Error('Web Share API is not available on this device');
  }

  const fileName = `coupon-${Date.now()}.png`;
  const file = new File([blob], fileName, { type: blob.type });

  try {
    await navigator.share({
      files: [file],
      title: title,
      text: text || 'I just redeemed this coupon! 💕',
    });
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name !== 'AbortError') {
      throw error;
    }
  }
};

/**
 * Downloads a card as an image file (desktop)
 */
export const downloadCard = (blob: Blob, filename?: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `coupon-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copies a card image to clipboard (desktop)
 */
export const copyCardToClipboard = async (blob: Blob): Promise<void> => {
  if (!navigator.clipboard || !('write' in navigator.clipboard)) {
    throw new Error('Clipboard API is not available');
  }

  try {
    const clipboardItem = new ClipboardItem({ [blob.type]: blob });
    await navigator.clipboard.write([clipboardItem]);
  } catch (error) {
    throw new Error('Failed to copy image to clipboard');
  }
};

/**
 * Main sharing function that handles both mobile and desktop
 */
export const shareRedemptionCard = async (
  elementId: string,
  title: string,
  options?: {
    method?: 'auto' | 'download' | 'share' | 'clipboard';
    text?: string;
    filename?: string;
  }
): Promise<{ success: boolean; method: string }> => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const blob = await elementToBlob(element);

  const method = options?.method || 'auto';

  // Auto-detect best sharing method
  if (method === 'auto') {
    if (canShareFiles()) {
      await shareCardViaNative(blob, title, options?.text);
      return { success: true, method: 'native-share' };
    } else {
      downloadCard(blob, options?.filename);
      return { success: true, method: 'download' };
    }
  }

  // Use specified method
  switch (method) {
    case 'share':
      await shareCardViaNative(blob, title, options?.text);
      return { success: true, method: 'native-share' };

    case 'download':
      downloadCard(blob, options?.filename);
      return { success: true, method: 'download' };

    case 'clipboard':
      await copyCardToClipboard(blob);
      return { success: true, method: 'clipboard' };

    default:
      throw new Error(`Unknown sharing method: ${method}`);
  }
};
