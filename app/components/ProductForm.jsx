import { Link, useNavigate } from 'react-router';
import { AddToCartButton } from './AddToCartButton';
import { useAside } from './Aside';
import { useToast } from './Toast';
import { ProductPrice } from './ProductPrice';
import { getSwatchColor } from '~/lib/colorMapper';

/**
 * @param {{
 *  productOptions: MappedProductOptions[];
 *  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
 *  productTitle: string;
 *  price: number;
 * }}
 */
export function ProductForm({ productOptions, selectedVariant, productTitle, price }) {
  const navigate = useNavigate();
  const { open } = useAside();
  const toast = useToast();
  return (
    <div className="product-form">
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
                  // SEO
                  // When the variant is a combined listing child product
                  // that leads to a different url, we need to render it
                  // as an anchor tag
                  return (
                    <Link
                      className={`option-value ${selected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                    >
                      <ProductOptionSwatch swatch={swatch} name={name} available={available} />
                    </Link>
                  );
                } else {
                  // SEO
                  // When the variant is an update to the search param,
                  // render it as a button with javascript navigating to
                  // the variant so that SEO bots do not index these as
                  // duplicated links
                  return (
                    <button
                      type="button"
                      className={`option-value ${selected ? 'selected' : ''} ${!available ? 'unavailable' : ''}`}
                      key={option.name + name}
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
                      <ProductOptionSwatch swatch={swatch} name={name} available={available} />
                    </button>
                  );
                }
              })}
            </div>
            <br />
          </div>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <ProductPrice
          price={price}
        // compareAtPrice={selectedVariant?.compareAtPrice}
        />
        <AddToCartButton
          disabled={!selectedVariant || !selectedVariant.availableForSale}
          onClick={() => {
            console.log('productOptions', productOptions);
            // open('cart');
            toast.show(`Sick! you just added ${productTitle} to your bag!`);
          }}
          lines={
            selectedVariant
              ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  selectedVariant,
                },
              ]
              : []
          }
        >
          {selectedVariant?.availableForSale ? 'Add to Cart' : 'Sold out'}
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
function ProductOptionSwatch({ swatch, name, available }) {
  const image = swatch?.image?.previewImage?.url;
  const shopifyColor = swatch?.color;

  // Use our color mapper to get accurate colors, falling back to Shopify's color
  const color = getSwatchColor(name, shopifyColor);

  // Log color info for debugging
  console.log('Color swatch:', {
    name,
    shopifyColor,
    mappedColor: color,
    hasImage: !!image,
    available
  });

  if (!image && !color) {
    // For text options (like sizes), return just the text
    return <span className="option-text">{name}</span>;
  }

  return (
    <div
      aria-label={name}
      className="product-option-swatch"
      style={{
        backgroundColor: image ? 'transparent' : color,
      }}
    >
      {!!image && <img src={image} alt={name} />}
      {!available && (
        <svg
          className="unavailable-line"
          width="100%"
          height="100%"
          viewBox="0 0 48 48"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none'
          }}
        >
          <line
            x1="10"
            y1="38"
            x2="38"
            y2="10"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}

/** @typedef {import('@shopify/hydrogen').MappedProductOptions} MappedProductOptions */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').Maybe} Maybe */
/** @typedef {import('@shopify/hydrogen/storefront-api-types').ProductOptionValueSwatch} ProductOptionValueSwatch */
/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
