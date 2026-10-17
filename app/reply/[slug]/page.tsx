"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import Footer from "@/app/components/footer";
import GoBack from "@/app/components/GoBack";
import Navbar from "@/app/components/navbar";
import { useAuth } from "@/app/hooks/useAuth";

type ParentPost = {
id: string;
author_id: string;
author_name: string;
category: string;
kind: "note" | "letter";
title: string | null;
content: string;
created_at: string;
};

type NoteReply = {
id: string;
note_id: string;
author_id: string;
author_name: string;
content: string;
created_at: string;
};

export default function ReplyPage() {
return (
<Suspense
fallback={
<main className="min-h-screen bg-blue-950 p-8 text-center text-white">
Loading conversation...
</main>
}
>
<ReplyContent />
</Suspense>
);
}

function ReplyContent() {
const { slug } = useParams<{ slug: string }>();
const router = useRouter();
const { supabase, user, profile, loading: authLoading } = useAuth();
const [post, setPost] = useState<ParentPost | null>(null);
const [replies, setReplies] = useState<NoteReply[]>([]);
const [content, setContent] = useState("");
const [isLoading, setIsLoading] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const [replyError, setReplyError] = useState("");
const maxLength = 1000;

useEffect(() => {
let active = true;

async function loadConversation() {
setIsLoading(true);
setErrorMessage("");
try {
const { data: postData, error: postError } = await supabase
.from("notes")
.select(
"id, author_id, author_name, category, kind, title, content, created_at",
)
.eq("id", slug)
.maybeSingle();
if (postError) throw postError;
if (!postData) {
if (active) setErrorMessage("This post may have been removed or is unavailable.");
return;
}

const { data: replyData, error: repliesError } = await supabase
.from("note_replies")
.select("id, note_id, author_id, author_name, content, created_at")
.eq("note_id", slug)
.order("created_at", { ascending: true });
if (repliesError) {
throw new Error(
`Replies could not be loaded. Apply the note replies migration and try again. ${repliesError.message}`,
);
}

if (!active) return;
setPost(postData as ParentPost);
setReplies((replyData ?? []) as NoteReply[]);
} catch (cause: unknown) {
if (!active) return;
setErrorMessage(
cause instanceof Error
? cause.message
: "This conversation could not be loaded. Please try again.",
);
} finally {
if (active) setIsLoading(false);
}
}

void loadConversation();
return () => {
active = false;
};
}, [slug, supabase]);

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
const cleanContent = content.trim();
if (!cleanContent || cleanContent.length > maxLength || !post) return;

if (!user) {
router.push(
`/login?tab=signin&redirect=${encodeURIComponent(`/reply/${slug}`)}`,
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
.from("note_replies")
.insert({
note_id: post.id,
author_id: user.id,
author_name: authorName,
content: cleanContent,
})
.select("id, note_id, author_id, author_name, content, created_at")
.single();
if (error) throw error;
if (!data) throw new Error("Supabase returned no saved reply.");

setReplies((current) => [...current, data as NoteReply]);
setContent("");
} catch (cause: unknown) {
console.error("Failed to save reply.", cause);
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
<div className="mb-6">
<GoBack />
</div>

{isLoading ? (
<p role="status" className="rounded-2xl bg-white/10 p-8 text-white/75">
Loading conversation...
</p>
) : errorMessage ? (
<p
role="alert"
className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
>
{errorMessage}
</p>
) : post ? (
<>
<article className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-7">
<div className="flex items-center justify-between gap-3">
<span className="rounded-full bg-blue-200/10 px-3 py-1 text-xs font-semibold text-blue-100">
{post.category} · {post.kind}
</span>
<time dateTime={post.created_at} className="text-xs text-white/60">
{new Date(post.created_at).toLocaleDateString()}
</time>
</div>
<h1 className="mt-4 text-2xl font-extrabold">
{post.kind === "letter"
? post.title || `A letter from ${post.author_name}`
: `Community note`}
</h1>
<p className="mt-1 text-sm text-white/65">
By{" "}
<Link
href={`/profile/${post.author_id}`}
className="font-semibold text-white hover:underline"
>
{post.author_name}
</Link>
</p>
<p className="mt-5 whitespace-pre-wrap wrap-break-word text-[15px] leading-7 text-white/90">
{post.content}
</p>
</article>

<section aria-labelledby="replies-title" className="mt-8">
<h2
id="replies-title"
className="flex items-center gap-2 text-xl font-bold"
>
<MessageCircle aria-hidden="true" className="h-5 w-5 text-blue-200" />
Replies <span className="text-base text-white/60">({replies.length})</span>
</h2>

<form
onSubmit={handleSubmit}
className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5"
>
<label htmlFor="reply-content" className="mb-2 block text-sm font-semibold">
Add to the conversation
</label>
<textarea
id="reply-content"
value={content}
onChange={(event) => setContent(event.target.value)}
maxLength={maxLength}
rows={4}
placeholder="Write a thoughtful reply..."
className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
/>
<div className="mt-3 flex flex-wrap items-center justify-between gap-3">
<p className="text-xs text-white/60" aria-live="polite">
{content.length}/{maxLength} characters
</p>
{!authLoading && !user && (
<p className="mr-auto text-xs text-amber-200">
Sign in to post a reply.
</p>
)}
<button
type="submit"
disabled={!content.trim() || isSubmitting || (authLoading && !user)}
className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
>
<Send aria-hidden="true" className="h-4 w-4" />
{isSubmitting
? "Replying..."
: user
? "Reply"
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
{replies.length ? (
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
No replies yet. Be the first to join in.
</p>
)}
</div>
</section>
</>
) : null}
</div>
</main>
<Footer />
</>
);
}
