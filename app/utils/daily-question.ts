export const dailyQuestionOptions = ["Absolutely", "It depends", "Not at all", "Explain"] as const;

export type DailyQuestionOption = (typeof dailyQuestionOptions)[number];

const questions = [
  // Original Questions
  "Can you disagree with someone and still be friends?",
  "Can people with different beliefs build a strong community?",
  "Can a difficult conversation bring people closer?",
  "Should curiosity come before trying to change someone's mind?",
  "Can we learn from a perspective we strongly disagree with?",
  "Is listening just as important as speaking in a disagreement?",
  "Can people find common ground without changing their minds?",

  // Connection & Understanding
  "Can you respect someone’s value system without agreeing with it?",
  "Is it possible to feel deep empathy for someone whose choices you wouldn't make?",
  "Can two people see the same facts and arrive at completely different, valid conclusions?",
  "Does understanding someone’s story make it harder to dislike them?",
  "Can a friendship survive when your core values evolve in different directions?",

  // Conversation & Listening
  "Are we listening to understand, or just waiting for our turn to reply?",
  "Can silence during a difficult conversation be more powerful than words?",
  "How do you know when a debate has stopped being productive?",
  "Is acknowledging someone else's point the same as admitting you were wrong?",
  "Can asking the right question be more persuasive than giving a strong argument?",

  // Curiosity & Growth
  "Can you change someone's mind if you don't first understand why they hold their belief?",
  "Is holding an opinion lightly a sign of weakness or a sign of wisdom?",
  "What is the difference between trying to win an argument and trying to solve a problem?",
  "Can being wrong about something actually be an enjoyable experience?",
  "Should our goal in a discussion be persuasion or mutual understanding?",

  // Community & Shared Spaces
  "Can a community thrive without complete consensus among its members?",
  "Is total agreement necessary for meaningful collaboration?",
  "How do we balance standing up for our beliefs with making room for others?",
  "Can shared goals unite people even when their methods completely conflict?",
] as const;

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function getUtcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDailyQuestion(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;

  const timestamp = Date.parse(`${dateKey}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== dateKey) {
    return null;
  }

  const dayNumber = Math.floor(timestamp / millisecondsPerDay);
  return questions[dayNumber % questions.length];
}

export function isDailyQuestionOption(value: string): value is DailyQuestionOption {
  return dailyQuestionOptions.some((option) => option === value);
}