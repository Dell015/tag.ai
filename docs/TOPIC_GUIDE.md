# Topic deck guide

How the Topic deck plays and how to write a topic. Content lives in `src/lib/data/talk-topics.ts`. Card (drinking game) rules are in `CARD_GUIDE.md`.

## What a topic is

Something to talk about, not a card to answer. No turns, no shots, no pot. Each topic has a group, a format, a "go deeper" follow-up and optional filter tags.

## Formats

| Format | Write it as | What the table does | Colour of the screen |
|---|---|---|---|
| `agree` | A statement, never a question. "A hotdog is a sandwich." | Count down 3-2-1, everyone shows agree or disagree at once, one person taps the counts. The smaller side gets 30 seconds to argue back. | Group colour |
| `ab` | A "Pick one" or "Would you rather" sentence plus two short options `a` and `b` (24 characters or less). | Count down, everyone says A or B, the table taps the counts. | Group colour |
| `think` | A reflective question. | A 60 second thinking timer, then talk. | Group colour |
| `story` | "Tell us about a time..." | The bottle picks who tells it, then a 60 second timer. | Group colour |

Rules that tests check: every topic has a `deeper` line, every `ab` topic has both options, `agree` topics do not end in a question mark, stories are `story`, no em dash, no exclamation mark, no emoji, at least 5 topics per group.

## Groups and colours

| Group | Colour | Best formats |
|---|---|---|
| Right and wrong (`moral`) | Red | agree |
| Fate and choice (`fate`) | Purple | agree, think |
| Mind and self (`self`) | Teal | think, agree |
| Society and the future (`society`) | Blue | agree, ab |
| Life reflections (`reflect`) | Pink | think |
| Everyday hot takes (`takes`) | Yellow | agree, ab |
| Dilemmas (`dilemma`) | Orange | ab |
| Stories (`stories`) | Green | story |

Colours live in `src/app/globals.css` (`data-group`). A topic saved before formats existed falls back to its group's format (`formatOf`).

## Writing a topic

1. Pick the group, then the format that fits. If it is a yes or no question, rewrite it as a statement and use `agree`.
2. Write the topic in plain words, under 100 characters. Say both options in the sentence for `ab` so the comfort filters can see them.
3. Write the "go deeper" line: one sharper follow-up that makes people explain or look inward. It is not a second topic. "Who does the forgiving help, them or you?" works. "What do you think?" does not.
4. Tag sensitive topics (`religion`, `death`, `politics`, `money`, `career`) so the skip filters work.
5. No topic should embarrass one person at the table. These are opinions and stories, not roasts.
6. Run `npm test` and `npm run lint`.

## What the app remembers

The counts the table taps are kept for the session (`results` in `talk-store.ts`). At the end the app shows the topic the table was most divided on and one everyone agreed on. Nothing is saved after the session ends and nothing is shared.
