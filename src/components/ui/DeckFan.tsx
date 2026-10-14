const DECK = ['#4274FF', '#FFC72C', '#FF82B2', '#E83C2E', '#FF7022', '#30BE70'];

/** The six mode decks fanned out like a hand of cards. Purely decorative. */
export function DeckFan({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className} style={{ position: 'relative', height: 220 }}>
      {DECK.map((c, i) => (
        <div key={c} style={{
          position: 'absolute', left: '50%', bottom: 0, width: 132, height: 188, marginLeft: -66,
          background: c, borderRadius: 18, border: '3px solid #181310',
          transformOrigin: '50% 140%', transform: `rotate(${(i - 2.5) * 13}deg)`,
        }} />
      ))}
    </div>
  );
}
