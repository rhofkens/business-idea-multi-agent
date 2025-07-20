import { BusinessPreferences } from '@business-idea/shared';

/**
 * Default business preferences when no CLI arguments are provided
 */
export const DEFAULT_PREFERENCES: BusinessPreferences = {
  vertical: 'Media & Entertainment',
  subVertical: 'Digital Media and Content Creation',
  businessModel: 'B2B SaaS',
};

/**
 * Parses command-line arguments for business preferences
 * @param args - Array of command-line arguments (process.argv)
 * @returns Parsed BusinessPreferences or null if not all required arguments are provided
 */
export function parseBusinessPreferences(args: string[]): BusinessPreferences | null {
  const verticalIndex = args.indexOf('--vertical');
  const subVerticalIndex = args.indexOf('--subvertical');
  const businessModelIndex = args.indexOf('--business-model');

  // Check if all flags are present
  if (
    verticalIndex === -1 ||
    subVerticalIndex === -1 ||
    businessModelIndex === -1
  ) {
    // Check if any flags are present (partial arguments)
    if (
      verticalIndex !== -1 ||
      subVerticalIndex !== -1 ||
      businessModelIndex !== -1
    ) {
      // Some but not all flags provided - this is an error
      return null;
    }
    // No flags provided at all - use defaults
    return DEFAULT_PREFERENCES;
  }

  // Check if values are provided after each flag
  if (
    verticalIndex >= args.length - 1 ||
    subVerticalIndex >= args.length - 1 ||
    businessModelIndex >= args.length - 1
  ) {
    return null;
  }

  const vertical = args[verticalIndex + 1];
  const subVertical = args[subVerticalIndex + 1];
  const businessModel = args[businessModelIndex + 1];

  // Validate that values are not empty and not other flags
  if (
    !vertical || vertical.startsWith('--') ||
    !subVertical || subVertical.startsWith('--') ||
    !businessModel || businessModel.startsWith('--')
  ) {
    return null;
  }

  return {
    vertical,
    subVertical,
    businessModel,
  };
}

/**
 * Displays usage help for CLI arguments
 */
export function displayUsageHelp(): void {
  console.log(`
Usage: npm start [options]

Options:
  --vertical <value>        Industry vertical (e.g., "Media & Entertainment")
  --subvertical <value>     Sub-category within the vertical
  --business-model <value>  Business model (e.g., "B2B SaaS")
  --test-cache              Use cached results when available

Note: When providing business preferences, all three parameters (--vertical, --subvertical, 
and --business-model) must be provided together.

Examples:
  # Use default preferences
  npm start

  # Specify custom preferences
  npm start --vertical "Healthcare" --subvertical "Digital Health" --business-model "B2C"

  # Use custom preferences with test cache
  npm start --test-cache --vertical "Healthcare" --subvertical "Digital Health" --business-model "B2C"
`);
}