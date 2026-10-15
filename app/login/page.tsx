    import { Suspense, useEffect, useState } from "react";
    import { useRouter, useSearchParams } from "next/navigation";
    import Link from "next/link";
    import toast, { Toaster } from "react-hot-toast";
    import { getSupabaseBrowserClient } from "../utils/supabase/client";
export default function page() {
  return (
    <div>page</div>
  )
}
