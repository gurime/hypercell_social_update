"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
dailyQuestionOptions,
getDailyQuestion,
getUtcDateKey,
isDailyQuestionOption,
type DailyQuestionOption,
} from "../utils/daily-question";

type QuestionResult = {
answer: DailyQuestionOption;
vote_count: number;
my_vote: DailyQuestionOption | null;
};

export default function DailyQuestionCard({
questionDate,
showDiscussionLink = true,
}: {
questionDate?: string;
showDiscussionLink?: boolean;
}) {
const router = useRouter();
const { supabase, user } = useAuth();
const [today, setToday] = useState<string | null>(null);
const [results, setResults] = useState<QuestionResult[]>([]);
const [loadedDate, setLoadedDate] = useState<string | null>(null);
const [isVoting, setIsVoting] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const date = questionDate ?? today;
const question = date ? getDailyQuestion(date) : null;
const isLoading = !date || Boolean(question && loadedDate !== date);
const totalVotes = results.reduce((total, result) => total + result.vote_count, 0);
const myVote = results.find((result) => result.my_vote)?.my_vote ?? null;
const isCurrentQuestion = date === today;
const displayedError = date && !question
? "This daily question link is invalid."
: errorMessage;

const loadResults = useCallback(async () => {
if (!date || !question) return;

try {
const { data, error } = await supabase.rpc(
"get_daily_question_results",
{ p_question_date: date },
);
if (error) throw error;

const loadedResults = ((data ?? []) as Array<{
answer: string;
vote_count: number | string;
my_vote: string | null;
}>).flatMap((row) => {
if (!isDailyQuestionOption(row.answer)) return [];
return [{
answer: row.answer,
vote_count: Number(row.vote_count),
my_vote:
row.my_vote && isDailyQuestionOption(row.my_vote)
? row.my_vote
: null,
}];
});
setResults(loadedResults);
setErrorMessage("");
} catch (cause: unknown) {
console.error("Failed to load daily question results.", cause);
setErrorMessage(
cause instanceof Error
? `Poll results could not be loaded. Apply the daily question migration and try again. ${cause.message}`
: "Poll results could not be loaded. Apply the daily question migration and try again.",
);
} finally {
setLoadedDate(date);
}
}, [date, question, supabase]);

useEffect(() => {
const updateToday = () => setToday(getUtcDateKey(new Date()));
updateToday();
if (questionDate) return;
const interval = window.setInterval(updateToday, 60_000);
return () => window.clearInterval(interval);
}, [questionDate]);

useEffect(() => {
if (!date || !question) return;
let active = true;
void Promise.resolve().then(() => {
if (active) return loadResults();
});
return () => {
active = false;
};
}, [date, loadResults, question]);

async function handleVote(answer: DailyQuestionOption) {
if (!date || isVoting) return;
if (!user) {
router.push(
`/login?tab=signin&redirect=${encodeURIComponent(`/question/${date}`)}`,
);
return;
}

setIsVoting(true);
setErrorMessage("");
try {
const { error } = await supabase.rpc("cast_daily_question_vote", {
p_question_date: date,
p_answer: answer,
});
if (error) throw error;
await loadResults();
} catch (cause: unknown) {
console.error("Failed to save daily question vote.", cause);
setErrorMessage(
cause instanceof Error
? `Your vote could not be saved. ${cause.message}`
: "Your vote could not be saved. Please try again.",
);
} finally {
setIsVoting(false);
}
}

return (
<section className="overflow-hidden rounded-2xl border border-amber-200/15 bg-gradient-to-br from-amber-300/10 via-blue-950 to-blue-950 p-5 shadow-lg shadow-black/10">
<div className="flex items-center justify-between gap-3">
<p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">
{isCurrentQuestion ? "Today’s question" : "Daily question"}
</p>
<Sparkles aria-hidden="true" className="h-4 w-4 text-amber-200" />
</div>
<h2 className="mt-3 text-lg font-bold leading-6 text-white">
{question ?? (date ? "Question unavailable" : "Loading today’s question...")}
</h2>
<p className="mt-2 text-sm leading-6 text-blue-100/75">
Everyone has a perspective. What&apos;s yours?
</p>

<div className="mt-4 grid grid-cols-2 gap-2">
{dailyQuestionOptions.map((answer) => {
const count =
results.find((result) => result.answer === answer)?.vote_count ?? 0;
const percentage =
totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

return (
<button
key={answer}
type="button"
onClick={() => void handleVote(answer)}
disabled={!date || !question || isLoading || isVoting || myVote !== null}
aria-pressed={myVote === answer}
className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-60 ${
myVote === answer
? "border-amber-200/50 bg-amber-200/15 text-amber-100"
: myVote
  ? "border-white/10 bg-white/2 text-white/55"
  : "border-white/10 bg-white/4 text-white hover:border-amber-200/30 hover:bg-white/8"
}`}
>
<span className="block text-sm font-bold">{answer}</span>
<span className="mt-1 block text-xs text-white/55">
{isLoading && question
? "Loading..."
: question
  ? `${count} · ${percentage}%`
  : "Unavailable"}
{myVote === answer ? " · Your vote" : ""}
</span>
</button>
);
})}
</div>

{!user && (
<p className="mt-3 text-xs text-blue-100/55">
Sign in to vote. Results are visible to everyone.
</p>
)}
{myVote && (
<p className="mt-3 text-xs text-amber-100/75">
You’ve voted. Your answer is locked for this question.
</p>
)}
{displayedError && (
<p role="alert" className="mt-3 text-xs leading-5 text-rose-200">
{displayedError}
</p>
)}
{showDiscussionLink && date && question && (
<Link
href={`/question/${date}`}
className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-amber-200 transition hover:text-amber-100"
>
<MessageCircle aria-hidden="true" className="h-4 w-4" />
Join the conversation
<span aria-hidden="true">→</span>
</Link>
)}
{isVoting && (
<span className="sr-only" role="status">
Saving your vote...
</span>
)}
</section>
);
}
