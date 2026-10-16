import { describe, it, expect, beforeEach } from 'vitest';
import { TOOL_CARDS, ADULT_TOOL_CARDS } from '@/lib/data/tool-cards';
import { kindOf, KIND_META, fillDrink, penaltyFor } from '@/lib/game/card-kinds';
import { libraryCards } from '@/lib/data/card-pool';
import { DECK_BY_ID, deckPool } from '@/lib/game/decks';
import { useGameStore } from '@/stores/game-store';
import { WILD_CARD_DEFINITIONS } from '@/lib/game/wild-cards';

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
      if ((c.tool?.via ?? c.kind) === 'dice' && c.tool?.dice === 1 && c.outcomes) expect(c.outcomes, c.id).toHaveLength(6);
      if ((c.tool?.via ?? c.kind) === 'coin') expect(c.outcomes, c.id).toHaveLength(2);
      if ((c.tool?.via ?? c.kind) === 'wheel') expect(c.tool?.labels?.length, c.id).toBeGreaterThanOrEqual(2);
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

  it('only builds the challenge wild cards', () => {
    const q = buildBasketQueue({ basket: { chaos: 60 }, comfortFilters: [], trashedCardIds: [], playerCount: 4 }, libraryCards(true)).cards;
    const known = Object.keys(WILD_CARD_DEFINITIONS);
    expect(q.filter((c) => c.cardType === 'wild').every((c) => known.includes(c.wildCardType as string))).toBe(true);
  });
});


describe('rule cards and penalties', () => {
  it('rule cards say what is on screen while they hold', () => {
    const rules = TOOL_CARDS.filter((c) => c.kind === 'rule');
    expect(rules.length).toBeGreaterThanOrEqual(10);
    rules.forEach((c) => { expect(c.rule || c.tool?.via, c.id).toBeTruthy(); expect(c.text, c.id).toMatch(/next wild card/); });
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

import { drawForHeat, MAX_HEAT_AT } from '@/lib/game/steering';

describe('heat decides what is drawn', () => {
  const card = (id: string, intensity: number, deckId: string, category: 'hot_takes' | 'dares' = 'hot_takes') =>
    ({ id, text: id, cardType: 'question' as const, intensity, category, topics: [], deckId });
  const queue = [card('hard1', 5, 'adult'), card('easy1', 1, 'icebreaker'), card('mid1', 3, 'barkada'), card('hard2', 5, 'spicy'), card('easy2', 1, 'family')];

  it('draws the easiest cards first at low heat, the hardest at high heat', () => {
    const low = drawForHeat(queue, 0, 1);
    expect(['easy1', 'easy2']).toContain(low[0].id);
    const high = drawForHeat([queue[1], queue[0], queue[2], queue[3], queue[4]], 0, 4.5);
    expect(['hard1', 'hard2']).toContain(high[0].id);
  });

  it('keeps wild cards where they are', () => {
    const wild = { id: 'w', text: '', cardType: 'wild' as const, intensity: 0, category: 'hot_takes' as const, topics: [], wildCardType: 'call_out' as const };
    const q = [card('hard1', 5, 'adult'), wild, card('easy1', 1, 'icebreaker')];
    const out = drawForHeat(q, 0, 1);
    expect(out[1].id).toBe('w');
    expect(out.map((c) => c.id).sort()).toEqual(['easy1', 'hard1', 'w']);
  });

  it('is completely random when the meter is full', () => {
    const picks = new Set<string>();
    for (let i = 0; i < 80; i++) picks.add(drawForHeat(queue, 0, MAX_HEAT_AT + 0.05)[0].id);
    expect(picks.size).toBeGreaterThanOrEqual(4);
  });
});

import { heatPace } from '@/lib/game/escalation-engine';

describe('heat pace', () => {
  it('uses full steps for short games and slows long ones', () => {
    expect(heatPace(20)).toBe(1);
    expect(heatPace(10)).toBe(1);
    expect(heatPace(90)).toBeLessThan(0.3);
    expect(heatPace(500)).toBe(0.15);
  });
  it('a 90 card game does not fill the meter in the first quarter', () => {
    useGameStore.getState().resetGame();
    useGameStore.setState({
      turnRotation: { players: [{ id: 'a', name: 'A', avatarUrl: 'c0', turnOrder: 0 }, { id: 'b', name: 'B', avatarUrl: 'c1', turnOrder: 1 }], currentIndex: 0 },
      cardQueue: Array.from({ length: 90 }, (_, i) => ({ id: `y${i}`, text: 't', cardType: 'question' as const, intensity: 2, category: 'hot_takes' as const, topics: [] })),
      cardCountTarget: 90, heatLevel: 1,
    });
    for (let i = 0; i < 22; i++) useGameStore.getState().dismissCard();
    expect(useGameStore.getState().heatLevel).toBeLessThan(3);
  });
});
