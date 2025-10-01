import { Link } from 'react-router';
import { Money } from '@shopify/hydrogen';
import { AddToCartButton } from './AddToCartButton';

export function ProductSidebar({ product }) {
  if (!product) return null;

  const selectedVariant = product.selectedOrFirstAvailableVariant;
  const price = selectedVariant?.price;

  return (
    <div className="product-sidebar">
      {/* Breadcrumb */}
      <nav className="product-breadcrumb">
        <Link to="/">Home</Link>
        <span> > </span>
        <span>Product</span>
      </nav>

      {/* Product Title */}
      <h1 className="product-sidebar-title">{product.title}</h1>

      {/* Product Description */}
      <div className="product-sidebar-description">
        {product.description}
      </div>

      {/* Price and Add to Cart */}
      <div className="product-sidebar-actions">
        {price && (
          <div className="product-sidebar-price">
            <Money data={price} />
          </div>
        )}

        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            // This will be handled by the AddToCartButton component
          }}
          lines={
            selectedVariant
              ? [
                  {
                    merchandiseId: selectedVariant.id,
                    quantity: 1,
                  },
                ]
              : []
          }
        >
          <span className="add-to-cart-text">Add to Cart</span>
        </AddToCartButton>
      </div>
    </div>
  );
}