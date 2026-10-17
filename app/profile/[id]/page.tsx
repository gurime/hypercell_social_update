"use client";

import {
Suspense,
useCallback,
useEffect,
useState,
type FormEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
CalendarDays,
Link as LinkIcon,
MapPin,
MessageCircle,
Pencil,
Trash2,
UserCheck,
UserPlus,
} from "lucide-react";
import Footer from "@/app/components/footer";
import GoBack from "@/app/components/GoBack";
import Navbar from "@/app/components/navbar";
import { useAuth } from "@/app/hooks/useAuth";

const PROFILE_COLUMNS =
"id, first_name, last_name, bio, location, website, created_at";

type ProfileRow = {
id: string;
first_name: string | null;
last_name: string | null;
bio: string | null;
location: string | null;
website: string | null;
created_at: string | null;
};

type PostRow = {
id: string;
category: string;
kind: "note" | "letter";
title: string | null;
content: string;
created_at: string;
};

type ReplyRow = {
id: string;
note_id: string;
content: string;
created_at: string;
};

type Tab = "notes" | "letters" | "replies" | "followers" | "following";

function displayName(person: {
first_name: string | null;
last_name: string | null;
}) {
return (
[person.first_name, person.last_name].filter(Boolean).join(" ") ||
"Community member"
);
}

function normalizeWebsite(value: string) {
const trimmed = value.trim();
if (!trimmed) return null;
const withProtocol = /^https?:\/\//i.test(trimmed)
? trimmed
: `https://${trimmed}`;
try {
const url = new URL(withProtocol);
if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
return url.toString();
} catch {
return undefined;
}
}

function Avatar({ name, size = "h-10 w-10 text-sm" }: { name: string; size?: string }) {
return (
<div
aria-hidden="true"
className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-cyan-100 font-bold text-blue-800 ${size}`}
>
{name.charAt(0).toUpperCase()}
</div>
);
}

export default function ProfilePage() {
return (
<Suspense
fallback={
<main className="min-h-screen bg-blue-950 p-8 text-center text-white">
Loading profile...
</main>
}
>
<ProfileContent />
</Suspense>
);
}

function ProfileContent() {
// Works whether the route folder is [id], [slug], [userId], etc.
const routeParams = useParams();
const rawParam = Object.values(routeParams)[0];
const profileId = Array.isArray(rawParam) ? rawParam[0] : rawParam;

const router = useRouter();
const { supabase, user } = useAuth();

const [profile, setProfile] = useState<ProfileRow | null>(null);
const [posts, setPosts] = useState<PostRow[]>([]);
const [replies, setReplies] = useState<ReplyRow[]>([]);
const [followers, setFollowers] = useState<ProfileRow[]>([]);
const [following, setFollowing] = useState<ProfileRow[]>([]);
const [tab, setTab] = useState<Tab>("notes");
const [isLoading, setIsLoading] = useState(true);
const [errorMessage, setErrorMessage] = useState("");
const [actionError, setActionError] = useState("");
const [followBusy, setFollowBusy] = useState(false);

const [isEditing, setIsEditing] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [form, setForm] = useState({
first_name: "",
last_name: "",
bio: "",
location: "",
website: "",
});

const isOwnProfile = Boolean(user && profile && user.id === profile.id);
const isFollowing = Boolean(user && followers.some((p) => p.id === user.id));

const loadPeople = useCallback(
async (
match: "follower_id" | "following_id",
other: "follower_id" | "following_id",
) => {
const { data, error } = await supabase
.from("follows")
.select(other)
.eq(match, profileId)
.order("created_at", { ascending: false })
.limit(200);
if (error) throw error;

const ids = ((data ?? []) as unknown as Record<string, string>[]).map(
(row) => row[other],
);
if (ids.length === 0) return [] as ProfileRow[];

const { data: rows, error: profilesError } = await supabase
.from("profiles")
.select(PROFILE_COLUMNS)
.in("id", ids);
if (profilesError) throw profilesError;
return (rows ?? []) as ProfileRow[];
},
[supabase, profileId],
);

useEffect(() => {
if (!profileId) return;
let active = true;

async function load() {
setIsLoading(true);
setErrorMessage("");
try {
const { data: profileData, error: profileError } = await supabase
.from("profiles")
.select(PROFILE_COLUMNS)
.eq("id", profileId)
.maybeSingle();
if (profileError) throw profileError;
if (!profileData) {
if (active) setErrorMessage("This profile could not be found.");
return;
}

const [postsRes, repliesRes, followerList, followingList] =
await Promise.all([
supabase
.from("notes")
.select("id, category, kind, title, content, created_at")
.eq("author_id", profileId)
.order("created_at", { ascending: false })
.limit(100),
supabase
.from("note_replies")
.select("id, note_id, content, created_at")
.eq("author_id", profileId)
.order("created_at", { ascending: false })
.limit(100),
loadPeople("following_id", "follower_id"),
loadPeople("follower_id", "following_id"),
]);
if (postsRes.error) throw postsRes.error;
if (repliesRes.error) throw repliesRes.error;

if (!active) return;
setProfile(profileData as ProfileRow);
setPosts((postsRes.data ?? []) as PostRow[]);
setReplies((repliesRes.data ?? []) as ReplyRow[]);
setFollowers(followerList);
setFollowing(followingList);
} catch (cause: unknown) {
if (!active) return;
setErrorMessage(
cause instanceof Error
? `This profile could not be loaded. ${cause.message}`
: "This profile could not be loaded. Please try again.",
);
} finally {
if (active) setIsLoading(false);
}
}

void load();
return () => {
active = false;
};
}, [supabase, profileId, loadPeople]);

async function toggleFollow() {
if (!user) {
router.push(
`/login?tab=signin&redirect=${encodeURIComponent(`/profile/${profileId}`)}`,
);
return;
}
if (!profile || isOwnProfile) return;

setFollowBusy(true);
setActionError("");
const { error } = isFollowing
? await supabase
.from("follows")
.delete()
.eq("follower_id", user.id)
.eq("following_id", profile.id)
: await supabase
.from("follows")
.insert({ follower_id: user.id, following_id: profile.id });

if (error) {
setActionError(
`${isFollowing ? "Unfollow" : "Follow"} failed. ${error.message}`,
);
} else {
try {
setFollowers(await loadPeople("following_id", "follower_id"));
} catch {
/* the follow itself saved; counts refresh on next load */
}
}
setFollowBusy(false);
}

function startEditing() {
if (!profile) return;
setForm({
first_name: profile.first_name ?? "",
last_name: profile.last_name ?? "",
bio: profile.bio ?? "",
location: profile.location ?? "",
website: profile.website ?? "",
});
setActionError("");
setIsEditing(true);
}

async function saveProfile(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
if (!user || !profile || !isOwnProfile) return;

const website = normalizeWebsite(form.website);
if (website === undefined) {
setActionError("Enter a valid website address, like example.com.");
return;
}
if (!form.first_name.trim()) {
setActionError("First name is required.");
return;
}

setIsSaving(true);
setActionError("");
const { data, error } = await supabase
.from("profiles")
.update({
first_name: form.first_name.trim(),
last_name: form.last_name.trim() || null,
bio: form.bio.trim() || null,
location: form.location.trim() || null,
website,
})
.eq("id", user.id)
.select(PROFILE_COLUMNS)
.single();

if (error || !data) {
setActionError(
`Your profile could not be saved. ${error?.message ?? "No profile was updated."}`,
);
} else {
setProfile(data as ProfileRow);
setIsEditing(false);
}
setIsSaving(false);
}

async function deletePost(id: string) {
if (!user || !window.confirm("Delete this post? This can't be undone.")) return;
setActionError("");
const { error } = await supabase
.from("notes")
.delete()
.eq("id", id)
.eq("author_id", user.id);
if (error) {
setActionError(`The post could not be deleted. ${error.message}`);
return;
}
setPosts((current) => current.filter((post) => post.id !== id));
}

async function deleteReply(id: string) {
if (!user || !window.confirm("Delete this reply? This can't be undone.")) return;
setActionError("");
const { error } = await supabase
.from("note_replies")
.delete()
.eq("id", id)
.eq("author_id", user.id);
if (error) {
setActionError(`The reply could not be deleted. ${error.message}`);
return;
}
setReplies((current) => current.filter((reply) => reply.id !== id));
}

const notes = posts.filter((post) => post.kind === "note");
const letters = posts.filter((post) => post.kind === "letter");
const tabs: { id: Tab; label: string; count: number }[] = [
{ id: "notes", label: "Notes", count: notes.length },
{ id: "letters", label: "Letters", count: letters.length },
{ id: "replies", label: "Replies", count: replies.length },
{ id: "followers", label: "Followers", count: followers.length },
{ id: "following", label: "Following", count: following.length },
];

const inputClass =
"w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30";

function PostList({ items }: { items: PostRow[] }) {
if (items.length === 0) {
return (
<p className="rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-white/65">
{isOwnProfile
? "You haven't posted here yet. Share something with the community."
: "Nothing here yet."}
</p>
);
}
return (
<div className="space-y-3">
{items.map((post) => (
<article
key={post.id}
className="rounded-2xl border border-white/10 bg-white/5 p-4"
>
<div className="flex items-center justify-between gap-3">
<span className="rounded-full bg-blue-200/10 px-2.5 py-1 text-xs font-semibold text-blue-100">
{post.category}
</span>
<time
dateTime={post.created_at}
className="text-xs text-white/55"
>
{new Date(post.created_at).toLocaleDateString()}
</time>
</div>
{post.kind === "letter" ? (
<Link
href={`/letter/${post.id}`}
className="mt-3 block text-base font-bold hover:underline"
>
{post.title ||
`A letter from ${profile ? displayName(profile) : "this author"}`}
</Link>
) : (
<p className="mt-3 whitespace-pre-wrap wrap-break-word text-[15px] leading-6 text-white/90">
{post.content}
</p>
)}
<div className="mt-3 flex items-center gap-2">
<Link
href={`/reply/${post.id}`}
className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-blue-200 transition hover:bg-white/10"
>
<MessageCircle aria-hidden="true" className="h-4 w-4" />
Replies
</Link>
{isOwnProfile && (
<button
type="button"
onClick={() => void deletePost(post.id)}
className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
>
<Trash2 aria-hidden="true" className="h-4 w-4" />
Delete
</button>
)}
</div>
</article>
))}
</div>
);
}

function PeopleList({ people, empty }: { people: ProfileRow[]; empty: string }) {
if (people.length === 0) {
return (
<p className="rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-white/65">
{empty}
</p>
);
}
return (
<ul className="grid gap-3 sm:grid-cols-2">
{people.map((person) => (
<li key={person.id}>
<Link
href={`/profile/${person.id}`}
className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-blue-300 hover:bg-white/10"
>
<Avatar name={displayName(person)} />
<span className="min-w-0">
<span className="block truncate text-sm font-bold">
{displayName(person)}
</span>
{person.bio && (
<span className="block truncate text-xs text-white/65">
{person.bio}
</span>
)}
</span>
</Link>
</li>
))}
</ul>
);
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
Loading profile...
</p>
) : errorMessage ? (
<p
role="alert"
className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
>
{errorMessage}
</p>
) : profile ? (
<>
<section className="rounded-2xl border border-white/15 bg-white/5 p-5 sm:p-7">
<div className="flex flex-wrap items-start gap-4">
<Avatar
name={displayName(profile)}
size="h-20 w-20 text-3xl"
/>
<div className="min-w-0 flex-1">
<h1 className="text-2xl font-extrabold">
{displayName(profile)}
</h1>
{profile.bio && (
<p className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-white/85">
{profile.bio}
</p>
)}
<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/65">
{profile.location && (
<span className="inline-flex items-center gap-1.5">
  <MapPin aria-hidden="true" className="h-4 w-4" />
  {profile.location}
</span>
)}
{profile.website && /^https?:\/\//i.test(profile.website) && (
<a
  href={profile.website}
  target="_blank"
  rel="noopener noreferrer nofollow"
  className="inline-flex items-center gap-1.5 text-blue-200 hover:underline"
>
  <LinkIcon aria-hidden="true" className="h-4 w-4" />
  {profile.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
</a>
)}
{profile.created_at && (
<span className="inline-flex items-center gap-1.5">
  <CalendarDays aria-hidden="true" className="h-4 w-4" />
  Joined{" "}
  {new Date(profile.created_at).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  )}
</span>
)}
</div>
</div>

{isOwnProfile ? (
!isEditing && (
<button
type="button"
onClick={startEditing}
className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-sm font-bold transition hover:bg-white/10"
>
<Pencil aria-hidden="true" className="h-4 w-4" />
Edit profile
</button>
)
) : (
<button
type="button"
onClick={() => void toggleFollow()}
disabled={followBusy}
aria-pressed={isFollowing}
className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
isFollowing
  ? "border border-white/30 text-white hover:bg-white/10"
  : "bg-blue-500 text-white hover:bg-blue-400"
}`}
>
{isFollowing ? (
<UserCheck aria-hidden="true" className="h-4 w-4" />
) : (
<UserPlus aria-hidden="true" className="h-4 w-4" />
)}
{isFollowing ? "Following" : "Follow"}
</button>
)}
</div>

<dl className="mt-5 flex flex-wrap gap-6 border-t border-white/10 pt-4 text-sm">
<button type="button" onClick={() => setTab("followers")} className="text-left">
<dt className="text-white/60">Followers</dt>
<dd className="text-lg font-bold">{followers.length}</dd>
</button>
<button type="button" onClick={() => setTab("following")} className="text-left">
<dt className="text-white/60">Following</dt>
<dd className="text-lg font-bold">{following.length}</dd>
</button>
<div>
<dt className="text-white/60">Posts</dt>
<dd className="text-lg font-bold">{posts.length}</dd>
</div>
<div>
<dt className="text-white/60">Replies</dt>
<dd className="text-lg font-bold">{replies.length}</dd>
</div>
</dl>

{isEditing && (
<form onSubmit={saveProfile} className="mt-5 space-y-4 border-t border-white/10 pt-5">
<div className="grid gap-4 sm:grid-cols-2">
<div>
<label htmlFor="edit-first" className="mb-1.5 block text-sm font-semibold">
  First name
</label>
<input
  id="edit-first"
  className={inputClass}
  value={form.first_name}
  maxLength={50}
  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
/>
</div>
<div>
<label htmlFor="edit-last" className="mb-1.5 block text-sm font-semibold">
  Last name
</label>
<input
  id="edit-last"
  className={inputClass}
  value={form.last_name}
  maxLength={50}
  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
/>
</div>
</div>
<div>
<label htmlFor="edit-bio" className="mb-1.5 block text-sm font-semibold">
Bio
</label>
<textarea
id="edit-bio"
rows={3}
className={`${inputClass} resize-y`}
value={form.bio}
maxLength={160}
placeholder="A line or two about you"
onChange={(e) => setForm({ ...form, bio: e.target.value })}
/>
<p className="mt-1 text-right text-xs text-white/60">
{form.bio.length}/160
</p>
</div>
<div className="grid gap-4 sm:grid-cols-2">
<div>
<label htmlFor="edit-location" className="mb-1.5 block text-sm font-semibold">
  Location
</label>
<input
  id="edit-location"
  className={inputClass}
  value={form.location}
  maxLength={60}
  onChange={(e) => setForm({ ...form, location: e.target.value })}
/>
</div>
<div>
<label htmlFor="edit-website" className="mb-1.5 block text-sm font-semibold">
  Website
</label>
<input
  id="edit-website"
  className={inputClass}
  value={form.website}
  maxLength={120}
  placeholder="example.com"
  onChange={(e) => setForm({ ...form, website: e.target.value })}
/>
</div>
</div>
<div className="flex gap-3">
<button
type="submit"
disabled={isSaving}
className="rounded-full bg-blue-500 px-5 py-2.5 text-sm font-bold transition hover:bg-blue-400 disabled:opacity-50"
>
{isSaving ? "Saving..." : "Save changes"}
</button>
<button
type="button"
onClick={() => setIsEditing(false)}
className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-bold transition hover:bg-white/10"
>
Cancel
</button>
</div>
</form>
)}

{actionError && (
<p role="alert" className="mt-4 text-sm text-red-200">
{actionError}
</p>
)}
</section>

<div
role="tablist"
aria-label="Profile sections"
className="mt-6 flex gap-1 overflow-x-auto border-b border-white/10 pb-px"
>
{tabs.map((item) => (
<button
key={item.id}
type="button"
role="tab"
aria-selected={tab === item.id}
onClick={() => setTab(item.id)}
className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
tab === item.id
? "border-blue-300 text-white"
: "border-transparent text-white/60 hover:text-white"
}`}
>
{item.label}{" "}
<span className="text-white/50">{item.count}</span>
</button>
))}
</div>

<div role="tabpanel" className="mt-5">
{tab === "notes" && <PostList items={notes} />}
{tab === "letters" && <PostList items={letters} />}
{tab === "replies" &&
(replies.length === 0 ? (
<p className="rounded-xl border border-dashed border-white/20 p-6 text-center text-sm text-white/65">
No replies yet.
</p>
) : (
<div className="space-y-3">
{replies.map((reply) => (
<article
  key={reply.id}
  className="rounded-2xl border border-white/10 bg-white/5 p-4"
>
  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-white/85">
    {reply.content}
  </p>
  <div className="mt-3 flex items-center gap-3 text-xs text-white/55">
    <time dateTime={reply.created_at}>
      {new Date(reply.created_at).toLocaleString()}
    </time>
    <Link
      href={`/reply/${reply.note_id}`}
      className="font-semibold text-blue-200 hover:underline"
    >
      View conversation
    </Link>
    {isOwnProfile && (
      <button
        type="button"
        onClick={() => void deleteReply(reply.id)}
        className="ml-auto inline-flex items-center gap-1.5 font-semibold text-red-300 hover:text-red-200"
      >
        <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
        Delete
      </button>
    )}
  </div>
</article>
))}
</div>
))}
{tab === "followers" && (
<PeopleList
people={followers}
empty={isOwnProfile ? "No followers yet." : "No followers yet. Be the first."}
/>
)}
{tab === "following" && (
<PeopleList people={following} empty="Not following anyone yet." />
)}
</div>
</>
) : null}
</div>
</main>
<Footer />
</>
);
}