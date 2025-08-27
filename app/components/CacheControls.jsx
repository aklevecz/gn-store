import { vinylFactCache, backgroundImageCache, cacheManager } from '~/lib/cache';

export function CacheControls() {
  const handleClearVinylFacts = () => {
    vinylFactCache.clear();
    console.log('Cleared vinyl fact cache');
    // Optionally reload the page to see the effect
    window.location.reload();
  };

  const handleClearBackgrounds = () => {
    backgroundImageCache.clearAll();
    console.log('Cleared background cache');
  };

  const handleClearAll = () => {
    cacheManager.clearAll();
    console.log('Cleared all caches');
    // Optionally reload the page to see the effect
    window.location.reload();
  };

  const getCacheStats = () => {
    return cacheManager.getStats();
  };

  // Only render on client side
  if (typeof window === 'undefined') {
    return null;
  }

  const stats = getCacheStats();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 1000,
      display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <strong>Cache Stats:</strong><br />
        {stats ? (
          <>
            Entries: {stats.totalEntries}<br />
            Vinyl Facts: {stats.vinylFacts}<br />
            Backgrounds: {stats.backgroundImages}<br />
            Size: ~{Math.round(stats.estimatedSize / 1024)}KB
          </>
        ) : (
          'Loading...'
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={handleClearVinylFacts}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Facts
        </button>
        
        <button 
          onClick={handleClearBackgrounds}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear BGs
        </button>
        
        <button 
          onClick={handleClearAll}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
}