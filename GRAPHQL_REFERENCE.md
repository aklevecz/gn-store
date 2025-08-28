# GraphQL Reference Documentation

A comprehensive reference for all GraphQL fragments, queries, and mutations used in the Good Neighbor Records Hydrogen store.

## Table of Contents

1. [Core Fragments](#core-fragments)
2. [Cart & Commerce](#cart--commerce)
3. [Navigation & Layout](#navigation--layout)
4. [Products & Collections](#products--collections)
5. [Search & Predictive Search](#search--predictive-search)
6. [Blog & Content](#blog--content)
7. [Policies & Legal](#policies--legal)
8. [Customer Account API](#customer-account-api)
9. [Usage Examples](#usage-examples)

---

## Core Fragments

### Money Fragment
```graphql
fragment Money on MoneyV2 {
  currencyCode
  amount
}
```
**Usage**: Base fragment used in all price-related queries
**Location**: `app/lib/fragments.js`

---

## Cart & Commerce

### Cart Query Fragment
```graphql
fragment CartApiQuery on Cart {
  updatedAt
  id
  appliedGiftCards {
    lastCharacters
    amountUsed {
      ...Money
    }
  }
  checkoutUrl
  totalQuantity
  buyerIdentity {
    countryCode
    customer {
      id
      email
      firstName
      lastName
      displayName
    }
    email
    phone
  }
  lines(first: $numCartLines) {
    nodes {
      ...CartLine
    }
    nodes {
      ...CartLineComponent
    }
  }
  cost {
    subtotalAmount {
      ...Money
    }
    totalAmount {
      ...Money
    }
    totalDutyAmount {
      ...Money
    }
    totalTaxAmount {
      ...Money
    }
  }
  note
  attributes {
    key
    value
  }
  discountCodes {
    code
    applicable
  }
}
```
**Usage**: Complete cart data structure
**Location**: `app/lib/fragments.js`
**Context Integration**: Used in `app/lib/context.js` for cart configuration

### Cart Line Fragment
```graphql
fragment CartLine on CartLine {
  id
  quantity
  attributes {
    key
    value
  }
  cost {
    totalAmount {
      ...Money
    }
    amountPerQuantity {
      ...Money
    }
    compareAtAmountPerQuantity {
      ...Money
    }
  }
  merchandise {
    ... on ProductVariant {
      id
      availableForSale
      compareAtPrice {
        ...Money
      }
      price {
        ...Money
      }
      requiresShipping
      title
      image {
        id
        url
        altText
        width
        height
      }
      product {
        handle
        title
        id
        vendor
      }
      selectedOptions {
        name
        value
      }
    }
  }
}
```
**Usage**: Individual cart line item data
**Location**: `app/lib/fragments.js`

---

## Navigation & Layout

### Menu Fragments
```graphql
fragment MenuItem on MenuItem {
  id
  resourceId
  tags
  title
  type
  url
}

fragment ChildMenuItem on MenuItem {
  ...MenuItem
}

fragment ParentMenuItem on MenuItem {
  ...MenuItem
  items {
    ...ChildMenuItem
  }
}

fragment Menu on Menu {
  id
  items {
    ...ParentMenuItem
  }
}
```
**Usage**: Navigation menu structure
**Location**: `app/lib/fragments.js`

### Header Query
```graphql
query Header(
  $country: CountryCode
  $headerMenuHandle: String!
  $language: LanguageCode
) @inContext(language: $language, country: $country) {
  shop {
    ...Shop
  }
  menu(handle: $headerMenuHandle) {
    ...Menu
  }
}
```
**Usage**: Site header data
**Location**: `app/lib/fragments.js`
**Used In**: `app/root.jsx`

### Footer Query
```graphql
query Footer(
  $country: CountryCode
  $footerMenuHandle: String!
  $language: LanguageCode
) @inContext(language: $language, country: $country) {
  menu(handle: $footerMenuHandle) {
    ...Menu
  }
}
```
**Usage**: Site footer navigation
**Location**: `app/lib/fragments.js`

### Shop Fragment
```graphql
fragment Shop on Shop {
  id
  name
  description
  primaryDomain {
    url
  }
  brand {
    logo {
      image {
        url
      }
    }
  }
}
```
**Usage**: Basic shop information
**Location**: `app/lib/fragments.js`

---

## Products & Collections

### Product Query
```graphql
query Product(
  $country: CountryCode
  $handle: String!
  $language: LanguageCode
  $selectedOptions: [SelectedOptionInput!]!
) @inContext(country: $country, language: $language) {
  product(handle: $handle) {
    ...Product
  }
}
```
**Usage**: Individual product page data
**Location**: `app/routes/products.$handle.jsx`

### Product Fragment
```graphql
fragment Product on Product {
  id
  title
  vendor
  handle
  descriptionHtml
  description
  encodedVariantExistence
  encodedVariantAvailability
  options {
    name
    optionValues {
      name
      firstSelectableVariant {
        ...ProductVariant
      }
      swatch {
        color
        image {
          previewImage {
            url
          }
        }
      }
    }
  }
  selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
    ...ProductVariant
  }
  adjacentVariants (selectedOptions: $selectedOptions) {
    ...ProductVariant
  }
  seo {
    description
    title
  }
}
```
**Usage**: Complete product data
**Location**: `app/routes/products.$handle.jsx`

### Product Variant Fragment
```graphql
fragment ProductVariant on ProductVariant {
  availableForSale
  compareAtPrice {
    amount
    currencyCode
  }
  id
  image {
    __typename
    id
    url
    altText
    width
    height
  }
  price {
    amount
    currencyCode
  }
  product {
    title
    handle
  }
  selectedOptions {
    name
    value
  }
  sku
  title
  unitPrice {
    amount
    currencyCode
  }
}
```
**Usage**: Product variant details
**Location**: `app/routes/products.$handle.jsx`

### Collection Query
```graphql
query Collection(
  $handle: String!
  $country: CountryCode
  $language: LanguageCode
  $first: Int
  $last: Int
  $startCursor: String
  $endCursor: String
) @inContext(country: $country, language: $language) {
  collection(handle: $handle) {
    id
    handle
    title
    description
    products(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...ProductItem
      }
      pageInfo {
        hasPreviousPage
        hasNextPage
        endCursor
        startCursor
      }
    }
  }
}
```
**Usage**: Collection page with products
**Location**: `app/routes/collections.$handle.jsx`

### Product Item Fragment
```graphql
fragment ProductItem on Product {
  id
  handle
  title
  featuredImage {
    id
    altText
    url
    width
    height
  }
  priceRange {
    minVariantPrice {
      ...MoneyProductItem
    }
    maxVariantPrice {
      ...MoneyProductItem
    }
  }
}
```
**Usage**: Product card/listing data
**Location**: `app/routes/collections.$handle.jsx`

### Collections Index Query
```graphql
query StoreCollections(
  $country: CountryCode
  $endCursor: String
  $first: Int
  $language: LanguageCode
  $last: Int
  $startCursor: String
) @inContext(country: $country, language: $language) {
  collections(
    first: $first,
    last: $last,
    before: $startCursor,
    after: $endCursor
  ) {
    nodes {
      ...Collection
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
```
**Usage**: All collections listing
**Location**: `app/routes/collections._index.jsx`

### Featured Collection Query
```graphql
query FeaturedCollection($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
  collections(first: 1, sortKey: UPDATED_AT, reverse: true) {
    nodes {
      ...FeaturedCollection
    }
  }
}
```
**Usage**: Homepage featured collection
**Location**: `app/routes/_index.jsx`

### Recommended Products Query
```graphql
query RecommendedProducts ($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
  products(first: 4, sortKey: UPDATED_AT, reverse: true) {
    nodes {
      ...RecommendedProduct
    }
  }
}
```
**Usage**: Homepage product recommendations
**Location**: `app/routes/_index.jsx`

---

## Search & Predictive Search

### Search Query
```graphql
query search(
  $country: CountryCode
  $endCursor: String
  $first: Int
  $language: LanguageCode
  $last: Int
  $query: String!
  $startCursor: String
) @inContext(country: $country, language: $language) {
  products: search(
    query: $query,
    types: [PRODUCT],
    first: $first,
    sortKey: RELEVANCE,
    last: $last,
    before: $startCursor,
    after: $endCursor
  ) {
    nodes {
      ...SearchProduct
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    totalCount
  }
  pages: search(
    query: $query,
    types: [PAGE],
    first: 10
  ) {
    nodes {
      ...SearchPage
    }
  }
  articles: search(
    query: $query,
    types: [ARTICLE],
    first: 10
  ) {
    nodes {
      ...SearchArticle
    }
  }
}
```
**Usage**: Full search results
**Location**: `app/routes/search.jsx`

### Predictive Search Query
```graphql
query PredictiveSearch(
  $country: CountryCode
  $language: LanguageCode
  $limit: Int!
  $limitScope: PredictiveSearchLimitScope!
  $query: String!
  $types: [PredictiveSearchType!]
) @inContext(country: $country, language: $language) {
  predictiveSearch(
    limit: $limit,
    limitScope: $limitScope,
    query: $query,
    types: $types,
  ) {
    ...PredictiveSearchResult
  }
}
```
**Usage**: Search suggestions/autocomplete
**Location**: `app/routes/search.jsx`

### Search Product Fragment
```graphql
fragment SearchProduct on Product {
  __typename
  handle
  id
  publishedAt
  title
  trackingParameters
  vendor
  featuredImage {
    url
    altText
    width
    height
  }
  variants(first: 1) {
    nodes {
      id
      image {
        url
        altText
        width
        height
      }
      price {
        amount
        currencyCode
      }
      compareAtPrice {
        amount
        currencyCode
      }
      selectedOptions {
        name
        value
      }
      product {
        handle
        title
      }
    }
  }
}
```
**Usage**: Product in search results
**Location**: `app/routes/search.jsx`

---

## Blog & Content

### Article Query
```graphql
query Article(
  $articleHandle: String!
  $blogHandle: String!
  $country: CountryCode
  $language: LanguageCode
) @inContext(language: $language, country: $country) {
  blog(handle: $blogHandle) {
    handle
    articleByHandle(handle: $articleHandle) {
      handle
      title
      contentHtml
      publishedAt
      author: authorV2 {
        name
      }
      image {
        id
        altText
        url
        width
        height
      }
      seo {
        description
        title
      }
    }
  }
}
```
**Usage**: Individual blog article
**Location**: `app/routes/blogs.$blogHandle.$articleHandle.jsx`

### Blogs Query
```graphql
query Blogs(
  $country: CountryCode
  $endCursor: String
  $first: Int
  $language: LanguageCode
  $last: Int
  $startCursor: String
) @inContext(country: $country, language: $language) {
  blogs(
    first: $first,
    last: $last,
    before: $startCursor,
    after: $endCursor
  ) {
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    nodes {
      title
      handle
      seo {
        title
        description
      }
    }
  }
}
```
**Usage**: All blogs listing
**Location**: `app/routes/blogs._index.jsx`

### Page Query
```graphql
query Page(
  $language: LanguageCode,
  $country: CountryCode,
  $handle: String!
)
@inContext(language: $language, country: $country) {
  page(handle: $handle) {
    handle
    id
    title
    body
    seo {
      description
      title
    }
  }
}
```
**Usage**: Static page content
**Location**: `app/routes/pages.$handle.jsx`

---

## Policies & Legal

### Policies Query
```graphql
query Policies ($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
  shop {
    privacyPolicy {
      ...PolicyItem
    }
    shippingPolicy {
      ...PolicyItem
    }
    termsOfService {
      ...PolicyItem
    }
    refundPolicy {
      ...PolicyItem
    }
  }
}
```
**Usage**: All store policies
**Location**: `app/routes/policies._index.jsx`

### Policy Content Query
```graphql
query Policy(
  $country: CountryCode
  $language: LanguageCode
  $privacyPolicy: Boolean!
  $refundPolicy: Boolean!
  $shippingPolicy: Boolean!
  $termsOfService: Boolean!
) @inContext(language: $language, country: $country) {
  shop {
    privacyPolicy @include(if: $privacyPolicy) {
      ...Policy
    }
    shippingPolicy @include(if: $shippingPolicy) {
      ...Policy
    }
    termsOfService @include(if: $termsOfService) {
      ...Policy
    }
    refundPolicy @include(if: $refundPolicy) {
      ...Policy
    }
  }
}
```
**Usage**: Individual policy content
**Location**: `app/routes/policies.$handle.jsx`

---

## Customer Account API

### Customer Details Query
```graphql
query CustomerDetails {
  customer {
    ...Customer
  }
}

fragment Customer on Customer {
  id
  firstName
  lastName
  defaultAddress {
    ...Address
  }
  addresses(first: 6) {
    nodes {
      ...Address
    }
  }
}

fragment Address on CustomerAddress {
  id
  formatted
  firstName
  lastName
  company
  address1
  address2
  territoryCode
  zoneCode
  city
  zip
  phoneNumber
}
```
**Usage**: Customer account information
**Location**: Customer Account API

### Customer Orders Query
```graphql
query CustomerOrders(
  $endCursor: String
  $first: Int
  $last: Int
  $startCursor: String
) {
  customer {
    ...CustomerOrders
  }
}

fragment CustomerOrders on Customer {
  orders(
    sortKey: PROCESSED_AT,
    reverse: true,
    first: $first,
    last: $last,
    before: $startCursor,
    after: $endCursor
  ) {
    nodes {
      ...OrderItem
    }
    pageInfo {
      hasPreviousPage
      hasNextPage
      endCursor
      startCursor
    }
  }
}
```
**Usage**: Customer order history
**Location**: Customer Account API

### Customer Account Mutations
```graphql
# Update customer info
mutation customerUpdate($customer: CustomerUpdateInput!) {
  customerUpdate(input: $customer) {
    customer {
      firstName
      lastName
      emailAddress { emailAddress }
      phoneNumber { phoneNumber }
    }
    userErrors {
      code
      field
      message
    }
  }
}

# Create address
mutation customerAddressCreate(
  $address: CustomerAddressInput!
  $defaultAddress: Boolean
) {
  customerAddressCreate(
    address: $address
    defaultAddress: $defaultAddress
  ) {
    customerAddress { id }
    userErrors {
      code
      field
      message
    }
  }
}

# Update address
mutation customerAddressUpdate(
  $address: CustomerAddressInput!
  $addressId: ID!
  $defaultAddress: Boolean
) {
  customerAddressUpdate(
    address: $address
    addressId: $addressId
    defaultAddress: $defaultAddress
  ) {
    customerAddress { id }
    userErrors {
      code
      field
      message
    }
  }
}

# Delete address
mutation customerAddressDelete($addressId: ID!) {
  customerAddressDelete(addressId: $addressId) {
    deletedAddressId
    userErrors {
      code
      field
      message
    }
  }
}
```
**Usage**: Customer account management
**Location**: Customer Account API

---

## Test & Debug Queries

### Test Products Query
```graphql
query TestProducts {
  products(first: 50) {
    nodes {
      id
      title
      handle
      vendor
      productType
      tags
      category { id name }
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
```
**Usage**: Debug store data
**Location**: `app/routes/api.test-products.jsx`

### Test Menu Query
```graphql
query TestMenu {
  menu(handle: "main-menu") {
    id
    handle
    title
    items {
      id
      title
      url
      items {
        id
        title
        url
      }
    }
  }
  footerMenu: menu(handle: "footer") {
    id
    handle
    title
    items {
      id
      title
      url
    }
  }
  shop {
    name
    primaryDomain { url }
  }
}
```
**Usage**: Debug navigation structure
**Location**: `app/routes/api.test-menu.jsx`

### Robots Query
```graphql
query StoreRobots($country: CountryCode, $language: LanguageCode)
 @inContext(country: $country, language: $language) {
  shop {
    id
  }
}
```
**Usage**: SEO robots.txt generation
**Location**: `app/routes/[robots.txt].jsx`

---

## Usage Examples

### Basic Product Query Usage
```javascript
// In a route loader
export async function loader({ params, context }) {
  const { handle } = params;
  const { storefront } = context;
  
  const { product } = await storefront.query(PRODUCT_QUERY, {
    variables: { 
      handle, 
      selectedOptions: getSelectedProductOptions(request) 
    },
  });
  
  return { product };
}
```

### Collection with Pagination
```javascript
export async function loader({ request, params, context }) {
  const { handle } = params;
  const { storefront } = context;
  const searchParams = new URL(request.url).searchParams;
  
  const cursor = searchParams.get('cursor');
  
  const { collection } = await storefront.query(COLLECTION_QUERY, {
    variables: {
      handle,
      first: 8,
      ...(cursor && { startCursor: cursor }),
    },
  });
  
  return { collection };
}
```

### Search Implementation
```javascript
export async function loader({ request, context }) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  
  const { storefront } = context;
  const { errors, ...items } = await storefront.query(SEARCH_QUERY, {
    variables: {
      query,
      first: 20,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });
  
  return { searchResults: items, query };
}
```

---

## Fragment Dependencies

### Core Dependencies
- `Money` → Used in all price-related fragments
- `MenuItem` → Used in navigation fragments
- `Shop` → Used in header/footer queries

### Product Dependencies
- `ProductVariant` → Used in `Product`, `CartLine`
- `ProductItem` → Used in collection listings
- `Product` → Complete product data structure

### Cart Dependencies
- `CartLine` → Used in `CartApiQuery`
- `CartApiQuery` → Used in cart configuration

---

## Performance Notes

### Caching Behavior
- All `storefront.query()` calls are automatically cached
- Cache keys generated from query + variables
- Cache respects Shopify's cache-control headers
- Fragments enable efficient caching by standardizing queries

### Optimization Tips
1. **Use fragments consistently** to enable better caching
2. **Limit field selection** to only needed data
3. **Implement pagination** for large datasets
4. **Use variables** instead of dynamic query strings
5. **Batch related queries** when possible

---

## File Locations Summary

| File | Contains |
|------|----------|
| `app/lib/fragments.js` | Core fragments, header/footer queries |
| `app/routes/products.$handle.jsx` | Product queries and fragments |
| `app/routes/collections.$handle.jsx` | Collection queries and fragments |
| `app/routes/search.jsx` | Search and predictive search queries |
| `app/routes/blogs.$blogHandle.$articleHandle.jsx` | Blog/article queries |
| `app/routes/policies.$handle.jsx` | Policy queries |
| `customer-accountapi.generated.d.ts` | Customer Account API types |
| `storefrontapi.generated.d.ts` | Storefront API types |

This reference provides a complete overview of all GraphQL operations in your Hydrogen store. Use this as a central reference for understanding data structures, dependencies, and implementation patterns.