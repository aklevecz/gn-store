import { Link, useNavigate } from 'react-router';
import {
  Money,
  useOptimisticVariant,
  getProductOptions,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam
} from '@shopify/hydrogen';
import { AddToCartButton } from './AddToCartButton';
import { useAside } from './Aside';

export function ProductSidebar({ product }) {
  if (!product) return null;

  const navigate = useNavigate();
  const { open } = useAside();

  // Use optimistic variant selection like in the main product page
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    getAdjacentAndFirstAvailableVariants(product),
  );

  // Set URL params for selected variant
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);

  // Get product options for variant selection
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  const price = selectedVariant?.price;

  return (
    <div className="product-sidebar">
      <img src="/images/stacked-no-r-tag.png" alt="Good Neighbor Records" style={{ width: 280, marginBottom: 40 }} />
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

      {/* Variant Selection */}
      {productOptions.map((option) => {
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        return (
          <div className="product-sidebar-options" key={option.name}>
            <h4 className="option-title">{option.name}</h4>
            <div className="option-values">
              {option.optionValues.map((value) => {
                const {
                  name,
                  handle,
                  variantUriQuery,
                  selected,
                  available,
                  exists,
                  isDifferentProduct,
                  swatch,
                } = value;

                if (isDifferentProduct) {
                  return (
                    <Link
                      className={`option-value ${selected ? 'selected' : ''}`}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                      style={{
                        opacity: available ? 1 : 0.3,
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </Link>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      className={`option-value ${selected ? 'selected' : ''}`}
                      key={option.name + name}
                      style={{
                        opacity: available ? 1 : 0.3,
                      }}
                      disabled={!exists}
                      onClick={() => {
                        if (!selected) {
                          navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} />
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}

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
            open('cart');
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

/**
 * @param {{
 *   swatch?: Maybe<ProductOptionValueSwatch> | undefined;
 *   name: string;
 * }}
 */
function ProductOptionSwatch({swatch, name}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;

  if (!image && !color) {
    // For text options (like sizes), return just the text
    return <span className="option-text">{name}</span>;
  }

  return (
    <div
      aria-label={name}
      className="product-option-swatch"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}