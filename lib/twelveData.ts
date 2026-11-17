// All Twelve Data access lives here. The API-route files stay thin wrappers, so
// the provider logic isn't tied to one runtime — if the transport layer changes
// again, this file doesn't.
const TWELVE_DATA_BASE = 'https://api.twelvedata.com'

// A result type instead of throwing: the caller must handle failure explicitly,
// and the HTTP status is decided here where we know what actually went wrong.
export type FetchResult =
  | { ok: true; data: unknown }
  | { ok: false; status: number; error: string }

export async function fetchQuote(symbol: string): Promise<FetchResult> {
  const apiKey = process.env.TWELVE_DATA_API_KEY
  if (!apiKey) {
    // Log the real reason server-side; don't leak config details to the client.
    console.error('TWELVE_DATA_API_KEY is not set')
    return { ok: false, status: 500, error: 'Server configuration error' }
  }

  try {
    // encodeURIComponent stops user input from breaking or injecting into the URL.
    const url = `${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`
    const upstream = await fetch(url)
    const data = (await upstream.json()) as { status?: string; message?: string }

    // Twelve Data reports problems (bad symbol, rate limit) inside the body,
    // not always via the HTTP status — so check the body, not just res.ok.
    if (data.status === 'error') {
      return { ok: false, status: 502, error: data.message ?? 'Upstream API error' }
    }

    return { ok: true, data }
  } catch (err) {
    console.error('Failed to fetch quote:', err)
    return { ok: false, status: 502, error: 'Failed to reach data provider' }
  }
}
