import { GoogleGenAI } from "@google/genai";

const generationModel = 'gemini-3-pro-image-preview';

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageBase64, retouchPrompt, mimeType = 'image/jpeg' } = await req.json();

    const ai = new GoogleGenAI({ apiKey });

    const imagePart = {
      inlineData: {
        data: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
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
      return new Response(
        JSON.stringify({
          imageData: imagePartResponse.inlineData.data,
          mimeType: imagePartResponse.inlineData.mimeType,
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('No retouched image was generated.');
  } catch (error: any) {
    console.error('Retouch error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Retouch failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
