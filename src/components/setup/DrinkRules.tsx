'use client';

import { useState, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';

export type DrinkRuleTemplateId = 'Classic' | 'Chaos' | 'Soft_Mode' | 'Points_Based';

export interface DrinkRuleTemplate {
  id: DrinkRuleTemplateId;
  name: string;
  emoji: string;
  description: string;
  summary: string;
}

export const DRINK_RULE_TEMPLATES: DrinkRuleTemplate[] = [
  {
    id: 'Classic',
    name: 'Classic',
    emoji: '🍺',
    description: 'Traditional drink-when-you-draw rules',
    summary: 'Person who drew drinks. Group votes on skips.',
  },
  {
    id: 'Chaos',
    name: 'Chaos',
    emoji: '🎲',
    description: 'Random targets every round',
    summary: 'Random person drinks each round. Double if wild card.',
  },
  {
    id: 'Soft_Mode',
    name: 'Soft Mode',
    emoji: '🌙',
    description: 'Relaxed and low-pressure',
    summary: 'Only drink on dare cards. Otherwise, take a sip.',
  },
  {
    id: 'Points_Based',
    name: 'Points Based',
    emoji: '🏆',
    description: 'Competitive scoring system',
    summary: 'Points for completing challenges. Lowest points drinks at the end.',
  },
];

export const MAX_CUSTOM_RULES = 5;

interface DrinkRulesProps {
  /** Callback to broadcast drink rule changes to other players via Realtime */
  onBroadcastChange?: (update: {
    drinkRuleTemplate?: string | null;
    customDrinkRules?: string[];
    nonDrinkingMode?: boolean;
  }) => void;
}

export function DrinkRules({ onBroadcastChange }: DrinkRulesProps) {
  const { drinkRuleTemplate, customDrinkRules, nonDrinkingMode, setSession } =
    useSessionStore();

  const [customInput, setCustomInput] = useState('');

  const handleSelectTemplate = useCallback(
    (templateId: DrinkRuleTemplateId) => {
      const newTemplate =
        drinkRuleTemplate === templateId ? null : templateId;
      setSession({ drinkRuleTemplate: newTemplate });
      onBroadcastChange?.({ drinkRuleTemplate: newTemplate });
    },
    [drinkRuleTemplate, setSession, onBroadcastChange]
  );

  const handleAddCustomRule = useCallback(() => {
    const trimmed = customInput.trim();
    if (!trimmed || customDrinkRules.length >= MAX_CUSTOM_RULES) return;

    const updatedRules = [...customDrinkRules, trimmed];
    setSession({ customDrinkRules: updatedRules });
    setCustomInput('');
    onBroadcastChange?.({ customDrinkRules: updatedRules });
  }, [customInput, customDrinkRules, setSession, onBroadcastChange]);

  const handleRemoveCustomRule = useCallback(
    (index: number) => {
      const updatedRules = customDrinkRules.filter((_, i) => i !== index);
      setSession({ customDrinkRules: updatedRules });
      onBroadcastChange?.({ customDrinkRules: updatedRules });
    },
    [customDrinkRules, setSession, onBroadcastChange]
  );

  const handleToggleNonDrinking = useCallback(() => {
    const newValue = !nonDrinkingMode;
    setSession({ nonDrinkingMode: newValue });
    onBroadcastChange?.({ nonDrinkingMode: newValue });
  }, [nonDrinkingMode, setSession, onBroadcastChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustomRule();
      }
    },
    [handleAddCustomRule]
  );

  const selectedTemplate = DRINK_RULE_TEMPLATES.find(
    (t) => t.id === drinkRuleTemplate
  );

  return (
    <div className="flex flex-col gap-5">
      <h3 className="text-lg font-semibold text-white">
        {nonDrinkingMode ? 'Dare/Challenge Rules' : 'Drink Rules'}
      </h3>

      {/* Template cards */}
      <div className="grid grid-cols-2 gap-3">
        {DRINK_RULE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => handleSelectTemplate(template.id)}
            className={`flex flex-col items-start gap-1 p-3 rounded-xl text-left transition-colors ${
              drinkRuleTemplate === template.id
                ? 'bg-purple-600 ring-2 ring-purple-400'
                : 'bg-white/10 hover:bg-white/20'
            }`}
            aria-pressed={drinkRuleTemplate === template.id}
          >
            <span className="text-xl">{template.emoji}</span>
            <span className="text-sm font-medium text-white">
              {template.name}
            </span>
            <span className="text-xs text-white/60">{template.description}</span>
          </button>
        ))}
      </div>

      {/* Selected template summary */}
      {selectedTemplate && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
          <p className="text-sm text-white/80">
            <span className="font-medium text-white">
              {selectedTemplate.emoji} {selectedTemplate.name}:
            </span>{' '}
            {selectedTemplate.summary}
          </p>
        </div>
      )}

      {/* Custom drink rules */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-white/80">
          Custom rules ({customDrinkRules.length}/{MAX_CUSTOM_RULES})
        </p>

        {/* Custom rules list */}
        {customDrinkRules.length > 0 && (
          <ul className="flex flex-col gap-2">
            {customDrinkRules.map((rule, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-2"
              >
                <span className="text-sm text-white/90 break-words flex-1">
                  {rule}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomRule(index)}
                  className="shrink-0 text-white/40 hover:text-red-400 transition-colors"
                  aria-label={`Remove rule: ${rule}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add custom rule input */}
        {customDrinkRules.length < MAX_CUSTOM_RULES && (
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                nonDrinkingMode
                  ? 'Add a dare/challenge rule...'
                  : 'Add a drink rule...'
              }
              aria-label="Custom rule text"
              className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/40 text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
            <button
              type="button"
              onClick={handleAddCustomRule}
              disabled={!customInput.trim()}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-500 transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Non-drinking mode toggle */}
      <div className="flex items-center justify-between rounded-lg bg-white/5 border border-white/10 p-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-white">
            Non-drinking mode
          </span>
          <span className="text-xs text-white/50">
            Replaces drink language with dare/challenge alternatives
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={nonDrinkingMode}
          onClick={handleToggleNonDrinking}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            nonDrinkingMode ? 'bg-purple-600' : 'bg-white/20'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              nonDrinkingMode ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
