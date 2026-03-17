import type { VercelRequest, VercelResponse } from '@vercel/node';

const generationModel = 'gemini-3-pro-image-preview';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return res.status(500).json({ error: 'Server API key not configured. Please set GEMINI_API_KEY in Vercel environment variables.' });
  }

  try {
    // Dynamic import to avoid ESM/CJS issues in Vercel
    const { GoogleGenAI } = await import('@google/genai');

    const { imageBase64, retouchPrompt, aspectRatio = '1:1', mimeType = 'image/jpeg' } = req.body;

    if (!imageBase64 || !retouchPrompt) {
      return res.status(400).json({ error: 'Missing required fields: imageBase64 and retouchPrompt' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    // @ts-ignore
    const response = await ai.models.generateContent({
      model: generationModel,
      contents: {
        parts: [imagePart, { text: `Edit this image based on: ${retouchPrompt}` }],
      },
      // @ts-ignore
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: '4K',
        },
      },
    });

    const imagePartResponse = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

    if (imagePartResponse?.inlineData) {
      return res.status(200).json({
        imageData: imagePartResponse.inlineData.data,
        mimeType: imagePartResponse.inlineData.mimeType,
      });
    }

    throw new Error('No retouched image was generated.');
  } catch (error: any) {
    console.error('Retouch error:', error);
    const message = error.message || 'Retouch failed';
    const status = message.includes('API key') || message.includes('unauthenticated') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
