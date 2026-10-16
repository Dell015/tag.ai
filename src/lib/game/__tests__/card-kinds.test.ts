import { describe, it, expect, beforeEach } from 'vitest';
import { TOOL_CARDS, ADULT_TOOL_CARDS } from '@/lib/data/tool-cards';
import { kindOf, KIND_META, fillDrink, penaltyFor } from '@/lib/game/card-kinds';
import { libraryCards } from '@/lib/data/card-pool';
import { DECK_BY_ID, deckPool } from '@/lib/game/decks';
import { useGameStore } from '@/stores/game-store';

const ALL = [...TOOL_CARDS, ...ADULT_TOOL_CARDS];

describe('card kinds', () => {
  it('older cards default to truth or dare', () => {
    expect(kindOf({ cardType: 'question' })).toBe('truth');
    expect(kindOf({ cardType: 'action' })).toBe('dare');
  });

  it('every kind that brings a tool has cards, with unique ids and clean copy', () => {
    const ids = new Set(ALL.map((c) => c.id));
    expect(ids.size).toBe(ALL.length);
    for (const k of Object.keys(KIND_META).filter((k) => KIND_META[k as keyof typeof KIND_META].tool)) {
      expect(ALL.some((c) => c.kind === k), k).toBe(true);
    }
    for (const c of ALL) {
      expect(c.text.includes(String.fromCharCode(0x2014)), c.id).toBe(false);
      expect(c.text.split('').every((ch) => ch.charCodeAt(0) < 0xd800), c.id).toBe(true);
    }
  });

  it('tool settings match the kind', () => {
    for (const c of ALL) {
      if (c.kind === 'dice' && c.tool?.dice === 1 && c.outcomes) expect(c.outcomes, c.id).toHaveLength(6);
      if (c.kind === 'coin') expect(c.outcomes, c.id).toHaveLength(2);
      if (c.kind === 'wheel') expect(c.tool?.labels?.length, c.id).toBeGreaterThanOrEqual(2);
      if (c.kind === 'timer') expect(c.tool?.seconds, c.id).toBeGreaterThan(0);
      if (c.kind === 'dice') expect(c.tool?.dice, c.id).toBeDefined();
    }
  });

  it('adult tool cards stay out of the library when 18+ is off and into Adult and Chaos when on', () => {
    expect(libraryCards(false).some((c) => c.adult && c.kind)).toBe(false);
    expect(deckPool(DECK_BY_ID.adult, libraryCards(true)).some((c) => c.kind)).toBe(true);
    expect(deckPool(DECK_BY_ID.chaos, libraryCards(true)).some((c) => c.kind === 'wheel')).toBe(true);
  });

  it('the Family deck keeps tool cards clean and gentle', () => {
    const fam = deckPool(DECK_BY_ID.family, libraryCards(true)).filter((c) => c.kind);
    expect(fam.length).toBeGreaterThan(0);
    expect(fam.every((c) => c.intensity <= 2 && !c.adult)).toBe(true);
  });

  it('{drink} follows the table', () => {
    expect(fillDrink('You {drink}.', false)).toBe('You drink.');
    expect(fillDrink('You {drink}.', true)).toBe('You do a forfeit.');
  });
});

describe('skip gives the same player a new card', () => {
  beforeEach(() => useGameStore.getState().resetGame());
  it('does not pass the turn', () => {
    useGameStore.setState({
      turnRotation: { players: [{ id: 'a', name: 'A', avatarUrl: 'c0', turnOrder: 0 }, { id: 'b', name: 'B', avatarUrl: 'c1', turnOrder: 1 }], currentIndex: 0 },
      cardQueue: Array.from({ length: 5 }, (_, i) => ({ id: `x${i}`, text: 't', cardType: 'question' as const, intensity: 2, category: 'hot_takes' as const, topics: [] })),
      cardCountTarget: 5,
    });
    useGameStore.getState().skipCard();
    const s = useGameStore.getState();
    expect(s.turnRotation.currentIndex).toBe(0);
    expect(s.showPassPrompt).toBe(false);
    expect(s.cardsPlayed).toBe(1);
  });
});

import { spreadOut, buildBasketQueue } from '@/lib/game/card-queue-builder';

describe('shuffle after buying', () => {
  it('does not leave long runs of one deck, kind or category', () => {
    const lib = libraryCards(true);
    const q = buildBasketQueue({ basket: { barkada: 30, spicy: 25, icebreaker: 20 }, comfortFilters: [], trashedCardIds: [], playerCount: 4 }, lib).cards.filter((c) => c.cardType !== 'wild');
    let worstDeck = 1, run = 1, worstCat = 1, cRun = 1;
    for (let i = 1; i < q.length; i++) {
      run = q[i].deckId === q[i - 1].deckId ? run + 1 : 1; worstDeck = Math.max(worstDeck, run);
      cRun = q[i].category === q[i - 1].category ? cRun + 1 : 1; worstCat = Math.max(worstCat, cRun);
    }
    expect(worstDeck).toBeLessThanOrEqual(7);
    expect(worstCat).toBeLessThanOrEqual(2);
    expect(new Set(q.map((c) => c.deckId)).size).toBe(3);
  });

  it('keeps every card', () => {
    const cards = libraryCards(true).slice(0, 40);
    expect(spreadOut(cards).map((c) => c.id).sort()).toEqual(cards.map((c) => c.id).sort());
  });

  it('only builds the four challenge wild cards', () => {
    const q = buildBasketQueue({ basket: { chaos: 60 }, comfortFilters: [], trashedCardIds: [], playerCount: 4 }, libraryCards(true)).cards;
    const known = ['call_out', 'voice_note', 'group_pose', 'dance_off'];
    expect(q.filter((c) => c.cardType === 'wild').every((c) => known.includes(c.wildCardType as string))).toBe(true);
  });
});


describe('rule cards and penalties', () => {
  it('rule cards say what is on screen while they hold', () => {
    const rules = TOOL_CARDS.filter((c) => c.kind === 'rule');
    expect(rules.length).toBeGreaterThanOrEqual(10);
    rules.forEach((c) => { expect(c.rule, c.id).toBeTruthy(); expect(c.text, c.id).toMatch(/until the next wild card|next wild card/); });
  });
  it('a rule stays on until a wild card clears it', () => {
    useGameStore.getState().resetGame();
    useGameStore.getState().setRule('Phones down');
    expect(useGameStore.getState().activeRule).toBe('Phones down');
    useGameStore.getState().applyWildCardEffect();
    expect(useGameStore.getState().activeRule).toBeNull();
  });
  it('every card has a consequence of 1 to 3 shots', () => {
    libraryCards(true).forEach((c) => { const n = penaltyFor(c); expect(n, c.id).toBeGreaterThanOrEqual(1); expect(n, c.id).toBeLessThanOrEqual(3); });
    expect(penaltyFor({ cardType: 'action', intensity: 5 })).toBe(2);
    expect(penaltyFor({ cardType: 'question', intensity: 5 })).toBe(1);
  });
});
