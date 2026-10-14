import { describe, it, expect } from 'vitest';
import { formatDuration, PRESET_COUNTS, DRINK_RULE_TEMPLATES } from '../setup-options';

describe('setup options', () => {
  it('formats durations at 30s per card', () => {
    expect(formatDuration(10)).toBe('~5 min');
    expect(formatDuration(20)).toBe('~10 min');
    expect(formatDuration(120)).toBe('~1 hr');
    expect(formatDuration(150)).toBe('~1 hr 15 min');
  });
  it('offers five presets', () => expect(PRESET_COUNTS).toHaveLength(5));
  it('has four drink-rule templates with summaries', () => {
    expect(DRINK_RULE_TEMPLATES).toHaveLength(4);
    DRINK_RULE_TEMPLATES.forEach((t) => expect(t.summary.length).toBeGreaterThan(0));
  });
});
