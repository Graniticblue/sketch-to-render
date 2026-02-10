import { GoogleGenAI } from "@google/genai";

// Using Gemini 2.5 Flash Image for high-quality image generation
const analysisModel = 'gemini-2.5-flash'; // For vision/analysis
const generationModel = 'gemini-2.5-flash-image'; // For high-quality image generation

// This guide for translating specific SketchUp colors into materials remains fixed.
const MATERIAL_TRANSLATION_GUIDE = `*   **Material Translation (SketchUp Model to Rendering Result):**
    *   **SketchUp Grey (Building Facades):** Translates into highly reflective, multi-paneled glass facades, polished light-colored concrete or stone, and subtle metallic accents. These materials vividly reflect the sky and surrounding environment, and many windows glow warmly from within.
    *   **SketchUp Transparent (Facade Glass):** Is always rendered as photorealistic glass. This glass should be transparent and reflective, accurately showing the interior (if modeled) and reflecting the exterior environment (sky, other buildings).
    *   **SketchUp Dark Grey/Brown (Accent Building Facades):** Becomes textured dark concrete, contemporary dark metallic panels, or deep wood-effect cladding. These provide visual contrast and depth, and may exhibit internal light where applicable.
    *   **SketchUp White (Building Tops/Details):** Rendered as crisp, clean white concrete or smooth, light-toned stone elements, often subtly illuminated, contributing to a sleek and modern aesthetic.
    *   **SketchUp Green (Landscaping/Terrain):** Transformed into lush, highly detailed, photorealistic vegetation, including a diverse array of mature trees, varied shrubs, and manicured grass, displaying natural light and shadow play.
    *   **SketchUp Blue (Water):** Becomes a realistic body of water with subtle surface ripples, naturalistic color variations, and accurate reflections of the sky and surrounding buildings.
    *   **SketchUp Dark Grey/Brown (Roads/Paving):** Rendered as detailed asphalt roads with clear lane markings, integrated lampposts, and realistic vehicle movement. Pedestrian zones are enhanced with textured paving stones and landscaped pathways.`;

let storedApiKey: string | null = null;

export const setGeminiApiKey = (key: string) => {
  if (!key) return;
  const cleanKey = key.trim();
  console.log("Setting API Key:", cleanKey.substring(0, 5) + "..." + cleanKey.substring(cleanKey.length - 4));
  storedApiKey = cleanKey;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gemini_api_key'); // Clear first
    localStorage.setItem('gemini_api_key', cleanKey);
  }
};

export const getGeminiApiKey = (): string | null => {
  if (storedApiKey) return storedApiKey;
  if (typeof window !== 'undefined') {
    const localKey = localStorage.getItem('gemini_api_key');
    if (localKey) {
      storedApiKey = localKey;
      return localKey;
    }
  }
  // Fallback to env var if available (Vite define)
  if (process.env.API_KEY) return process.env.API_KEY;
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  return null;
};

// Helper function to convert base64 to GenerativePart
const fileToGenerativePart = (base64String: string, mimeType: string = 'image/jpeg') => {
  return {
    inlineData: {
      data: base64String.split(',')[1] || base64String, // Handle data URI prefix
      mimeType
    },
  };
};

/**
 * API 연결 테스트를 위한 함수
 */
export const testConnection = async (): Promise<boolean> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    console.warn("testConnection: No API Key found.");
    return false;
  }

  console.log("Testing connection with Key:", apiKey.substring(0, 4) + "...");

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use a simple prompt to test connection
    const response = await ai.models.generateContent({
      model: analysisModel, // Use the same model as generation
      contents: { parts: [{ text: "ping" }] },
    });
    console.log("Connection Test Success:", response);
    return !!response;
  } catch (error) {
    console.error("API Connection Test Failed:", error);
    return false;
  }
};

export const generateRendering = async (
  styleRefBase64: string,
  newSketchupBase64: string,
  textFeedback: string
): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("API Key is missing. Please select your API Key in settings.");

  const ai = new GoogleGenAI({ apiKey });

  // Note: Arguments order in function signature matches usage in App.tsx: (style, sketch, feedback)
  const newSketchupPart = fileToGenerativePart(newSketchupBase64);
  const styleRefPart = fileToGenerativePart(styleRefBase64);

  // 1. Analyze Style (Gemini Vision) - Enhanced analysis prompt
  const analysisPrompt = `Analyze the provided style reference image and generate a detailed artistic style description. This description will be used as a guide to render a new image. Structure your response under the heading "**Overall Artistic Style (Inferred from Style Reference, Applied to Rendering Result):**" and include the following subsections, formatted exactly as shown:

*   **Mood & Tone:** [Describe the emotional feel, atmosphere, and overall vibe of the image.]
*   **Lighting & Atmosphere:** [Describe the quality of light (e.g., soft, harsh, diffuse), the direction of light, the presence of shadows, and the overall atmospheric conditions (e.g., clear, hazy, misty).]
*   **Time & Sky:** [Describe the time of day and the appearance of the sky (e.g., clear blue, overcast, sunset colors, starry night).]

Your description should be clear, concise, and actionable for a generative AI model.`;

  const analysisResponse = await ai.models.generateContent({
    model: analysisModel,
    contents: { parts: [{ text: analysisPrompt }, styleRefPart] },
  });
  const analyzedStyleGuide = analysisResponse.text || JSON.stringify(analysisResponse);

  // 2. Generate high-quality rendering with comprehensive prompt
  const generationPrompt = `**CRITICAL MISSION: TRANSFORM SKETCHUP BLUEPRINT TO PHOTOREALISTIC RENDERING**

Your **sole and mandatory objective** is to transform the provided **SketchUp Model Blueprint** into a completely new, original, and photorealistic architectural rendering.

You are being provided with these inputs:
1.  **The Blueprint (SketchUp Model Image):** This is the **ABSOLUTE STRUCTURAL FOUNDATION** for your output. The geometry, layout, and composition of this image **MUST** be perfectly preserved.
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
${analyzedStyleGuide}

**3. Material Translation Guide (fixed):**
${MATERIAL_TRANSLATION_GUIDE}
---

**Final Mandate:** Generate a single, high-quality, photorealistic image that is a faithful rendering of the **SketchUp Blueprint's structure**, artistically defined by the **Style Guide**, and precisely adjusted by the **User's Modifications**.`;

  console.log("Image Generation Prompt:", generationPrompt); // Debug

  try {
    // gemini-2.5-flash-image does not need responseModalities config
    const response = await ai.models.generateContent({
      model: generationModel,
      contents: {
        parts: [
          { text: generationPrompt },
          newSketchupPart
        ],
      }
    });

    console.log("Full Generation Response:", JSON.stringify(response, null, 2)); // Debug
    console.log("Response candidates:", response.candidates);
    console.log("First candidate:", response.candidates?.[0]);
    console.log("First candidate content:", response.candidates?.[0]?.content);
    console.log("First candidate parts:", response.candidates?.[0]?.content?.parts);

    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePart?.inlineData) {
      return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    } else {
      console.error("NO IMAGE PART FOUND. Checking all parts:");
      response.candidates?.[0]?.content?.parts?.forEach((part, idx) => {
        console.log(`Part ${idx}:`, Object.keys(part), part);
      });

      // If no image, check for text (error or refusal)
      const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
      if (textPart?.text) {
        console.warn("Model returned text instead of image:", textPart.text);
        throw new Error(`Model returned text: ${textPart.text.substring(0, 100)}...`);
      }

      if (response.candidates?.[0]?.finishReason) {
        console.warn("Finish Reason:", response.candidates[0].finishReason);
        if (response.candidates[0].finishReason === 'SAFETY') {
          throw new Error("Image generation blocked by safety filters.");
        }
      }
    }

    throw new Error('No image was generated (and no text explanation). check console for details.');
  } catch (error) {
    console.error("Generation Error Details:", error);
    throw error;
  }
};

export const retouchRendering = async (currentImageBase64: string, retouchPrompt: string): Promise<string> => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  const imagePart = fileToGenerativePart(currentImageBase64);

  const response = await ai.models.generateContent({
    model: generationModel,
    contents: {
      parts: [imagePart, { text: `Edit this image based on: ${retouchPrompt} ` }],
    }
  });

  const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
  if (imagePartResponse?.inlineData) {
    return `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
  }
  throw new Error('No retouched image was generated.');
};