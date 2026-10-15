'use client'
import React from 'react'
import Image from "next/image";
import Link from 'next/link'
import { getSupabaseBrowserClient } from '../utils/supabase/client'
import { useAuth } from '../hooks/useAuth'
import { useState, } from 'react';
import {useRouter} from 'next/navigation'
    import toast, { Toaster } from "react-hot-toast";

export default function navbar() {
const router = useRouter();
const [open, setOpen] = useState(false);
const { supabase, user, profile, loading } = useAuth()

const handleLogout = async () => {
try {
await supabase.auth.signOut()
setOpen(false)
router.push('/')
router.refresh()
}catch (err) {
console.error(err);
toast.error("Failed to log out. Please try again.");
}
};

return (
<>
<Toaster position="top-center" />
<nav className="w-full dark:bg-blue-900 text-white shadow-md flex items-center justify-between px-4 py-2">
<Link href="/">
<Image src="/images/hypercell_social.png" alt="Logo" width={150} height={50} />
</Link>
<input type="text" placeholder="Search Hypercell Social" className="px-4 py-2 rounded-full text-black space-x-4 bg-white placeholder:text-white border border-gray-600 outline-blue-500 w-1/3" />
<div className="flex items-center space-x-4">
{loading ? (
<div className="w-16 h-16 bg-blue-500 rounded-full animate-pulse"></div>
) : user ? (
<>
<button onClick={() => setOpen(!open)} className="bg-gray-200 px-4 py-2 rounded">
{profile?.first_name || 'User'}
</button>
{open && (
<div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg">
<Link href="/profile" className="block px-4 py-2 hover:bg-gray-100">Profile</Link>
<button onClick={handleLogout} className="block bg-red-700 w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
</div>
)}
</>
) : (
<div className="flex gap-2 rounded-full p-3">
<button
className="px-4 py-2 text-sm font-semibold text-white bg-blue-500 border-2 border-blue-900 rounded-full hover:bg-blue-800 transition-colors whitespace-nowrap cursor-pointer"
onClick={() => router.push("/login?tab=signin")}
>
Sign in
</button>
<button
className="px-4 py-2 text-sm font-semibold text-white bg-green-600 border-2 border-green-600 rounded-full hover:bg-green-700 transition-colors whitespace-nowrap cursor-pointer"
onClick={() => router.push("/login?tab=signup")}
>
Sign up
</button>
</div>      
)}
</div>
</nav>
</>
)
}
