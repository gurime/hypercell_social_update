"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import Footer from "@/app/components/footer";
import Navbar from "@/app/components/navbar";
import { useAuth } from "@/app/hooks/useAuth";

const categories = [
  "Politics",
  "Tech",
  "Gaming",
  "Fashion",
  "Faith",
  "LGBTQ+",
  "Sports",
  "Entertainment",
  "Science",
  "Books",
  "Food",
  "Local",
] as const;

type NoteKind = "note" | "letter";

export default function CreateNotePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-blue-950 p-8 text-center text-white">
          Loading editor...
        </main>
      }
    >
      <CreateNoteForm />
    </Suspense>
  );
}

function CreateNoteForm() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { supabase, user, profile, loading } = useAuth();
  const kind: NoteKind = params.id === "letter" ? "letter" : "note";
  const [category, setCategory] = useState<(typeof categories)[number]>("Tech");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const characterLimit = kind === "note" ? 255 : 400;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanContent = content.trim();
    const cleanTitle = title.trim();

    if (!cleanContent || cleanContent.length > characterLimit) return;
    if (!user) {
      router.push(
        `/login?tab=signin&redirect=${encodeURIComponent(`/createnote/${kind}`)}`,
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
    setErrorMessage("");
    try {
      const { error } = await supabase.from("notes").insert({
        author_id: user.id,
        author_name: authorName,
        category,
        kind,
        title: kind === "letter" && cleanTitle ? cleanTitle : null,
        content: cleanContent,
      });
      if (error) throw error;

      router.push("/");
      router.refresh();
    } catch (cause: unknown) {
      console.error(`Failed to share ${kind}.`, cause);
      setErrorMessage(
        cause instanceof Error
          ? `Your ${kind} could not be shared. ${cause.message}`
          : `Your ${kind} could not be shared. Please try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex-1 bg-blue-950 px-4 py-8 text-white sm:px-6">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-200 transition hover:text-white"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Back to community
          </button>

          <header className="mb-6">
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-300">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              Connect. Share. Belong.
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {kind === "note" ? "Share a note" : "Write a letter"}
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/75">
              {kind === "note"
                ? "Share a quick thought with your community."
                : "Write something meaningful and let readers open your full letter."}
            </p>
          </header>

          <section className="rounded-2xl border border-white/15 bg-white/5 p-5 shadow-lg sm:p-7">
            <div
              role="group"
              aria-label="Choose a post type"
              className="mb-6 inline-flex rounded-full bg-white/10 p-1"
            >
              {(["note", "letter"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => router.replace(`/createnote/${option}`)}
                  aria-pressed={kind === option}
                  className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                    kind === option
                      ? "bg-white text-blue-950 shadow"
                      : "text-white/75 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                {errorMessage}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="create-category"
                  className="mb-2 block text-sm font-semibold"
                >
                  Community
                </label>
                <select
                  id="create-category"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as (typeof categories)[number])
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {kind === "letter" && (
                <div>
                  <label
                    htmlFor="letter-title"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Title <span className="font-normal text-white/60">(optional)</span>
                  </label>
                  <input
                    id="letter-title"
                    type="text"
                    value={title}
                    maxLength={120}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give your letter a title"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="create-content"
                  className="mb-2 block text-sm font-semibold"
                >
                  {kind === "note" ? "Your note" : "Your letter"}
                </label>
                <textarea
                  id="create-content"
                  value={content}
                  maxLength={characterLimit}
                  onChange={(event) => setContent(event.target.value)}
                  rows={kind === "note" ? 5 : 10}
                  placeholder={
                    kind === "note"
                      ? "What’s on your mind?"
                      : "Write a little more about what matters to you..."
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30"
                />
                <p className="mt-2 text-right text-xs text-white/65" aria-live="polite">
                  {content.length}/{characterLimit} characters
                </p>
              </div>

              {!loading && !user && (
                <p className="text-sm text-amber-200">
                  You’ll need to sign in before you can share.
                </p>
              )}
              <button
                type="submit"
                disabled={!content.trim() || isSubmitting || (loading && !user)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Send aria-hidden="true" className="h-4 w-4" />
                {isSubmitting
                  ? "Sharing..."
                  : user
                    ? `Share ${kind}`
                    : "Sign in to share"}
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
