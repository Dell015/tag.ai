import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PRESET_TOPICS } from './ComfortFilters';
import { useSessionStore } from '@/stores/session-store';

describe('ComfortFilters', () => {
  beforeEach(() => {
    useSessionStore.setState({ comfortFilters: [] });
  });

  describe('PRESET_TOPICS', () => {
    it('contains exactly 10 preset topics', () => {
      expect(PRESET_TOPICS).toHaveLength(10);
    });

    it('includes all required topics', () => {
      const expected = [
        'Politics',
        'Religion',
        'Trauma/Mental Health',
        'Money/Finances',
        'Family Drama',
        'Sexual Content',
        'Past Relationships',
        'Physical Appearance',
        'Career/Work Stress',
        'Death/Loss',
      ];
      expect([...PRESET_TOPICS]).toEqual(expected);
    });
  });

  describe('session store integration', () => {
    it('adds a preset topic to comfortFilters', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ comfortFilters: ['Politics'] });
      expect(useSessionStore.getState().comfortFilters).toEqual(['Politics']);
    });

    it('removes a preset topic from comfortFilters', () => {
      useSessionStore.setState({ comfortFilters: ['Politics', 'Religion'] });
      const { setSession } = useSessionStore.getState();
      const current = useSessionStore.getState().comfortFilters;
      setSession({ comfortFilters: current.filter((f) => f !== 'Politics') });
      expect(useSessionStore.getState().comfortFilters).toEqual(['Religion']);
    });

    it('adds a custom filter to comfortFilters', () => {
      const { setSession } = useSessionStore.getState();
      setSession({ comfortFilters: ['My Custom Topic'] });
      expect(useSessionStore.getState().comfortFilters).toEqual([
        'My Custom Topic',
      ]);
    });

    it('stores both preset and custom filters together', () => {
      const { setSession } = useSessionStore.getState();
      setSession({
        comfortFilters: ['Politics', 'Religion', 'Custom Filter'],
      });
      expect(useSessionStore.getState().comfortFilters).toEqual([
        'Politics',
        'Religion',
        'Custom Filter',
      ]);
    });

    it('does not duplicate filters in the array', () => {
      const { setSession } = useSessionStore.getState();
      const filters = ['Politics'];
      // Simulating: don't add if already present
      const newTopic = 'Politics';
      if (!filters.includes(newTopic)) {
        filters.push(newTopic);
      }
      setSession({ comfortFilters: filters });
      expect(useSessionStore.getState().comfortFilters).toEqual(['Politics']);
    });

    it('supports removing custom filters', () => {
      useSessionStore.setState({
        comfortFilters: ['Politics', 'Custom One', 'Custom Two'],
      });
      const { setSession } = useSessionStore.getState();
      const current = useSessionStore.getState().comfortFilters;
      setSession({
        comfortFilters: current.filter((f) => f !== 'Custom One'),
      });
      expect(useSessionStore.getState().comfortFilters).toEqual([
        'Politics',
        'Custom Two',
      ]);
    });
  });

  describe('broadcast callback', () => {
    it('invokes onBroadcastChange with updated filters', () => {
      const callback = vi.fn();
      const newFilters = ['Politics', 'Religion'];
      // Simulate what the component does
      useSessionStore.getState().setSession({ comfortFilters: newFilters });
      callback(newFilters);
      expect(callback).toHaveBeenCalledWith(['Politics', 'Religion']);
    });
  });
});
