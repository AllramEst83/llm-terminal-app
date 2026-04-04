let idCounter = 0;

export function generateId(): string {
  const timestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const counter = ++idCounter;
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${counter}-${randomSuffix}`;
}

export function getCurrentTimestamp(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  return `[${hours}:${minutes}:${seconds}]`;
}
