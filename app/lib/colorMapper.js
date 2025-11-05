/**
 * Map color variant names to accurate hex colors for swatches
 * This is used when Shopify's automatic color detection doesn't match the actual product colors
 */
export const COLOR_MAP = {
  // T-shirt colors
  'Purple': '#9B8FB8',
  'Lavender': '#B8A8D4',
  'Sage Green': '#8FA885',
  'Forest Green': '#2D5F3F',
  'Mint': '#A8D5BA',
  'Light Blue': '#A8C5D5',
  'Navy': '#1F2937',
  'Black': '#1A1A1A',
  'White': '#F5F5F5',
  'Gray': '#9CA3AF',
  'Heather Gray': '#B8B8B8',

  // Add more product-specific colors as needed
};

/**
 * Get the correct hex color for a color variant name
 * Falls back to Shopify's color if not in our map
 */
export function getSwatchColor(colorName, shopifyColor) {
  return COLOR_MAP[colorName] || shopifyColor || '#CCCCCC';
}
