import { Link } from 'react-router';
import { Image, Money } from '@shopify/hydrogen';

export default function HeroProduct({ product }) {
  if (!product) {
    return null;
  }

  const variant = product.variants?.nodes?.[0];
  const price = variant?.price || product.priceRange?.minVariantPrice;

  return (
    <div className="hero-product" >
      {product.featuredImage && (
        <>
          <div className="hero-product-image">
            <Image
              data={product.featuredImage}
              sizes="100vw"
              loading="eager"
            />
          </div>
        </>
      )}
      <div className="hero-product-content">
        <h2 className="hero-product-title">{product.title}</h2>
        <Link to={`/products/${product.handle}`} className="hero-product-cta">
          Add to Cart<Money data={price} withoutTrailingZeros />
        </Link>
      </div>
      <img src="/images/PLANTS.png" alt="Plants" className="overlay-image" />
    </div>
  );
}