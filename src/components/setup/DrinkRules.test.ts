import { describe, it, expect, beforeEach } from 'vitest';
import {
  DRINK_RULE_TEMPLATES,
  MAX_CUSTOM_RULES,
} from './DrinkRules';
import { useSessionStore } from '@/stores/session-store';

describe('DrinkRules', () => {
  beforeEach(() => {
    useSessionStore.setState({
      drinkRuleTemplate: null,
      customDrinkRules: [],
      nonDrinkingMode: false,
    });
  });

  describe('DRINK_RULE_TEMPLATES', () => {
    it('contains exactly 4 templates', () => {
      expect(DRINK_RULE_TEMPLATES).toHaveLength(4);
    });

    it('has Classic, Chaos, Soft_Mode, Points_Based template IDs', () => {
      const ids = DRINK_RULE_TEMPLATES.map((t) => t.id);
      expect(ids).toEqual(['Classic', 'Chaos', 'Soft_Mode', 'Points_Based']);
    });

    it('each template has required fields', () => {
      for (const template of DRINK_RULE_TEMPLATES) {
        expect(template.id).toBeTruthy();
        expect(template.name).toBeTruthy();
        expect(template.emoji).toBeTruthy();
        expect(template.description).toBeTruthy();
        expect(template.summary).toBeTruthy();
      }
    });

    it('Classic template has correct summary', () => {
      const classic = DRINK_RULE_TEMPLATES.find((t) => t.id === 'Classic');
      expect(classic?.summary).toBe(
        'Person who drew drinks. Group votes on skips.'
      );
    });

    it('Chaos template has correct summary', () => {
      const chaos = DRINK_RULE_TEMPLATES.find((t) => t.id === 'Chaos');
      expect(chaos?.summary).toBe(
        'Random person drinks each round. Double if wild card.'
      );
    });

    it('Soft_Mode template has correct summary', () => {
      const soft = DRINK_RULE_TEMPLATES.find((t) => t.id === 'Soft_Mode');
      expect(soft?.summary).toBe(
        'Only drink on dare cards. Otherwise, take a sip.'
      );
    });

    it('Points_Based template has correct summary', () => {
      const points = DRINK_RULE_TEMPLATES.find(
        (t) => t.id === 'Points_Based'
      );
      expect(points?.summary).toBe(
        'Points for completing challenges. Lowest points drinks at the end.'
      );
    });
  });

  describe('MAX_CUSTOM_RULES', () => {
    it('is 5', () => {
      expect(MAX_CUSTOM_RULES).toBe(5);
    });
  });

  describe('session store integration - drinkRuleTemplate', () => {
    it('stores selected template', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ drinkRuleTemplate: 'Classic' });
      expect(useSessionStore.getState().drinkRuleTemplate).toBe('Classic');
    });

    it('allows deselecting template by setting null', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ drinkRuleTemplate: 'Chaos' });
      setSession({ drinkRuleTemplate: null });
      expect(useSessionStore.getState().drinkRuleTemplate).toBeNull();
    });

    it('allows changing template selection', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ drinkRuleTemplate: 'Classic' });
      setSession({ drinkRuleTemplate: 'Points_Based' });
      expect(useSessionStore.getState().drinkRuleTemplate).toBe(
        'Points_Based'
      );
    });
  });

  describe('session store integration - customDrinkRules', () => {
    it('stores custom drink rules array', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ customDrinkRules: ['First rule', 'Second rule'] });
      expect(useSessionStore.getState().customDrinkRules).toEqual([
        'First rule',
        'Second rule',
      ]);
    });

    it('allows adding rules up to max', () => {
      const { setSession } = useSessionStore.getState();
      const rules = Array.from({ length: MAX_CUSTOM_RULES }, (_, i) => `Rule ${i + 1}`);
      setSession({ customDrinkRules: rules });
      expect(useSessionStore.getState().customDrinkRules).toHaveLength(
        MAX_CUSTOM_RULES
      );
    });

    it('allows removing a rule by filtering', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ customDrinkRules: ['A', 'B', 'C'] });
      const filtered = useSessionStore
        .getState()
        .customDrinkRules.filter((_, i) => i !== 1);
      setSession({ customDrinkRules: filtered });
      expect(useSessionStore.getState().customDrinkRules).toEqual(['A', 'C']);
    });
  });

  describe('session store integration - nonDrinkingMode', () => {
    it('defaults to false', () => {
      expect(useSessionStore.getState().nonDrinkingMode).toBe(false);
    });

    it('can be toggled on', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ nonDrinkingMode: true });
      expect(useSessionStore.getState().nonDrinkingMode).toBe(true);
    });

    it('can be toggled off', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ nonDrinkingMode: true });
      setSession({ nonDrinkingMode: false });
      expect(useSessionStore.getState().nonDrinkingMode).toBe(false);
    });
  });
});
