import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { CardCategory } from '@/types/game';

/**
 * 18+ cards. Flirty and suggestive, never graphic, never about anyone who has not agreed to play.
 * They are drawn only when the "18+ cards" setting is on. Group topic filters still apply
 * through the "sexual_content" tag, so a table can switch them off for one game.
 */
type Row = [string, 'question' | 'action', number, CardCategory];
const ROWS: Row[] = [
  ["What is the most embarrassing thing that has happened to you in bed?", "question", 4, "confessions"],
  ["Who in this room would you swipe right on? Say it out loud.", "question", 4, "relationships"],
  ["Rate your last kiss from 1 to 10. Be honest.", "question", 3, "confessions"],
  ["What is the boldest place you have ever kissed someone?", "question", 4, "confessions"],
  ["Name an ex you still check on social media.", "question", 4, "relationships"],
  ["What is a turn-on you are willing to say out loud in front of everyone?", "question", 5, "confessions"],
  ["Have you ever had a crush on a friend's partner? Answer or drink.", "question", 5, "confessions"],
  ["Which person here do you think kisses the best, and why?", "question", 4, "hot_takes"],
  ["What is the most scandalous message in your phone right now? Describe it, no showing.", "question", 5, "confessions"],
  ["Have you ever had a one-night stand? Tell the story or drink.", "question", 5, "confessions"],
  ["What is the wildest thing you have done after a night of drinking?", "question", 4, "memories"],
  ["Which celebrity would you not say no to?", "question", 3, "hypotheticals"],
  ["What is the first thing you notice about someone you find attractive?", "question", 3, "relationships"],
  ["What is the longest you have stayed in a situationship?", "question", 3, "relationships"],
  ["Which two people here would make the best couple, and why?", "question", 3, "hypotheticals"],
  ["What is your biggest bedroom red flag in a partner?", "question", 4, "hot_takes"],
  ["Have you ever had feelings for someone you work with?", "question", 3, "confessions"],
  ["What is something you did to impress someone you liked that you would never admit sober?", "question", 4, "confessions"],
  ["Have you ever been caught kissing or doing something you should not? Where were you?", "question", 4, "memories"],
  ["Who here would be the worst person to share a hotel room with, and why?", "question", 3, "roasts"],
  ["Describe your ideal date with the person on your right, in one sentence.", "action", 3, "dares"],
  ["Give the person across from you your best pickup line.", "action", 3, "dares"],
  ["Whisper something flirty to the person on your left. They decide if you drink.", "action", 4, "dares"],
  ["Do your best slow walk across the room. The group scores it out of 10.", "action", 3, "dares"],
  ["Offer a 10-second shoulder massage to anyone who says yes.", "action", 3, "dares"],
  ["Compliment the person on your right on something other than their looks.", "action", 2, "dares"],
];

export const ADULT_CARDS: QueuedCard[] = ROWS.map(([text, cardType, intensity, category], i) => ({
  id: `adult-${String(i + 1).padStart(3, '0')}`, text, cardType, intensity, category, topics: ['sexual_content', 'adult'], adult: true,
}));
