import { StreakEvent, StreakEventData, StreakSession } from './StreakTypes';

/**
 * Handles event management and notifications for streak updates
 */
export class StreakEventService {
  private static listeners: Map<StreakEvent, Function[]> = new Map();

  /**
   * Subscribe to streak events
   */
  static on(event: StreakEvent, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event to all listeners
   */
  static emit(event: StreakEvent, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in streak event callback for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Emit streak update event
   */
  static emitStreakUpdate(
    userId: string,
    previousStreak: number,
    newStreak: number,
    newSession?: StreakSession
  ): void {
    const eventData: StreakEventData = {
      userId,
      previousStreak,
      newStreak,
      newSession,
      timestamp: Date.now()
    };

    this.emit('streak-updated', eventData);
  }

  /**
   * Emit streak calculation event
   */
  static emitStreakCalculated(userId: string, newStreak: number): void {
    const eventData: StreakEventData = {
      userId,
      newStreak,
      timestamp: Date.now()
    };

    this.emit('streak-calculated', eventData);
  }

  /**
   * Emit history update event
   */
  static emitHistoryUpdated(userId: string): void {
    const eventData: StreakEventData = {
      userId,
      newStreak: 0, // Not relevant for history updates
      timestamp: Date.now()
    };

    this.emit('history-updated', eventData);
  }

  /**
   * Clear all event listeners (useful for cleanup)
   */
  static clearAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Get number of listeners for a specific event (useful for debugging)
   */
  static getListenerCount(event: StreakEvent): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * Check if there are any listeners for an event
   */
  static hasListeners(event: StreakEvent): boolean {
    return this.getListenerCount(event) > 0;
  }
} 