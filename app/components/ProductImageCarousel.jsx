'use client';

import { useState, useEffect, useRef } from 'react';
import { ProductImage } from './ProductImage';

export function ProductImageCarousel({ images, selectedVariantImage }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const imageRefs = useRef([]);

  // Put selected variant image first, then other images
  const sortedImages = [
    selectedVariantImage,
    ...images.filter((img) => img.id !== selectedVariantImage?.id),
  ].filter(Boolean);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = imageRefs.current.indexOf(entry.target);
            if (index !== -1) {
              setActiveIndex(index);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    imageRefs.current.forEach((img) => {
      if (img) observer.observe(img);
    });

    return () => observer.disconnect();
  }, [sortedImages.length]);

  const scrollToImage = (index) => {
    imageRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  if (!sortedImages || sortedImages.length === 0) return null;

  return (
    <div className="product-image-carousel">
      <div className="carousel-container" ref={scrollContainerRef}>
        {sortedImages.map((image, index) => (
          <div
            key={image.id}
            className="carousel-slide"
            ref={(el) => (imageRefs.current[index] = el)}
          >
            <ProductImage image={image} />
          </div>
        ))}
      </div>

      {sortedImages.length > 1 && (
        <div className="carousel-dots">
          {sortedImages.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => scrollToImage(index)}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
