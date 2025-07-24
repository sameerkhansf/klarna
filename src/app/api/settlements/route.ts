import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServer'

async function firecrawlScrape(url: string, prompt?: string) {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
  const body: any = {
    url,
    formats: ['json'],
  };
  if (prompt) {
    body.jsonOptions = { prompt };
  }
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Firecrawl error for ${url}`);
  }
  return response.json();
}

export async function GET(req: NextRequest) {
  const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY
  if (!FIRECRAWL_API_KEY) {
    return NextResponse.json({ error: 'FIRECRAWL_API_KEY is not set' }, { status: 500 })
  }
  const supabase = await createClient();
  try {
    // 1. Scrape the main settlements page for a list of settlements and their detail URLs
    const mainPrompt = `Extract a list of all current settlements. For each, include: title, detail_url (the full URL to the settlement's detail page).`;
    const mainData = await firecrawlScrape('https://www.openclassactions.com/settlements.php', mainPrompt);
    let settlementsList = mainData.data?.json?.settlements || [];
    settlementsList = settlementsList.filter((s: any) => s.title && s.detail_url);
    if (!settlementsList.length) {
      return NextResponse.json({ error: 'No settlements found on main page' }, { status: 500 });
    }
    // 2. For each settlement, scrape its detail page for richer data
    const detailPrompt = `Extract the following: title, deadline (if available), payout_min (if available), payout_max (if available), payout_description (if available), claim_url (if available), requires_proof (true/false if available), proof_limit (if available), description (short summary of the settlement).`;
    const results: any[] = [];
    for (const s of settlementsList) {
      try {
        // Scrape detail page
        const detailData = await firecrawlScrape(s.detail_url, detailPrompt);
        let detail = detailData.data?.json || {};
        // Fallbacks
        detail.title = detail.title || s.title;
        detail.claim_url = detail.claim_url || s.detail_url;
        // Clean and coerce fields
        const allowedFields = [
          'title', 'deadline', 'payout_min', 'payout_max', 'claim_url',
          'requires_proof', 'proof_limit', 'form_type', 'description', 'payout_description'
        ];
        const cleaned: any = {};
        const extraFields: any = {};
        for (const [key, value] of Object.entries(detail)) {
          if (allowedFields.includes(key)) {
            if (key === 'payout_min' || key === 'payout_max' || key === 'proof_limit') {
              cleaned[key] = (value === '' || isNaN(Number(value))) ? null : Number(value);
            } else if (key === 'form_type') {
              cleaned[key] = 'pdf';
            } else {
              cleaned[key] = value ?? null;
            }
          } else {
            extraFields[key] = value;
          }
        }
        cleaned.form_type = 'pdf';
        cleaned.fields = extraFields;
        if (!cleaned.title || typeof cleaned.title !== 'string' || cleaned.title.trim().length === 0) {
          results.push({ title: cleaned.title || s.title, success: false, error: 'Missing or invalid title' });
          continue;
        }
        // Upsert immediately
        const { data, error } = await supabase
          .from('settlements')
          .upsert([cleaned], { onConflict: 'title' });
        if (error) {
          results.push({ title: cleaned.title, success: false, error: error.message });
        } else {
          results.push({ title: cleaned.title, success: true });
        }
      } catch (e: any) {
        results.push({ title: s.title, success: false, error: e.message });
      }
    }
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error scraping settlements:', error);
    return NextResponse.json({ error: 'Failed to scrape settlements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  try {
    const body = await req.json();
    // Accept a single object or an array
    let settlements = Array.isArray(body) ? body : [body];
    settlements = settlements
      .filter((s: any) => s.title && typeof s.title === 'string' && s.title.trim().length > 0)
      .map((s: any) => ({
        ...s,
        payout_min: s.payout_min === '' ? null : Number.isFinite(Number(s.payout_min)) ? Number(s.payout_min) : null,
        payout_max: s.payout_max === '' ? null : Number.isFinite(Number(s.payout_max)) ? Number(s.payout_max) : null,
        proof_limit: s.proof_limit === '' ? null : Number.isFinite(Number(s.proof_limit)) ? Number(s.proof_limit) : null,
        form_type: 'pdf',
        fields: {},
      }))
    if (!settlements.length) {
      return NextResponse.json({ error: 'No settlements provided' }, { status: 400 });
    }
    // Insert into Supabase
    const { data, error } = await supabase
      .from('settlements')
      .insert(settlements)
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request or server error' }, { status: 500 });
  }
}