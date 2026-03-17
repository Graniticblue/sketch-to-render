import { GoogleGenAI } from "@google/genai";

const analysisModel = 'gemini-3-pro-preview';

const ANALYSIS_PROMPT = `You are an expert architectural visualization analyst. Analyze the provided style reference image and generate a comprehensive style description. This description will be used to guide the rendering of a new architectural image. Do NOT analyze composition or camera angle.

Structure your response under the heading "**Overall Artistic Style (Inferred from Style Reference, Applied to Rendering Result):**" and include ALL of the following subsections, formatted exactly as shown:

*   **Mood & Tone:** [Describe the emotional feel and overall vibe. Is it warm and inviting, cold and dramatic, serene and peaceful, or bold and futuristic? What overall impression does the image convey?]

*   **Lighting & Shadows:** [Describe in detail: the primary light source direction (e.g., front-left, back-right, overhead), light quality (soft/diffused vs hard/direct), shadow intensity and sharpness, any secondary or ambient light sources, and the overall contrast level (high contrast vs low contrast). Note any specific lighting effects like rim lighting, volumetric light rays, or lens flare.]

*   **Time & Sky:** [Specify the exact time of day (e.g., golden hour sunrise, midday, blue hour dusk, twilight, night). Describe the sky in detail: cloud type and coverage, sky gradient colors, any atmospheric phenomena like haze, fog, or sun glow.]

*   **Color Palette & Grading:** [Identify the dominant color palette (warm/cool/neutral). List the primary colors used (e.g., warm beige, steel blue, forest green). Describe the color grading style: is it saturated or desaturated? Are there any color tints (e.g., orange tint in highlights, blue tint in shadows)? Note the overall white balance (warm/cool/neutral).]

*   **Building Materials & Textures:** [Describe the visible building materials in detail: facade types (glass curtain wall, exposed concrete, stone cladding, metal panels, wood), their finish (matte, glossy, textured, weathered), reflectivity levels, and any notable material combinations. How do materials interact with light?]

*   **Vegetation & Landscape Style:** [Describe the landscaping approach: tree species style (deciduous/coniferous/tropical/mixed), foliage density, grass quality, planting patterns (formal/naturalistic/wild). Note the level of detail in vegetation and its overall lushness or sparsity.]

*   **Human Figures & Vehicles:** [Describe how people and vehicles are depicted: are they present? If so, are they sharp or blurred/silhouetted? What is their scale relative to buildings? Are vehicles modern/luxury/casual? How do these elements contribute to the scene's sense of life and scale?]

*   **Post-Processing & Visual Effects:** [Identify any post-processing effects: depth of field (background blur), vignetting, bloom/glow effects, chromatic aberration, grain/noise, HDR tone mapping style. Describe the overall "finish" of the image — does it look like a photograph, a hyperrealistic render, or a stylized illustration?]

Your description for each category must be specific, detailed, and directly actionable for a generative AI model. Avoid vague descriptions like "nice lighting" — instead describe exactly what makes the lighting distinctive.`;

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
    const { styleRefBase64, mimeType = 'image/jpeg' } = await req.json();

    const ai = new GoogleGenAI({ apiKey });

    const styleRefPart = {
      inlineData: {
        data: styleRefBase64.includes(',') ? styleRefBase64.split(',')[1] : styleRefBase64,
        mimeType,
      },
    };

    const response = await ai.models.generateContent({
      model: analysisModel,
      contents: { parts: [{ text: ANALYSIS_PROMPT }, styleRefPart] },
    });

    const styleGuide = response.text || JSON.stringify(response);

    return new Response(JSON.stringify({ styleGuide }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Analyze error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Analysis failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
