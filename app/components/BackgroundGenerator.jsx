import { useEffect, useState, useRef } from "react";
import { fluxUltra, kontextMax, uploadFileByUrl } from "../lib/fal-client";
import { backgroundImageCache, cacheManager } from "~/lib/cache";

export function BackgroundGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [background, setBackground] = useState(null);
  const [error, setError] = useState(null);
  const initRef = useRef(false);

  const applyBackgroundImage = (imageUrl) => {
    // Remove any existing background elements
    const existingBg = document.querySelector('.generated-background');
    if (existingBg) {
      existingBg.remove();
    }
    
    // Create background element
    const bgElement = document.createElement('div');
    bgElement.className = 'generated-background';
    bgElement.style.position = 'fixed';
    bgElement.style.top = '0';
    bgElement.style.left = '0';
    bgElement.style.width = '100%';
    bgElement.style.height = '100%';
    bgElement.style.backgroundImage = `url(${imageUrl})`;
    bgElement.style.backgroundSize = 'cover';
    bgElement.style.backgroundPosition = 'center';
    bgElement.style.backgroundRepeat = 'no-repeat';
    bgElement.style.zIndex = '-2';
    bgElement.style.opacity = '0';
    bgElement.style.transition = 'opacity 1.5s ease-in-out';
    bgElement.style.pointerEvents = 'none';
    
    document.body.appendChild(bgElement);
    
    // Preload image then fade in
    const img = new Image();
    img.onload = () => {
      setTimeout(() => {
        bgElement.style.opacity = '1';
      }, 100);
    };
    img.src = imageUrl;
    
    // Add overlay
    let overlay = document.querySelector('.bg-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'bg-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.75)';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '-1';
      document.body.appendChild(overlay);
    }
  };

  const handleGenerateStyleBackground = async (forceGenerate = false) => {
    setIsGenerating(true);
    setError(null);
    setBackground(null);
    try {
      // Pick a random style reference image from the public images
      const styleImages = [
        '/images/hifive-color.png',
        '/images/juggle-color.png',
        '/images/infatuation-color.png',
        '/images/carry-color.png',
        '/images/welcome-color.png',
        '/images/spin-color.png'
      ];
      
      const randomStyleImage = styleImages[Math.floor(Math.random() * styleImages.length)];
      
      // Check cache first (unless force generating)
      if (!forceGenerate) {
        const cachedBackground = backgroundImageCache.get(randomStyleImage);
        if (cachedBackground) {
          console.log('Using cached background for:', randomStyleImage);
          setBackground(cachedBackground.imageUrl);
          applyBackgroundImage(cachedBackground.imageUrl);
          setIsGenerating(false);
          return;
        }
      }
      
      console.log('Generating new background for:', randomStyleImage);
      
      // Fetch the image as blob on client
      const response = await fetch(randomStyleImage);
      const blob = await response.blob();
      
      // Convert blob to base64 for JSON transport
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      // Send to server for upload to fal
      const uploadResponse = await fetch('/api/fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'upload-blob',
          blobData: base64,
          fileName: randomStyleImage.split('/').pop()
        }),
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to fal');
      }
      
      const uploadResult = await uploadResponse.json();
      const uploadedUrl = uploadResult.file_url;
      console.log('Uploaded to fal:', uploadedUrl);
      const result = await kontextMax({
        prompt: "in the style of the given image, create a background of beautiful forest with mystical trees and giant blooming flowers",
        imageUrl: uploadedUrl,
        guidanceScale: 4.0,
        numImages: 1
      });
      
      console.log('kontext result', result);
      if (result.images && result.images.length > 0) {
        const generatedImageUrl = result.images[0].url;
        setBackground(generatedImageUrl);
        
        // Cache the generated background
        backgroundImageCache.set(randomStyleImage, generatedImageUrl);
        console.log('Cached background for:', randomStyleImage);
        
        // Apply the background with fade-in effect
        applyBackgroundImage(generatedImageUrl);
      } else {
        setError("No image was generated");
      }
    } catch (err) {
      console.error("Kontext generation error:", err);
      setError(err.message || "Failed to generate style background");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBackground = async () => {
    setIsGenerating(true);
    setError(null);
    setBackground(null);
    try {
      const result = await fluxUltra({ 
        prompt: "vinyl records sitting among blooming flowers",
        imageSize: "landscape_16_9",
        numImages: 1
      });
      
      // The result has an images array with image objects
      // const result = {images: [{url: 'https://fal.media/files/penguin/BsdTHrxnqF_S51tSeI3_I_4e4fa4ed3e6446f9987d17cf5b9c8afe.jpg'}]}
      console.log('result', result);
      if (result.images && result.images.length > 0) {
        const imageUrl = result.images[0].url;
        setBackground(imageUrl);
        
        // Set the body background image
        document.body.style.backgroundImage = `url(${imageUrl})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        
        // Add a semi-transparent overlay for opacity effect
        let overlay = document.querySelector('.bg-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'bg-overlay';
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.75)'; // White overlay with 30% opacity
          overlay.style.pointerEvents = 'none';
          overlay.style.zIndex = '-1';
          document.body.appendChild(overlay);
        }
      } else {
        setError("No image was generated");
      }
    } catch (err) {
      console.error("Generation error:", err);
      setError(err.message || "Failed to generate background");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      
      // Check if we have any cached backgrounds first
      const styleImages = [
        '/images/hifive-color.png',
        '/images/juggle-color.png',
        '/images/infatuation-color.png',
        '/images/carry-color.png',
        '/images/welcome-color.png',
        '/images/spin-color.png'
      ];
      
      // Try to find a cached background
      let foundCachedBackground = false;
      // for (const styleImage of styleImages) {
      //   const cachedBackground = backgroundImageCache.get(styleImage);
      //   if (cachedBackground) {
      //     console.log('Found cached background on init:', styleImage);
      //     setBackground(cachedBackground.imageUrl);
      //     applyBackgroundImage(cachedBackground.imageUrl);
      //     foundCachedBackground = true;
      //     break;
      //   }
      // }
      
      // If no cached background found, generate a new one
      if (!foundCachedBackground) {
        handleGenerateStyleBackground();
      }
    }
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "600px", display: 'none' }}>
      <button
        className="button"
        style={{
          position: 'absolute', 
          top: '120px', 
          left: '20px',
          transform: isGenerating ? 'scale(1.1) skew(-2deg)' : 'scale(1) skew(0deg)',
          backgroundColor: isGenerating ? '#ff6b6b' : '#000',
          transition: 'all 0.3s ease',
          animation: isGenerating ? 'pulse 1.5s infinite' : 'none'
        }}
        onClick={() => handleGenerateStyleBackground(true)} 
        disabled={isGenerating}
      >
{isGenerating ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/images/spin-color.svg" 
              alt="Loading" 
              style={{ 
                width: '20px', 
                height: '20px', 
                animation: 'spin 1s linear infinite' 
              }} 
            />
            Generating Style...
          </span>
        ) : (
          "Generate Style Background"
        )}
      </button>
      
      <button
        className="button"
        style={{
          position: 'absolute', 
          top: '180px', 
          left: '20px',
          transform: isGenerating ? 'scale(1.1) skew(-2deg)' : 'scale(1) skew(0deg)',
          backgroundColor: isGenerating ? '#ff6b6b' : '#333',
          transition: 'all 0.3s ease',
          animation: isGenerating ? 'pulse 1.5s infinite' : 'none'
        }}
        onClick={handleGenerateBackground} 
        disabled={isGenerating}
      >
{isGenerating ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img 
              src="/images/spin-color.svg" 
              alt="Loading" 
              style={{ 
                width: '20px', 
                height: '20px', 
                animation: 'spin 1s linear infinite' 
              }} 
            />
            Generating...
          </span>
        ) : (
          "Generate Flux Background"
        )}
      </button>
      
      <button
        className="button"
        style={{
          position: 'absolute', 
          top: '240px', 
          left: '20px',
          backgroundColor: '#666',
          fontSize: '12px',
          padding: '8px 16px'
        }}
        onClick={() => {
          backgroundImageCache.clearAll();
          console.log('Cleared all background caches');
        }}
        disabled={isGenerating}
      >
        Clear Cache
      </button>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0% { transform: scale(1.1) skew(-2deg); }
            50% { transform: scale(1.15) skew(2deg); }
            100% { transform: scale(1.1) skew(-2deg); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `
      }} />
      
      {error && (
        <p style={{ marginTop: "10px", color: "red" }}>
          Error: {error}
        </p>
      )}
    </div>
  );
}