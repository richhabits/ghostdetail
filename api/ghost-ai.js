// Ghost AI Proxy — Vercel Edge Function
// Routes to free AI providers: Pollinations (GPT-OSS 20B) → Gemini fallback
// ZERO API keys needed

const SYSTEM_PROMPTS = {
  ghost: `You are GHOST — the AI brain of Ghost Detail Autos, Watford WD18. Romeo Cruz and his son Ferrel run this luxury car detailing studio. Be direct, sharp, business-focused. Services: Spark Wash £79, Quick Refinement £249, Depth Refinement £149, Total Refinement £349, Nano Banana Ceramic £279, PPF. Ghost Pass memberships: Spark £99/mo, Shield £199/mo, Legend £299/mo. Help Romeo run and grow the business. Max 150 words.`,
  aria: `You are ARIA — Ghost Detail's receptionist AI. Handle enquiries professionally, draft WhatsApp messages, manage leads. Ghost Detail Autos, Watford WD18. Max 120 words.`,
  jade: `You are JADE — Ghost Detail's lead nurturing AI. Turn cold leads into bookings. Write compelling follow-up messages. Persuasive and strategic. Max 120 words.`,
  marcus: `You are MARCUS — market intelligence AI for Ghost Detail Watford. Analyse competitor pricing, local detailing trends in Hertfordshire and North London. Data-driven. Max 120 words.`,
  aaliya: `You are AALIYA — social content AI for Ghost Detail. Turn car transformations into viral Instagram and TikTok content. Gen Z energy, aspirational. Max 100 words.`,
  priya: `You are PRIYA — operations AI for Ghost Detail. Bay scheduling, stock, workflow management. Practical and organised. Max 100 words.`,
  dev: `You are DEV — financial AI for Ghost Detail. Revenue tracking, forecast analysis, deposit management. Precise with numbers. Max 100 words.`,
  romeo_ai: `You are ROMEO AI — brand strategy AI for Ghost Detail. Long-term vision, positioning, brand identity. Visionary and honest. Max 120 words.`
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});
  
  const { prompt, brain = 'ghost', messages = [], history = [] } = req.body || {};
  const userMessage = prompt || (messages[messages.length-1]?.content) || '';
  if (!userMessage) return res.status(400).json({error: 'No message'});
  
  const systemPrompt = SYSTEM_PROMPTS[brain] || SYSTEM_PROMPTS.ghost;
  
  // Build conversation history
  const conversationMsgs = [
    { role: 'system', content: systemPrompt },
    ...history.filter(m => m.role !== 'system').slice(-8),
    { role: 'user', content: userMessage }
  ];

  // ── Provider 1: Pollinations AI (GPT-OSS 20B) — FREE, no key ──
  try {
    const r = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationMsgs,
        model: 'openai-fast',
        seed: Math.floor(Math.random() * 1000),
        private: true,
        nofeed: true
      }),
      signal: AbortSignal.timeout(12000)
    });
    
    if (r.ok) {
      const text = await r.text();
      if (text && text.length > 5 && !text.includes('error')) {
        return res.json({
          ok: true,
          text: text.trim(),
          model: 'gpt-oss-20b',
          brain,
          provider: 'pollinations'
        });
      }
    }
  } catch(e) {
    console.error('Pollinations error:', e.message);
  }
  
  // ── Provider 2: Supabase ghost-brain (Gemini 2.5 Flash) — fallback ──
  try {
    const r = await fetch('https://slzawehsiotvkjzaehqw.supabase.co/functions/v1/ghost-brain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsemF3ZWhzaW90dmtqemFlaHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MDIxMjEsImV4cCI6MjA5MjQ3ODEyMX0.OEug6UpLSY4poXPLASufTLc-FqQdGx9mJfwhD0opWxA'
      },
      body: JSON.stringify({
        prompt: systemPrompt + '\n\nUser: ' + userMessage
      }),
      signal: AbortSignal.timeout(10000)
    });
    
    if (r.ok) {
      const d = await r.json();
      const text = d.text;
      if (text && text.length > 5) {
        return res.json({
          ok: true,
          text,
          model: d.model || 'gemini-2.5-flash',
          brain,
          provider: 'gemini-supabase'
        });
      }
    }
  } catch(e) {
    console.error('Gemini error:', e.message);
  }
  
  // ── Provider 3: Pollinations GET endpoint (ultra-simple fallback) ──
  try {
    const q = encodeURIComponent(systemPrompt.substring(0,200) + ' ' + userMessage);
    const r = await fetch(`https://text.pollinations.ai/${q}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (r.ok) {
      const text = await r.text();
      if (text && text.length > 5) {
        return res.json({ok: true, text: text.trim(), model: 'gpt-oss', brain, provider: 'pollinations-get'});
      }
    }
  } catch(e) {}
  
  // All providers failed
  return res.status(503).json({
    ok: false,
    text: 'Ghost is temporarily offline. All AI providers unavailable.',
    error: 'All providers failed'
  });
}
