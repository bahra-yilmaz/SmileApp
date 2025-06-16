import { Share, Platform } from 'react-native';
import type { ShareContent } from 'react-native';

/**
 * Simple cross-platform helper to invoke the native share sheet.
 * Wraps React Native`s Share API to provide a consistent typed interface
 * and graceful error handling.
 *
 * Because iOS ignores the `message` field when a URL is supplied, we
 * conditionally compose the object per-platform.
 *
 * If you only want to share plain text, pass just `title` and `message`.
 */
export async function shareContent({
  title = 'Share',
  message,
  url,
}: {
  /** Sheet title on Android */
  title?: string;
  /** Main text to share */
  message: string;
  /** Optional URL to include */
  url?: string;
}): Promise<void> {
  try {
    const content = Platform.select({
      ios: {
        title,
        message,
        url, // iOS can handle both message & url
      },
      android: {
        title,
        message: url ? `${message} ${url}` : message, // Android ignores message if url is separate
      },
      default: { title, message: url ? `${message} ${url}` : message },
    }) as ShareContent | undefined;

    if (!content) return;

    const result = content ? await Share.share(content) : undefined;

    // At the moment we do not need to handle `result` beyond logging
    if (result?.action === Share.dismissedAction) {
      // User dismissed the share sheet.
      return;
    }
  } catch (err) {
    console.error('Error while attempting to share:', err);
  }
} 