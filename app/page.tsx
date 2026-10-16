"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
Activity,
Atom,
BookOpen,
Church,
Clapperboard,
Cpu,
EyeOff,
Gamepad2,
Heart,
HeartCrack,
House,
MapPin,
MessageCircle,
Newspaper,
Send,
Shirt,
Sparkles,
Trophy,
UsersRound,
Utensils,
} from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import Footer from "./components/footer";
import Navbar from "./components/navbar";

const categories = [
{ name: "Politics", icon: Newspaper },
{ name: "Tech", icon: Cpu },
{ name: "Gaming", icon: Gamepad2 },
{ name: "Fashion", icon: Shirt },
{ name: "Faith", icon: Church },
{ name: "LGBTQ+", icon: Heart },
{ name: "Sports", icon: Trophy },
{ name: "Entertainment", icon: Clapperboard },
{ name: "Science", icon: Atom },
{ name: "Books", icon: BookOpen },
{ name: "Food", icon: Utensils },
{ name: "Local", icon: MapPin },
] as const;

type Category = (typeof categories)[number]["name"];
type FeedCategory = "All notes" | Category;
type NoteKind = "note" | "letter";
type NoteReaction = "good" | "cold";

type NoteReactionSummary = {
good: number;
cold: number;
mine: NoteReaction | null;
};

type NoteReactionRow = {
note_id: string;
good_count: number;
cold_count: number;
my_reaction: NoteReaction | null;
};

type Note = {
id: string;
authorId: string;
author: string;
category: Category;
kind: NoteKind;
title: string | null;
text: string;
createdAt: string;
};

type NoteRow = {
id: string;
author_id: string;
author_name: string;
category: string;
kind: string;
title: string | null;
content: string;
created_at: string;
};

function isCategory(value: string): value is Category {
return categories.some((category) => category.name === value);
}

function formatTime(value: string) {
const elapsedSeconds = Math.max(
0,
Math.floor((Date.now() - new Date(value).getTime()) / 1000),
);

if (elapsedSeconds < 60) return "now";
if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m`;
if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h`;
return `${Math.floor(elapsedSeconds / 86400)}d`;
}

function CategoryList({
activeCategory,
visibleCategories,
onSelect,
onHide,
compact = false,
}: {
activeCategory: FeedCategory;
visibleCategories: readonly Category[];
onSelect: (category: FeedCategory) => void;
onHide?: (category: Category) => void;
compact?: boolean;
}) {
const buttonClassName = compact
? "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition"
: "flex w-full items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm font-semibold transition";

return (
<>
<button
type="button"
onClick={() => onSelect("All notes")}
aria-pressed={activeCategory === "All notes"}
className={`${buttonClassName} ${
activeCategory === "All notes"
? "bg-blue-950 text-white shadow-sm"
: "text-slate-600 hover:bg-blue-50 hover:text-blue-950"
}`}
>
<House aria-hidden="true" className="h-4 w-4" />
All notes
</button>
{visibleCategories.map((name) => {
const category = categories.find((item) => item.name === name);
if (!category) return null;
const Icon = category.icon;

return (
<div
  key={name}
  className={`group flex items-center gap-1 ${
    compact ? "w-max shrink-0" : "min-w-0"
  }`}
>
<button
type="button"
onClick={() => onSelect(name)}
aria-pressed={activeCategory === name}
className={`${buttonClassName} min-w-0 ${
activeCategory === name
? "bg-blue-950 text-white shadow-sm"
: "text-slate-600 hover:bg-blue-50 hover:text-blue-950"
}`}
>
<Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
{name}
</button>
{onHide && (
<button
type="button"
onClick={() => onHide(name)}
aria-label={`Hide ${name} category`}
title={`Hide ${name}`}
className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-blue-700"
>
<EyeOff aria-hidden="true" className="h-4 w-4" />
</button>
)}
</div>
);
})}
</>
);
}

export default function Home() {
const router = useRouter();
const { supabase, user, profile, loading: authLoading, error: authError } =
useAuth();
const [activeCategory, setActiveCategory] =
useState<FeedCategory>("All notes");
const [composeCategory, setComposeCategory] = useState<Category>("Tech");
const [kind, setKind] = useState<NoteKind>("note");
const [title, setTitle] = useState("");
const [message, setMessage] = useState("");
const [notes, setNotes] = useState<Note[]>([]);
const [reactionSummaries, setReactionSummaries] = useState<
Record<string, NoteReactionSummary>
>({});
const [reactingTo, setReactingTo] = useState<string | null>(null);
const [isLoadingNotes, setIsLoadingNotes] = useState(true);
const [isSubmitting, setIsSubmitting] = useState(false);
const [hiddenCategoriesOverride, setHiddenCategoriesOverride] = useState<{
userId: string;
categories: Category[];
} | null>(null);
const [errorMessage, setErrorMessage] = useState("");

const hiddenCategories = (
hiddenCategoriesOverride && user?.id === hiddenCategoriesOverride.userId
? hiddenCategoriesOverride.categories
: profile?.hidden_categories ?? []
).filter(isCategory);
const visibleCategories = categories
.map(({ name }) => name)
.filter((name) => !hiddenCategories.includes(name));

const visibleNotes =
activeCategory === "All notes"
? notes
: notes.filter((note) => note.category === activeCategory);
const characterLimit = kind === "note" ? 255 : 400;

const categoryActivity = new Map<Category, number>();
const communityNotes = notes.filter(
(note) => !hiddenCategories.includes(note.category),
);
for (const note of communityNotes) {
categoryActivity.set(
note.category,
(categoryActivity.get(note.category) ?? 0) + 1,
);
}

const trendingNotes = [...communityNotes]
.sort(
(left, right) =>
(categoryActivity.get(right.category) ?? 0) -
(categoryActivity.get(left.category) ?? 0) ||
new Date(right.createdAt).getTime() -
new Date(left.createdAt).getTime(),
)
.slice(0, 3);

useEffect(() => {
let active = true;

async function loadNotes() {
setIsLoadingNotes(true);
setErrorMessage("");

const { data, error } = await supabase
.from("notes")
.select(
"id, author_id, author_name, category, kind, title, content, created_at",
)
.order("created_at", { ascending: false })
.limit(100);

if (!active) return;
if (error) {
setErrorMessage(
`Notes could not be loaded. Apply the Supabase migration and try again. ${error.message}`,
);
} else {
const loadedNotes = ((data ?? []) as NoteRow[])
.filter(
(row): row is NoteRow & { category: Category; kind: NoteKind } =>
isCategory(row.category) &&
(row.kind === "note" || row.kind === "letter"),
)
.map((row) => ({
id: row.id,
authorId: row.author_id,
author: row.author_name,
category: row.category,
kind: row.kind,
title: row.title,
text: row.content,
createdAt: row.created_at,
}));
setNotes(loadedNotes);

if (loadedNotes.length > 0) {
const { data: reactionData, error: reactionError } = await supabase.rpc(
"get_note_reaction_summaries",
{ p_note_ids: loadedNotes.map((note) => note.id) },
);

if (!active) return;
if (reactionError) {
setErrorMessage(
`Reaction counts could not be loaded. Apply the note reactions migration and try again. ${reactionError.message}`,
);
} else {
setReactionSummaries(
Object.fromEntries(
((reactionData ?? []) as NoteReactionRow[]).map((summary) => [
summary.note_id,
{
good: Number(summary.good_count),
cold: Number(summary.cold_count),
mine: summary.my_reaction,
},
]),
),
);
}
}
}
setIsLoadingNotes(false);
}

void loadNotes();
return () => {
active = false;
};
}, [supabase, user?.id]);

async function handleReaction(noteId: string, reaction: NoteReaction) {
if (!user) {
router.push("/login?tab=signin&redirect=%2F");
return;
}

setReactingTo(noteId);
setErrorMessage("");
const { error } = await supabase.rpc("toggle_note_reaction", {
p_note_id: noteId,
p_reaction: reaction,
});

if (error) {
setErrorMessage(`Your reaction could not be saved. ${error.message}`);
setReactingTo(null);
return;
}

const { data, error: summaryError } = await supabase.rpc(
"get_note_reaction_summaries",
{ p_note_ids: [noteId] },
);

if (summaryError) {
setErrorMessage(
`Reaction counts could not be refreshed. ${summaryError.message}`,
);
setReactingTo(null);
return;
}

const summary = (data as NoteReactionRow[] | null)?.[0];
if (summary) {
setReactionSummaries((current) => ({
...current,
[noteId]: {
good: Number(summary.good_count),
cold: Number(summary.cold_count),
mine: summary.my_reaction,
},
}));
}
setReactingTo(null);
}

async function toggleCategory(category: Category, shouldHide: boolean) {
if (!user) {
router.push("/login?tab=signin&redirect=%2F");
return;
}
if (shouldHide && visibleCategories.length === 1) {
setErrorMessage("Keep at least one community visible in your category list.");
return;
}

const updatedCategories = shouldHide
? [...new Set([...hiddenCategories, category])]
: hiddenCategories.filter((item) => item !== category);
setErrorMessage("");

const { data, error } = await supabase.rpc("update_my_hidden_categories", {
p_categories: updatedCategories,
});

if (error || !data) {
setErrorMessage(
`Your category preference could not be saved. ${
error?.message ?? "No matching profile was updated."
}`,
);
return;
}

setHiddenCategoriesOverride({
userId: user.id,
categories: updatedCategories,
});
if (shouldHide && activeCategory === category) {
setActiveCategory("All notes");
}
if (shouldHide && composeCategory === category) {
setComposeCategory(visibleCategories.find((item) => item !== category) ?? category);
}
}

async function handleSubmit(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
const content = message.trim();
const cleanTitle = title.trim();

if (!content || content.length > characterLimit) return;
if (!user) {
router.push("/login?tab=signin&redirect=%2F");
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
setErrorMessage("");

try {
const { data, error } = await supabase
.from("notes")
.insert({
author_id: user.id,
author_name: authorName,
category: composeCategory,
kind,
title: kind === "letter" && cleanTitle ? cleanTitle : null,
content,
})
.select(
"id, author_id, author_name, category, kind, title, content, created_at",
)
.single();

if (error) throw error;
if (!data) throw new Error("Supabase returned no saved note.");

const row = data as NoteRow;
const newNote: Note = {
id: row.id,
authorId: row.author_id,
author: row.author_name,
category: composeCategory,
kind,
title: row.title,
text: row.content,
createdAt: row.created_at,
};

setNotes((currentNotes) => [newNote, ...currentNotes]);
setActiveCategory(composeCategory);
setTitle("");
setMessage("");
} catch (cause: unknown) {
console.error(`Failed to share ${kind}.`, cause);
const details =
cause instanceof Error ? cause.message : "Unknown connection error.";
setErrorMessage(
cause instanceof TypeError
? `Could not connect to Supabase. Check your connection and verify the Supabase project is available. ${details}`
: `Your ${kind} could not be shared. ${details}`,
);
} finally {
setIsSubmitting(false);
}
}

function selectCategory(category: FeedCategory) {
  setActiveCategory(category);
  if (category !== "All notes") {
    setComposeCategory(category);
  }
}

return (
<>
<Navbar />
<main className="min-h-screen bg-blue-950">
<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
<header className="mb-7">
<p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
<Sparkles aria-hidden="true" className="h-4 w-4" />
Connect. Share. Belong.
</p>
<h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
A feed for every side of you.
</h1>
<p className="mt-2 max-w-2xl text-base leading-7 text-white/75">
Find your people, follow what you love, and share a quick note
with the community.
</p>
</header>

{errorMessage && (
<p
role="alert"
className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
>
{errorMessage}
</p>
)}
{authError && (
<p
role="alert"
className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
>
Your profile settings could not be loaded. Category preferences
may not be available until the Supabase migration is applied.
</p>
)}

<nav
aria-label="Note categories"
className="mb-3 flex gap-2 overflow-x-auto pb-2 md:hidden"
>
<CategoryList
activeCategory={activeCategory}
visibleCategories={visibleCategories}
onSelect={selectCategory}
compact
/>
</nav>
<details className="mb-5 rounded-xl border border-white/20 bg-white/10 p-3 text-white md:hidden">
<summary className="cursor-pointer text-sm font-semibold">
Customize communities
</summary>
<div className="mt-3 space-y-2">
{visibleCategories.map((category) => (
<button
key={category}
type="button"
onClick={() => void toggleCategory(category, true)}
className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-white/10"
>
Hide {category}
<EyeOff aria-hidden="true" className="h-4 w-4" />
</button>
))}
{hiddenCategories.map((category) => (
<button
key={category}
type="button"
onClick={() => void toggleCategory(category, false)}
className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-white/10"
>
Show {category}
<span aria-hidden="true">+</span>
</button>
))}
</div>
</details>

<div className="grid items-start gap-6 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_260px]">
<aside className="sticky top-24 hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:block">
<h2 className="px-4 pb-3 pt-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
Communities
</h2>
<nav aria-label="Note categories" className="space-y-1">
<CategoryList
  activeCategory={activeCategory}
  visibleCategories={visibleCategories}
  onSelect={selectCategory}   // was setActiveCategory
  onHide={(category) => void toggleCategory(category, true)}
/>
</nav>
{hiddenCategories.length > 0 && (
<div className="mt-4 border-t border-slate-100 pt-3">
<h3 className="px-3 pb-2 text-xs font-semibold text-slate-500">
Hidden communities
</h3>
{hiddenCategories.map((category) => (
<button
key={category}
type="button"
onClick={() => void toggleCategory(category, false)}
className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-950"
>
{category}
<span aria-hidden="true">+</span>
</button>
))}
</div>
)}
<p className="mx-3 mt-4 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
More interests, more perspectives, one welcoming place.
</p>
</aside>

<section aria-label="Community notes" className="min-w-0">
<form
onSubmit={handleSubmit}
className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
>
<div className="mb-4 flex items-center gap-3">
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-800">
{profile?.first_name?.charAt(0).toUpperCase() ??
user?.email?.charAt(0).toUpperCase() ??
"Y"}
</div>
<div className="min-w-0">
<p className="text-sm font-semibold text-slate-800">
{kind === "note" ? "Share a note" : "Write a letter"}
</p>
<p className="text-xs text-slate-500">
Choose a community for your {kind}.
</p>
</div>
<select
id="note-category"
aria-label="Choose a community"
value={composeCategory}
onChange={(event) =>
setComposeCategory(event.target.value as Category)
}
className="ml-auto max-w-40 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
>
{visibleCategories.map((name) => (
<option key={name} value={name}>
{name}
</option>
))}
</select>
</div>

<div
role="group"
aria-label="Choose a message type"
className="mb-3 inline-flex rounded-full bg-slate-100 p-1"
>
{(["note", "letter"] as const).map((option) => (
<button
key={option}
type="button"
onClick={() => setKind(option)}
aria-pressed={kind === option}
className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
kind === option
? "bg-blue-950 text-white shadow-sm"
: "text-slate-600 hover:text-blue-950"
}`}
>
{option}
</button>
))}
</div>

{kind === "letter" && (
<div className="mb-3">
<label htmlFor="letter-title" className="sr-only">
Letter title (optional)
</label>
<input
id="letter-title"
type="text"
value={title}
maxLength={120}
onChange={(event) => setTitle(event.target.value)}
placeholder="Add a title (optional)"
className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
/>
</div>
)}

<label htmlFor="note-message" className="sr-only">
Write your {kind}
</label>
<textarea
id="note-message"
value={message}
onChange={(event) => setMessage(event.target.value)}
maxLength={characterLimit}
aria-describedby="note-character-count"
placeholder={
kind === "note"
? "Share your thoughts."
: "Write a little more about what matters to you..."
}
rows={kind === "note" ? 3 : 5}
className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
/>
<div className="mt-3 flex items-center justify-between gap-3">
<p
id="note-character-count"
aria-live="polite"
className={`text-xs ${
message.length >= characterLimit - 15
? "font-semibold text-amber-700"
: "text-slate-500"
}`}
>
{message.length}/{characterLimit} characters
</p>
<button
type="submit"
disabled={
!message.trim() ||
isSubmitting ||
(authLoading && !user)
}
className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-45"
>
<Send aria-hidden="true" className="h-4 w-4" />
{isSubmitting
? "Sharing..."
: user
? `Share ${kind}`
: "Sign in to share"}
</button>
</div>
</form>

<div className="mb-3 flex items-center justify-between px-1">
<div>
<h2 className="text-xl font-bold text-white">
{activeCategory === "All notes"
? "Your community feed"
: `${activeCategory} notes`}
</h2>
<p className="mt-1 text-sm text-white/75">
{activeCategory === "All notes"
? "A little bit of everything you care about."
: `Conversations from the ${activeCategory} community.`}
</p>
</div>
<span className="hidden items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 sm:inline-flex">
<Activity aria-hidden="true" className="h-3.5 w-3.5" />
{visibleNotes.length} {visibleNotes.length === 1 ? "note" : "notes"}
</span>
</div>

{isLoadingNotes ? (
<div
role="status"
className="rounded-2xl border border-white/15 bg-white/10 px-6 py-12 text-center text-sm text-white/75"
>
Loading notes...
</div>
) : visibleNotes.length > 0 ? (
<div className="space-y-3">
{visibleNotes.map((note) => (
<article
key={note.id}
className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 sm:p-5"
>
<div className="flex items-start gap-3">
<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-cyan-100 text-sm font-bold text-blue-800">
{note.author.charAt(0).toUpperCase()}
</div>
<div className="min-w-0 flex-1">
<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
<span className="text-sm font-bold text-slate-900">
{note.author}
</span>
<time
dateTime={note.createdAt}
className="text-sm text-slate-500"
>
· {formatTime(note.createdAt)}
</time>
<span className="ml-auto rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800">
{note.category}
</span>
</div>
{note.kind === "letter" && note.title && (
<h3 className="mt-3 text-base font-bold text-slate-900">
{note.title}
</h3>
)}
<p className="mt-2 whitespace-pre-wrap wrap-break-word text-[15px] leading-6 text-slate-800">
{note.text}
</p>
<div className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-500">
<MessageCircle
aria-hidden="true"
className="h-4 w-4"
/>
Community {note.kind}
</div>
<div
role="group"
aria-label="React to this note"
className="mt-4 flex items-center gap-2"
>
<button
type="button"
onClick={() => void handleReaction(note.id, "good")}
aria-label={`Mark this note good (${reactionSummaries[note.id]?.good ?? 0})`}
aria-pressed={reactionSummaries[note.id]?.mine === "good"}
disabled={reactingTo === note.id}
className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs cursor-pointer font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:opacity-50 ${
reactionSummaries[note.id]?.mine === "good"
? "bg-rose-100 text-rose-700"
: "text-rose-600 hover:bg-rose-50"
}`}
>
<Heart
aria-hidden="true"
className="h-4 w-4"
fill={reactionSummaries[note.id]?.mine === "good" ? "currentColor" : "none"}
/>
Good
<span>{reactionSummaries[note.id]?.good ?? 0}</span>
</button>
<button
type="button"
onClick={() => void handleReaction(note.id, "cold")}
aria-label={`Mark this note cold (${reactionSummaries[note.id]?.cold ?? 0})`}
aria-pressed={reactionSummaries[note.id]?.mine === "cold"}
disabled={reactingTo === note.id}
className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition  cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:opacity-50 ${
reactionSummaries[note.id]?.mine === "cold"
? "bg-sky-100 text-sky-700"
: "text-sky-700 hover:bg-sky-50"
}`}
>
<HeartCrack
aria-hidden="true"
className="h-4 w-4 cursor-pointer"
fill={reactionSummaries[note.id]?.mine === "cold" ? "currentColor" : "none"}
/>
Cold
<span>{reactionSummaries[note.id]?.cold ?? 0}</span>
</button>
</div>

</div>
</div>
</article>
))}
</div>
) : (
<div className="rounded-2xl border border-dashed border-white/30 bg-white/10 px-6 py-12 text-center">
<UsersRound
aria-hidden="true"
className="mx-auto h-9 w-9 text-blue-200"
/>
<h3 className="mt-3 font-bold text-white">
Start the conversation
</h3>
<p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-white/75">
{errorMessage
? "The feed could not load. Resolve the message above to see community notes."
: `There aren’t any notes in ${
activeCategory === "All notes"
? "the community"
: activeCategory
} yet. Be the first to share something.`}
</p>
</div>
)}
</section>

<aside className="hidden space-y-4 lg:block">
<div className="rounded-2xl border border-white/20 bg-white p-5 shadow-sm">
<h2 className="flex items-center gap-2 font-bold text-blue-950">
<Activity
aria-hidden="true"
className="h-4 w-4 text-blue-700"
/>
Trending notes
</h2>
<p className="mt-1 text-xs text-slate-500">
From the most active communities
</p>
{trendingNotes.length > 0 ? (
<div className="mt-4 space-y-4">
{trendingNotes.map((note, index) => (
<button
key={note.id}
type="button"
onClick={() => setActiveCategory(note.category)}
className="block w-full border-t border-slate-100 pt-3 text-left first:border-0 first:pt-0"
>
<span className="text-xs font-semibold text-blue-700">
{index + 1}. {note.category}
</span>
{note.title && (
<span className="mt-1 block text-sm font-bold text-slate-800">
{note.title}
</span>
)}
<span className="mt-1 line-clamp-3 block text-sm leading-5 text-slate-600">
{note.text}
</span>
</button>
))}
</div>
) : (
<p className="mt-4 text-sm leading-6 text-slate-500">
Trending notes from the community will show up here.
</p>
)}
</div>
<div className="rounded-2xl bg-blue-900 p-5 text-white shadow-sm">
<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-200">
<Heart aria-hidden="true" className="h-5 w-5" />
</div>
<h2 className="mt-4 text-lg font-bold">
Belong before you agree.
</h2>
<p className="mt-2 text-sm leading-6 text-blue-100/80">
Good conversations start with curiosity. Keep it kind, make
room for different views, and help everyone feel welcome.
</p>
</div>
<div className="rounded-2xl border border-white/20 bg-white p-5 shadow-sm">
<h2 className="flex items-center gap-2 font-bold text-blue-950">
<Sparkles
aria-hidden="true"
className="h-4 w-4 text-blue-600"
/>
Made for your mix
</h2>
<p className="mt-2 text-sm leading-6 text-slate-600">
Politics, games, style, faith, and all the interests that
make you you. Show only the communities you want to see.
</p>
</div>
</aside>
</div>
</div>
</main>
<Footer />
</>
);
}
