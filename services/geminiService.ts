import { GoogleGenAI } from "@google/genai";

// Using Gemini 3 Pro models for both analysis and image generation
const analysisModel = 'gemini-3-pro-preview'; // For vision/analysis (understanding reference images)
const generationModel = 'gemini-3-pro-image-preview'; // For 4K image generation

// This guide for translating specific SketchUp colors into materials remains fixed.
const MATERIAL_TRANSLATION_GUIDE = `*   **Material Translation (SketchUp Model to Rendering Result):**
    *   **SketchUp Grey (Building Facades):** Translates into highly reflective, multi-paneled glass facades, polished light-colored concrete or stone, and subtle metallic accents. These materials vividly reflect the sky and surrounding environment, and many windows glow warmly from within.
    *   **SketchUp Transparent (Facade Glass):** Is always rendered as photorealistic glass. This glass should be transparent and reflective, accurately showing the interior (if modeled) and reflecting the exterior environment (sky, other buildings).
    *   **SketchUp Dark Grey/Brown (Accent Building Facades):** Becomes textured dark concrete, contemporary dark metallic panels, or deep wood-effect cladding. These provide visual contrast and depth, and may exhibit internal light where applicable.
    *   **SketchUp White (Building Tops/Details):** Rendered as crisp, clean white concrete or smooth, light-toned stone elements, often subtly illuminated, contributing to a sleek and modern aesthetic.
    *   **SketchUp Green (Landscaping/Terrain):** Transformed into lush, highly detailed, photorealistic vegetation, including a diverse array of mature trees, varied shrubs, and manicured grass, displaying natural light and shadow play.
    *   **SketchUp Blue (Water):** Becomes a realistic body of water with subtle surface ripples, naturalistic color variations, and accurate reflections of the sky and surrounding buildings.
    *   **SketchUp Dark Grey/Brown (Roads/Paving):** Rendered as detailed asphalt roads with clear lane markings, integrated lampposts, and realistic vehicle movement. Pedestrian zones are enhanced with textured paving stones and landscaped pathways.`;

// Hardcoded API Key
const GEMINI_API_KEY = 'AIzaSyDAsnqDi_zWQKg2n8LT1GjUkGDdiAAcAVY';

// Helper function to convert base64 to GenerativePart
const fileToGenerativePart = (base64String: string, mimeType: string = 'image/jpeg') => {
  return {
    inlineData: {
      data: base64String.split(',')[1] || base64String, // Handle data URI prefix
      mimeType
    },
  };
};

// Helper to upscale image if it's too small (to ensure high-res output trigger)
const upscaleImageIfNeeded = (base64String: string, targetMinSize: number = 2048): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // If image is already large enough, return original
      if (Math.max(width, height) >= targetMinSize) {
        resolve(base64String);
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      const scale = targetMinSize / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      console.log(`Upscaling reference image from ${img.width}x${img.height} to ${width}x${height}`);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64String); // Fallback to original if context fails
        return;
      }

      // Use better interpolation for upscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', 0.95)); // High quality JPEG
    };
    img.onerror = reject;
    img.src = base64String;
  });
};

// Helper function to get image dimensions from base64
const getImageDimensions = (base64String: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = base64String;
  });
};

// Helper to find the nearest supported aspect ratio
const getNearestAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;

  // Define standard aspect ratios supported by Gemini/Imagen
  const ratios = [
    { name: '1:1', value: 1.0 },
    { name: '4:3', value: 4 / 3 },
    { name: '3:4', value: 3 / 4 },
    { name: '16:9', value: 16 / 9 },
    { name: '9:16', value: 9 / 16 },
  ];

  // Find the closest ratio
  let closest = ratios[0];
  let minDiff = Math.abs(ratio - closest.value);

  for (const r of ratios) {
    const diff = Math.abs(ratio - r.value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = r;
    }
  }

  console.log(`Detected image ratio: ${ratio.toFixed(2)}, snapping to nearest supported ratio: ${closest.name}`);
  return closest.name;
};

export const generateRendering = async (
  styleRefBase64: string,
  newSketchupBase64: string,
  textFeedback: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  // Note: Arguments order in function signature matches usage in App.tsx: (style, sketch, feedback)
  const newSketchupPart = fileToGenerativePart(newSketchupBase64);

  // Upscale style reference if it's low res (to signal high-quality intent)
  const highResStyleRef = await upscaleImageIfNeeded(styleRefBase64, 2048);
  const styleRefPart = fileToGenerativePart(highResStyleRef);

  // Get original SketchUp image dimensions to preserve exact size
  const { width: originalWidth, height: originalHeight } = await getImageDimensions(newSketchupBase64);
  const targetAspectRatio = getNearestAspectRatio(originalWidth, originalHeight);

  // 1. Analyze Style (Gemini Vision) - Comprehensive architectural rendering analysis
  const analysisPrompt = `You are an expert architectural visualization analyst. Analyze the provided style reference image and generate a comprehensive style description. This description will be used to guide the rendering of a new architectural image. Do NOT analyze composition or camera angle.

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

  const analysisResponse = await ai.models.generateContent({
    model: analysisModel,
    contents: { parts: [{ text: analysisPrompt }, styleRefPart] },
  });
  const analyzedStyleGuide = analysisResponse.text || JSON.stringify(analysisResponse);

  // 2. Generate high-quality rendering with comprehensive prompt
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
${analyzedStyleGuide}

**3. Material Translation Guide (fixed):**
${MATERIAL_TRANSLATION_GUIDE}
---

**Final Mandate:** Generate a single, high-quality, photorealistic image that is a faithful rendering of the **SketchUp Blueprint's structure**, artistically defined by the **Style Guide**, and precisely adjusted by the **User's Modifications**.`;

  console.log("Image Generation Prompt:", generationPrompt); // Debug

  try {
    // Official SDK structure for gemini-3-pro-image-preview
    // See: https://ai.google.dev/gemini-api/docs/image-generation
    const response = await ai.models.generateContent({
      model: generationModel,
      contents: {
        parts: [
          { text: generationPrompt },
          newSketchupPart
        ],
      },
      // @ts-ignore - config is the correct parameter for image generation settings
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: targetAspectRatio,
          imageSize: '4K',  // '1K', '2K', '4K' - must be uppercase K
        },
      },
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
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const imagePart = fileToGenerativePart(currentImageBase64);

  const response = await ai.models.generateContent({
    model: generationModel,
    contents: {
      parts: [imagePart, { text: `Edit this image based on: ${retouchPrompt}` }],
    },
    // @ts-ignore - config is the correct parameter for image generation settings
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: '1:1',
        imageSize: '4K',  // Maintain 4K resolution for retouching
      },
    },
  });

  const imagePartResponse = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
  if (imagePartResponse?.inlineData) {
    return `data:${imagePartResponse.inlineData.mimeType};base64,${imagePartResponse.inlineData.data}`;
  }
  throw new Error('No retouched image was generated.');
};