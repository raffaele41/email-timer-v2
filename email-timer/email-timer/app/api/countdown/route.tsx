import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const GIFEncoder = (await import('gifencoder')).default
    const { createCanvas } = await import('canvas')

    const launch = new Date('2026-03-31T22:00:00Z')
    const now = new Date()
    let diff = Math.floor((launch.getTime() - now.getTime()) / 1000)
    if (diff < 0) diff = 0

    const width = 800
    const height = 200
    const frames = 60 // 60 secondi di animazione

    const encoder = new GIFEncoder(width, height)
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')

    const chunks: Buffer[] = []
    encoder.createReadStream().on('data', (chunk: Buffer) => chunks.push(chunk))

    encoder.start()
    encoder.setRepeat(0) // 0 = loop infinito
    encoder.setDelay(1000) // 1 frame al secondo
    encoder.setQuality(10)

    for (let i = 0; i < frames; i++) {
      const d = diff - i
      if (d < 0) break

      const days = String(Math.floor(d / 86400)).padStart(2, '0')
      const hours = String(Math.floor((d % 86400) / 3600)).padStart(2, '0')
      const minutes = String(Math.floor((d % 3600) / 60)).padStart(2, '0')
      const seconds = String(d % 60).padStart(2, '0')

      // Sfondo
      ctx.fillStyle = '#240709'
      ctx.fillRect(0, 0, width, height)

      // Testo
      ctx.fillStyle = 'white'
      ctx.font = 'bold 80px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Valori
      ctx.fillText(days, 90, 100)
      ctx.fillText(hours, 290, 100)
      ctx.fillText(minutes, 490, 100)
      ctx.fillText(seconds, 690, 100)

      // Labels
      ctx.font = '18px Arial'
      ctx.fillText('days', 90, 160)
      ctx.fillText('hours', 290, 160)
      ctx.fillText('min', 490, 160)
      ctx.fillText('sec', 690, 160)

      // Separatori
      ctx.fillStyle = 'white'
      ctx.fillRect(188, 60, 2, 100)
      ctx.fillRect(388, 60, 2, 100)
      ctx.fillRect(588, 60, 2, 100)

      encoder.addFrame(ctx as any)
    }

    encoder.finish()

    await new Promise(resolve => setTimeout(resolve, 100))
    const gif = Buffer.concat(chunks)

    const id = req.nextUrl.searchParams.get('id') || 'unknown'
    const job = req.nextUrl.searchParams.get('job') || 'unknown'
    console.log(JSON.stringify({ timestamp: now.toISOString(), id, job, diff }))

    return new NextResponse(gif, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store',
      }
    })

  } catch (error) {
    console.error(error)
    return new NextResponse('Error', { status: 500 })
  }
}

