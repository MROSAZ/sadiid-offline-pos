
/**
 * Type definitions for performance-related interfaces
 */

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  cancelable: boolean;
  target: Node | null;
}
