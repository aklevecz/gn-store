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
      
      case 'upload-blob':
        // Handle blob upload from client
        const { blobData, fileName: blobFileName } = params;
        if (!blobData) {
          return json({ error: 'Blob data required for upload' }, { status: 400 });
        }
        
        // Convert base64 to blob
        const blobResponse = await fetch(blobData);
        const blob = await blobResponse.blob();
        
        // Get file extension and mime type
        const blobExtension = blobFileName?.split('.').pop() || 'png';
        const blobMimeType = blobExtension === 'png' ? 'image/png' : 
                            blobExtension === 'svg' ? 'image/svg+xml' : 
                            'application/octet-stream';
        
        // Create proper File object
        const blobFile = new File([blob], blobFileName || 'image.png', { type: blobMimeType });
        
        const blobUploadUrl = await uploadFile(blobFile);
        result = { file_url: blobUploadUrl };
        break;
      
      case 'upload':
        // Handle file upload - server fetches the file from URL
        const { fileUrl } = params;
        if (!fileUrl) {
          return json({ error: 'File URL required for upload' }, { status: 400 });
        }
        
        // Determine the base URL based on the request URL
        const requestUrl = new URL(request.url);
        const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
        const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;
        
        // Fetch the file from the provided URL
        const fileResponse = await fetch(fullUrl);
        const arrayBuffer = await fileResponse.arrayBuffer();
        
        // Get the file extension from the URL
        const fileName = fileUrl.split('/').pop();
        const fileExtension = fileName.split('.').pop();
        const mimeType = fileExtension === 'png' ? 'image/png' : 
                        fileExtension === 'svg' ? 'image/svg+xml' : 
                        'application/octet-stream';
        
        // Create a proper File object with the correct MIME type
        const file = new File([arrayBuffer], fileName, { type: mimeType });
        
        const uploadedUrl = await uploadFile(file);
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
export async function loader({ request, context }) {
  return json({ status: 'ok', service: 'fal-proxy' });
}