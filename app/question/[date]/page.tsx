"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import DailyQuestionCard from "@/app/components/daily-question-card";
import Footer from "@/app/components/footer";
import Navbar from "@/app/components/navbar";
import { useAuth } from "@/app/hooks/useAuth";
import { getDailyQuestion } from "@/app/utils/daily-question";

type QuestionReply = {
id: string;
question_date: string;
author_id: string;
author_name: string;
content: string;
created_at: string;
};

export default function DailyQuestionPage() {
return (
<Suspense
fallback={
<main className="min-h-screen bg-blue-950 p-8 text-center text-white">
Loading discussion...
</main>
}
>
<QuestionDiscussion />
</Suspense>
);
}

function QuestionDiscussion() {
const { date } = useParams<{ date: string }>();
const router = useRouter();
const { supabase, user, profile, loading: authLoading } = useAuth();
const [replies, setReplies] = useState<QuestionReply[]>([]);
const [content, setContent] = useState("");
const [isLoading, setIsLoading] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const [replyError, setReplyError] = useState("");
const question = getDailyQuestion(date);
const maxLength = 1000;

useEffect(() => {
let active = true;

async function loadReplies() {
if (!question) {
setErrorMessage("This daily question link is invalid.");
setIsLoading(false);
return;
}

setIsLoading(true);
setErrorMessage("");
try {
const { data, error } = await supabase
.from("daily_question_replies")
.select("id, question_date, author_id, author_name, content, created_at")
.eq("question_date", date)
.order("created_at", { ascending: true })
.limit(100);
if (error) throw error;
if (active) setReplies((data ?? []) as QuestionReply[]);
} catch (cause: unknown) {
if (!active) return;
console.error("Failed to load daily question discussion.", cause);
setErrorMessage(
cause instanceof Error
? `The discussion could not be loaded. Apply the daily question migration and try again. ${cause.message}`
: "The discussion could not be loaded. Please try again.",
);
} finally {
if (active) setIsLoading(false);
}
}

void loadReplies();
return () => {
active = false;
};
}, [date, question, supabase]);

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
const cleanContent = content.trim();
if (!question || !cleanContent || cleanContent.length > maxLength) return;
if (!user) {
router.push(
`/login?tab=signin&redirect=${encodeURIComponent(`/question/${date}`)}`,
);
return;
}

const metadataName =
typeof user.user_metadata?.full_name === "string"
? user.user_metadata.full_name.trim()
: "";
const authorName =
[profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
metadataName ||
user.email?.split("@")[0] ||
"Community member";

setIsSubmitting(true);
setReplyError("");
try {
const { data, error } = await supabase
.from("daily_question_replies")
.insert({
question_date: date,
author_id: user.id,
author_name: authorName,
content: cleanContent,
})
.select("id, question_date, author_id, author_name, content, created_at")
.single();
if (error) throw error;
if (!data) throw new Error("Supabase returned no saved reply.");

setReplies((current) => [...current, data as QuestionReply]);
setContent("");
} catch (cause: unknown) {
console.error("Failed to save daily question reply.", cause);
setReplyError(
cause instanceof Error
? `Your reply could not be saved. ${cause.message}`
: "Your reply could not be saved. Please try again.",
);
} finally {
setIsSubmitting(false);
}
}

return (
<>
<Navbar />
<main className="min-h-screen flex-1 bg-blue-950 px-4 py-8 text-white sm:px-6">
<div className="mx-auto max-w-3xl">
<Link
href="/"
className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white"
>
<ArrowLeft aria-hidden="true" className="h-4 w-4" />
Back to community
</Link>

{question ? (
<>
<DailyQuestionCard questionDate={date} showDiscussionLink={false} />
<section aria-labelledby="discussion-title" className="mt-8">
<h1
id="discussion-title"
className="flex items-center gap-2 text-xl font-bold"
>
<MessageCircle aria-hidden="true" className="h-5 w-5 text-amber-200" />
Community discussion
<span className="text-base font-medium text-white/55">
({replies.length})
</span>
</h1>

{errorMessage && (
<p
role="alert"
className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
>
{errorMessage}
</p>
)}

<form
onSubmit={handleSubmit}
className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5"
>
<label
htmlFor="question-reply"
className="mb-2 block text-sm font-semibold"
>
What&apos;s your perspective?
</label>
<textarea
id="question-reply"
value={content}
onChange={(event) => setContent(event.target.value)}
maxLength={maxLength}
rows={4}
placeholder="Share a thoughtful response..."
className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
/>
<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
<p className="text-xs text-white/60" aria-live="polite">
{content.length}/{maxLength} characters
</p>
{!authLoading && !user && (
<p className="mr-auto text-xs text-amber-200">
Sign in to join the discussion.
</p>
)}
<button
type="submit"
disabled={
!content.trim() ||
isSubmitting ||
(authLoading && !user)
}
className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2.5 text-sm font-bold text-blue-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
>
<Send aria-hidden="true" className="h-4 w-4" />
{isSubmitting
? "Posting..."
: user
? "Post reply"
: "Sign in to reply"}
</button>
</div>
{replyError && (
<p role="alert" className="mt-3 text-sm text-red-200">
{replyError}
</p>
)}
</form>

<div className="mt-5 space-y-3">
{isLoading ? (
<p role="status" className="rounded-xl bg-white/10 p-6 text-sm text-white/70">
Loading replies...
</p>
) : replies.length > 0 ? (
replies.map((reply) => (
<article
key={reply.id}
className="rounded-2xl border border-white/10 bg-white/5 p-4"
>
<div className="flex items-center justify-between gap-3">
<Link
href={`/profile/${reply.author_id}`}
className="text-sm font-bold hover:underline"
>
{reply.author_name}
</Link>
<time
dateTime={reply.created_at}
className="text-xs text-white/55"
>
{new Date(reply.created_at).toLocaleString()}
</time>
</div>
<p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-white/85">
{reply.content}
</p>
</article>
))
) : (
<p className="rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-white/65">
No replies yet. Be the first to share your perspective.
</p>
)}
</div>
</section>
</>
) : (
<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
This daily question link is invalid.
</p>
)}
</div>
</main>
<Footer />
</>
);
}
