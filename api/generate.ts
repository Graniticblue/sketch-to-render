import type { VercelRequest, VercelResponse } from '@vercel/node';

const generationModel = 'gemini-3-pro-image-preview';

const MATERIAL_TRANSLATION_GUIDE = `*   **Material Translation (SketchUp Model to Rendering Result):**
    *   **SketchUp Grey (Building Facades):** Translates into highly reflective, multi-paneled glass facades, polished light-colored concrete or stone, and subtle metallic accents. These materials vividly reflect the sky and surrounding environment, and many windows glow warmly from within.
    *   **SketchUp Transparent (Facade Glass):** Is always rendered as photorealistic glass. This glass should be transparent and reflective, accurately showing the interior (if modeled) and reflecting the exterior environment (sky, other buildings).
    *   **SketchUp Dark Grey/Brown (Accent Building Facades):** Becomes textured dark concrete, contemporary dark metallic panels, or deep wood-effect cladding. These provide visual contrast and depth, and may exhibit internal light where applicable.
    *   **SketchUp White (Building Tops/Details):** Rendered as crisp, clean white concrete or smooth, light-toned stone elements, often subtly illuminated, contributing to a sleek and modern aesthetic.
    *   **SketchUp Green (Landscaping/Terrain):** Transformed into lush, highly detailed, photorealistic vegetation, including a diverse array of mature trees, varied shrubs, and manicured grass, displaying natural light and shadow play.
    *   **SketchUp Blue (Water):** Becomes a realistic body of water with subtle surface ripples, naturalistic color variations, and accurate reflections of the sky and surrounding buildings.
    *   **SketchUp Dark Grey/Brown (Roads/Paving):** Rendered as detailed asphalt roads with clear lane markings, integrated lampposts, and realistic vehicle movement. Pedestrian zones are enhanced with textured paving stones and landscaped pathways.`;

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

    const {
      sketchBase64,
      styleGuide,
      textFeedback,
      targetAspectRatio,
      originalWidth,
      originalHeight,
      mimeType = 'image/jpeg',
    } = req.body;

    if (!sketchBase64 || !styleGuide) {
      return res.status(400).json({ error: 'Missing required fields: sketchBase64 and styleGuide' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const sketchPart = {
      inlineData: {
        data: sketchBase64,
        mimeType,
      },
    };

    const generationPrompt = `**CRITICAL MISSION: TRANSFORM SKETCHUP BLUEPRINT TO PHOTOREALISTIC RENDERING**

**RESOLUTION REQUIREMENT: Generate an image with EXACTLY ${originalWidth}x${originalHeight} pixels - matching the original SketchUp model image dimensions precisely.**

**ABSOLUTE CAMERA/VIEWPOINT PRESERVATION REQUIREMENT:**
- The camera angle, viewpoint, perspective, and framing of the SketchUp Model Image MUST be EXACTLY preserved
- Do NOT change the viewing angle, camera position, or field of view in ANY way
- Do NOT zoom in, zoom out, pan, tilt, or shift the perspective
- The exact spatial relationship between ALL elements in the SketchUp blueprint MUST remain identical
- Think of this as applying a photorealistic "skin" to the exact 3D view provided - the VIEW itself is LOCKED and IMMUTABLE
- The horizon line, vanishing points, and perspective must match the original EXACTLY

Your **sole and mandatory objective** is to transform the provided **SketchUp Model Blueprint** into a completely new, original, and photorealistic architectural rendering.

You are being provided with these inputs:
1.  **The Blueprint (SketchUp Model Image):** This is the **ABSOLUTE STRUCTURAL FOUNDATION** for your output. The EXACT camera viewpoint, perspective, geometry, layout, spatial composition, and framing of this image **MUST** be perfectly preserved. Do NOT alter the viewing angle or camera position in any way.
2.  **The Style Guide (Text):** This contains artistic direction derived from a style reference.
3.  **User's Modifications (Text):** These are **TOP-PRIORITY** instructions that **OVERRIDE** the Style Guide. If there is a conflict, **the user's modifications always win.**

**!!!--- ABSOLUTE PROHIBITION ---!!!**
You are not being shown the original style reference image. Do not try to replicate any image you might think is the reference. Your task is to create a **100% ORIGINAL work** based *only* on the SketchUp Blueprint's structure, the textual Style Guide's directions, and the user's overriding modifications.

---

**FOUR-PART RENDERING STRATEGY**

Execute your task by mentally dividing the SketchUp Blueprint into these four zones and applying the specific rules for each.

**1. The Main Building(s) - The Focal Point**
*   **Identify:** Locate the primary architectural subject(s) in the blueprint. These are typically the most detailed models.
*   **Render:** Apply photorealistic materials to these structures based on the "**Material Translation**" guide below. Pay extremely close attention to creating realistic textures, reflections, and interior lighting (glowing windows) as described. The final quality must be high-end.

**2. Surrounding Buildings - The Context**
*   **Identify:** Locate the simpler, often box-like, structures that form the context around the main building.
*   **Render:** These are your opportunity for creative facade generation. Create detailed, contemporary building facades that are thematically consistent with the main building and the overall "**Overall Artistic Style**" guide. These should look like believable, modern buildings but not draw excessive attention from the focal point.

**3. Landscaping & Infrastructure - The Ground Plane**
*   **Identify:** All ground-level elements: green/blue patches, grey areas for roads/paths.
*   **Render:** Transform these simple color blocks into a living environment.
    *   **Green:** Becomes lush, detailed, photorealistic vegetation (trees, shrubs, grass).
    *   **Blue:** Becomes realistic water with ripples and reflections.
    *   **Grey/Brown:** Becomes detailed asphalt or paving with realistic markings, textures, and subtle imperfections.
    *   **Enhance:** Add contextually appropriate details like streetlights, modern vehicles (if suitable for the scene), and possibly blurred figures of people to add life and scale.

**4. Distant Scenery & Sky - The Atmosphere**
*   **Identify:** The areas at and beyond the horizon of the SketchUp model. This is often an empty space.
*   **Render:** This is your canvas for creating the world. Generatively fill this entire space with a sky and distant scenery (e.g., a faint city skyline, misty mountains, a clear horizon over water) that **perfectly matches** the "**Overall Artistic Style**" guide, especially the "**Time & Sky**" and "**Lighting & Atmosphere**" sections. This background sets the final mood.

--- STYLE GUIDE & MODIFICATIONS ---
**1. User's Modifications (TOP PRIORITY):**
${textFeedback ? textFeedback : "No specific modifications provided. Follow the Analyzed Style."}

**2. Analyzed Style (from reference):**
${styleGuide}

**3. Material Translation Guide (fixed):**
${MATERIAL_TRANSLATION_GUIDE}
---

**Final Mandate:** Generate a single, high-quality, photorealistic image that is a faithful rendering of the **SketchUp Blueprint's structure**, artistically defined by the **Style Guide**, and precisely adjusted by the **User's Modifications**.`;

    // @ts-ignore
    const response = await ai.models.generateContent({
      model: generationModel,
      contents: {
        parts: [{ text: generationPrompt }, sketchPart],
      },
      // @ts-ignore
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: targetAspectRatio,
          imageSize: '4K',
        },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

    if (imagePart?.inlineData) {
      return res.status(200).json({
        imageData: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
      });
    }

    // Check for text refusal
    const textPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.text);
    if (textPart?.text) {
      throw new Error(`Model returned text instead of image: ${textPart.text.substring(0, 200)}`);
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error('Image generation blocked by safety filters.');
    }

    throw new Error('No image was generated. Check server logs for details.');
  } catch (error: any) {
    console.error('Generate error:', error);
    const message = error.message || 'Generation failed';
    const status = message.includes('API key') || message.includes('unauthenticated') ? 401 : 500;
    return res.status(status).json({ error: message });
  }
}
