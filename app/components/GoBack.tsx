"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Goback() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push("/");
        }
      }}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold text-blue-200 transition-colors hover:text-white"
    >
      <ArrowLeft aria-hidden="true" size={16} />
      Go back
    </button>
  );
}