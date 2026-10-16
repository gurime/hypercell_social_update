'use client';

import { useEffect, useState } from 'react';

import Footer from '@/app/components/footer';
import Navbar from '@/app/components/navbar';
import { useRouter } from 'next/navigation';
;
export default function page() {
    const [loading, setLoading] = useState(true);
const router = useRouter();

return (
<div>
<Navbar />
<div>page</div>
<Footer />
</div>
)
}
