import { GoogleGenAI } from "@google/genai";

const analysisModel = 'gemini-3-pro-preview';

export default async function handler(req: Request): Promise<Response> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ connected: false, error: 'Server API key not configured' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: { parts: [{ text: 'ping' }] },
    });

    const connected = !!response;
    return new Response(JSON.stringify({ connected }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Test connection error:', error);
    return new Response(JSON.stringify({ connected: false, error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
