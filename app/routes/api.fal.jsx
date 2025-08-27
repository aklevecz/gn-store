import { data as json } from '@shopify/remix-oxygen';
import { kontextMax, fluxUltra, configureFal, uploadFile } from '~/lib/fal-server';
import { fal } from "@fal-ai/client";

/**
 * API route for proxying fal.ai requests
 * Keeps the API key on the server side
 */

// Handle POST requests to /api/fal
export async function action({ request, context }) {
  console.log('API route for proxying fal.ai requests');
  // Get the API key from environment variables
  const apiKey = context.env.FAL_API_KEY;
  console.log('API key', apiKey);
  if (!apiKey) {
    return json(
      { error: 'FAL_API_KEY not configured in environment' },
      { status: 500 }
    );
  }

  // Configure fal with the API key
  configureFal(apiKey);

  try {
    const body = await request.json();
    const { model, ...params } = body;

    let result;

    // Route to the appropriate model function
    switch (model) {
      case 'kontext-max':
        result = await kontextMax(params);
        break;
      
      case 'flux-ultra':
        result = await fluxUltra(params);
        break;
      
      case 'upload':
        // Handle file upload - server fetches the file from URL
        const { fileUrl } = params;
        if (!fileUrl) {
          return json({ error: 'File URL required for upload' }, { status: 400 });
        }
        
        // Fetch the file from the provided URL
        const fileResponse = await fetch(`http://localhost:3000${fileUrl}`);
        const fileBlob = await fileResponse.blob();
        
        const uploadedUrl = await uploadFile(fileBlob);
        result = { file_url: uploadedUrl };
        break;
      
      default:
        return json(
          { error: `Unknown model: ${model}` },
          { status: 400 }
        );
    }

    console.log("FAL API Result:", JSON.stringify(result, null, 2));
    return json(result);
  } catch (error) {
    console.error('FAL API error:', error);
    return json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Optionally handle GET requests for health check
export async function loader() {
  return json({ status: 'ok', service: 'fal-proxy' });
}