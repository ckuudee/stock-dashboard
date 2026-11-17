import { fetchQuote } from '../lib/twelveData'

// Web Standard handler: a plain Request in, a plain Response out. Exporting GET
// means Vercel only routes GET requests here — other methods get a 405 for free.
export async function GET(request: Request) {
  const symbol = new URL(request.url).searchParams.get('symbol')

  // Validate BEFORE spending an upstream call — protects our rate limit.
  if (symbol === null || symbol.trim() === '') {
    return Response.json(
      { error: "Missing or invalid 'symbol' query parameter" },
      { status: 400 },
    )
  }

  const result = await fetchQuote(symbol)
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status })
  }

  return Response.json(result.data) // only data reaches the browser — never the key
}
