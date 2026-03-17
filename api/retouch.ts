import { GoogleGenAI } from "@google/genai";

const generationModel = 'gemini-3-pro-image-preview';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured' });
  }

  try {
    const { imageBase64, retouchPrompt, mimeType = 'image/jpeg' } = req.body;

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
          aspectRatio: '1:1',
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
    return res.status(500).json({ error: error.message || 'Retouch failed' });
  }
}
