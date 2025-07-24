import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, address, settlementTitle, productQuantity, store, purchaseMonth, hasProof, paymentPreference, paypalEmail, venmoHandle, bankDetails } = body

    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const textSize = 12
    const textColor = rgb(0, 0, 0)

    page.drawText(`Claim Form for ${settlementTitle}`, { x: 50, y: 750, font, size: 30 })
    page.drawText(`Full Name: ${fullName}`, { x: 50, y: 700, font, size: textSize, color: textColor })
    page.drawText(`Email: ${email}`, { x: 50, y: 680, font, size: textSize, color: textColor })
    page.drawText(`Address: ${address}`, { x: 50, y: 660, font, size: textSize, color: textColor })

    if (hasProof) {
      page.drawText(`Product Quantity: ${productQuantity}`, { x: 50, y: 640, font, size: textSize, color: textColor })
      page.drawText(`Store: ${store}`, { x: 50, y: 620, font, size: textSize, color: textColor })
      page.drawText(`Purchase Month: ${purchaseMonth}`, { x: 50, y: 600, font, size: textSize, color: textColor })
    } else {
      page.drawText(`No proof provided. Claim will be capped.`, { x: 50, y: 640, font, size: textSize, color: textColor })
    }

    let currentY = hasProof ? 580 : 620;

    page.drawText(`Payment Preference: ${paymentPreference}`, { x: 50, y: currentY, font, size: textSize, color: textColor })
    if (paymentPreference === 'paypal') {
      currentY -= 20;
      page.drawText(`PayPal Email: ${paypalEmail}`, { x: 50, y: currentY, font, size: textSize, color: textColor })
    } else if (paymentPreference === 'venmo') {
      currentY -= 20;
      page.drawText(`Venmo Handle: ${venmoHandle}`, { x: 50, y: currentY, font, size: textSize, color: textColor })
    } else if (paymentPreference === 'bank') {
      currentY -= 20;
      page.drawText(`Bank Details: ${bankDetails}`, { x: 50, y: currentY, font, size: textSize, color: textColor })
    }

    const pdfBytes = await pdfDoc.save()

    const fileName = `claim-form-${settlementTitle.toLowerCase().replace(/ /g, '-')}-${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('claim-forms')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload PDF to storage' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('claim-forms')
      .getPublicUrl(fileName)

    return NextResponse.json({ pdfUrl: publicUrlData.publicUrl })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
