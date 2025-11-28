/**
 * Centralized ID generation utility
 * 
 * Uses performance.now() for sub-millisecond precision and a closure-based
 * counter to ensure uniqueness even when objects are created in rapid succession.
 */

// Closure-based counter to ensure uniqueness
let idCounter = 0;

/**
 * Generates a unique ID using high-precision timestamp, counter, and random suffix.
 * Format: {highPrecisionTimestamp}-{counter}-{randomString}
 * 
 * This ensures no collisions even with rapid successive calls.
 * 
 * @returns A unique string ID
 */
export function generateId(): string {
  // Use performance.now() for sub-millisecond precision
  // This is more reliable than Date.now() for rapid successive calls
  const timestamp = performance.now();
  
  // Increment counter atomically (JavaScript is single-threaded, so this is safe)
  const counter = ++idCounter;
  
  // Add random suffix for additional uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  
  return `${timestamp}-${counter}-${randomSuffix}`;
}

