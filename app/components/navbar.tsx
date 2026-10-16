"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { Bell, Bookmark, CircleHelp, FileText, Megaphone, Pencil, Search, Settings, UserRound,Shield, LogOut } from "lucide-react";
function getAccountName(
user: ReturnType<typeof useAuth>["user"],
profile: ReturnType<typeof useAuth>["profile"],
) {
const profileName = [profile?.first_name, profile?.last_name]
.filter(Boolean)
.join(" ");
if (profileName) return profileName;

const metadata = user?.user_metadata;
const metadataFullName =
typeof metadata?.full_name === "string" ? metadata.full_name.trim() : "";
if (metadataFullName) return metadataFullName;

const metadataName = [metadata?.first_name, metadata?.last_name]
.filter((name): name is string => typeof name === "string" && Boolean(name.trim()))
.join(" ");
if (metadataName) return metadataName;

return user?.email?.split("@")[0] || "My account";
}

export default function Navbar() {
const router = useRouter();
const [open, setOpen] = useState(false);
const [searchOpen, setSearchOpen] = useState(false);
const menuRef = useRef<HTMLDivElement>(null);
const { supabase, user, profile, loading, error } = useAuth();
const accountName = getAccountName(user, profile);

useEffect(() => {
if (!open) return;
const onClick = (e: MouseEvent) => {
if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
};
const onKey = (e: KeyboardEvent) => {
if (e.key === "Escape") setOpen(false);
};
document.addEventListener("mousedown", onClick);
document.addEventListener("keydown", onKey);
return () => {
document.removeEventListener("mousedown", onClick);
document.removeEventListener("keydown", onKey);
};
}, [open]);


async function handleLogout() {
try {
const { error: signOutError } = await supabase.auth.signOut();
if (signOutError) throw signOutError;
setOpen(false);
router.push("/");
router.refresh();
} catch (cause: unknown) {
console.error("Failed to log out.", cause);
toast.error("Failed to log out. Please try again.");
}
}

const menuGroups = [
[
{ href: "/profile", label: "Profile", icon: UserRound },
{ href: "/account", label: "My account", icon: UserRound },
{ href: "/settings", label: "Settings", icon: Settings },
],
[
{ href: "/my-posts", label: "My posts", icon: FileText },
{ href: "/saved", label: "Saved", icon: Bookmark },
],
[
{ href: "/help", label: "Help center", icon: CircleHelp },
{ href: "/terms", label: "Terms & Privacy", icon: Shield },
{
href: "/advertise",
label: "Advertise on Hypercell Social",
icon: Megaphone,
},
],
];

return (
<>
<Toaster position="top-center" />
<nav className="sticky top-0 z-50 w-full bg-blue-950 text-white shadow-md">
<div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4">
<Link href="/" aria-label="Hypercell Social home" className="shrink-0">
<Image
src="/images/hypercell_social.png"
alt="Hypercell Social"
width={150}
height={50}
className="h-auto w-28 sm:w-37.5"
/>
</Link>

{/* Desktop search */}
<input
type="search"
aria-label="Search Hypercell Social"
placeholder="Search Hypercell Social"
className="hidden w-1/3 rounded-full border border-gray-300 bg-white px-4 py-2 text-black outline-blue-500 placeholder:text-gray-500 md:block"
/>

<div ref={menuRef} className="relative flex items-center gap-1 sm:gap-3">
{/* Mobile search toggle */}
<button
type="button"
onClick={() => setSearchOpen((s) => !s)}
aria-label="Search"
aria-expanded={searchOpen}
className="rounded-full p-2 hover:text-blue-300 md:hidden"
>
<Search className="h-6 w-6" />
</button>

{loading ? (
<div
className="h-10 w-10 animate-pulse rounded-full bg-blue-800 sm:w-28"
aria-label="Loading account"
role="status"
/>
) : user ? (
<>
<button type="button" aria-label="Notifications" className="rounded-full p-2 hover:text-blue-300">
<Bell className="h-6 w-6" />
</button>

<button
type="button"
onClick={() => router.push("/create-post")}
aria-label="Create post"
className="flex items-center  rounded-full p-2 bg-blue-400  hover:text-white hover:bg-blue-500 cursor-pointer"
>
<Pencil className="h-6 w-6" />
</button>

<button
type="button"
onClick={() => setOpen((isOpen) => !isOpen)}
aria-expanded={open}
aria-controls="account-menu"
aria-label={`Account menu for ${accountName}`}
className="flex h-10 items-center rounded-full bg-blue-600 text-sm font-semibold hover:bg-blue-500 sm:max-w-48 sm:px-4"
>
{/* initial on mobile, full name on sm+ */}
<span className="flex h-10 w-10 items-center justify-center sm:hidden cursor-pointer">
{accountName.charAt(0).toUpperCase()}
</span>
<span className="hidden truncate sm:inline cursor-pointer">{accountName}</span>
</button>

{open && (
<div
id="account-menu"
className="absolute right-0 top-full z-20 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded border border-slate-200 bg-blue-950 py-1 text-white shadow-lg"
>
{menuGroups.map((group, i) => (
<div key={i} className={i > 0 ? "border-t border-slate-200" : ""}>
{group.map((item) => {
const Icon = item.icon;

return (
<Link
key={item.href}
href={item.href}
onClick={() => setOpen(false)}
className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-blue-900"
>
<Icon className="h-4 w-4 shrink-0 text-blue-300" />
<span>{item.label}</span>
</Link>
);
})}
</div>
))}

{error && (
<p role="status" className="border-t border-slate-200 px-4 py-2 text-xs text-amber-300">
Profile details could not be loaded. Showing your account name instead.
</p>
)}

<button
type="button"
onClick={handleLogout}
className="flex w-full items-center gap-3 border-t border-slate-200 px-4 py-3 text-left text-sm hover:bg-blue-900 cursor-pointer"
>
<LogOut className="h-4 w-4 shrink-0" />
<span>Log out</span>
</button>
</div>
)}
</>
) : (
<div className="flex gap-2">
<button
type="button"
className="whitespace-nowrap rounded-full border-2 border-blue-900 bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 sm:px-4"
onClick={() => router.push("/login?tab=signin")}
>
Sign in
</button>
<button
type="button"
className="whitespace-nowrap rounded-full border-2 border-green-600 bg-green-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 sm:px-4"
onClick={() => router.push("/login?tab=signup")}
>
Sign up
</button>
</div>
)}
</div>
</div>

{/* Mobile search row */}
{searchOpen && (
<div className="px-3 pb-2 md:hidden">
<input
type="search"
autoFocus
aria-label="Search Hypercell Social"
placeholder="Search Hypercell Social"
className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-black outline-blue-500 placeholder:text-gray-500"
/>
</div>
)}
</nav>
</>
);
}
