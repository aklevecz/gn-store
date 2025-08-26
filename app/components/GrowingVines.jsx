import { useEffect, useRef, useState } from 'react';

export function GrowingVines({ 
  vineCount = 4, 
  animationDuration = 6000,
  startDelay = 1000,
  className = ''
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const vinesDataRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size to parent container
    canvas.width = canvas.offsetWidth || 800;
    canvas.height = canvas.offsetHeight || 600;
    
    // Debug - draw a test rectangle to verify canvas is working
    ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    console.log('Canvas size:', canvas.width, canvas.height);

    // Generate vine data once
    const leftVineCount = Math.ceil(vineCount / 2);
    const rightVineCount = Math.floor(vineCount / 2);
    const vines = [];

    // Left vines
    for (let i = 0; i < leftVineCount; i++) {
      const spacing = (canvas.width * 0.2) / (leftVineCount + 1);
      vines.push({
        side: 'left',
        startX: spacing * (i + 1),
        startY: canvas.height,
        height: 200 + Math.random() * 150,
        curvature: 30 + Math.random() * 20,
        speed: 0.8 + Math.random() * 0.4,
        delay: i * 300 + Math.random() * 200,
        progress: 0,
        leaves: []
      });
    }

    // Right vines
    for (let i = 0; i < rightVineCount; i++) {
      const spacing = (canvas.width * 0.2) / (rightVineCount + 1);
      vines.push({
        side: 'right',
        startX: canvas.width - spacing * (i + 1),
        startY: canvas.height,
        height: 200 + Math.random() * 150,
        curvature: 30 + Math.random() * 20,
        speed: 0.8 + Math.random() * 0.4,
        delay: i * 300 + Math.random() * 200,
        progress: 0,
        leaves: []
      });
    }

    vinesDataRef.current = vines;

    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, startDelay);

    return () => {
      clearTimeout(timer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [vineCount, startDelay]);

  useEffect(() => {
    if (!isAnimating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let startTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Debug background
      ctx.fillStyle = 'rgba(255, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      console.log('Animating, elapsed:', elapsed, 'vines:', vinesDataRef.current.length);

      // Draw vines
      vinesDataRef.current.forEach((vine, index) => {
        const vineElapsed = elapsed - vine.delay;
        if (vineElapsed < 0) return;

        // Calculate progress (0 to 1)
        vine.progress = Math.min(vineElapsed / (animationDuration * vine.speed), 1);

        console.log(`Vine ${index}:`, { vineElapsed, progress: vine.progress });

        if (vine.progress > 0) {
          drawVine(ctx, vine);
        }
      });

      if (elapsed < animationDuration + 2000) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating, animationDuration]);

  const drawVine = (ctx, vine) => {
    const { startX, startY, height, curvature, progress, side } = vine;
    const currentHeight = height * progress;
    
    console.log('Drawing vine:', { startX, startY, currentHeight, progress });
    
    // Draw simple straight line first to test
    ctx.strokeStyle = '#4a7c59';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, startY - currentHeight);
    ctx.stroke();
    
    // Draw a simple curved path
    if (currentHeight > 10) {
      const segments = 10;
      ctx.strokeStyle = '#6b8e23';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const y = startY - (currentHeight * t);
        const curveOffset = Math.sin(t * Math.PI) * curvature * t * 0.5;
        const direction = side === 'left' ? 1 : -1;
        const x = startX + curveOffset * direction;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw leaves at certain points
    if (progress > 0.4) {
      const leafPositions = [0.5, 0.7, 0.9];
      leafPositions.forEach((pos, index) => {
        if (progress > pos) {
          const leafPoint = Math.floor(pos * segments);
          if (points[leafPoint]) {
            drawLeaf(ctx, points[leafPoint].x, points[leafPoint].y, side, index);
          }
        }
      });
    }
  };

  const createGradient = (ctx, x1, y1, x2, y2) => {
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, '#2d5016');
    gradient.addColorStop(0.5, '#4a7c59');
    gradient.addColorStop(1, '#6b8e23');
    return gradient;
  };

  const drawLeaf = (ctx, x, y, side, index) => {
    ctx.save();
    ctx.translate(x, y);
    
    const leafSize = 6 + index * 2;
    const angle = (side === 'left' ? -30 : 30) + index * 15;
    ctx.rotate(angle * Math.PI / 180);

    // Draw leaf shape
    ctx.fillStyle = '#90EE90';
    ctx.beginPath();
    ctx.ellipse(0, 0, leafSize, leafSize * 0.6, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Add leaf vein
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-leafSize * 0.7, 0);
    ctx.lineTo(leafSize * 0.7, 0);
    ctx.stroke();

    ctx.restore();
  };

  return (
    <canvas
      ref={canvasRef}
      className={`growing-vines-canvas ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}