import { GoogleGenAI } from "@google/genai";

const analysisModel = 'gemini-3-pro-preview';

export default async function handler(req: any, res: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ connected: false, error: 'Server API key not configured' });
  }

  try {
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
