import type { QueuedCard } from '@/lib/game/escalation-engine';
import type { CardKind, CardTool } from '@/lib/game/card-kinds';
import type { CardCategory } from '@/types/game';

/**
 * The Social media deck: phones, apps, posts, DMs, group chats and screen time. These cards belong to this deck
 * only (and Shuffle everything), so they carry `social: true` and the other decks skip them.
 * Rules for the writing are in docs/CARD_GUIDE.md. Everything a card asks to show or read is the player's own,
 * never another person's messages, and nothing is sent or posted from the table.
 */
type Q = [string, number, CardCategory, string[]?];

/** Truths: things to answer. */
const TRUTHS: Q[] = [
  ['What is the most embarrassing thing you have ever posted?', 2, 'confessions'],
  ['Which app do you open first when you wake up, and how long do you stay on it?', 1, 'confessions'],
  ['What is your daily screen time on average? Say the number out loud.', 1, 'confessions'],
  ['Who is the last person you looked up online without them knowing?', 3, 'confessions'],
  ['What is the longest you have gone without checking your phone while awake?', 1, 'memories'],
  ['Which group chat do you mute the most, and why?', 1, 'hot_takes'],
  ['Have you ever left a group chat without saying goodbye? Which one?', 2, 'confessions'],
  ['What is the most cringe photo still on your profile or in your old posts?', 2, 'memories'],
  ['Have you ever deleted a post because it did not get enough likes? Be honest.', 2, 'confessions'],
  ['Who here do you follow but never actually talk to?', 2, 'relationships'],
  ['Have you ever muted or unfollowed someone at this table? Say who or {drink}.', 4, 'confessions'],
  ['What is the most embarrassing thing you have searched this month?', 3, 'confessions'],
  ['Have you ever liked a very old photo while looking through someone\'s page? Tell the story.', 3, 'confessions'],
  ['What is the worst caption you have ever written?', 1, 'memories'],
  ['Which kind of post from your friends annoys you the most? No names, just describe it.', 2, 'roasts'],
  ['Have you ever pretended to be busy to avoid replying to a message? Who was it?', 2, 'confessions'],
  ['What is the longest you have left someone on seen, and why?', 2, 'confessions'],
  ['What is your most used emoji, and what does it say about you?', 1, 'hot_takes'],
  ['Have you ever blocked someone and unblocked them later? What happened?', 3, 'relationships', ['past_relationships']],
  ['Which celebrity do you secretly follow and never admit it?', 2, 'confessions'],
  ['What is the strangest message a stranger has ever sent you?', 3, 'memories'],
  ['Have you ever had a second or fake account? What was it for?', 3, 'confessions'],
  ['What is the most embarrassing wrong send you have ever made?', 2, 'memories'],
  ['Have you ever sent a message to the wrong person? Who was it meant for?', 3, 'confessions'],
  ['What was your first profile picture on Facebook? Describe it.', 1, 'memories'],
  ['What is the most money you have spent because of a video or reel you saw?', 1, 'confessions', ['money']],
  ['Which trend did you follow that you now regret?', 1, 'memories'],
  ['Have you ever cried because of something you saw online? What was it?', 3, 'confessions'],
  ['What is the meanest comment you have ever written online?', 4, 'confessions'],
  ['Have you ever argued with a stranger in the comments? Who won?', 2, 'memories'],
  ['Which social media app would you delete forever if you had to pick one?', 1, 'hypotheticals'],
  ['If your search history was read out loud, what is the one thing you would want deleted?', 4, 'hypotheticals'],
  ['Would you rather lose all your followers or lose all your photos? Why?', 1, 'hypotheticals'],
  ['Would you rather have your private messages leaked or your search history leaked? Pick one.', 4, 'hypotheticals'],
  ['If you could post one thing with no consequences, what would it be?', 3, 'hypotheticals'],
  ['Would you go viral for something embarrassing if it made you rich? Yes or no, and why.', 2, 'hypotheticals', ['money']],
  ['If every post you made had to be completely honest, what would you stop posting?', 3, 'hypotheticals'],
  ['If you had to give your phone to the person on your left for one minute, what would you hide first?', 4, 'hypotheticals'],
  ['Would you rather be famous online or have a quiet life with great friends?', 1, 'hypotheticals'],
  ['What would your username be if it described your real personality?', 1, 'hypotheticals'],
  ['Posting your relationship online makes it weaker. Agree or disagree, and why?', 2, 'hot_takes', ['relationships']],
  ['Close friends stories are where people are really themselves. Agree or disagree?', 1, 'hot_takes'],
  ['Anyone who posts a gym selfie is just showing off. Agree or disagree?', 2, 'hot_takes'],
  ['Seeing a message and not replying is worse than ignoring a call. Agree or disagree?', 2, 'hot_takes'],
  ['People who film a whole concert instead of watching it are missing the point. Agree or disagree?', 1, 'hot_takes'],
  ['It is fine to check your partner\'s phone if you suspect something. Agree or disagree?', 4, 'controversial', ['relationships']],
  ['Most influencers are fake. Agree or disagree?', 2, 'controversial'],
  ['Cancel culture is just online bullying. Agree or disagree, and why?', 3, 'controversial'],
  ['Group chats ruin friendships more than they help. Agree or disagree?', 2, 'hot_takes'],
  ['Voice notes are better than texts. Agree or disagree?', 1, 'hot_takes'],
  ['Nobody should be able to see when you read a message. Agree or disagree?', 1, 'hot_takes'],
  ['Taking a photo of your food is a waste of time. Agree or disagree?', 1, 'hot_takes'],
  ['An ex should be blocked on every app straight away. Agree or disagree?', 3, 'controversial', ['past_relationships']],
  ['Likes and views make you feel better about yourself than they should. Do they for you?', 3, 'confessions'],
  ['Which friend here takes the most photos before one finally gets posted?', 2, 'roasts'],
  ['Who in this group has the loudest group chat energy? Describe how they type.', 2, 'roasts'],
];

/** Dares: things to do. Each uses only the player\'s own phone and nothing leaves the table. */
const DARES: Q[] = [
  ['Show the group your screen time for the last week.', 2, 'dares'],
  ['Read out your last three searches. Skip one and {drink}.', 3, 'dares'],
  ['Let the group pick one of your old posts and read it out loud in a dramatic voice.', 2, 'dares'],
  ['Show the group the most recent photo in your gallery. No deleting first, or {drink}.', 4, 'dares'],
  ['Open your gallery and say the date of the oldest photo on it.', 1, 'dares'],
  ['Take a group selfie with everyone in the frame. Nobody posts it unless everyone says yes.', 1, 'dares'],
  ['Do your best influencer voice and promote the glass in front of you for 30 seconds.', 2, 'dares'],
  ['Act out your most embarrassing post without saying a word. The group guesses it.', 3, 'dares'],
  ['Pose for the group like your best profile picture. They rate it out of 10.', 1, 'dares'],
  ['Let the player on your right scroll your feed for 10 seconds and say out loud what they see.', 4, 'dares'],
  ['Say the username of your very first account. If you forgot it, {drink}.', 1, 'dares'],
  ['Describe every player here as if you were writing their dating app bio. Keep it kind.', 3, 'dares'],
  ['Give a 20 second speech thanking your followers, even if you only have five.', 2, 'dares'],
  ['Unbox something from your bag like a YouTuber, for 30 seconds.', 2, 'dares'],
  ['Show the group the last video you saved and explain why you saved it.', 3, 'dares'],
  ['Write a caption for the person across from you and read it out loud. They can veto it once.', 2, 'dares'],
  ['Read your latest unread notification in a news anchor voice.', 3, 'dares'],
  ['Show the last photo you took of someone at this table. If you have none, {drink}.', 2, 'dares'],
  ['Swap phones with the player on your right and look only at each other\'s home screens. Say what you notice, kindly.', 2, 'dares'],
  ['Count your unread notifications out loud. Under 50 you are safe. More and you {drink}.', 1, 'dares'],
];

interface Tool {
  kind: CardKind; text: string; intensity: number; tool?: CardTool; outcomes?: string[]; rule?: string;
  people?: { min: number; max: number | null };
}

/** Cards that bring their own tool, and rules. */
const TOOLS: Tool[] = [
  { kind: 'dice', intensity: 3, text: 'Roll the die. Your number picks what you confess about.', tool: { dice: 1 },
    outcomes: ['Instagram: your most embarrassing post.', 'TikTok: your guilty pleasure videos.', 'Facebook: the oldest request you ignored.', 'Messenger: your longest unanswered chat.', 'YouTube: the weirdest thing you watched this month.', 'Free pass. Skip the confession.'] },
  { kind: 'dice', intensity: 3, text: 'Roll the die. Read that many of your recent notifications out loud. Skip one and {drink}.', tool: { dice: 1 } },
  { kind: 'dice', intensity: 2, text: 'Roll the die. Name that many apps on your home screen and say what you use each one for.', tool: { dice: 1 } },
  { kind: 'coin', intensity: 2, text: 'Flip the coin. Show your screen time or pay.', outcomes: ['Heads: show the group your screen time.', 'Tails: {drink} and keep it private.'] },
  { kind: 'coin', intensity: 4, text: 'Flip the coin. Be honest or pay.', outcomes: ['Heads: say the last person you looked up online.', 'Tails: {drink} twice.'] },
  { kind: 'coin', intensity: 2, text: 'Flip the coin. Caption or message.', outcomes: ['Heads: read your last post caption out loud.', 'Tails: read the last message you sent to a group chat out loud.'] },
  { kind: 'coin', intensity: 2, text: 'Flip the coin. Best reply or worst reply.', outcomes: ['Heads: tell the group the best reply you ever sent.', 'Tails: tell the group the worst reply you ever sent.'] },
  { kind: 'wheel', intensity: 3, text: 'Spin the wheel. It picks your app confession.', tool: { labels: ['Last profile you viewed', 'Your worst post', 'Funniest message', 'Biggest unfollow', 'Your screen time', 'Free pass'] } },
  { kind: 'wheel', intensity: 2, text: 'Spin the wheel. You are the content now.', tool: { labels: ['Influencer voice', 'Vlog intro', 'Sing a jingle', 'Tell a story', 'Free pass', '{drink}'] } },
  { kind: 'wheel', intensity: 4, text: 'Spin the wheel. Your phone pays the price.', tool: { labels: ['Show screen time', 'Read last search', 'Show last photo', 'Read a notification', 'Free pass', '{drink} twice'] } },
  { kind: 'timer', intensity: 1, text: 'You have 30 seconds. Name as many social media apps as you can. Fewer than 8 and you {drink}.', tool: { seconds: 30 } },
  { kind: 'timer', intensity: 2, text: 'You have 20 seconds. Describe your last post like a movie trailer. Stuck means {drink}.', tool: { seconds: 20 } },
  { kind: 'timer', intensity: 1, text: 'You have 30 seconds. Explain your favourite meme to someone who has never seen one. Stuck means {drink}.', tool: { seconds: 30 } },
  { kind: 'bottle', intensity: 2, text: 'Spin the bottle. The player it lands on shows the last photo they took.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 4, text: 'Spin the bottle. You ask the player it lands on who they check on most online. They answer or {drink}.', people: { min: 3, max: null } },
  { kind: 'bottle', intensity: 2, text: 'Spin the bottle. The player it lands on describes your online personality in one sentence.', people: { min: 3, max: null } },
  { kind: 'vote', intensity: 2, text: 'Who here replies the slowest? Count down and point. The most pointed at will {drink}.', tool: { seconds: 3 }, people: { min: 3, max: null } },
  { kind: 'vote', intensity: 2, text: 'Who here has the most unread messages? Count down and point. They say their number or {drink}.', tool: { seconds: 3 }, people: { min: 3, max: null } },
  { kind: 'vote', intensity: 2, text: 'Who here posts the most? Count down and point. They tell the group their best post.', tool: { seconds: 3 }, people: { min: 3, max: null } },
  { kind: 'vote', intensity: 1, text: 'Who here would go viral first? Count down and point. They pick someone to {drink}.', tool: { seconds: 3 }, people: { min: 3, max: null } },
  { kind: 'vote', intensity: 3, text: 'Who here is most likely to start group chat drama? Count down and point. The most pointed at takes {shot}.', tool: { seconds: 3 }, people: { min: 3, max: null } },
  { kind: 'vote', intensity: 1, text: 'Who here has the best profile picture? Count down and point. They explain the story behind it.', tool: { seconds: 3 }, people: { min: 3, max: null } },
  { kind: 'rule', intensity: 2, text: 'Everyone says "hashtag" before they answer until the next wild card. Whoever forgets takes {shot}.', rule: 'Say "hashtag" first. Forget and take {shot}' },
  { kind: 'rule', intensity: 2, text: 'Nobody says the name of an app until the next wild card. Whoever does takes {shot}.', rule: 'No app names. Say one and take {shot}' },
  { kind: 'rule', intensity: 3, text: 'Everyone talks like a news presenter until the next wild card. Whoever breaks character takes {shot}.', rule: 'News presenter voice. Break it and take {shot}' },
];

const base = { social: true as const };
const id = (n: number) => `social-${String(n).padStart(3, '0')}`;

const truthCards: QueuedCard[] = TRUTHS.map(([text, intensity, category, extra], i) => ({
  id: id(i + 1), text, cardType: 'question', intensity, category, topics: ['social_media', ...(extra ?? [])], ...base,
}));
const dareCards: QueuedCard[] = DARES.map(([text, intensity, category, extra], i) => ({
  id: id(TRUTHS.length + i + 1), text, cardType: 'action', intensity, category, topics: ['social_media', ...(extra ?? [])], ...base,
}));
const toolCards: QueuedCard[] = TOOLS.map((r, i) => ({
  id: id(TRUTHS.length + DARES.length + i + 1), text: r.text, cardType: 'action', intensity: r.intensity, category: 'dares', topics: ['social_media'],
  kind: r.kind, tool: r.tool, outcomes: r.outcomes, people: r.people, rule: r.rule, ...base,
}));

export const SOCIAL_CARDS: QueuedCard[] = [...truthCards, ...dareCards, ...toolCards];
