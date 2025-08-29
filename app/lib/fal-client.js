/**
 * Client-side wrapper for fal.ai API calls
 * Routes requests through our server proxy to hide API keys
 */

/**
 * Call a fal.ai model through our server proxy
 * @param {string} model - Model identifier ('kontext-max', 'flux-ultra', or 'upload')
 * @param {Object} params - Model-specific parameters
 * @returns {Promise<Object>} Model results
 */
async function callFalModel(model, params) {
  const response = await fetch('/api/fal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      ...params
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Upload file to fal storage by URL (server fetches the file)
 * @param {string} fileUrl - URL of file to upload
 * @returns {Promise<string>} Uploaded file URL
 */
export async function uploadFileByUrl(fileUrl) {
  return callFalModel('upload', { fileUrl });
}

/**
 * Kontext Max - Advanced image editing (client-side)
 * @param {Object} params
 * @param {string} params.prompt - Text description of the image edit
 * @param {string} params.imageUrl - Source image URL to edit
 * @param {number} [params.guidanceScale=3.5] - How closely to follow the prompt
 * @param {number} [params.numImages=1] - Number of images to generate (1-4)
 * @param {number} [params.seed] - Seed for reproducible generation
 * @param {string} [params.safetyTolerance="6"] - Content filtering level
 * @returns {Promise<Object>} Generated image results
 */
export async function kontextMax(params) {
  return callFalModel('kontext-max', params);
}

/**
 * FLUX 1.1 Ultra - Text-to-image generation (client-side)
 * @param {Object} params
 * @param {string} params.prompt - Text prompt for image generation
 * @param {string} [params.imageSize="landscape_4_3"] - Output image dimensions
 * @param {number} [params.guidanceScale=3.5] - How closely to follow the prompt
 * @param {number} [params.numImages=1] - Number of images to generate (1-4)
 * @param {number} [params.seed] - Seed for reproducible generation
 * @param {string} [params.safetyTolerance="2"] - Content filtering level
 * @param {string} [params.outputFormat="jpeg"] - Output format
 * @param {boolean} [params.enhancePrompt=false] - Enhance the prompt automatically
 * @returns {Promise<Object>} Generated image results
 */
export async function fluxUltra(params) {
  return callFalModel('flux-ultra', params);
}

/**
 * Check if we're running on the server or client
 * @returns {boolean} True if running on server
 */
export function isServer() {
  return typeof window === 'undefined';
}