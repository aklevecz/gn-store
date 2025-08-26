import { useState } from "react";
import { fluxUltra } from "../lib/fal-client";

export function BackgroundGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [background, setBackground] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerateBackground = async () => {
    setIsGenerating(true);
    setError(null);
    setBackground(null);
    try {
      // const result = await fluxUltra({ 
      //   prompt: "a forest filled with light colored vinyl records",
      //   imageSize: "landscape_16_9",
      //   numImages: 1
      // });
      
      // The result has an images array with image objects
      const result = {images: [{url: 'https://fal.media/files/penguin/BsdTHrxnqF_S51tSeI3_I_4e4fa4ed3e6446f9987d17cf5b9c8afe.jpg'}]}
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

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
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
          "Generate Background"
        )}
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