import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function loadFont(): Promise<boolean> {
  try {
    const { GlobalFonts } = await import('@napi-rs/canvas')
    if (GlobalFonts.families.some((f: any) => f.family === 'Roboto')) return true
    const res = await fetch(
      'https://raw.githubusercontent.com/raffaele41/email-timer-v2/main/email-timer/email-timer/Roboto-VariableFont_wdth%2Cwght.ttf',
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    GlobalFonts.register(buf, 'Roboto')
    return true
  } catch (err) {
    console.error('Font load failed:', err)
    return false
  }
}

async function buildFallbackGif(diff: number): Promise<Buffer | null> {
  try {
    const GIFEncoder       = (await import('gifencoder')).default
    const { createCanvas } = await import('@napi-rs/canvas')

    const days  = String(Math.floor(diff / 86400)).padStart(2, '0')
    const hours = String(Math.floor((diff % 86400) / 3600)).padStart(2, '0')

    const width = 800, height = 200
    const encoder = new GIFEncoder(width, height)
    const canvas  = createCanvas(width, height)
    const ctx     = canvas.getContext('2d')
    const chunks: Buffer[] = []

    await new Promise<void>((resolve, reject) => {
      encoder.createReadStream()
        .on('data',  (chunk: Buffer) => chunks.push(chunk))
        .on('end',   resolve)
        .on('error', reject)

      encoder.start()
      encoder.setRepeat(0)
      encoder.setDelay(1000)
      encoder.setQuality(10)

      ctx.fillStyle = '#240709'
      ctx.fillRect(0, 0, width, height)
      ctx.fillStyle = 'white'
      ctx.font = 'bold 80px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(days,  250, 100)
      ctx.fillText(hours, 550, 100)
      ctx.font = '18px sans-serif'
      ctx.fillText('ημέρες',  250, 160)
      ctx.fillText('ώρες', 550, 160)
      ctx.fillStyle = 'white'
      ctx.fillRect(398, 60, 2, 100)

      encoder.addFrame(ctx as any)
      encoder.finish()
    })

    const gif = Buffer.concat(chunks)
    return gif.length > 6 ? gif : null
  } catch (err) {
    console.error('Fallback GIF failed:', err)
    return null
  }
}

export async function GET(req: NextRequest) {
  const id  = req.nextUrl.searchParams.get('id')  || 'unknown'
  const job = req.nextUrl.searchParams.get('job') || 'unknown'
  const now = new Date()

  const launch = new Date('2026-04-01T11:00:00Z')
  let diff = Math.floor((launch.getTime() - now.getTime()) / 1000)
  if (diff < 0) diff = 0

  try {
    const GIFEncoder       = (await import('gifencoder')).default
    const { createCanvas } = await import('@napi-rs/canvas')

    const fontLoaded = await loadFont()
    const fontFamily = fontLoaded ? 'Roboto' : 'sans-serif'

    const width = 800, height = 200, frames = 20
    const encoder = new GIFEncoder(width, height)
    const canvas  = createCanvas(width, height)
    const ctx     = canvas.getContext('2d')
    const chunks: Buffer[] = []

    await new Promise<void>((resolve, reject) => {
      encoder.createReadStream()
        .on('data',  (chunk: Buffer) => chunks.push(chunk))
        .on('end',   resolve)
        .on('error', reject)

      encoder.start()
      encoder.setRepeat(0)
      encoder.setDelay(1000)
      encoder.setQuality(10)

      for (let i = 0; i < frames; i++) {
        const d = diff - i
        if (d < 0) break

        const days    = String(Math.floor(d / 86400)).padStart(2, '0')
        const hours   = String(Math.floor((d % 86400) / 3600)).padStart(2, '0')
        const minutes = String(Math.floor((d % 3600) / 60)).padStart(2, '0')
        const seconds = String(d % 60).padStart(2, '0')

        ctx.fillStyle = '#240709'
        ctx.fillRect(0, 0, width, height)
        ctx.fillStyle = 'white'
        ctx.font = `bold 60px ${fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(days,    90,  100)
        ctx.fillText(hours,   290, 100)
        ctx.fillText(minutes, 490, 100)
        ctx.fillText(seconds, 690, 100)
        ctx.font = `18px ${fontFamily}`
        ctx.fillText('ημέρες',  90,  145)
        ctx.fillText('ώρες', 290, 145)
        ctx.fillText('λεπτά',   490, 145)
        ctx.fillText('δευτερόλεπτα',   690, 145)
        ctx.fillStyle = 'white'
        ctx.fillRect(188, 60, 2, 100)
        ctx.fillRect(388, 60, 2, 100)
        ctx.fillRect(588, 60, 2, 100)

        encoder.addFrame(ctx as any)
      }

      encoder.finish()
    })

    const gif = Buffer.concat(chunks)
    if (gif.length < 6) throw new Error('GIF output empty or corrupted')

    console.log(JSON.stringify({ timestamp: now.toISOString(), id, job, diff, gifSize: gif.length }))

    return new NextResponse(new Uint8Array(gif), {
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-cache, no-store' }
    })

  } catch (error) {
    console.error(JSON.stringify({
      timestamp: now.toISOString(), id, job,
      error: error instanceof Error ? error.message : String(error)
    }))

    const fallback = await buildFallbackGif(diff)

    if (fallback) {
      console.log(JSON.stringify({ timestamp: now.toISOString(), id, job, fallback: true }))
      return new NextResponse(new Uint8Array(fallback), {
        status: 200,
        headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-cache, no-store' }
      })
    }

    const minGif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    return new NextResponse(new Uint8Array(minGif), {
      status: 200,
      headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-cache, no-store' }
    })
  }
}
