import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { supabase } from '@/lib/supabaseClient'

export async function GET(req: NextRequest) {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY

  if (!FIRECRAWL_API_KEY) {
    return NextResponse.json({ error: 'FIRECRAWL_API_KEY is not set' }, { status: 500 })
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: 'https://www.openclassactions.com/settlements.php',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Firecrawl API error:', errorData)
      return NextResponse.json({ error: 'Failed to scrape settlements from Firecrawl' }, { status: response.status })
    }

    const data = await response.json()
    const htmlContent = data.data.content // Assuming content holds the scraped HTML

    const $ = cheerio.load(htmlContent)
    const settlements: any[] = []

    $('div.settlement').each((i, el) => {
      const title = $(el).find('h3 a').text().trim()
      const deadline = $(el).find('.deadline').text().trim()
      const payoutText = $(el).find('.payout').text().trim()
      let payout_min: number | null = null
      let payout_max: number | null = null

      const payoutMatch = payoutText.match(/\$(\d+)(?:\s*-\s*\$(\d+))?/)
      if (payoutMatch) {
        payout_min = parseInt(payoutMatch[1], 10)
        if (payoutMatch[2]) {
          payout_max = parseInt(payoutMatch[2], 10)
        } else {
          payout_max = payout_min // If only one number, min and max are the same
        }
      }
      const claimUrl = $(el).find('h3 a').attr('href') || '#'

      // Basic inference for proof requirements
      const requiresProof = $(el).text().toLowerCase().includes('proof required')
      const noProofNeeded = $(el).text().toLowerCase().includes('no proof needed')
      let proofLimit: number | null = null

      if (noProofNeeded) {
        const match = $(el).text().match(/up to \$(\d+)/i)
        if (match && match[1]) {
          proofLimit = parseInt(match[1], 10)
        }
      }

      settlements.push({
        title,
        deadline,
        payout_min,
        payout_max,
        claim_url: claimUrl,
        requires_proof: requiresProof,
        proof_limit: proofLimit,
        form_type: 'pdf', // Defaulting to PDF for now
        fields: {}, // Placeholder for specific form fields
      })
    })

    // Store in Supabase
    const { data: insertedData, error: insertError } = await supabase
      .from('settlements')
      .upsert(settlements, { onConflict: 'title' })

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return NextResponse.json({ error: 'Failed to store settlements in database' }, { status: 500 })
    }

    return NextResponse.json(settlements)

  } catch (error) {
    console.error('Error scraping settlements:', error)
    return NextResponse.json({ error: 'Failed to scrape settlements' }, { status: 500 })
  }
}