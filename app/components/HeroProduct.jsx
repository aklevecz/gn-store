import { Link } from 'react-router';
import { Image, Money, CartForm } from '@shopify/hydrogen';
import { useAside } from '~/components/Aside';

export default function HeroProduct({ product }) {
  const { open } = useAside();

  if (!product) {
    return null;
  }

  const variant = product.variants?.nodes?.[0];
  const price = variant?.price || product.priceRange?.minVariantPrice;

  const handleAddToCart = () => {
    // Open cart after adding
    setTimeout(() => {
      open('cart');
    }, 100);
  };

  return (
    <div className="hero-product" >
      {product.featuredImage && (
        <>
          <Link to={`/products/${product.handle}`} className="hero-product-image">
            <Image
              data={product.featuredImage}
              sizes="100vw"
              loading="eager"
            />
          </Link>
        </>
      )}
      <div className="hero-product-content">
        <h2 className="hero-product-title">{product.title}</h2>
        <CartForm
          route="/cart"
          inputs={{
            lines: variant ? [
              {
                merchandiseId: variant.id,
                quantity: 1,
                selectedVariant: variant,
              },
            ] : []
          }}
          action={CartForm.ACTIONS.LinesAdd}
        >
          {(fetcher) => (
            <button
              type="submit"
              onClick={handleAddToCart}
              className="hero-product-cta"
              disabled={!variant?.availableForSale || fetcher.state !== 'idle'}
            >
              {fetcher.state !== 'idle' ? 'Adding...' : variant?.availableForSale ? 'Add to Cart' : 'Sold out'}
              <Money data={price} withoutTrailingZeros />
            </button>
          )}
        </CartForm>
      </div>
      {/* <img src="/images/PLANTS.png" alt="Plants" className="overlay-image" /> */}
    </div>
  );
}