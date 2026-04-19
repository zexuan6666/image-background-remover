// Cloudflare Pages Function — handles /api/remove-bg
// Place this in /functions/api/remove-bg.ts

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = context.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Remove.bg API key not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await context.request.formData();
    const imageFile = formData.get('image_file') as File | null;

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Forward to remove.bg API
    const bgFormData = new FormData();
    bgFormData.append('image_file', imageFile);
    bgFormData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v3.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: bgFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('remove.bg API error:', response.status, errorText);
      return new Response(
        JSON.stringify({
          error: `remove.bg API error: ${response.status}. Please check your API key and try again.`,
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream the result back (PNG image)
    const resultBlob = await response.blob();
    return new Response(resultBlob, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="no-bg.png"',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
