'use client'

import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const ClaimPage = () => {
  const user = useUser()
  const supabaseClient = useSupabaseClient()
  const router = useRouter()
  const params = useParams()
  const { slug } = params
  const [mounted, setMounted] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [productQuantity, setProductQuantity] = useState<number | string>('')
  const [store, setStore] = useState('')
  const [purchaseMonth, setPurchaseMonth] = useState('')
  const [hasProof, setHasProof] = useState(false)
  const [paymentPreference, setPaymentPreference] = useState('') // 'paypal', 'venmo', 'bank'
  const [paypalEmail, setPaypalEmail] = useState('')
  const [venmoHandle, setVenmoHandle] = useState('')
  const [bankDetails, setBankDetails] = useState('') // Simplified for now, could be an object
  const [settlement, setSettlement] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    if (user) {
      setFullName(user.user_metadata.full_name || '')
      setEmail(user.email || '')
    }

    const fetchSettlement = async () => {
      const formattedSlug = slug?.toString().replace(/-/g, ' ')
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('title', formattedSlug)
        .single()

      if (error) {
        console.error('Error fetching settlement:', error)
        // Handle error, maybe redirect to settlements page
      } else {
        setSettlement(data)
      }
    }

    if (slug) {
      fetchSettlement()
    }
  }, [user, slug])

  if (!mounted || !settlement) {
    return null
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const claimData = {
      fullName,
      email,
      address,
      productQuantity: hasProof ? productQuantity : null,
      store: hasProof ? store : null,
      purchaseMonth: hasProof ? purchaseMonth : null,
      hasProof,
    }

    const res = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...claimData, settlementTitle: settlement.title }),
    })

    if (res.ok) {
      const { pdfUrl } = await res.json()

      // Store claim in Supabase
      const { data: claimResult, error: claimError } = await supabase
        .from('user_claims')
        .insert({
          user_id: user.id,
          settlement_id: settlement.id,
          data_json: claimData,
          pdf_url: pdfUrl,
          status: 'generated',
        })
        .select()
        .single()

      if (claimError) {
        console.error('Error saving claim:', claimError)
        alert('Failed to save claim data.')
        return
      }

      router.push(`/review-sign?claimId=${claimResult.id}`)
    } else {
      alert('Failed to generate PDF')
    }
  }

  return (
    <div className="min-h-screen bg-brand-light-gray">
      <header className="bg-brand-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-blue">Klara</h1>
          <button
            onClick={async () => {
              await supabaseClient.auth.signOut();
              router.push('/login');
            }}
            className="text-sm font-medium text-gray-600 hover:text-brand-black"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card">
          <div className="p-8">
            <h2 className="text-3xl font-extrabold text-brand-black mb-4">File a Claim for <span className="capitalize">{settlement.title}</span></h2>
            <p className="text-gray-600 mb-8">Fill out the form below to generate your pre-filled claim form.</p>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                  <div className="mt-1">
                    <input type="text" name="full_name" id="full_name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="mt-1">
                    <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Mailing Address</label>
                  <div className="mt-1">
                    <input type="text" name="address" id="address" autoComplete="street-address" value={address} onChange={(e) => setAddress(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="has_proof" className="block text-sm font-medium text-gray-700">Do you have proof of purchase?</label>
                  <div className="mt-1">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={hasProof}
                        onChange={(e) => setHasProof(e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900">{hasProof ? 'Yes, I have proof' : 'No proof'}</span>
                    </label>
                  </div>
                </div>
                {hasProof && (
                  <>
                    <div>
                      <label htmlFor="product_quantity" className="block text-sm font-medium text-gray-700">Product Quantity</label>
                      <div className="mt-1">
                        <input type="number" name="product_quantity" id="product_quantity" value={productQuantity} onChange={(e) => setProductQuantity(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="store" className="block text-sm font-medium text-gray-700">Store of Purchase</label>
                      <div className="mt-1">
                        <input type="text" name="store" id="store" value={store} onChange={(e) => setStore(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="purchase_month" className="block text-sm font-medium text-gray-700">Purchase Month (Approx.)</label>
                      <div className="mt-1">
                        <input type="month" name="purchase_month" id="purchase_month" value={purchaseMonth} onChange={(e) => setPurchaseMonth(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                      </div>
                    </div>
                  </>
                )}
                {settlement.requires_proof && !hasProof && (
                  <div className="sm:col-span-2">
                    <p className="mt-2 text-sm text-red-500">This settlement requires proof of purchase for the full payout. Without proof, your claim may be capped at ${settlement.proof_limit}.</p>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="payment_preference" className="block text-sm font-medium text-gray-700">Payment Preference</label>
                  <div className="mt-1 flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="payment_preference"
                        value="paypal"
                        checked={paymentPreference === 'paypal'}
                        onChange={(e) => setPaymentPreference(e.target.value)}
                      />
                      <span className="ml-2">PayPal</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="payment_preference"
                        value="venmo"
                        checked={paymentPreference === 'venmo'}
                        onChange={(e) => setPaymentPreference(e.target.value)}
                      />
                      <span className="ml-2">Venmo</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        className="form-radio"
                        name="payment_preference"
                        value="bank"
                        checked={paymentPreference === 'bank'}
                        onChange={(e) => setPaymentPreference(e.target.value)}
                      />
                      <span className="ml-2">Bank Account</span>
                    </label>
                  </div>
                </div>

                {paymentPreference === 'paypal' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="paypal_email" className="block text-sm font-medium text-gray-700">PayPal Email</label>
                    <div className="mt-1">
                      <input type="email" name="paypal_email" id="paypal_email" value={paypalEmail} onChange={(e) => setPaypalEmail(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                    </div>
                  </div>
                )}

                {paymentPreference === 'venmo' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="venmo_handle" className="block text-sm font-medium text-gray-700">Venmo Handle</label>
                    <div className="mt-1">
                      <input type="text" name="venmo_handle" id="venmo_handle" value={venmoHandle} onChange={(e) => setVenmoHandle(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                    </div>
                  </div>
                )}

                {paymentPreference === 'bank' && (
                  <div className="sm:col-span-2">
                    <label htmlFor="bank_details" className="block text-sm font-medium text-gray-700">Bank Account Details (Routing & Account Number)</label>
                    <div className="mt-1">
                      <input type="text" name="bank_details" id="bank_details" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md" />
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end">
                <button type="submit" className="btn-primary">
                  Generate Claim Form
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ClaimPage
