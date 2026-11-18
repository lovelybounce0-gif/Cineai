export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: 'prompt missing' });

    const API_KEY = process.env.GEMINI_API_KEY;
    const BASE = 'https://generativelanguage.googleapis.com/v1beta';
    const H = { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY };

    // 1. Video generate start pannu
    const r = await fetch(`${BASE}/models/veo-3.1-generate-preview:predictLongRunning`, {
      method: 'POST',
      headers: H,
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: { aspectRatio: '16:9' }
      })
    });

    const d = await r.json();
    if (!r.ok) return res.status(r.status).json(d);

    const opName = d.name;

    // 2. Video ready aagura vara wait pannu
    let videoUri = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(x => setTimeout(x, 10000));
      const check = await fetch(`${BASE}/${opName}`, { headers: H });
      const cd = await check.json();
      if (cd.done) {
        videoUri = cd.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
        break;
      }
    }

    if (!videoUri) return res.status(504).json({ error: 'video timeout, try again' });

    return res.json({ videoUrl: videoUri + '&key=' + API_KEY });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
