'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const user = useUser()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/settlements')
    } else {
      router.push('/login')
    }
  }, [user, router])

  return null
}
