'use client";'
import Image from "next/image";
import Link from "next/link";
import {
Home,
UserPlus,
Compass,
Users,
CircleHelp,
Flag,
ShieldCheck,
FileText,
SlidersHorizontal,
Accessibility,
Megaphone,
Handshake,
Mail,
} from "lucide-react";

const footerLinkClassName =
"inline-flex items-center gap-2 text-sm text-white/75 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-300";

const footerHeadingClassName =
"flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-green-300";

const exploreLinks = [
{ href: "/", label: "Home", icon: Home },
{
href: "/login?tab=signup",
label: "Create an account",
icon: UserPlus,
},
// Add this link when your discover page exists.
// { href: "/discover", label: "Discover", icon: Compass },
];

const communityLinks = [
{
href: "/community-guidelines",
label: "Community Guidelines",
icon: Users,
},
{ href: "/help", label: "Help & Contact", icon: CircleHelp },
// Add this link when reporting is implemented.
// { href: "/report", label: "Report a Problem", icon: Flag },
];

const legalLinks = [
{ href: "/privacy", label: "Privacy Policy", icon: ShieldCheck },
{ href: "/terms", label: "Terms of Service", icon: FileText },
{
href: "/privacy-choices",
label: "Privacy Choices",
icon: SlidersHorizontal,
},
{
href: "/accessibility",
label: "Accessibility",
icon: Accessibility,
},
];

const businessLinks = [
{ href: "/advertise", label: "Advertise", icon: Megaphone },
// Add these links when the corresponding pages exist.
// { href: "/partnerships", label: "Partnerships", icon: Handshake },
// { href: "/contact", label: "Contact Us", icon: Mail },
];

type FooterLink = {
href: string;
label: string;
icon: React.ComponentType<{ className?: string }>;
};

function FooterLinkList({ links }: { links: FooterLink[] }) {
return (
<ul className="mt-5 space-y-3">
{links.map(({ href, label, icon: Icon }) => (
<li key={href}>
<Link href={href} className={footerLinkClassName}>
<Icon
aria-hidden="true"
className="h-4 w-4 shrink-0 text-green-300/80"
/>
<span>{label}</span>
</Link>
</li>
))}
</ul>
);
}

export default function Footer() {
const CURRENT_YEAR = 2026;


 
return (
<footer className="mt-auto border-t border-white/10 bg-blue-950 text-white">
<div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-5 py-12 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-8">
{/* Brand and description */}
<div className="max-w-sm">
<Link
href="/"
aria-label="Hypercell Social home"
className="inline-flex rounded-md p-2 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-300"
>
<Image
src="/images/hypercell_social.png"
alt="Hypercell Social"
width={150}
height={50}
className="h-12 w-auto object-contain"
priority={false}
/>
</Link>

<p className="mt-4 text-sm leading-6 text-white/65">
A place to connect, share what matters, and stay close to your
community.
</p>

<p className="mt-4 text-sm font-medium text-green-300">
Connect. Share. Belong.
</p>
</div>

{/* Explore */}
<nav aria-label="Explore">
<h2 className={footerHeadingClassName}>
<Compass aria-hidden="true" className="h-4 w-4" />
Explore
</h2>
<FooterLinkList links={exploreLinks} />
</nav>

{/* Community */}
<nav aria-label="Community">
<h2 className={footerHeadingClassName}>
<Users aria-hidden="true" className="h-4 w-4" />
Community
</h2>
<FooterLinkList links={communityLinks} />
</nav>

{/* Legal and business */}
<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:col-span-2 lg:col-span-1 lg:grid-cols-1">
<nav aria-label="Legal and privacy">
<h2 className={footerHeadingClassName}>
<ShieldCheck aria-hidden="true" className="h-4 w-4" />
Legal & Privacy
</h2>
<FooterLinkList links={legalLinks} />
</nav>

<nav aria-label="Business">
<h2 className={footerHeadingClassName}>
<Megaphone aria-hidden="true" className="h-4 w-4" />
Business
</h2>
<FooterLinkList links={businessLinks} />
</nav>
</div>
</div>

{/* Copyright bar */}
<div className="border-t border-white/10">
<div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-white/50 sm:px-8 md:flex-row md:items-center md:justify-between">
   <p>
      &copy; {CURRENT_YEAR} Hypercell Social. All rights reserved.
    </p>
 

<p>Built for connection and community.</p>
</div>
</div>
</footer>
);
}
