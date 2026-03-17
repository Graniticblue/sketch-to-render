// Helper to strip data URI prefix and return raw base64
const toRawBase64 = (base64String: string): string =>
  base64String.includes(',') ? base64String.split(',')[1] : base64String;

// Helper to upscale image if it's too small (uses browser canvas API)
const upscaleImageIfNeeded = (base64String: string, targetMinSize: number = 2048): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (Math.max(width, height) >= targetMinSize) {
        resolve(base64String);
        return;
      }

      const scale = targetMinSize / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);

      console.log(`Upscaling reference image from ${img.width}x${img.height} to ${width}x${height}`);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64String); return; }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.onerror = reject;
    img.src = base64String;
  });
};

// Helper function to get image dimensions from base64
const getImageDimensions = (base64String: string): Promise<{ width: number, height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = reject;
    img.src = base64String;
  });
};

// Helper to find the nearest supported aspect ratio
const getNearestAspectRatio = (width: number, height: number): string => {
  const ratio = width / height;
  const ratios = [
    { name: '1:1', value: 1.0 },
    { name: '4:3', value: 4 / 3 },
    { name: '3:4', value: 3 / 4 },
    { name: '16:9', value: 16 / 9 },
    { name: '9:16', value: 9 / 16 },
  ];
  let closest = ratios[0];
  let minDiff = Math.abs(ratio - closest.value);
  for (const r of ratios) {
    const diff = Math.abs(ratio - r.value);
    if (diff < minDiff) { minDiff = diff; closest = r; }
  }
  console.log(`Detected image ratio: ${ratio.toFixed(2)}, snapping to: ${closest.name}`);
  return closest.name;
};

// Helper for POST requests to our API routes
const callApi = async (endpoint: string, body: object): Promise<any> => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    // Response was not JSON — likely an HTML error page
    throw new Error(`Server error (${res.status}): ${text.substring(0, 200)}`);
  }
  if (!res.ok || data.error) {
    throw new Error(data.error || `API call failed (${res.status})`);
  }
  return data;
};

/**
 * API 연결 테스트
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/test-connection');
    const data = await res.json();
    return data.connected === true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

export const generateRendering = async (
  styleRefBase64: string,
  newSketchupBase64: string,
  textFeedback: string
): Promise<string> => {
  // 1. Upscale style reference client-side (requires browser canvas)
  const highResStyleRef = await upscaleImageIfNeeded(styleRefBase64, 2048);

  // 2. Get sketch dimensions for aspect ratio
  const { width: originalWidth, height: originalHeight } = await getImageDimensions(newSketchupBase64);
  const targetAspectRatio = getNearestAspectRatio(originalWidth, originalHeight);

  // 3. Analyze style (server-side Gemini call)
  const { styleGuide } = await callApi('/api/analyze', {
    styleRefBase64: toRawBase64(highResStyleRef),
    mimeType: 'image/jpeg',
  });

  // 4. Generate rendering (server-side Gemini call)
  const { imageData, mimeType } = await callApi('/api/generate', {
    sketchBase64: toRawBase64(newSketchupBase64),
    styleGuide,
    textFeedback,
    targetAspectRatio,
    originalWidth,
    originalHeight,
    mimeType: 'image/jpeg',
  });

  return `data:${mimeType};base64,${imageData}`;
};

export const retouchRendering = async (currentImageBase64: string, retouchPrompt: string): Promise<string> => {
  const { imageData, mimeType } = await callApi('/api/retouch', {
    imageBase64: toRawBase64(currentImageBase64),
    retouchPrompt,
    mimeType: 'image/jpeg',
  });

  return `data:${mimeType};base64,${imageData}`;
};
