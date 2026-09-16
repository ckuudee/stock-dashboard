import "dotenv/config"; // must be first: loads .env into process.env before anything reads it
import express from "express";

const app = express();
const TWELVE_DATA_BASE = "https://api.twelvedata.com";

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/quote", async (req, res) => {
  const symbol = req.query.symbol;

  // Validate input BEFORE spending an API call (protects our rate limit + rejects junk).
  if (typeof symbol !== "string" || symbol.trim() === "") {
    res.status(400).json({ error: "Missing or invalid 'symbol' query parameter" });
    return;
  }

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) {
    // Server misconfigured — log the real reason server-side, but don't leak details to the client.
    console.error("TWELVE_DATA_API_KEY is not set");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  try {
    // encodeURIComponent stops user input from breaking or injecting into the URL.
    const url = `${TWELVE_DATA_BASE}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const upstream = await fetch(url);
    const data = await upstream.json();

    // Twelve Data reports problems (bad symbol, rate limit) inside the body, not always via HTTP status.
    if (data.status === "error") {
      res.status(502).json({ error: data.message ?? "Upstream API error" });
      return;
    }

    res.json(data); // only the data reaches the browser — the key never does
  } catch (err) {
    console.error("Failed to fetch quote:", err);
    res.status(502).json({ error: "Failed to reach data provider" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
