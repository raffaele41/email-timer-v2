import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const launch = new Date('2026-04-01T00:00:00Z')
    const now = new Date()

    let diffHours = Math.floor((launch.getTime() - now.getTime()) / 1000 / 60 / 60)
    if (diffHours < 0) diffHours = 0

    const days = String(Math.floor(diffHours / 24)).padStart(2, '0')
    const hours = String(diffHours % 24).padStart(2, '0')

    // Logging per monitorare cache hit
    const id = req.nextUrl.searchParams.get('id') || 'unknown'
    const job = req.nextUrl.searchParams.get('job') || 'unknown'
    console.log(JSON.stringify({
      timestamp: now.toISOString(),
      id,
      job,
      days,
      hours
    }))

    return new ImageResponse(
      (
        <div style={{
          width: '600px',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A0505',
          gap: '0px',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '280px',
          }}>
            <span style={{ color: 'white', fontSize: '90px', fontWeight: 'bold', fontFamily: 'sans-serif', lineHeight: 1 }}>
              {days}
            </span>
            <span style={{ color: 'white', fontSize: '20px', fontFamily: 'sans-serif', marginTop: '8px' }}>
              days
            </span>
          </div>

          <div style={{ width: '2px', height: '120px', background: 'white' }} />

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '280px',
          }}>
            <span style={{ color: 'white', fontSize: '90px', fontWeight: 'bold', fontFamily: 'sans-serif', lineHeight: 1 }}>
              {hours}
            </span>
            <span style={{ color: 'white', fontSize: '20px', fontFamily: 'sans-serif', marginTop: '8px' }}>
              hours
            </span>
          </div>
        </div>
      ),
      { width: 600, height: 200 }
    )

  } catch (error) {
    return new ImageResponse(
      (
        <div style={{
          width: '600px',
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1A0505',
        }}>
          <span style={{ color: 'white', fontSize: '30px', fontFamily: 'sans-serif' }}>
            glo — Coming Soon
          </span>
        </div>
      ),
      { width: 600, height: 200 }
    )
  }
}
