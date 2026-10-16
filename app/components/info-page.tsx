import type { ReactNode } from "react";

type InfoPageProps = {
  title: string;
  description: string;
  children: ReactNode;
  draft?: boolean;
};

export default function InfoPage({
  title,
  description,
  children,
  draft = false,
}: InfoPageProps) {
  return (
    <main className="flex-1 bg-slate-50 px-5 py-12 sm:px-8 sm:py-16">
      <article className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        {draft && (
          <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
            Starter draft: this page needs review and completion before public
            launch.
          </p>
        )}
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Hypercell Social
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            {description}
          </p>
        </header>
        <div className="prose prose-slate mt-8 max-w-none space-y-7 text-sm leading-7 text-slate-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-blue-950 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </main>
  );
}
