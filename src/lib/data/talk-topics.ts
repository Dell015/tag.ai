/**
 * Topic deck content: things to talk about, not cards to answer. No turns, no shots.
 * Each topic has a group and optional filter tags (see lib/game/comfort-filters.ts).
 * Kept small on purpose while the groups are being settled.
 */
export type TalkGroupId = 'moral' | 'fate' | 'self' | 'society' | 'reflect' | 'takes' | 'dilemma' | 'stories';

export interface TalkGroup { id: TalkGroupId; label: string; hint: string }
export interface TalkTopic { id: string; group: TalkGroupId; text: string; topics?: string[] }

export const TALK_GROUPS: TalkGroup[] = [
  { id: 'moral', label: 'Right and wrong', hint: 'Where people draw the line' },
  { id: 'fate', label: 'Fate and choice', hint: 'Luck, destiny and free will' },
  { id: 'self', label: 'Mind and self', hint: 'Who you are and how you know' },
  { id: 'society', label: 'Society and the future', hint: 'How we live now and later' },
  { id: 'reflect', label: 'Life reflections', hint: 'What matters, looking back' },
  { id: 'takes', label: 'Everyday hot takes', hint: 'Small things people argue about' },
  { id: 'dilemma', label: 'Dilemmas', hint: 'Two choices, defend yours' },
  { id: 'stories', label: 'Stories', hint: 'Tell the table what happened' },
];

const rows: [TalkGroupId, string, string[]?][] = [
  ['moral', 'Is it ever okay to lie to someone you love?'],
  ['moral', 'If a friend cheats on their partner, do you tell the partner?'],
  ['moral', 'Is it wrong to forgive someone who never said sorry?'],
  ['moral', 'Should people be judged by their worst moment or their usual self?'],
  ['moral', 'Is keeping a secret for a friend always the loyal thing to do?'],
  ['moral', 'Can someone be a good person without believing in anything?', ['religion']],
  ['moral', 'Would you return a wallet with a lot of cash and no ID in it?'],
  ['fate', 'Do we choose who we fall for, or does it just happen?'],
  ['fate', 'Is success mostly talent, effort or luck?'],
  ['fate', 'If you could see how your life ends, would you look?', ['death']],
  ['fate', 'Do things happen for a reason, or do we invent the reason afterwards?'],
  ['fate', 'Is there one person out there for everyone?'],
  ['fate', 'Is there anything after we die?', ['religion', 'death']],
  ['fate', 'If you replayed your life from the start, how much would change?'],
  ['self', 'If every part of you was slowly replaced, would you still be you?'],
  ['self', 'Are you the same person online as in real life?'],
  ['self', 'Can people really change, or do they just get better at hiding?'],
  ['self', 'What would you do if nobody could ever find out?'],
  ['self', 'Do you know yourself better than your best friend knows you?'],
  ['society', 'Will we be better or worse off with AI in everything?'],
  ['society', 'Is social media making friendships stronger or thinner?'],
  ['society', 'Should rich people be allowed to buy their way out of every problem?', ['money']],
  ['society', 'Would you live in a world with no phones if everyone agreed?'],
  ['society', 'Is it better to be loved by many or deeply by one?'],
  ['society', 'Should a country put the environment ahead of jobs?', ['politics']],
  ['society', 'What will people in 50 years find strange about how we live?'],
  ['reflect', 'What would you tell yourself at 18?'],
  ['reflect', 'What is something you did not value until it was gone?'],
  ['reflect', 'What does a good life look like to you, and is it the one you are living?'],
  ['reflect', 'Which small decision changed your life the most?'],
  ['reflect', 'What are you proud of that nobody around you knows about?'],
  ['reflect', 'What is the best advice you ever ignored?'],
  ['takes', 'Is a hotdog a sandwich?'],
  ['takes', 'Is it rude to leave a group chat without saying anything?'],
  ['takes', 'Should you split the bill evenly or pay for what you ordered?', ['money']],
  ['takes', 'Is reading the last page of a book first cheating?'],
  ['takes', 'Are people who are always early more respectful or just anxious?'],
  ['takes', 'Which is worse: being left on read or being ghosted?'],
  ['dilemma', 'Would you rather know every truth or be happy believing a lie?'],
  ['dilemma', 'Would you rather have a job you love that pays little, or one you hate that pays well?', ['money', 'career']],
  ['dilemma', 'Would you rather lose all your memories or never make a new one?'],
  ['dilemma', 'Would you rather be famous and disliked, or unknown and adored by a few?'],
  ['dilemma', 'Would you rather always say what you think or never speak again?'],
  ['stories', 'Tell the story of the best day you have had with someone at this table.'],
  ['stories', 'Tell us about a time you were completely wrong and found out the hard way.'],
  ['stories', 'Describe the strangest person you have ever met.'],
  ['stories', 'What is the most memorable trip you have taken, and why?'],
  ['stories', 'Tell us about a time a stranger changed your day.'],
];

export const TALK_TOPICS: TalkTopic[] = rows.map(([group, text, topics], i) => ({ id: `talk-${String(i + 1).padStart(3, '0')}`, group, text, ...(topics ? { topics } : {}) }));
