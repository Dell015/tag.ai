'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ToolStage, type ToolResult } from './ToolStage';
import type { CardKind, CardTool } from '@/lib/game/card-kinds';
import { haptic } from '@/lib/haptics';

const LABEL: Record<string, [string, string]> = {
  dice: ['Roll the die', 'Roll again'], coin: ['Flip the coin', 'Flip again'], bottle: ['Spin the bottle', 'Spin again'],
  wheel: ['Spin the wheel', 'Spin again'], timer: ['Open the timer', 'Open the timer'], vote: ['Count down', 'Count down again'],
};
/** Tools that give one answer per card. Bottle, timer and vote can be used again. */
const ONCE = new Set(['dice', 'coin', 'wheel']);

/**
 * The tool a card brings. On the card it is just a button and, afterwards, the result. The animation
 * itself plays on its own full screen (ToolStage), so nothing is squeezed into the card.
 */
export function CardToolView({ kind, tool, outcomes, prompt, nonDrinking, onResult, deck }: {
  deck?: string; kind: CardKind; tool?: CardTool; outcomes?: string[]; prompt: string; nonDrinking: boolean; onResult?: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  if (kind === 'truth' || kind === 'dare' || kind === 'rule') return null;
  const [first, again] = LABEL[kind];
  return (
    <div onPointerDownCapture={(e) => e.stopPropagation()} className="mt-4">
      {result && (
        <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 18 }}
          className="mb-3 flex items-center gap-3 rounded-xl border-[3px] border-current px-4 py-3 text-xl font-extrabold leading-tight" role="status">
          {result.label && <span className="display text-4xl leading-none">{result.label}</span>}
          <span>{result.text}</span>
        </motion.p>
      )}
      {!(result && ONCE.has(kind)) && (
        <button onClick={() => { haptic('tap'); setOpen(true); }} className="min-h-tap w-full rounded-xl bg-onaccent px-5 text-xl font-extrabold text-accent active:translate-y-px">{result ? again : first}</button>
      )}
      {open && (
        <ToolStage kind={kind} deck={deck} prompt={prompt} dice={tool?.dice ?? 1} outcomes={outcomes} labels={tool?.labels} seconds={tool?.seconds} nonDrinking={nonDrinking}
          onResult={(r) => { setResult(r); onResult?.(r.text); }} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
