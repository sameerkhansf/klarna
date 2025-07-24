'use client'

import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const ReviewSignPage = () => {
  const user = useUser()
  const supabaseClient = useSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const claimId = searchParams.get('claimId')
  const [mounted, setMounted] = useState(false)
  const [claim, setClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)

    const fetchClaim = async () => {
      if (!claimId) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('user_claims')
        .select('*, settlements(*)') // Fetch settlement details as well
        .eq('id', claimId)
        .single()

      if (error) {
        console.error('Error fetching claim:', error)
        // Handle error, maybe redirect
      } else {
        setClaim(data)
      }
      setLoading(false)
    }

    fetchClaim()
  }, [claimId])

  if (!mounted || loading) {
    return <div className="min-h-screen bg-brand-light-gray flex items-center justify-center">Loading...</div>
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (!claim) {
    return <div className="min-h-screen bg-brand-light-gray flex items-center justify-center">Claim not found.</div>
  }

  const handleSubmitClaim = async () => {
    const { error } = await supabase
      .from('user_claims')
      .update({ status: 'submitted' })
      .eq('id', claim.id)

    if (error) {
      console.error('Error submitting claim:', error)
      alert('Failed to submit claim.')
    } else {
      alert('Claim submitted successfully!')
      router.push('/settlements') // Redirect after submission
    }
  }

  return (
    <div className="min-h-screen bg-brand-light-gray">
      <header className="bg-brand-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-blue">Klara</h1>
          <button
            onClick={async () => {
              await supabaseClient.auth.signOut()
              router.push('/login')
            }}
            className="text-sm font-medium text-gray-600 hover:text-brand-black"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <div className="p-8 text-center">
            <h2 className="text-3xl font-extrabold text-brand-black mb-4">Review and Sign Your Claim</h2>
            <p className="text-gray-600 mb-8">Your claim form for <span className="font-bold">{claim.settlements.title}</span> has been generated. Please review it and proceed to sign.</p>
            <div className="mt-8">
              {claim.pdf_url && (
                <a
                  href={claim.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-block mb-4"
                >
                  Download Claim Form (PDF)
                </a>
              )}
              <button onClick={handleSubmitClaim} className="btn-primary block w-full">
                Submit Claim
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ReviewSignPage
