"use client";

import {  Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { getSupabaseBrowserClient } from "../utils/supabase/client";
import Footer from "../components/footer";
import Image from "next/image";

const inputClassName =
"w-full rounded border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20";

function getSafeRedirect(value: string | null) {
if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
return "/";
}

try {
const destination = new URL(value, "https://hypercellsocial.invalid");
return destination.origin === "https://hypercellsocial.invalid"
? `${destination.pathname}${destination.search}${destination.hash}`
: "/";
} catch {
return "/";
}
}

export function Login() {
const router = useRouter();
const searchParams = useSearchParams();
const redirectTo = getSafeRedirect(searchParams.get("redirect") ?? "/");
const [isLoginMode, setIsLoginMode] = useState(
searchParams.get("tab") !== "signup"
);
const [initialLoading, setInitialLoading] = useState(true);
const [loading, setLoading] = useState(false);
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [error, setError] = useState("");
const [notice, setNotice] = useState("");

useEffect(() => {
let active = true;

async function checkUser() {
try {
const { data, error: sessionError } =
await getSupabaseBrowserClient().auth.getSession();
if (sessionError) throw sessionError;

if (!active) return;
if (data.session) {
router.replace(redirectTo);
} else {
setInitialLoading(false);
}
} catch (cause: unknown) {
if (!active) return;
setError(
cause instanceof Error
? cause.message
: "Unable to check your account. Please try again."
);
setInitialLoading(false);
}
}

void checkUser();
return () => {
active = false;
};
}, [redirectTo, router]);

function clearMessages() {
setError("");
setNotice("");
}

async function handleLogin(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
setLoading(true);
clearMessages();

try {
const { error: signInError } =
await getSupabaseBrowserClient().auth.signInWithPassword({
email,
password,
});
if (signInError) throw signInError;

toast.success("Welcome back.");
router.refresh();
router.replace(redirectTo);
} catch (cause: unknown) {
setError(
cause instanceof Error
? cause.message
: "Unable to sign in. Please try again."
);
} finally {
setLoading(false);
}
}

async function handleSignup(event: FormEvent<HTMLFormElement>) {
event.preventDefault();
setLoading(true);
clearMessages();

if (password !== confirmPassword) {
setError("Passwords do not match.");
setLoading(false);
return;
}

if (password.length < 6) {
setError("Your password must be at least 6 characters.");
setLoading(false);
return;
}

try {
const { data, error: signUpError } =
await getSupabaseBrowserClient().auth.signUp({
email,
password,
options: {
data: { first_name: firstName.trim(), last_name: lastName.trim() },
emailRedirectTo: `${window.location.origin}/login`,
},
});
if (signUpError) throw signUpError;

setFirstName("");
setLastName("");
setPassword("");
setConfirmPassword("");

if (data.session) {
toast.success("Your account is ready.");
router.refresh();
router.replace(redirectTo);
} else {
setNotice("Your account has been created. Check your email to confirm your address.");
setIsLoginMode(true);
}
} catch (cause: unknown) {
setError(
cause instanceof Error
? cause.message
: "Unable to create your account. Please try again."
);
} finally {
setLoading(false);
}
}

return (
<>
<main className="relative isolate flex-1 overflow-hidden bg-blue-950">
<Toaster position="top-center" />
<div
aria-hidden="true"
className="pointer-events-none absolute -right-40 -top-40 -z-10 h-96 w-96 rounded-full border border-blue-200/70"
/>
<div className="mx-auto grid min-h-155 max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_0.86fr] lg:gap-16 lg:py-20">
<section className="relative overflow-hidden rounded-lg bg-blue-900 px-7 py-9 text-white shadow-xl shadow-blue-950/10 sm:px-10 sm:py-12 lg:min-h-117.5 lg:px-12 lg:py-14">
<div
aria-hidden="true"
className="absolute -bottom-20 -right-16 h-72 w-72 rounded-full border border-white/10"
/>
<div
aria-hidden="true"
className="absolute -bottom-8 -right-4 h-48 w-48 rounded-full border border-white/10"
/>
<div className="relative flex h-full flex-col justify-between gap-12">
<Link
href="/"
className="w-fit text-xs font-semibold uppercase tracking-[0.2em] text-green-300 transition hover:text-white"
>
<Image
src="/images/hypercell_social.png"
alt="Hypercell Social"
width={150}
height={50}
className="h-12 w-auto object-contain"
/>
</Link>
<div className="max-w-lg">
<p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-green-300">
Your community, closer
</p>
<h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
Find your people. Share your world.
</h1>
<p className="mt-5 max-w-md text-sm leading-6 text-white/70 sm:text-base">
Sign in or create an account to connect with your community and keep up
with what matters to you.
</p>
</div>
<Link
href="/"
className="w-fit text-sm text-white/70 transition hover:text-white"
>
<span aria-hidden="true">←</span> Back to home
</Link>
</div>
</section>

<section
aria-labelledby="account-title"
className="mx-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(30,58,138,0.10)] sm:p-9"
>
<div className="mb-7">
<p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
Your account
</p>
<h2
id="account-title"
className="mt-2 font-serif text-3xl text-blue-950"
>
{isLoginMode ? "Welcome back" : "Create your account"}
</h2>
<p className="mt-2 text-sm leading-6 text-slate-600">
{isLoginMode
? "Sign in to pick up where you left off."
: "A few details will get you started."}
</p>
</div>

<div
className="mb-6 grid grid-cols-2 gap-1 rounded bg-slate-100 p-1"
role="tablist"
aria-label="Choose sign-in or sign-up"
>
<button
type="button"
role="tab"
aria-selected={isLoginMode}
onClick={() => {
setIsLoginMode(true);
clearMessages();
}}
className={`rounded px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
isLoginMode
? "bg-white text-blue-950 shadow-sm"
: "text-slate-600 hover:text-blue-950"
}`}
>
Sign in
</button>
<button
type="button"
role="tab"
aria-selected={!isLoginMode}
onClick={() => {
setIsLoginMode(false);
clearMessages();
}}
className={`rounded px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
!isLoginMode
? "bg-white text-blue-950 shadow-sm"
: "text-slate-600 hover:text-blue-950"
}`}
>
Create account
</button>
</div>

{initialLoading ? (
<div className="space-y-4" aria-label="Checking your account" role="status">
<div className="h-11 animate-pulse rounded bg-slate-100" />
<div className="h-11 animate-pulse rounded bg-slate-100" />
<div className="h-12 animate-pulse rounded bg-slate-200" />
</div>
) : (
<>
{error && (
<p
className="mb-5 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800"
role="alert"
>
{error}
</p>
)}
{notice && (
<p
className="mb-5 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-800"
role="status"
>
{notice}
</p>
)}

<form
onSubmit={isLoginMode ? handleLogin : handleSignup}
className="space-y-4"
>
{!isLoginMode && (
<div className="grid gap-4 sm:grid-cols-2">
<div>
<label
htmlFor="first-name"
className="mb-1.5 block text-sm font-medium text-slate-700"
>
First name
</label>
<input
id="first-name"
type="text"
name="given-name"
autoComplete="given-name"
value={firstName}
onChange={(event) => setFirstName(event.target.value)}
onFocus={clearMessages}
className={inputClassName}
placeholder="First name"
required
/>
</div>
<div>
<label
htmlFor="last-name"
className="mb-1.5 block text-sm font-medium text-slate-700"
>
Last name
</label>
<input
id="last-name"
type="text"
name="family-name"
autoComplete="family-name"
value={lastName}
onChange={(event) => setLastName(event.target.value)}
onFocus={clearMessages}
className={inputClassName}
placeholder="Last name"
required
/>
</div>
</div>
)}

<div>
<label
htmlFor="email"
className="mb-1.5 block text-sm font-medium text-slate-700"
>
Email address
</label>
<input
id="email"
type="email"
name="email"
autoComplete="email"
value={email}
onChange={(event) => setEmail(event.target.value)}
onFocus={clearMessages}
className={inputClassName}
placeholder="you@example.com"
required
/>
</div>

<div>
<label
htmlFor="password"
className="mb-1.5 block text-sm font-medium text-slate-700"
>
Password
</label>
<input
id="password"
type="password"
name="password"
autoComplete={
isLoginMode ? "current-password" : "new-password"
}
value={password}
onChange={(event) => setPassword(event.target.value)}
className={inputClassName}
placeholder="At least 6 characters"
minLength={isLoginMode ? undefined : 6}
required
/>
</div>

{!isLoginMode && (
<div>
<label
htmlFor="confirm-password"
className="mb-1.5 block text-sm font-medium text-slate-700"
>
Confirm password
</label>
<input
id="confirm-password"
type="password"
name="confirmPassword"
autoComplete="new-password"
value={confirmPassword}
onChange={(event) =>
setConfirmPassword(event.target.value)
}
className={inputClassName}
placeholder="Re-enter your password"
minLength={6}
required
/>
</div>
)}

<button
type="submit"
disabled={loading}
className="mt-2 flex min-h-12 w-full items-center justify-center rounded bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
>
{loading
? isLoginMode
? "Signing in..."
: "Creating account..."
: isLoginMode
? "Sign in"
: "Create account"}
</button>
</form>
</>
)}
</section>
</div>
</main>
<Footer />
</>
);
}

function LoginFallback() {
return (
<main
className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-16"
aria-label="Loading account page"
>
<div className="h-12 w-12 animate-pulse rounded-full bg-blue-300" />
</main>
);
}

export default function LoginPage() {
return (
<Suspense fallback={<LoginFallback />}>
<Login />
</Suspense>
);
}
