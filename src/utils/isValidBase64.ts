export function isValidBase64(str: string): boolean {
  if (typeof str !== 'string') return false;
  if (str.length % 4 !== 0) return false;
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(str);
}
