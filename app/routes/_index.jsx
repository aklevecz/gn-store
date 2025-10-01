import { Await, useLoaderData, Link } from 'react-router';
import { Suspense, useEffect, useState } from 'react';
import { Image } from '@shopify/hydrogen';
import { ProductItem } from '~/components/ProductItem';
import { WelcomeHero } from '~/components/WelcomeHero';
import { BackgroundGenerator } from '~/components/BackgroundGenerator';
import HeroProduct from '~/components/HeroProduct';
// import { AgentChat } from '~/components/AgentChat';

/**
 * @type {MetaFunction}
 */
export const meta = () => {
  return [
    { title: 'Good Neighbor Music | Vinyl Records & Music Merchandise' },
    { name: 'description', content: 'Discover rare vinyl records, exclusive music merchandise, and sonic treasures at Good Neighbor Music. Your neighborhood record shop for music lovers.' }
  ];
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return { ...deferredData, ...criticalData };
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({ context }) {
  const [{ collections }, { products }, debugAllProducts] = await Promise.all([
    context.storefront.query(FEATURED_COLLECTION_QUERY),
    context.storefront.query(FEATURED_PRODUCT_QUERY, {
      cache: context.storefront.CacheLong(),
    }),
    context.storefront.query(DEBUG_ALL_PRODUCTS_QUERY, {
      cache: context.storefront.CacheLong(),
    }),
  ]);

  console.log('=== DEBUG: All products (first 5) ===');
  debugAllProducts.products.nodes.forEach((product, index) => {
    console.log(`Product ${index + 1}:`, {
      title: product.title,
      handle: product.handle,
      tags: product.tags
    });
  });

  console.log('=== Featured products query result ===');
  console.log('Featured products found:', products?.nodes?.length || 0);
  if (products?.nodes?.length > 0) {
    console.log('Featured product:', {
      title: products.nodes[0].title,
      handle: products.nodes[0].handle,
      tags: products.nodes[0].tags
    });
  } else {
    console.log('No products found with "featured" tag');
  }

  return {
    featuredCollection: collections.nodes[0],
    featuredProduct: products.nodes[0],
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({ context }) {
  const recommendedProducts = context.storefront
    .query(RECOMMENDED_PRODUCTS_QUERY)
    .catch((error) => {
      // Log query errors, but don't throw them so the page can still render
      console.error(error);
      return null;
    });

  return {
    recommendedProducts,
  };
}

// THIS IS THE HOMEPAGE
export default function Homepage() {
  /** @type {LoaderReturnData} */
  const data = useLoaderData();

  return (
    <div className="home">
      {/* <FeaturedCollection collection={data.featuredCollection} /> */}
      {/* <WelcomeHero /> */}
      <HeroProduct product={data.featuredProduct} />
      <RecommendedProducts products={data.recommendedProducts} />
    </div>
  );
}

/**
 * @param {{
 *   collection: FeaturedCollectionFragment;
 * }}
 */
function FeaturedCollection({ collection }) {
  if (!collection) return null;
  const image = collection?.image;
  return (
    <Link
      className="featured-collection"
      to={`/collections/${collection.handle}`}
    >
      {image && (
        <div className="featured-collection-image">
          <Image data={image} sizes="100vw" />
        </div>
      )}
      <h1>{collection.title}</h1>
    </Link>
  );
}

/**
 * @param {{
 *   products: Promise<RecommendedProductsQuery | null>;
 * }}
 */
function RecommendedProducts({ products }) {
  return (
    <div className="recommended-products">
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={products}>
          {(response) => (
            <div className="recommended-products-grid">
              {response
                ? response.products.nodes.map((product) => (
                  <ProductItem key={product.id} product={product} />
                ))
                : null}
            </div>
          )}
        </Await>
      </Suspense>
      <br />
    </div>
  );
}

const FEATURED_COLLECTION_QUERY = `#graphql
  fragment FeaturedCollection on Collection {
    id
    title
    image {
      id
      url
      altText
      width
      height
    }
    handle
  }
  query FeaturedCollection($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...FeaturedCollection
      }
    }
  }
`;

const FEATURED_PRODUCT_QUERY = `#graphql
  fragment FeaturedProduct on Product {
    id
    title
    handle
    description
    tags
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
    variants(first: 1) {
      nodes {
        id
        availableForSale
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
  query FeaturedProduct($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 1, query: "tag:featured") {
      nodes {
        ...FeaturedProduct
      }
    }
  }
`;

const DEBUG_ALL_PRODUCTS_QUERY = `#graphql
  query AllProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 5) {
      nodes {
        id
        title
        handle
        tags
      }
    }
  }
`;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  fragment RecommendedProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
  query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 4, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...RecommendedProduct
      }
    }
  }
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @template T @typedef {import('react-router').MetaFunction<T>} MetaFunction */
/** @typedef {import('storefrontapi.generated').FeaturedCollectionFragment} FeaturedCollectionFragment */
/** @typedef {import('storefrontapi.generated').RecommendedProductsQuery} RecommendedProductsQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
