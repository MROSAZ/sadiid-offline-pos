
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 🎨 Sadiid Offline POS - Core Utilities
 * 
 * Essential utility functions for the application core.
 * For formatting utilities, see @/utils/formatting
 */

/**
 * Combine class names with conditional logic
 * Uses clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
