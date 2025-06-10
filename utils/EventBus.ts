/**
 * A simple, lightweight, and type-safe event bus implementation.
 * This allows for decoupled communication between different parts of the application.
 */

type Listener = (...args: any[]) => void;

class EventBus {
  private listeners: { [event: string]: Listener[] } = {};

  /**
   * Subscribes to an event.
   * @param event The name of the event to subscribe to.
   * @param listener The callback function to execute when the event is emitted.
   * @returns A function to unsubscribe the listener.
   */
  on(event: string, listener: Listener): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);

    // Return an unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribes from an event.
   * @param event The name of the event.
   * @param listener The listener function to remove.
   */
  off(event: string, listener: Listener): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  /**
   * Emits an event, calling all subscribed listeners.
   * @param event The name of the event to emit.
   * @param args The arguments to pass to the listeners.
   */
  emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach(listener => {
      try {
        listener(...args);
      } catch (e) {
        console.error(`Error in event listener for ${event}:`, e);
      }
    });
  }
}

// Export a singleton instance
export const eventBus = new EventBus(); 