import { RefObject } from 'react';
import { FlatList } from 'react-native';

interface Options {
  /** Delay before scrolling to allow animations (ms) */
  delay?: number;
  /** viewPosition when opening picker for a newly added row (0-1, >1 allowed) */
  addViewPosition?: number;
  /** viewPosition when opening picker for editing existing row */
  editViewPosition?: number;
  /** viewPosition when closing picker after add */
  closeAddViewPosition?: number;
  /** viewPosition when closing picker after edit */
  closeEditViewPosition?: number;
}

/**
 * Returns helper functions to auto-scroll a FlatList so that an inline picker
 * (or any expandable element) is properly revealed.
 *
 * Example usage:
 *   const autoScroll = useInlinePickerScroll(listRef);
 *   autoScroll.openAdd(items.length);
 */
export default function useInlinePickerScroll<T = any>(
  listRef: RefObject<FlatList<T> | null>,
  {
    delay = 400,
    addViewPosition = 1.2,
    editViewPosition = 0.7,
    closeAddViewPosition = 0.5,
    closeEditViewPosition = 0.3,
  }: Options = {},
) {
  const scrollAfterDelay = (index: number, viewPosition: number) => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition });
    }, delay);
  };

  return {
    /** Call when opening the add-new picker */
    openAdd: (itemsCount: number) => scrollAfterDelay(itemsCount, addViewPosition),
    /** Call when opening picker for an existing item */
    openEdit: (index: number) => scrollAfterDelay(index, editViewPosition),
    /** Call when closing add-new picker */
    closeAdd: (itemsCount: number) =>
      listRef.current?.scrollToIndex({ index: itemsCount, animated: true, viewPosition: closeAddViewPosition }),
    /** Call when closing picker after editing */
    closeEdit: (index: number) =>
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: closeEditViewPosition }),
  };
} 