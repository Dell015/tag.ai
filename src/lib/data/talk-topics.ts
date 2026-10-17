/**
 * Topic deck content: things to talk about, not cards to answer. No turns, no shots.
 * Each topic has a group, a format (how the table plays it), a "go deeper" follow-up and optional
 * filter tags (see lib/game/comfort-filters.ts). How to write them: docs/TOPIC_GUIDE.md.
 */
export type TalkGroupId = 'moral' | 'fate' | 'self' | 'society' | 'reflect' | 'takes' | 'dilemma' | 'stories';

/**
 * How the table plays a topic.
 * agree: a statement. Count down, everyone shows agree or disagree, the table taps the split.
 * ab: two options. Count down, everyone picks A or B, the table taps the split.
 * think: a reflective question. A one minute thinking timer, then talk.
 * story: someone tells it. The bottle picks who, then a one minute timer.
 */
export type TalkFormat = 'agree' | 'ab' | 'think' | 'story';

export interface TalkGroup { id: TalkGroupId; label: string; hint: string }
export interface TalkTopic {
  id: string; group: TalkGroupId; text: string; topics?: string[];
  /** Missing in old saved sessions: the group decides (see formatOf). */
  format?: TalkFormat;
  /** One sharper follow-up, shown when the table taps "Go deeper". */
  deeper?: string;
  /** The two options of an "ab" topic, short enough for a button. */
  a?: string; b?: string;
}

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

const DEFAULT_FORMAT: Record<TalkGroupId, TalkFormat> = { moral: 'agree', fate: 'think', self: 'think', society: 'agree', reflect: 'think', takes: 'agree', dilemma: 'ab', stories: 'story' };
/** The format a topic plays in, falling back to its group for topics saved before formats existed. */
export const formatOf = (t: TalkTopic): TalkFormat => {
  const f = t.format ?? DEFAULT_FORMAT[t.group];
  return f === 'ab' && !(t.a && t.b) ? 'think' : f;
};

type Row = { g: TalkGroupId; f: TalkFormat; text: string; deeper: string; a?: string; b?: string; topics?: string[] };
const agree = (g: TalkGroupId, text: string, deeper: string, topics?: string[]): Row => ({ g, f: 'agree', text, deeper, topics });
const think = (g: TalkGroupId, text: string, deeper: string, topics?: string[]): Row => ({ g, f: 'think', text, deeper, topics });
const story = (text: string, deeper: string, topics?: string[]): Row => ({ g: 'stories', f: 'story', text, deeper, topics });
const ab = (text: string, a: string, b: string, deeper: string, topics?: string[], g: TalkGroupId = 'dilemma'): Row => ({ g, f: 'ab', text, a, b, deeper, topics });

const rows: Row[] = [
  // Right and wrong
  agree('moral', 'It is okay to lie to someone you love to protect them.', 'Where is the line between protecting someone and controlling them?'),
  agree('moral', 'If a friend cheats, you have to tell their partner.', 'Does it change if the partner is also your friend?'),
  agree('moral', 'You can forgive someone who never said sorry.', 'Who does the forgiving help, them or you?'),
  agree('moral', 'People should be judged by their usual self, not their worst moment.', 'Is there a mistake so big it outweighs everything else?'),
  agree('moral', 'Keeping a friend\'s secret is always the loyal thing to do.', 'What secret would make you break your word?'),
  agree('moral', 'A person can be good without believing in anything.', 'What keeps a person good when nobody is watching?', ['religion']),
  agree('moral', 'You should return a wallet full of cash with no ID in it.', 'Would your answer change if you were broke this week?'),
  agree('moral', 'It is fine to cut someone off after one big betrayal.', 'What would a person have to do to earn a second chance?'),
  agree('moral', 'It is wrong to take credit for a group project you barely worked on.', 'What if everyone else agreed to let you take it?'),
  agree('moral', 'Telling a white lie to avoid hurting someone is kinder than the truth.', 'When did a white lie last make things worse?'),
  agree('moral', 'You should always tell a friend when they are making a mistake.', 'Has a friend ever been right to tell you, even when it hurt?'),
  think('moral', 'Is it worse to hurt someone on purpose or by not caring?', 'Which one have you been guilty of more often?'),
  agree('moral', 'Cheating on a test is okay if the test is unfair.', 'Who decides when a rule is unfair?'),
  // Fate and choice
  agree('fate', 'We do not choose who we fall for. It just happens.', 'Then why do some people keep falling for the same type?'),
  agree('fate', 'Success is mostly luck.', 'What was the luckiest break you ever got?'),
  think('fate', 'If you could see how your life ends, would you look?', 'What if it turned out ordinary? Would that be a relief or a letdown?', ['death']),
  agree('fate', 'Everything happens for a reason.', 'Name something that hurt at the time and made sense later.'),
  agree('fate', 'There is one person out there for everyone.', 'If so, what are the odds you have already met yours?'),
  think('fate', 'Is there anything after we die?', 'How does your answer change the way you live?', ['religion', 'death']),
  think('fate', 'If you replayed your life from the start, how much would change?', 'What is the one thing you would keep exactly as it was?'),
  agree('fate', 'Where you were born decides most of how your life goes.', 'What one thing did your starting point give you that others did not get?'),
  think('fate', 'If you could ask one person from your past one question and get the whole truth, who and what?', 'Why have you never asked it?'),
  agree('fate', 'Meeting the right person at the wrong time is the saddest thing there is.', 'Has it happened to you?'),
  think('fate', 'What is one thing that was pure luck and changed everything for you?', 'Do you think you would have found another way?'),
  // Mind and self
  think('self', 'If every part of you was slowly replaced, would you still be you?', 'Which part of you could never be replaced?'),
  agree('self', 'You are the same person online as in real life.', 'Who has met only one of your two versions?'),
  agree('self', 'People can really change.', 'Who in your life actually did, and what made the difference?'),
  think('self', 'What would you do if nobody could ever find out?', 'Why does being seen stop you?'),
  agree('self', 'You know yourself better than your best friend knows you.', 'What does your best friend see in you that you do not?'),
  agree('self', 'You become more like your parents as you get older.', 'Which habit of theirs have you already caught in yourself?'),
  think('self', 'What is a belief you used to hold strongly and no longer do?', 'What changed your mind?'),
  agree('self', 'First impressions are usually right.', 'Who did you completely misjudge at first?'),
  think('self', 'What do you pretend to be fine with that you are not?', 'What would happen if you said it out loud?'),
  agree('self', 'It is easier to be honest with strangers than with the people closest to you.', 'Who do you tell the things you tell nobody else?'),
  // Society and the future
  agree('society', 'AI will make life better for most of us.', 'Who gets left behind first?'),
  agree('society', 'Social media makes friendships thinner.', 'Which friendship of yours only survives because of an app?'),
  agree('society', 'Rich people should not be able to buy their way out of every problem.', 'Where would you draw the line on what money can buy?', ['money']),
  agree('society', 'Life would be better with no phones, if everyone agreed.', 'What would you miss first?'),
  ab('Pick one: be loved by many, or be loved deeply by one.', 'Loved by many', 'Loved by one', 'Which one do you already have more of?', undefined, 'society'),
  agree('society', 'A country should put the environment ahead of jobs.', 'Would you accept a pay cut yourself for it?', ['politics']),
  think('society', 'What will people in 50 years find strange about how we live?', 'What do we do today that they will judge us for most?'),
  agree('society', 'Remote work is better for people than working in an office.', 'What do you lose when nobody is in the same room?'),
  agree('society', 'Students should be graded less and taught more.', 'What did school measure that did not matter?'),
  agree('society', 'Online reviews have made us worse at deciding for ourselves.', 'When did a review steer you wrong?'),
  agree('society', 'Everyone should spend a year serving their country or community.', 'What would you have done with your year?'),
  think('society', 'What is a job that will not exist when your children are adults?', 'What new job would you invent?'),
  agree('society', 'Having children is a bigger decision than getting married.', 'What is the question nobody asks before either one?'),
  // Life reflections
  think('reflect', 'What would you tell yourself at 18?', 'Would 18 year old you have listened?'),
  think('reflect', 'What is something you did not value until it was gone?', 'Is there something you have now that you should value more?'),
  think('reflect', 'What does a good life look like to you, and is it the one you are living?', 'What is the smallest change that would close the gap?'),
  think('reflect', 'Which small decision changed your life the most?', 'What would your life look like if you had decided the other way?'),
  think('reflect', 'What are you proud of that nobody around you knows about?', 'Why have you kept it to yourself?'),
  think('reflect', 'What is the best advice you ever ignored?', 'What did ignoring it cost you, or save you?'),
  think('reflect', 'Who has been the biggest influence on who you are today?', 'Have you ever told them?'),
  think('reflect', 'What did you want to be when you were ten, and what happened?', 'Is there a piece of it you could still do?'),
  think('reflect', 'What is something you used to be afraid of that does not scare you now?', 'What took the fear away?'),
  think('reflect', 'What habit would you give up first if you could?', 'What stops you?'),
  think('reflect', 'What is the best thing that happened to you this year?', 'Who would you want to share it with?'),
  // Everyday hot takes
  agree('takes', 'A hotdog is a sandwich.', 'So what is the one thing that makes a sandwich a sandwich?'),
  agree('takes', 'Leaving a group chat without saying anything is rude.', 'What is the politest way to leave one?'),
  agree('takes', 'Splitting the bill evenly is the fair way.', 'What should you do when one person ordered far more?', ['money']),
  agree('takes', 'Reading the last page of a book first is cheating.', 'Does knowing the ending ruin it, or make you enjoy it more?'),
  agree('takes', 'People who are always early are more respectful, not just anxious.', 'Which are you, honestly?'),
  ab('Pick one: being left on read, or being ghosted. Which is worse?', 'Left on read', 'Ghosted', 'Which one has happened to you more?', undefined, 'takes'),
  agree('takes', 'Sweet spaghetti is the right kind of spaghetti.', 'What is the one dish you will defend to the end?'),
  agree('takes', 'Karaoke is better when you are bad at it.', 'What song do you refuse to sing in front of people?'),
  agree('takes', 'Rice is needed in every proper meal.', 'What meal comes closest to breaking that rule?'),
  agree('takes', 'It is rude to be on your phone at the dinner table.', 'When did you last break that rule?'),
  agree('takes', 'Replying to a message right away is more polite than waiting.', 'Whose message have you been avoiding replying to?'),
  agree('takes', 'Pineapple on pizza is fine.', 'What is the strangest food combination you actually like?'),
  agree('takes', 'Tipping should be built into the bill.', 'Where would you tip more, and where less?', ['money']),
  agree('takes', 'Eating alone in a restaurant is more peaceful than awkward.', 'Where would you go for a meal on your own?'),
  agree('takes', 'Group photos should be taken once, not ten times.', 'Who in your group makes you take it again?'),
  agree('takes', 'Bringing food to a party is a must, even if the host says not to.', 'What is your safe dish to bring?'),
  agree('takes', 'Sleeping in on weekends is better than any plan.', 'What plan would still get you out of bed?'),
  ab('Pick one: fried chicken or sinigang for the last meal on earth.', 'Fried chicken', 'Sinigang', 'Who cooked the best version you have had?', undefined, 'takes'),
  // Dilemmas
  ab('Would you rather know every truth, or be happy believing a lie?', 'Know every truth', 'Happy in a lie', 'What is one truth you are glad you do not know?'),
  ab('Would you rather have a job you love that pays little, or one you hate that pays well?', 'Love it, low pay', 'Hate it, high pay', 'How much more would it take to make you switch?', ['money', 'career']),
  ab('Would you rather lose all your memories, or never make a new one?', 'Lose them all', 'Never make new ones', 'Which memory would you fight hardest to keep?'),
  ab('Would you rather be famous and disliked, or unknown and adored by a few?', 'Famous, disliked', 'Unknown, adored', 'Who are the few?'),
  ab('Would you rather always say what you think, or never speak again?', 'Say everything', 'Never speak', 'What is the first thing you would say if you could not hold back?'),
  ab('Would you rather read minds, or turn invisible?', 'Read minds', 'Turn invisible', 'Whose mind would you read first, and whose would you regret reading?'),
  ab('Would you rather always arrive 20 minutes early, or always be 10 minutes late?', 'Always early', 'Always late', 'Which one is already you?'),
  ab('Would you rather give up your phone for a year, or give up rice for a year?', 'No phone', 'No rice', 'What would you do with the extra time?'),
  ab('Would you rather live in the city, always busy, or in the province, quiet and far from everyone?', 'The city', 'The province', 'Where do you see yourself at 60?'),
  ab('Would you rather marry someone your family loves and you like, or someone you love and your family cannot stand?', 'Family loves them', 'You love them', 'Who is in the room when you decide, you or your family?'),
  ab('Would you rather know the day you will die, or never know?', 'Know the day', 'Never know', 'What is the first thing you would change?', ['death']),
  ab('Would you rather speak every language, or play every instrument perfectly?', 'Every language', 'Every instrument', 'Where is the first place you would use it?'),
  ab('Would you rather never have to sleep, or never have to eat?', 'Never sleep', 'Never eat', 'What would you do with your extra time?'),
  ab('Would you rather relive your best day once a year, or skip your worst day for good?', 'Relive the best', 'Skip the worst', 'What would you pick as the best day?'),
  ab('Would you rather be rich and always alone, or poor and surrounded by people who love you?', 'Rich, alone', 'Poor, loved', 'What number would change your answer?', ['money']),
  ab('Would you rather have an hour with someone you lost, or an hour with your future self?', 'Someone you lost', 'Your future self', 'What would you say in the first minute?'),
  ab('Would you rather everyone could hear your thoughts for a day, or you could hear everyone else\'s?', 'They hear mine', 'I hear theirs', 'Who would be most surprised?'),
  // Stories
  story('Tell the story of the best day you have had with someone at this table.', 'What made that day better than all the ordinary ones?'),
  story('Tell us about a time you were completely wrong and found out the hard way.', 'What would you do differently now?'),
  story('Describe the strangest person you have ever met.', 'What did you learn from them?'),
  story('Tell us about the most memorable trip you have taken, and why.', 'Who would you take back with you?'),
  story('Tell us about a time a stranger changed your day.', 'Have you ever been that stranger for someone?'),
  story('Tell us about a time you were scared and it turned out fine.', 'What helped you get through it?'),
  story('Tell us about the best meal of your life and who you shared it with.', 'Could you ever cook or find it again?'),
  story('Tell us about someone who shaped who you are.', 'Do they know?'),
  story('Tell us about a time you got completely lost.', 'Who found you, or how did you find your way?'),
  story('Tell us about the most embarrassing thing that happened to you at school or work.', 'Is it funny to you now?'),
  story('Tell us about a time you had to say goodbye to someone or something that mattered.', 'What do you wish you had said?'),
  story('Tell us about the kindest thing someone has done for you.', 'How did you thank them, or how could you?'),
  story('Tell us about a job, school or place you thought you would hate and ended up loving.', 'What changed your mind?'),
  story('Tell us about a time you laughed so hard you could not stop.', 'Who was there and what set it off?'),
  story('Tell us about a risk you took that you are glad you took.', 'What if you had played it safe?'),
  story('Tell us about the first time you felt properly grown up.', 'Did it feel the way you expected?'),
];

export const TALK_TOPICS: TalkTopic[] = rows.map((r, i) => ({
  id: `talk-${String(i + 1).padStart(3, '0')}`, group: r.g, text: r.text, format: r.f, deeper: r.deeper,
  ...(r.a ? { a: r.a, b: r.b } : {}), ...(r.topics ? { topics: r.topics } : {}),
}));
