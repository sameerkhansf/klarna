'use client'

import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const MissedPayoutPage = () => {
  const user = useUser()
  const supabaseClient = useSupabaseClient()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<any>({})
  const [estimatedPayout, setEstimatedPayout] = useState<number | null>(null)

  const questions = [
    {
      id: 'q1',
      question: 'Have you purchased any electronic devices (e.g., smartphones, laptops) between 2018 and 2023?',
      type: 'boolean',
    },
    {
      id: 'q2',
      question: 'Approximately how many such devices did you purchase?',
      type: 'number',
      dependsOn: { q1: true },
    },
    {
      id: 'q3',
      question: 'Do you have proof of purchase (e.g., receipts, order confirmations)?',
      type: 'boolean',
      dependsOn: { q1: true },
    },
  ]

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers({ ...answers, [questionId]: answer })
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculatePayout()
    }
  }

  const calculatePayout = () => {
    let payout = 0
    if (answers.q1) {
      const numDevices = answers.q2 || 0
      if (answers.q3) {
        payout = numDevices * 50 // Example: $50 per device with proof
      } else {
        payout = numDevices * 10 // Example: $10 per device without proof
      }
    }
    setEstimatedPayout(payout)
  }

  const renderQuestion = () => {
    const question = questions[currentQuestion]
    if (!question) return null

    // Check if the question depends on a previous answer and if that condition is met
    if (question.dependsOn) {
      const dependencyMet = Object.entries(question.dependsOn).every(([depId, depValue]) => {
        return answers[depId] === depValue
      })
      if (!dependencyMet) {
        // If dependency not met, skip this question and go to the next or calculate payout
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1)
          return renderQuestion() // Recursively render the next question
        } else {
          calculatePayout()
          return null
        }
      }
    }

    switch (question.type) {
      case 'boolean':
        return (
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleAnswer(question.id, true)}
              className={`btn-primary ${answers[question.id] === true ? 'bg-brand-blue' : 'bg-gray-300 text-gray-700'}`}
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer(question.id, false)}
              className={`btn-primary ${answers[question.id] === false ? 'bg-brand-blue' : 'bg-gray-300 text-gray-700'}`}
            >
              No
            </button>
          </div>
        )
      case 'number':
        return (
          <input
            type="number"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswer(question.id, parseInt(e.target.value) || 0)}
            className="py-3 px-4 block w-full shadow-sm focus:ring-brand-blue focus:border-brand-blue border-gray-300 rounded-md text-center"
            min="0"
          />
        )
      default:
        return null
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
            <h2 className="text-3xl font-extrabold text-brand-black mb-4">Estimate Your Missed Payout</h2>
            <p className="text-gray-600 mb-8">Answer a few questions to see how much you might be owed.</p>

            {!estimatedPayout ? (
              <div className="space-y-6">
                <p className="text-xl font-semibold text-gray-800">{questions[currentQuestion]?.question}</p>
                {renderQuestion()}
                <button
                  onClick={nextQuestion}
                  className="btn-primary mt-6"
                  disabled={answers[questions[currentQuestion]?.id] === undefined}
                >
                  {currentQuestion === questions.length - 1 ? 'Calculate Payout' : 'Next'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-2xl font-bold text-brand-black">Your Estimated Missed Payout:</p>
                <p className="text-6xl font-extrabold text-brand-yellow">${estimatedPayout}</p>
                <button
                  onClick={() => {
                    setEstimatedPayout(null)
                    setCurrentQuestion(0)
                    setAnswers({})
                  }}
                  className="btn-primary mt-6"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default MissedPayoutPage
