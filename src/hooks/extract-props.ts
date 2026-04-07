export interface ExtractedProperty {
  key: string;
  value: string | number | boolean;
  category: 'text' | 'color' | 'number' | 'boolean' | 'position' | 'timing';
}

/**
 * Detect the category of a property value.
 */
export function categorizeValue(key: string, value: string | number | boolean): ExtractedProperty['category'] {
  const lowerKey = key.toLowerCase();
  const strValue = String(value).toLowerCase();

  // Colors
  if (strValue.startsWith('#') || lowerKey.includes('color') || lowerKey.includes('bg')) {
    return 'color';
  }
  // Text content
  if (lowerKey.includes('text') || lowerKey.includes('label') || lowerKey.includes('title') || lowerKey.includes('content')) {
    return 'text';
  }
  // Position
  if (lowerKey.includes('x') || lowerKey.includes('y') || lowerKey.includes('position') || lowerKey.includes('offset')) {
    return 'position';
  }
  // Timing
  if (lowerKey.includes('time') || lowerKey.includes('duration') || lowerKey.includes('delay') || lowerKey.includes('speed')) {
    return 'timing';
  }
  // Booleans
  if (typeof value === 'boolean') return 'boolean';
  // Numbers
  if (typeof value === 'number') return 'number';
  // Default
  return 'text';
}

/**
 * Extract editable properties from TSX source code using regex.
 * Looks for DEFAULT_PROPS, PROPS, or similar constant objects.
 */
export function extractPropsFromCode(code: string): ExtractedProperty[] {
  const props: ExtractedProperty[] = [];

  // Match object properties: key: value (handles strings, numbers, booleans)
  const propRegex = /(\w+)\s*:\s*(?:"([^"]*?)"|'([^']*?)'|(`[^`]*?`)|(\d+\.?\d*)|(true|false))/g;

  let match;
  const seen = new Set<string>();

  while ((match = propRegex.exec(code)) !== null) {
    const key = match[1];
    const rawValue = match[2] ?? match[3] ?? match[4] ?? match[5] ?? match[6];

    // Skip internal/react keys
    if (['key', 'ref', 'className', 'style', 'id', 'type', 'name'].includes(key)) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    // Parse value
    let value: string | number | boolean = rawValue;
    if (match[5] !== undefined) value = parseFloat(rawValue);
    if (match[6] !== undefined) value = rawValue === 'true';
    if (typeof value === 'string') value = value.replace(/^`|`$/g, ''); // strip template literal backticks

    const category = categorizeValue(key, value);
    props.push({ key, value, category });
  }

  return props;
}
