/** Common typos in the part after the @, mapped to what the player most likely meant. */
const FIXES: Record<string, string> = {
  'gmail.con': 'gmail.com', 'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com', 'gmail.comm': 'gmail.com', 'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com', 'gmail.ocm': 'gmail.com',
  'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.co': 'yahoo.com',
  'hotmail.con': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'outlook.con': 'outlook.com', 'outlok.com': 'outlook.com',
  'icloud.con': 'icloud.com', 'iclod.com': 'icloud.com',
};

/** Returns the corrected address when the domain looks like a typo, otherwise null. */
export function suggestEmailFix(email: string): string | null {
  const t = email.trim();
  const at = t.lastIndexOf('@');
  if (at < 1) return null;
  const fixed = FIXES[t.slice(at + 1).toLowerCase()];
  return fixed ? `${t.slice(0, at)}@${fixed}` : null;
}

export const emailLooksValid = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
