"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Reply } from "lucide-react";
import Footer from "@/app/components/footer";
import Navbar from "@/app/components/navbar";
import { getSupabaseBrowserClient } from "@/app/utils/supabase/client";

type Letter = {
  id: string;
  author_id: string;
  author_name: string;
  category: string;
  title: string | null;
  content: string;
  created_at: string;
};

export default function LetterPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-blue-950 p-8 text-center text-white">
          Loading letter...
        </main>
      }
    >
      <LetterContent />
    </Suspense>
  );
}

function LetterContent() {
  const { id } = useParams<{ id: string }>();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLetter() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from("notes")
          .select(
            "id, author_id, author_name, category, kind, title, content, created_at",
          )
          .eq("id", id)
          .eq("kind", "letter")
          .maybeSingle();

        if (!active) return;
        if (error) {
          setErrorMessage(`This letter could not be loaded. ${error.message}`);
        } else if (!data) {
          setErrorMessage("This letter may have been removed or is unavailable.");
        } else {
          setLetter(data as Letter);
        }
      } catch (cause: unknown) {
        if (!active) return;
        setErrorMessage(
          cause instanceof Error
            ? `This letter could not be loaded. ${cause.message}`
            : "This letter could not be loaded. Please try again.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadLetter();
    return () => {
      active = false;
    };
  }, [id]);

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

          {isLoading ? (
            <p role="status" className="rounded-2xl bg-white/10 p-8 text-white/75">
              Loading letter...
            </p>
          ) : errorMessage ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              {errorMessage}
            </p>
          ) : letter ? (
            <article className="rounded-2xl border border-white/15 bg-white/5 p-6 shadow-lg sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                {letter.category} · Community letter
              </p>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl">
                {letter.title || `A letter from ${letter.author_name}`}
              </h1>
              <p className="mt-4 text-sm text-white/65">
                By{" "}
                <Link
                  href={`/profile/${letter.author_id}`}
                  className="font-semibold text-white hover:underline"
                >
                  {letter.author_name}
                </Link>
                {" · "}
                <time dateTime={letter.created_at}>
                  {new Date(letter.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </p>
              <div className="my-7 border-t border-white/15" />
              <p className="whitespace-pre-wrap wrap-break-word text-base leading-8 text-white/90">
                {letter.content}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5">
                <span className="inline-flex items-center gap-2 text-sm text-white/70">
                  <MessageCircle aria-hidden="true" className="h-4 w-4" />
                  Join the conversation
                </span>
                <Link
                  href={`/reply/${letter.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2.5 text-sm font-bold transition hover:bg-blue-400"
                >
                  <Reply aria-hidden="true" className="h-4 w-4" />
                  Reply to this letter
                </Link>
              </div>
            </article>
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
