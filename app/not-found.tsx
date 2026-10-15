'use client'
import { useRouter } from 'next/navigation'

  
export default function NotFound() {
const router = useRouter()
return (
<div className="min-h-screen bg-linear-to-br from-slate-800 via-slate-700 to-slate-900 flex items-center justify-center px-4">
<div className="text-center space-y-6 max-w-2xl">
{/* 404 Number with gradient */}
<div className="relative">
<h1 className="text-9xl font-bold text-transparent bg-clip-text bg-linear-to-r from-red-400 to-red-600 tracking-wider animate-pulse">
404
</h1>
<div className="absolute inset-0 blur-2xl opacity-30 bg-linear-to-r from-red-400 to-red-600"></div>
</div>
        
{/* Page Not Found */}
<h2 className="text-3xl font-semibold text-white capitalize tracking-wide">
Page Not Found
</h2>
        
{/* Description */}
<p className="text-gray-300 text-lg leading-relaxed tracking-wide max-w-md mx-auto">
Oops... The link you clicked may be broken or the page may have been removed.
</p>
        
{/* Button */}
<div className="pt-4">
<button
onClick={() => router.back()}
className="group inline-flex items-center gap-2 px-8 py-3 text-lg font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer"
>
<span className="transition-transform group-hover:-translate-x-1">←</span>
<span className="capitalize cursor-pointer">Go Back</span>
</button>
</div>
        
{/* Optional: Home link */}
<div className="pt-2">
<button
onClick={() => router.push('/')}
className="text-gray-400 hover:text-white text-sm underline underline-offset-4 transition-colors duration-200 cursor-pointer"
>
Or return to homepage
</button>
</div>
</div>
</div>
)
}