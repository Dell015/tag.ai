import { describe, expect, it } from 'vitest';
import { emailLooksValid, suggestEmailFix } from './email-hint';

describe('suggestEmailFix', () => {
  it('fixes common domain typos and keeps the name part', () => {
    expect(suggestEmailFix('Randel@gmail.con')).toBe('Randel@gmail.com');
    expect(suggestEmailFix(' a.b@gmial.com ')).toBe('a.b@gmail.com');
    expect(suggestEmailFix('x@yahoo.con')).toBe('x@yahoo.com');
  });
  it('leaves good and unknown addresses alone', () => {
    expect(suggestEmailFix('x@gmail.com')).toBeNull();
    expect(suggestEmailFix('2300937@usl.edu.ph')).toBeNull();
    expect(suggestEmailFix('nonsense')).toBeNull();
  });
});

describe('emailLooksValid', () => {
  it('accepts normal addresses and rejects broken ones', () => {
    expect(emailLooksValid('2300937@usl.edu.ph')).toBe(true);
    expect(emailLooksValid('a@b')).toBe(false);
    expect(emailLooksValid('a b@c.com')).toBe(false);
    expect(emailLooksValid('@c.com')).toBe(false);
  });
});
