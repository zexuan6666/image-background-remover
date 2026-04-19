// Cloudflare Pages Function — /api/remove-bg
// Handles background removal via remove.bg API

interface Env {
  REMOVE_BG_API_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (context.request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const apiKey = context.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      { error: 'Server configuration error. API key not set.' },
      500
    );
  }

  try {
    const formData = await context.request.formData();
    const imageFile = formData.get('image_file');

    if (!imageFile || !(imageFile instanceof File)) {
      return jsonResponse(
        { error: 'No image file provided. Please upload an image.' },
        400
      );
    }

    // Size limit: 10MB
    if (imageFile.size > 10 * 1024 * 1024) {
      return jsonResponse(
        { error: 'File is too large. Maximum size is 10MB.' },
        413
      );
    }

    // Forward to remove.bg API
    const bgFormData = new FormData();
    bgFormData.append('image_file', imageFile);
    bgFormData.append('size', 'auto');
    bgFormData.append('format', 'png');

    const response = await fetch('https://api.remove.bg/v3.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: bgFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('remove.bg API error:', response.status, errorText);

      if (response.status === 402 || response.status === 429) {
        return jsonResponse(
          { error: 'API quota exceeded. Please try again later.' },
          response.status
        );
      }

      if (response.status === 400) {
        return jsonResponse(
          { error: 'Unable to process this image. Please try a different image.' },
          400
        );
      }

      return jsonResponse(
        { error: `Background removal failed (${response.status}). Please try again.` },
        502
      );
    }

    // Return the PNG result
    const resultBlob = await response.blob();
    return new Response(resultBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('remove-bg function error:', message);
    return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500);
  }
};

function jsonResponse(data: Record<string, string>, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
