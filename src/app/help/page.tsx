'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Screen } from '@/components/ui';
import { cn } from '@/lib/cn';

const STEPS = [
  ['Host a game', 'Tap Drinking game on the home screen and add your friends by name. They do not need the app.'],
  ['Pick a deck', 'Choose a deck, how many cards, the topics to skip and how many coins go in the pot.'],
  ['Pass the phone', 'The phone shows whose turn it is. Tap the card to reveal it, then answer or take the dare.'],
  ['Next or skip', 'Tap Next, or swipe the card, when it is played. Skip gives the same player a new card. Every card shows what happens if you fail or refuse it.'],
];

const GLOSSARY = [
  ['Deck', 'A set of cards with its own mood, like Barkada or Spicy.'],
  ['Stack', 'The shuffled pile of cards you play from. It is made from the decks you pick.'],
  ['Heat', 'How intense the cards are right now, from 1 to 5. It rises when cards are played and falls when they are skipped.'],
  ['Wild card', 'A challenge for the whole table, such as calling someone outside the group and shouting. Fail it and you take 2 or 3 shots. It never costs coins.'],
  ['Rule card', 'A rule that holds until the next wild card, such as all shots doubled. It stays on screen while it is on.'],
  ['Card types', 'Truth, dare, dice, coin, bottle, wheel, timer, vote and rule. Each deck has its own card colour, and the dice, coin, bottle, wheel and timer cards bring their own tool.'],
  ['Pot', 'The coins that pay for the cards in one game. Whatever is left comes back to you.'],
  ['Dare', 'A card that asks you to do something instead of answer.'],
  ['Forfeit', 'What you do instead of drinking in non-drinking mode.'],
];

const FAQ = [
  ['Do my friends need the app?', 'No. You add them by name and pass one phone around. One phone runs the whole game.'],
  ['What do coins do?', 'Before a game you pick a deck and a Short (10 cards) or Long (30 cards) session. Every card is 1 coin, and the cards go into the pot. When they run out you can get 10 more for 10 coins. You can also spend coins in the Shop on card packs and looks. Tools are free.'],
  ['How do decks and prices work?', 'Easy decks like Icebreaker and Family cost the least. Every card costs 1 coin, whichever deck you pick. Short is 10 cards and Long is 30. Shuffle everything mixes all the decks, 18+ cards included. Wild cards are free.'],
  ['What is the Adult deck?', 'Flirty to frank cards for adults only. Everyone at the table confirms they are 18 or older before it is used.'],
  ['Can I play without alcohol?', 'Yes. Turn on non-drinking mode in the drink rules step. Drinks become dares and forfeits.'],
  ['How do I remove a card?', 'Tap Trash while a card is showing. You will not see that card again. All your trashed cards are stored in Settings, under Trashed cards, where you can undo it.'],
  ['Does it work offline?', 'Yes. Once a game starts, it runs on your phone without a connection.'],
  ['What is heat?', 'Heat is how intense the next cards are. Play more cards and it climbs. Skip and it cools. You can change it from the pause menu.'],
  ['Who sees my saved cards?', 'Only you. Saved cards live on your phone.'],
  ['How do I report a card?', 'Open the pause menu during a game and tap Report this card.'],
];

function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b-2 border-line/60">
      <button aria-expanded={open} onClick={() => setOpen(!open)} className="flex min-h-[4.25rem] w-full items-center justify-between gap-3 py-3 text-left">
        <span className="text-xl font-bold">{q}</span>
        <span aria-hidden className={cn('text-2xl font-extrabold text-muted transition-transform', open && 'rotate-45')}>+</span>
      </button>
      {open && <p className="pb-4 text-lg text-muted">{a}</p>}
    </div>
  );
}

export default function HelpPage() {
  const router = useRouter();
  return (
    <Screen title="Help" onBack={() => router.back()}>
      <h2 className="mb-2 text-3xl">How to play</h2>
      <ol className="space-y-4">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="flex gap-4">
            <span className="display flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-2xl text-onaccent">{i + 1}</span>
            <span><span className="block text-xl font-extrabold">{t}</span><span className="text-lg text-muted">{d}</span></span>
          </li>
        ))}
      </ol>

      <h2 className="mb-1 mt-10 text-3xl">Words we use</h2>
      <dl>
        {GLOSSARY.map(([t, d]) => (
          <div key={t} className="border-b-2 border-line/60 py-3"><dt className="text-xl font-extrabold">{t}</dt><dd className="text-lg text-muted">{d}</dd></div>
        ))}
      </dl>

      <h2 className="mb-1 mt-10 text-3xl">Questions</h2>
      <div>{FAQ.map(([q, a]) => <Item key={q} q={q} a={a} />)}</div>

      <h2 className="mb-2 mt-10 text-3xl">Drinking responsibly</h2>
      <ul className="space-y-2 text-lg text-muted">
        <li>Drink water between rounds.</li>
        <li>Anyone can skip any card, any time. Nobody has to drink.</li>
        <li>Plan your ride home before you start. Never drive after drinking.</li>
        <li>Stop the game if someone is not okay.</li>
      </ul>
    </Screen>
  );
}
