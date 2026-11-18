// Vercel serverless: starts a Veo job and checks its status. Keys live in Vercel env vars, never in the phone.
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

export default async function handler(req, res) {
  const { ACCESS_CODE, GEMINI_API_KEY, VEO_MODEL = 'veo-3.0-generate-001' } = process.env;
  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY Vercel-la set pannala' });
  if (ACCESS_CODE && req.headers['x-access-code'] !== ACCESS_CODE) return res.status(401).json({ error: 'Access code thappu' });
  const H = { 'x-goog-api-key': GEMINI_API_KEY, 'Content-Type': 'application/json' };
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  try {
    if (b.action === 'start') {
      const inst = { prompt: b.prompt };
      if (b.image) inst.image = { bytesBase64Encoded: b.image, mimeType: 'image/jpeg' }; // face + continuity
      const r = await fetch(`${BASE}/models/${VEO_MODEL}:predictLongRunning`, {
        method: 'POST', headers: H, body: JSON.stringify({ instances: [inst], parameters: { aspectRatio: b.aspect || '16:9' } }) });
      const d = await r.json();
      if (!r.ok) return res.status(r.status).json({ error: d.error?.message || 'Veo start failed' });
      return res.json({ id: d.name });
    }
    if (b.action === 'status') {
      const r = await fetch(`${BASE}/${b.id}`, { headers: H });
      const d = await r.json();
      if (d.error) return res.json({ done: true, error: d.error.message });
      if (!d.done) return res.json({ done: false });
      const v = d.response?.generateVideoResponse;
      const uri = v?.generatedSamples?.[0]?.video?.uri;
      return res.json(uri ? { done: true, uri } : { done: true, error: v?.raiMediaFilteredReasons?.[0] || 'Video kidaikkala (safety filter irukkalam)' });
    }
    res.status(400).json({ error: 'bad action' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
