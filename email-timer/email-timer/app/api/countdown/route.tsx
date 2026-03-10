const { join } = await import('path')
const { existsSync } = await import('fs')

const possiblePaths = [
  join(process.cwd(), 'email-timer/email-timer/Roboto-VariableFont_wdth,wght.ttf'),
  join(process.cwd(), 'Roboto-VariableFont_wdth,wght.ttf'),
  '/vercel/path0/email-timer/email-timer/Roboto-VariableFont_wdth,wght.ttf',
]

let fontRegistered = false
for (const p of possiblePaths) {
  console.log('Trying font path:', p, 'exists:', existsSync(p))
  if (existsSync(p)) {
    GlobalFonts.registerFromPath(p, 'Roboto')
    fontRegistered = true
    console.log('Font registered from:', p)
    break
  }
}
console.log('Font registered:', fontRegistered)
console.log('Available fonts:', JSON.stringify(GlobalFonts.families))
