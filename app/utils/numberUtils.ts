/**
 * Utility functions for handling floating point precision issues
 */

/**
 * Rounds a number to a specified number of decimal places
 * This avoids floating-point precision issues
 */
export const roundToDecimal = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Creates a step value that avoids floating-point precision issues
 * For example: createSafeStep(0.1) returns a step for integers internally
 */
export const createSafeStep = (decimalStep: number) => {
  // Find the number of decimal places
  const decimals = decimalStep.toString().split('.')[1]?.length || 0
  const factor = Math.pow(10, decimals)

  return {
    step: 1, // Always use 1 for internal calculations
    factor,
    toInternal: (val: number) => Math.round(val * factor),
    fromInternal: (val: number) => roundToDecimal(val / factor, decimals)
  }
}

export const formatPrice = (amount: number, locale = 'en-US', currency = 'USD') => new Intl.NumberFormat(locale, {
  style: 'currency',
  currency
}).format(amount)
