'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from '../utils/supabase/client'

type Profile = {
first_name: string | null
last_name: string | null
}

export function useAuth() {
const supabase = getSupabaseBrowserClient()
const [user, setUser] = useState<User | null>(null)
const [profile, setProfile] = useState<Profile | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<Error | null>(null)

useEffect(() => {
let active = true

async function load(u: User | null) {
if (!active) return
setUser(u)
setError(null)
if (!u) {
setProfile(null)
setLoading(false)
return
}

try {
const { data, error: profileError } = await supabase
.from('profiles')
.select('first_name, last_name')
.eq('id', u.id)
.maybeSingle()

if (profileError) throw profileError
if (active) setProfile(data)
} catch (cause) {
if (active) {
setProfile(null)
setError(
cause instanceof Error
? cause
: new Error('Unable to load the signed-in user profile.')
)
}
} finally {
if (active) {
setLoading(false)
}
}
}

supabase.auth
.getUser()
.then(({ data, error: authError }) => {
if (authError) throw authError
return load(data.user)
})
.catch((cause: unknown) => {
if (active) {
setError(
cause instanceof Error
? cause
: new Error('Unable to check the current authentication state.')
)
setLoading(false)
}
})
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
void load(session?.user ?? null)
})

return () => {
active = false
subscription.unsubscribe()
}
}, [supabase])



return { supabase, user, profile, loading, error,  }
}