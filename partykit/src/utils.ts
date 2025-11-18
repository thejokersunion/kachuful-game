/**
 * Utility functions for lobby management
 */

/**
 * Generate a 6-character alphanumeric lobby code
 * Format: ABC123 (3 letters + 3 numbers for easy communication)
 */
export function generateLobbyCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Exclude I, O to avoid confusion with 1, 0
  const numbers = '23456789' // Exclude 0, 1 to avoid confusion with O, I
  
  let code = ''
  
  // Generate 3 letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  // Generate 3 numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return code
}

/**
 * Validate lobby code format
 */
export function isValidLobbyCode(code: string): boolean {
  // Must be exactly 6 characters: 3 letters followed by 3 numbers
  const pattern = /^[A-Z]{3}[2-9]{3}$/
  return pattern.test(code.toUpperCase())
}

/**
 * Format lobby code for display (adds hyphen for readability)
 */
export function formatLobbyCode(code: string): string {
  if (code.length === 6) {
    return `${code.slice(0, 3)}-${code.slice(3)}`
  }
  return code
}
