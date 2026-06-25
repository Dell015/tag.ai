'use client';

import { useState, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { useSessionStore } from '@/stores/session-store';

export const PRESET_TOPICS = [
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
] as const;

export type PresetTopic = (typeof PRESET_TOPICS)[number];

interface ComfortFiltersProps {
  /** Callback to broadcast comfort filter changes to other players via Realtime */
  onBroadcastChange?: (comfortFilters: string[]) => void;
}

export function ComfortFilters({ onBroadcastChange }: ComfortFiltersProps) {
  const { comfortFilters, setSession } = useSessionStore();
  const [customInput, setCustomInput] = useState('');

  const updateFilters = useCallback(
    (newFilters: string[]) => {
      setSession({ comfortFilters: newFilters });
      onBroadcastChange?.(newFilters);
    },
    [setSession, onBroadcastChange]
  );

  const handleTogglePreset = useCallback(
    (topic: string) => {
      const isActive = comfortFilters.includes(topic);
      const newFilters = isActive
        ? comfortFilters.filter((f) => f !== topic)
        : [...comfortFilters, topic];
      updateFilters(newFilters);
    },
    [comfortFilters, updateFilters]
  );

  const handleCustomInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setCustomInput(e.target.value);
    },
    []
  );

  const addCustomFilter = useCallback(() => {
    const trimmed = customInput.trim();
    if (trimmed === '' || comfortFilters.includes(trimmed)) {
      return;
    }
    const newFilters = [...comfortFilters, trimmed];
    updateFilters(newFilters);
    setCustomInput('');
  }, [customInput, comfortFilters, updateFilters]);

  const handleCustomKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomFilter();
      }
    },
    [addCustomFilter]
  );

  const handleRemoveCustom = useCallback(
    (filter: string) => {
      const newFilters = comfortFilters.filter((f) => f !== filter);
      updateFilters(newFilters);
    },
    [comfortFilters, updateFilters]
  );

  // Separate custom filters from preset topics
  const customFilters = comfortFilters.filter(
    (f) => !PRESET_TOPICS.includes(f as PresetTopic)
  );

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-white">Comfort Filters</h3>
      <p className="text-sm text-white/60">
        Toggle topics your group wants to avoid.
      </p>

      {/* Preset topic toggles */}
      <div className="flex flex-wrap gap-2">
        {PRESET_TOPICS.map((topic) => {
          const isActive = comfortFilters.includes(topic);
          return (
            <button
              key={topic}
              type="button"
              onClick={() => handleTogglePreset(topic)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-500/80 text-white ring-2 ring-red-400'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
              aria-pressed={isActive}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* Custom filter input */}
      <div className="flex flex-col gap-2">
        <label htmlFor="custom-filter-input" className="text-sm text-white/70">
          Add a custom filter
        </label>
        <div className="flex gap-2">
          <input
            id="custom-filter-input"
            type="text"
            value={customInput}
            onChange={handleCustomInputChange}
            onKeyDown={handleCustomKeyDown}
            placeholder="Type a topic and press Enter"
            aria-label="Custom comfort filter"
            className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="button"
            onClick={addCustomFilter}
            disabled={customInput.trim() === ''}
            className="px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium transition-colors hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Add custom filter"
          >
            Add
          </button>
        </div>
      </div>

      {/* Custom filter chips */}
      {customFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customFilters.map((filter) => (
            <span
              key={filter}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-500/80 text-white text-sm"
            >
              {filter}
              <button
                type="button"
                onClick={() => handleRemoveCustom(filter)}
                className="ml-1 text-white/80 hover:text-white"
                aria-label={`Remove ${filter} filter`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
