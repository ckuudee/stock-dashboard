import { useEffect, useState } from 'react'

// Twelve Data returns every numeric field as a STRING ("326.59000"), so the type
// describes the wire format honestly and we convert at the point of use.
type Quote = {
  symbol: string
  name: string
  close: string
  change: string
  percent_change: string
}

function App() {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Lets us cancel the in-flight request if this effect is torn down before it
    // finishes — React StrictMode runs effects twice in dev, and later the user
    // will change symbols mid-request.
    const controller = new AbortController()

    async function load() {
      try {
        // Relative path on purpose: Vite proxies /api to :3001 in dev, and in
        // production the proxy is same-origin. No hardcoded hostname either way.
        const res = await fetch('/api/quote?symbol=AAPL', {
          signal: controller.signal,
        })
        const data = await res.json()

        // Our proxy signals failure with a real HTTP status, so check it.
        if (!res.ok) {
          setError(data.error ?? 'Request failed')
          return
        }
        setQuote(data)
      } catch (err) {
        // An aborted request isn't a failure — it's us cancelling on purpose.
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError('Could not reach the server')
      }
    }

    load()
    return () => controller.abort()
  }, [])

  if (error) return <p role="alert">Error: {error}</p>
  if (!quote) return <p>Loading…</p>

  const price = Number(quote.close)
  const change = Number(quote.change)
  const percentChange = Number(quote.percent_change)

  return (
    <main>
      <h1>{quote.symbol}</h1>
      <p>{quote.name}</p>
      <p>${price.toFixed(2)}</p>
      <p>
        {change >= 0 ? '+' : ''}
        {change.toFixed(2)} ({percentChange.toFixed(2)}%)
      </p>
    </main>
  )
}

export default App
