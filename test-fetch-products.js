// Test script to fetch and inspect products from Shopify Storefront API
// Run with: node test-fetch-products.js

import { createStorefrontClient } from '@shopify/hydrogen-react';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function fetchProducts() {
  // Get the store domain and token from environment or use defaults
  const domain = process.env.PUBLIC_STORE_DOMAIN || 'hydrogen-preview.myshopify.com';
  const storefrontToken = process.env.PUBLIC_STOREFRONT_API_TOKEN || '';
  const storefrontApiVersion = '2024-01';

  if (!storefrontToken) {
    console.log('No Storefront API token found. Using mock data endpoint.');
  }

  const url = `https://${domain}/api/${storefrontApiVersion}/graphql.json`;

  const query = `
    query GetProducts {
      products(first: 50) {
        nodes {
          id
          title
          handle
          vendor
          productType
          tags
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
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();

    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      return;
    }

    console.log('\n=== PRODUCTS ===\n');
    data.data.products.nodes.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Handle: ${product.handle}`);
      console.log(`   Type: ${product.productType || 'N/A'}`);
      console.log(`   Vendor: ${product.vendor}`);
      console.log(`   Tags: ${product.tags.join(', ') || 'None'}`);
      console.log(`   Price: $${product.priceRange.minVariantPrice.amount}`);
      
      if (product.collections.nodes.length > 0) {
        console.log(`   Collections: ${product.collections.nodes.map(c => c.title).join(', ')}`);
      }
      
      if (product.variants.nodes.length > 1) {
        console.log(`   Variants: ${product.variants.nodes.map(v => v.title).join(', ')}`);
      }
      
      console.log('');
    });

    console.log('\n=== COLLECTIONS ===\n');
    data.data.collections.nodes.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.title} (${collection.handle})`);
      if (collection.description) {
        console.log(`   Description: ${collection.description.substring(0, 100)}...`);
      }
      if (collection.products.nodes.length > 0) {
        console.log(`   Sample products: ${collection.products.nodes.map(p => p.title).join(', ')}`);
      }
      console.log('');
    });

    // Summary for categorization
    console.log('\n=== CATEGORIZATION INSIGHTS ===\n');
    
    const productTypes = [...new Set(data.data.products.nodes.map(p => p.productType).filter(Boolean))];
    console.log('Product Types found:', productTypes.length > 0 ? productTypes.join(', ') : 'None specified');
    
    const vendors = [...new Set(data.data.products.nodes.map(p => p.vendor))];
    console.log('Vendors found:', vendors.join(', '));
    
    const allTags = [...new Set(data.data.products.nodes.flatMap(p => p.tags))];
    console.log('All Tags found:', allTags.length > 0 ? allTags.join(', ') : 'None');

    // Group products by type
    const groupedByType = {};
    data.data.products.nodes.forEach(product => {
      const type = product.productType || 'Uncategorized';
      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }
      groupedByType[type].push(product.title);
    });

    console.log('\nProducts grouped by type:');
    Object.entries(groupedByType).forEach(([type, products]) => {
      console.log(`  ${type}: ${products.length} products`);
      console.log(`    - ${products.slice(0, 3).join(', ')}${products.length > 3 ? '...' : ''}`);
    });

  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

// Run the fetch
fetchProducts();