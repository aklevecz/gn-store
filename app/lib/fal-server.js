// Direct API implementation for fal.ai
// Avoids CommonJS/ESM compatibility issues with @fal-ai/client

const FAL_API_BASE = "https://fal.run";
const FAL_QUEUE_BASE = "https://queue.fal.run";

// Store API key
let apiKey = null;

// Configure API key
export function configureFal(key) {
  if (!key) {
    throw new Error("FAL_API_KEY is required");
  }
  apiKey = key;
}

// Initialize from environment variable if available
if (typeof process !== 'undefined' && process.env?.FAL_API_KEY) {
  configureFal(process.env.FAL_API_KEY);
}

// Helper to make synchronous requests to fal.ai
async function falSyncRequest(endpoint, input) {
  if (!apiKey) {
    throw new Error("FAL_API_KEY not configured. Call configureFal() first.");
  }

  // Make synchronous request
  const response = await fetch(`${FAL_API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`FAL API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Poll for request completion
async function pollForResults(endpoint, requestId, maxAttempts = 120, delayMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const statusResponse = await fetch(`${FAL_QUEUE_BASE}/${endpoint}/requests/${requestId}/status?logs=1`, {
        headers: {
          "Authorization": `Key ${apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`);
      }

      const status = await statusResponse.json();
      
      console.log(`Request ${requestId} status:`, status.status);

      if (status.status === 'COMPLETED') {
        // Get the final result
        const resultResponse = await fetch(`${FAL_QUEUE_BASE}/${endpoint}/requests/${requestId}`, {
          headers: {
            "Authorization": `Key ${apiKey}`,
          },
        });

        if (!resultResponse.ok) {
          throw new Error(`Result fetch failed: ${resultResponse.status}`);
        }

        return resultResponse.json();
      } else if (status.status === 'FAILED') {
        throw new Error(`Request failed: ${status.error || 'Unknown error'}`);
      }

      // Still processing (IN_QUEUE or IN_PROGRESS), wait and try again
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error('Polling error:', error);
      if (i === maxAttempts - 1) throw error;
    }
  }
  
  throw new Error('Polling timeout - request did not complete in time');
}

/**
 * Kontext Max - Advanced image editing with text prompts
 * @param {Object} params
 * @param {string} params.prompt - Text description of the image edit
 * @param {string} params.imageUrl - Source image URL to edit
 * @param {number} [params.guidanceScale=3.5] - How closely to follow the prompt (0-20)
 * @param {number} [params.numImages=1] - Number of images to generate (1-4)
 * @param {number} [params.seed] - Seed for reproducible generation
 * @param {string} [params.safetyTolerance="2"] - Content filtering level
 * @param {boolean} [params.syncMode=false] - Wait for completion before returning
 * @returns {Promise<Object>} Generated image results
 */
export async function kontextMax({
  prompt,
  imageUrl,
  guidanceScale = 3.5,
  numImages = 1,
  seed,
  safetyTolerance = "6",
  syncMode = false
}) {
  if (!prompt || !imageUrl) {
    throw new Error("Both prompt and imageUrl are required");
  }

  const input = {
    prompt,
    image_url: imageUrl,
    guidance_scale: guidanceScale,
    num_images: numImages,
    safety_tolerance: safetyTolerance,
    sync_mode: syncMode
  };

  // Only add seed if provided
  if (seed !== undefined) {
    input.seed = seed;
  }

  try {
    const result = await falSyncRequest("fal-ai/flux-pro/kontext/max", input);
    return result;
  } catch (error) {
    console.error("Kontext Max error:", error);
    throw error;
  }
}

/**
 * Generic fal.ai model runner for any model
 * @param {string} modelId - The model identifier (e.g., "fal-ai/flux/dev")
 * @param {Object} input - Model-specific input parameters
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Model results
 */
export async function runModel(modelId, input, options = {}) {
  try {
    const result = await falSyncRequest(modelId, input);
    return result;
  } catch (error) {
    console.error(`Error running model ${modelId}:`, error);
    throw error;
  }
}

/**
 * FLUX 1.1 Ultra - Next-gen text-to-image with 2K resolution
 * @param {Object} params
 * @param {string} params.prompt - Text prompt for image generation
 * @param {string} [params.imageSize="landscape_4_3"] - Output image dimensions
 * @param {number} [params.guidanceScale=3.5] - How closely to follow the prompt
 * @param {number} [params.numImages=1] - Number of images to generate (1-4)
 * @param {number} [params.seed] - Seed for reproducible generation
 * @param {string} [params.safetyTolerance="2"] - Content filtering level
 * @param {string} [params.outputFormat="jpeg"] - Output format (jpeg/png)
 * @param {boolean} [params.enhancePrompt=false] - Enhance the prompt automatically
 * @param {boolean} [params.syncMode=false] - Wait for completion before returning
 * @returns {Promise<Object>} Generated image results
 */
export async function fluxUltra({
  prompt,
  imageSize = "landscape_4_3",
  guidanceScale = 3.5,
  numImages = 1,
  seed,
  safetyTolerance = "2",
  outputFormat = "jpeg",
  enhancePrompt = false,
  syncMode = false
}) {
  if (!prompt) {
    throw new Error("Prompt is required");
  }

  const input = {
    prompt,
    image_size: imageSize,
    guidance_scale: guidanceScale,
    num_images: numImages,
    safety_tolerance: safetyTolerance,
    output_format: outputFormat,
    enhance_prompt: enhancePrompt,
    sync_mode: syncMode
  };

  // Only add seed if provided
  if (seed !== undefined) {
    input.seed = seed;
  }

  try {
    const result = await falSyncRequest("fal-ai/flux-pro/v1.1-ultra", input);
    return result;
  } catch (error) {
    console.error("FLUX Ultra error:", error);
    throw error;
  }
}

/**
 * Upload a file to fal.ai storage using the SDK
 * @param {File|Blob} file - File or Blob to upload
 * @returns {Promise<string>} The uploaded file URL
 */
export async function uploadFile(file) {
  const { fal } = await import("@fal-ai/client");
  
  if (!apiKey) {
    throw new Error("FAL_API_KEY not configured. Call configureFal() first.");
  }

  fal.config({ credentials: apiKey });
  
  const url = await fal.storage.upload(file);
  console.log('Upload result:', url);
  return url;
}

/**
 * Upload a file URL for use with fal.ai
 * Note: For server-side file uploads, you'll need to upload to your own CDN first
 * @param {string} fileUrl - URL of the file to use
 * @returns {string} The file URL to use with fal.ai
 */
export function prepareFileUrl(fileUrl) {
  // Ensure the URL is accessible from fal.ai servers
  if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
    throw new Error('File URL must be a valid HTTP/HTTPS URL');
  }
  return fileUrl;
}

