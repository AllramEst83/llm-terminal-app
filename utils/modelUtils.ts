export function getShortModelName(modelName?: string): string {
  if (!modelName) return 'Unknown';

  const normalized = modelName.toLowerCase();
  if (normalized.includes('flash')) return 'Flash';
  if (normalized.includes('pro')) return 'Pro';

  return modelName;
}

