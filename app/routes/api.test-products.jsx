// Test route to inspect products structure
// Access at: /api/test-products

export async function loader({context}) {
  const {storefront} = context;
  
  const query = `#graphql
    query TestProducts {
      products(first: 50) {
        nodes {
          id
          title
          handle
          vendor
          productType
          tags
          category {
            id
            name
          }
          collections(first: 10) {
            nodes {
              title
              handle
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
          }
          variants(first: 10) {
            nodes {
              title
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
      collections(first: 20) {
        nodes {
          id
          title
          handle
          description
          products(first: 5) {
            nodes {
              title
              productType
            }
          }
        }
      }
    }
  `;

  const {products, collections} = await storefront.query(query);

  // Process and categorize products
  const productsByType = {};
  const productsByCollection = {};
  const productTags = new Set();
  const productTypes = new Set();
  const vendors = new Set();

  products.nodes.forEach(product => {
    // Group by product type
    const type = product.productType || 'Uncategorized';
    if (!productsByType[type]) {
      productsByType[type] = [];
    }
    productsByType[type].push({
      title: product.title,
      handle: product.handle,
      price: product.priceRange.minVariantPrice.amount,
      collections: product.collections.nodes.map(c => c.title),
      tags: product.tags
    });

    // Track unique values
    if (product.productType) productTypes.add(product.productType);
    if (product.vendor) vendors.add(product.vendor);
    product.tags.forEach(tag => productTags.add(tag));
    
    // Group by collection
    product.collections.nodes.forEach(collection => {
      if (!productsByCollection[collection.title]) {
        productsByCollection[collection.title] = [];
      }
      productsByCollection[collection.title].push(product.title);
    });
  });

  // Build response
  const response = {
    summary: {
      totalProducts: products.nodes.length,
      totalCollections: collections.nodes.length,
      productTypes: Array.from(productTypes),
      vendors: Array.from(vendors),
      allTags: Array.from(productTags),
    },
    productsByType,
    productsByCollection,
    collections: collections.nodes.map(c => ({
      title: c.title,
      handle: c.handle,
      productCount: c.products.nodes.length,
      sampleProducts: c.products.nodes.map(p => p.title)
    })),
    rawProducts: products.nodes.map(p => ({
      title: p.title,
      handle: p.handle,
      type: p.productType,
      vendor: p.vendor,
      tags: p.tags,
      category: p.category,
      collections: p.collections.nodes.map(c => c.title),
      variants: p.variants.nodes.map(v => v.title),
      price: `$${p.priceRange.minVariantPrice.amount}`
    }))
  };

  return new Response(JSON.stringify(response, null, 2), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}