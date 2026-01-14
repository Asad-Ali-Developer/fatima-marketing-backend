export const createRandomPassword = (
  full_name: string,
  length: number = 10,
): string => {
  // Handle null/undefined/empty
  const cleanName = (full_name || '').trim() || 'user';

  // Ensure length is between 1 and 100 (reasonable bounds)
  const safeLength = Math.max(1, Math.min(100, length));

  // Take first word
  const namePart = cleanName.split(' ')[0].toLowerCase();

  // At least 1 char from name
  const nameChars = namePart.substring(0, Math.max(1, safeLength - 1)) || 'u';

  // Remaining chars as digits
  const digitsNeeded = safeLength - nameChars.length;
  let digits = '';
  for (let i = 0; i < digitsNeeded; i++) {
    digits += Math.floor(Math.random() * 10);
  }

  return (nameChars + digits).substring(0, safeLength);
};
