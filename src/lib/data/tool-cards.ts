import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { CardKind, CardTool } from '@/lib/game/card-kinds';
import type { CardCategory } from '@/types/game';

/**
 * Cards that bring their own tool (dice, coin, bottle, wheel, timer, vote) and rule cards. The card shows
 * the tool and the result, so the table just follows it. {drink} becomes "do a forfeit" at
 * non-drinking tables. These are all dares, so Dares focus and the Dare timer rules fit them.
 */
interface Row {
  kind: CardKind; text: string; intensity: number; tool?: CardTool; outcomes?: string[];
  category?: CardCategory; adult?: boolean; people?: { min: number; max: number | null };
  /** Rule cards: the short line shown while the rule is on. */
  rule?: string;
  penalty?: number;
}

const ROWS: Row[] = [
  // Dice, one die with a line for each number
  { kind: 'dice', intensity: 2, text: 'Roll the dice. Your number decides your fate.', tool: { dice: 1 },
    outcomes: ['Pick someone to {drink}.', 'You {drink}.', 'Safe. Nothing happens.', 'Tell an embarrassing story.', 'Give a dare to the person on your left.', 'Everyone {drink}.'] },
  { kind: 'dice', intensity: 3, text: 'Roll the dice. Do what your number says.', tool: { dice: 1 },
    outcomes: ['Do your best impression of someone here.', 'Sing the chorus of any song.', 'Read your last sent message out loud, or {drink}.', 'Say something nice about every player.', 'Do 10 jumping jacks.', 'Pass the dice to the next player. You are free.'] },
  { kind: 'dice', intensity: 5, text: 'Roll the dice. No take-backs.', tool: { dice: 1 },
    outcomes: ['Truth: your biggest regret.', 'Truth: who here you trust least.', 'Dare: the group gives you a nickname for the night.', '{drink} twice.', 'Swap seats with anyone you like.', 'Free pass. Give it to someone.'] },
  // Dice, the number is the rule
  { kind: 'dice', intensity: 3, text: 'Roll the dice and count that many players clockwise from you. That player must {drink}.', tool: { dice: 1 }, people: { min: 3, max: null } },
  { kind: 'dice', intensity: 3, text: 'Roll two dice. Name that many Filipino teleserye. Miss one and {drink}.', tool: { dice: 2 } },
  { kind: 'dice', intensity: 1, text: 'Roll the dice. Make that many funny faces in a row.', tool: { dice: 1 } },
  { kind: 'dice', intensity: 1, text: 'Roll the dice. Say that many things you are grateful for tonight.', tool: { dice: 1 }, category: 'memories' },
  { kind: 'dice', intensity: 3, text: 'Roll the dice. Ask that many players one question each. Honest answers only.', tool: { dice: 1 }, people: { min: 3, max: null } },

  // Coin, heads then tails
  { kind: 'coin', intensity: 1, text: 'Flip the coin and follow the side it lands on.', outcomes: ['Heads: ask the group any question.', 'Tails: the group asks you one question.'] },
  { kind: 'coin', intensity: 2, text: 'Flip the coin. Heads is kind, tails is not.', outcomes: ['Heads: give every player a compliment.', 'Tails: you {drink}.'] },
  { kind: 'coin', intensity: 3, text: 'Flip the coin. Luck decides who pays.', outcomes: ['Heads: pick someone to {drink}.', 'Tails: you {drink}.'] },
  { kind: 'coin', intensity: 3, text: 'Flip the coin. Heads is a secret, tails is a sip.', outcomes: ['Heads: tell a secret nobody here knows.', 'Tails: {drink} and keep it.'] },
  { kind: 'coin', intensity: 1, text: 'Flip the coin. Keep it light.', outcomes: ['Heads: do your best animal sound.', 'Tails: tell a joke.'] },
  { kind: 'coin', intensity: 4, text: 'Flip the coin. Someone pays for it.', outcomes: ['Heads: the person on your left must {drink}.', 'Tails: the person on your right must {drink}.'] },
  { kind: 'coin', intensity: 4, text: 'Flip the coin. Truth or dare, but you do not choose.', outcomes: ['Heads: truth. Answer anything the group asks.', 'Tails: dare. The group picks it.'] },
  { kind: 'coin', intensity: 5, text: 'Flip the coin. Win or share the loss.', outcomes: ['Heads: you are safe this round.', 'Tails: you and the person across from you {drink}.'] },

  // Bottle, picks a player
  { kind: 'bottle', intensity: 1, text: 'Spin the bottle. Say one thing you like about the player it lands on.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 2, text: 'Spin the bottle. The player it lands on tells a story from their childhood.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 2, text: 'Spin the bottle. The player it lands on picks the next song or topic.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 3, text: 'Spin the bottle. The player it lands on must {drink}.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 3, text: 'Spin the bottle. Give the player it lands on a dare. They can {drink} instead.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 4, text: 'Spin the bottle. You ask the player it lands on one question. They must answer honestly.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 4, text: 'Spin the bottle. Give the player it lands on a nickname for tonight. It sticks until the end.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 5, text: 'Spin the bottle. You and the player it lands on both tell your most embarrassing moment this year.', people: { min: 3, max: null } },

  // Wheel
  { kind: 'wheel', intensity: 1, text: 'Spin the wheel and do what it says.', tool: { labels: ['Funny face', 'Tell a joke', 'Animal sound', 'Spin again', 'High five', 'Free pass'] } },
  { kind: 'wheel', intensity: 2, text: 'Spin the wheel. It decides.', tool: { labels: ['Sing', 'Speak in rhymes', 'Joke', 'Impression', 'Pass', 'Cheers'] } },
  { kind: 'wheel', intensity: 3, text: 'Spin the wheel and own the result.', tool: { labels: ['Truth', 'Dare', '{drink}', 'Swap seats', 'Free pass', 'Compliment a player'] } },
  { kind: 'wheel', intensity: 3, text: 'Spin the wheel. No skipping.', tool: { labels: ['Tell a secret', 'Imitate a player', 'Sing a line', 'Tongue twister', 'Sing an ad jingle', 'Free pass'] } },
  { kind: 'wheel', intensity: 4, text: 'Spin the wheel. Brace yourself.', tool: { labels: ['{drink} twice', 'Truth', 'Dare', 'Pick someone to {drink}', 'Free pass', 'Everyone {drink}'] } },
  { kind: 'wheel', intensity: 5, text: 'Spin the wheel. Last chance to look brave.', tool: { labels: ['Truth: biggest regret', 'Dare: the group picks', '{drink} twice', 'Pick two players to {drink}', 'Free pass', 'Everyone {drink}'] } },

  // Timer
  { kind: 'timer', intensity: 1, text: 'You have 30 seconds. Name as many Filipino foods as you can.', tool: { seconds: 30 } },
  { kind: 'timer', intensity: 1, text: 'You have 20 seconds. Say the alphabet backwards.', tool: { seconds: 20 } },
  { kind: 'timer', intensity: 1, text: 'You have 30 seconds. Name as many provinces as you can.', tool: { seconds: 30 } },
  { kind: 'timer', intensity: 2, text: 'You have 60 seconds. Tell the funniest story you know. The group decides if it was worth it.', tool: { seconds: 60 } },
  { kind: 'timer', intensity: 2, text: 'You have 30 seconds. Name as many Filipino movies as you can. Stuck means {drink}.', tool: { seconds: 30 } },
  { kind: 'timer', intensity: 2, text: 'You have 30 seconds. Act out a movie with no talking. The group guesses.', tool: { seconds: 30 } },
  { kind: 'timer', intensity: 3, text: 'You have 30 seconds. Do your best impression of a famous Filipino. The group guesses who.', tool: { seconds: 30 } },
  { kind: 'timer', intensity: 3, text: 'You have 60 seconds. Everyone else fires questions at you. Answer fast or {drink}.', tool: { seconds: 60 }, people: { min: 3, max: null } },
  { kind: 'timer', intensity: 4, text: 'You have 30 seconds. Say something kind and something petty about the player on your left.', tool: { seconds: 30 } },
  { kind: 'timer', intensity: 5, text: 'You have 60 seconds. Confess something you have never told this group. Silence is a {drink}.', tool: { seconds: 60 }, category: 'confessions' },

  // Vote, everyone points at once
  { kind: 'vote', intensity: 1, text: 'Who here has the best laugh? Count down, then everyone points.', tool: { seconds: 3 } },
  { kind: 'vote', intensity: 1, text: 'Who here would win a singing contest? Count down, then everyone points.', tool: { seconds: 3 } },
  { kind: 'vote', intensity: 2, text: 'Who here is most likely to be late to their own wedding? Count down, then everyone points.', tool: { seconds: 3 } },
  { kind: 'vote', intensity: 2, text: 'Who here is the best cook? The winner picks a player to {drink}.', tool: { seconds: 3 } },
  { kind: 'vote', intensity: 3, text: 'Who here is most likely to forget a friend\'s birthday? Most votes: {drink}.', tool: { seconds: 3 } },
  { kind: 'vote', intensity: 3, text: 'Who here is most likely to text their ex tonight? Most votes: {drink}.', tool: { seconds: 3 } },
  { kind: 'vote', intensity: 4, text: 'Who here would last longest in a zombie apocalypse? The winner gives a dare.', tool: { seconds: 3 } },
  { kind: 'vote', intensity: 4, text: 'Who here is most likely to start a business and fail? Most votes: {drink}.', tool: { seconds: 3 } },

  // The tool decides the penalty, so the card invents itself on the spot
  { kind: 'dice', intensity: 3, text: 'Roll the die. Your number is your penalty.', tool: { dice: 1 },
    outcomes: ['Take {shot}.', 'Take 2 {shots}.', 'Take 3 {shots}.', 'Take 3 {shots}. Unlucky.', 'Safe. Give 2 {shots} to anyone.', 'Safe. Pick who takes 3 {shots}.'] },
  { kind: 'dice', intensity: 4, text: 'Roll two dice. The lower number is how many {shots} you take, the higher is how many you give.', tool: { dice: 2 } },
  { kind: 'dice', intensity: 2, text: 'Roll the die. That many players must say one thing they like about you.', tool: { dice: 1 }, people: { min: 3, max: null } },
  { kind: 'dice', intensity: 5, text: 'Roll two dice. Take the total, but never more than 3 {shots}. Doubles mean you give them all away.', tool: { dice: 2 } },
  { kind: 'coin', intensity: 3, text: 'Flip the coin. Give or take.', outcomes: ['Heads: give 2 {shots} to anyone.', 'Tails: take 2 {shots}.'] },
  { kind: 'coin', intensity: 4, text: 'Flip the coin. Double or nothing.', outcomes: ['Heads: nothing happens.', 'Tails: take 3 {shots}.'] },
  { kind: 'coin', intensity: 2, text: 'Flip the coin. Heads picks who goes next.', outcomes: ['Heads: you pick who takes the next card.', 'Tails: the player on your left picks who takes the next card.'] },
  { kind: 'wheel', intensity: 3, text: 'Spin the wheel for your penalty.', tool: { labels: ['Take {shot}', 'Take 2 {shots}', 'Take 3 {shots}', 'Give 2 {shots}', 'Safe', 'Everyone takes {shot}'] } },
  { kind: 'wheel', intensity: 4, text: 'Spin the wheel. The group decides what you do for the result.', tool: { labels: ['Truth', 'Dare', 'Sing', 'Impression', 'Joke', 'Free pass'] } },
  { kind: 'bottle', intensity: 3, text: 'Spin the bottle. The player it lands on takes 2 {shots}.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 4, text: 'Spin the bottle. The player it lands on takes {shot} and picks who takes the next one.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 2, text: 'Spin the bottle. The player it lands on gives you a compliment, and you give one back.', people: { min: 3, max: null } },
  { kind: 'vote', intensity: 3, text: 'Who here would survive longest without their phone? Everyone else votes. The winner gives out 2 {shots}.', tool: { seconds: 3 } },
  { kind: 'timer', intensity: 3, text: 'You have 30 seconds. Name as many things as you can that start with the letter the player on your left picks. Every miss is {shot}.', tool: { seconds: 30 } },

  // Rule cards that make their rule on the spot with a tool
  { kind: 'rule', intensity: 3, text: 'Roll the die. Your number sets the rule until the next wild card.', tool: { via: 'dice', dice: 1 },
    outcomes: ['No names. Say one and take {shot}.', 'No pointing. Point and take {shot}.', 'Left hand only. Slip and take {shot}.', 'Whisper only. Get loud and take {shot}.', 'Say "po" after every sentence. Forget and take {shot}.', 'Phones down. Touch one and take 2 {shots}.'] },
  { kind: 'rule', intensity: 3, text: 'Flip the coin. It sets the rule until the next wild card.', tool: { via: 'coin' },
    outcomes: ['Heads: all {shots} are doubled.', 'Tails: nobody drinks. Everyone does a dare for every card instead.'] },
  { kind: 'rule', intensity: 4, text: 'Spin the wheel. The rule it lands on holds until the next wild card.', tool: { via: 'wheel', labels: ['All {shots} are doubled.', 'No swearing. Swear and take {shot}.', 'Questions only. Slip and take {shot}.', 'No yes or no. Slip and take {shot}.', 'Cheers before every drink. Forget and you {drink}.', 'Compliment first. Forget and take {shot}.'] } },

  // Rules: they hold until the next wild card, and the app keeps the rule on screen meanwhile.
  { kind: 'rule', intensity: 4, text: 'All {shots} are doubled until the next wild card.', rule: '{shots} are doubled' },
  { kind: 'rule', intensity: 2, text: 'Speak only one language that everybody agrees on until the next wild card. Whoever slips takes {shot}.', rule: 'One language only. Slip and take {shot}' },
  { kind: 'rule', intensity: 2, text: 'Nobody says anyone\'s name until the next wild card. Whoever does takes {shot}.', rule: 'No names. Say one and take {shot}' },
  { kind: 'rule', intensity: 3, text: 'Everyone talks in questions only until the next wild card. Whoever answers with a statement takes {shot}.', rule: 'Questions only. Slip and take {shot}' },
  { kind: 'rule', intensity: 1, text: 'Nobody points with a finger until the next wild card. Whoever points takes {shot}.', rule: 'No pointing. Point and take {shot}' },
  { kind: 'rule', intensity: 1, text: 'Everyone drinks with their left hand until the next wild card. Wrong hand and you take {shot}.', rule: 'Left hand only. Slip and take {shot}' },
  { kind: 'rule', intensity: 2, text: 'End every sentence with "po" until the next wild card. Forget and take {shot}.', rule: 'Say "po" after every sentence' },
  { kind: 'rule', intensity: 2, text: 'No swearing until the next wild card. Whoever swears takes {shot}.', rule: 'No swearing. Swear and take {shot}' },
  { kind: 'rule', intensity: 2, text: 'Nobody says "yes" or "no" until the next wild card. Whoever does takes {shot}.', rule: 'No yes or no. Slip and take {shot}' },
  { kind: 'rule', intensity: 1, text: 'Everyone whispers until the next wild card. Whoever speaks loudly takes {shot}.', rule: 'Whisper only. Get loud and take {shot}' },
  { kind: 'rule', intensity: 1, text: 'Say cheers before every drink until the next wild card. Forget and you {drink}.', rule: 'Cheers before every drink' },
  { kind: 'rule', intensity: 3, text: 'Compliment the player on your right before you answer anything until the next wild card. Forget and take {shot}.', rule: 'Compliment first. Forget and take {shot}' },
  { kind: 'rule', intensity: 4, text: 'Nobody touches their phone until the next wild card. Whoever does takes 2 {shots}.', rule: 'Phones down. Touch one and take 2 {shots}', penalty: 2 },
  { kind: 'rule', intensity: 5, text: 'The player who reads each card chooses who takes the penalty on it, until the next wild card.', rule: 'The reader picks who pays' },

  // 18+ (drawn only from the Adult deck and Chaos). Flirty, never graphic.
  { kind: 'coin', intensity: 4, adult: true, text: 'Flip the coin. Flirt or pay.', outcomes: ['Heads: flirt with the player on your right for 10 seconds.', 'Tails: you {drink}.'] },
  { kind: 'dice', intensity: 4, adult: true, text: 'Roll the dice. Your number decides.', tool: { dice: 1 },
    outcomes: ['Whisper a compliment to the player on your left.', '{drink}.', 'Pick a player. You both {drink}.', 'Tell your worst date story.', 'Say who here you would take on a date.', 'Safe. Everyone else must {drink}.'] },
  { kind: 'bottle', intensity: 4, adult: true, text: 'Spin the bottle. Tell the player it lands on what you noticed first about them. Keep it kind.', people: { min: 3, max: null } },
  { kind: 'vote', intensity: 4, adult: true, text: 'Who here is the best flirt? The winner picks someone to {drink}.', tool: { seconds: 3 } },
  { kind: 'wheel', intensity: 5, adult: true, text: 'Spin the wheel. Things are about to get personal.', tool: { labels: ['Truth: your last kiss', 'Dare: flirt for 10 seconds', '{drink} twice', 'Compliment a player', 'Free pass', 'Everyone {drink}'] } },
  { kind: 'timer', intensity: 4, adult: true, text: 'You have 30 seconds. Describe your perfect date with no filler words. Slip up and {drink}.', tool: { seconds: 30 } },
];

const make = (r: Row, i: number): QueuedCard => ({
  id: `${r.adult ? 'play-adult' : 'play'}-${String(i + 1).padStart(3, '0')}`,
  text: r.text, cardType: 'action', intensity: r.intensity, category: r.category ?? 'dares',
  topics: r.adult ? ['adult'] : ['games'], kind: r.kind, tool: r.tool, outcomes: r.outcomes, adult: r.adult, people: r.people, rule: r.rule, penalty: r.penalty,
});

export const TOOL_CARDS: QueuedCard[] = ROWS.filter((r) => !r.adult).map(make);
export const ADULT_TOOL_CARDS: QueuedCard[] = ROWS.filter((r) => r.adult).map(make);
