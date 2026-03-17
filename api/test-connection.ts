import type { VercelRequest, VercelResponse } from '@vercel/node';

const analysisModel = 'gemini-2.0-flash';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return res.status(200).json({ connected: false, error: 'Server API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.' });
  }

  try {
    // Dynamic import to avoid ESM/CJS issues in Vercel
    const { GoogleGenAI } = await import('@google/genai');

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: { parts: [{ text: 'ping' }] },
    });

    return res.status(200).json({ connected: !!response });
  } catch (error: any) {
    console.error('Test connection error:', error);
    return res.status(200).json({ connected: false, error: error.message });
  }
}
