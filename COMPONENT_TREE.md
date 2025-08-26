# Hydrogen App Component Tree

This document maps the component hierarchy and data flow in your Hydrogen quickstart application.

## 🏗️ Root Architecture

```
app/root.jsx (Entry Point)
│
├── Layout (HTML wrapper with styles & analytics)
│   └── PageLayout (Main layout provider)
│
└── App (Route outlet)
    └── Routes (Dynamic content based on URL)
```

## 📊 Main Layout Hierarchy

### PageLayout (`app/components/PageLayout.jsx:16`)
**Purpose:** Main layout wrapper providing header, footer, and aside management  
**Props:** `{cart, children, footer, header, isLoggedIn, publicStoreDomain}`  
**Key Features:** Aside.Provider context, manages cart/search/mobile sidebars

```
PageLayout
├── Aside.Provider (Context wrapper)
├── CartAside (Side cart drawer)
│   └── CartMain (cart content)
├── SearchAside (Search drawer)
│   ├── SearchFormPredictive
│   └── SearchResultsPredictive
├── MobileMenuAside (Mobile navigation)
│   └── HeaderMenu (mobile variant)
├── Header (Main navigation bar)
└── Footer (Site footer)
```

## 🧩 Header Component Tree

### Header (`app/components/Header.jsx:9`)
**Data Source:** `header` from root loader → HEADER_QUERY  
**Props:** `{header, isLoggedIn, cart, publicStoreDomain}`

```
Header
├── NavLink (Logo/home link)
├── HeaderMenu (Navigation links)
│   ├── NavLink (for each menu item)
│   └── Mobile images (infatuation, header-stacked.png)
└── HeaderCtas (Action buttons)
    ├── HeaderMenuMobileToggle (☰ button)
    ├── SearchToggle (🔍 button)
    └── CartToggle
        └── CartBanner
            └── CartBadge (shows cart count)
```

## 🛒 Cart Component System

### CartMain (`app/components/CartMain.jsx:12`)
**Data Flow:** `cart` → `useOptimisticCart()` → optimistic updates  
**Used in:** CartAside, /cart route

```
CartMain
├── CartEmpty (shown when cart is empty)
├── CartLineItem[] (for each cart line)
│   ├── CartLineItem removes/updates items
│   └── Links to product pages
└── CartSummary (checkout, totals)
```

## 🏪 Product Components

### Product Page (`app/routes/products.$handle.jsx:86`)
**Data Source:** PRODUCT_QUERY with selectedOptions  
**Key Hook:** `useOptimisticVariant()` for variant selection

```
Product Route
├── ProductPrice (price display)
├── ProductImage (main product image)
├── ProductForm (variant selection + add to cart)
│   ├── ProductOptionSwatch[] (size, color options)
│   └── AddToCartButton
│       └── CartForm (Shopify cart action)
└── Analytics.ProductView (tracking)
```

### ProductItem (`app/components/ProductItem.jsx:14`)
**Used in:** Homepage recommendations, collection grids  
**Data:** Product fragment with basic info

```
ProductItem (Link wrapper)
├── Image (product featured image)
├── h4 (product title)
└── Money (price display)
```

## 🏠 Homepage Structure

### Homepage (`app/routes/_index.jsx:63`)
**Data Sources:** 
- Critical: FEATURED_COLLECTION_QUERY
- Deferred: RECOMMENDED_PRODUCTS_QUERY

```
Homepage
├── WelcomeHero (animated SVG text + image)
│   ├── WelcomeHeroText (SVG with char animations)
│   └── hifive-color.svg image
└── RecommendedProducts
    └── ProductItem[] (grid of latest products)
```

## 🔍 Search System

### SearchFormPredictive (`app/components/SearchFormPredictive.jsx`)
**Context:** Used in SearchAside  
**Provides:** `{fetchResults, goToSearch, inputRef}`

```
SearchAside
├── SearchFormPredictive (input provider)
│   └── input + button (rendered via children function)
└── SearchResultsPredictive
    ├── SearchResultsPredictive.Queries
    ├── SearchResultsPredictive.Products  
    ├── SearchResultsPredictive.Collections
    ├── SearchResultsPredictive.Pages
    └── SearchResultsPredictive.Articles
```

## 📱 Aside/Drawer System

### Aside (`app/components/Aside.jsx`)
**Pattern:** Provider/Consumer for managing sidebar state  
**Types:** `'cart' | 'search' | 'mobile'`

```
useAside() Hook provides:
├── open(type) - Opens specific aside
├── close() - Closes current aside  
└── type - Current aside type or 'closed'

Used by:
├── Cart buttons (open cart)
├── Search buttons (open search)
├── Mobile menu button (open mobile)
└── Navigation links (close on navigate)
```

## 🗂️ Other Key Components

### Footer (`app/components/Footer.jsx:7`)
```
Footer
├── Social Links (Instagram, TikTok, X)
├── Footer Links (Privacy, Terms, Subscribe)
└── Copyright notice
```

### AddToCartButton (`app/components/AddToCartButton.jsx:12`)
**Wrapper around:** Shopify's CartForm with LinesAdd action  
**Used by:** ProductForm

## 📈 Data Flow Patterns

### 1. Root Data Loading
```
root.jsx loader()
├── loadCriticalData() 
│   └── HEADER_QUERY (navigation data)
└── loadDeferredData()
    ├── FOOTER_QUERY (footer links)
    ├── cart.get() (cart state)
    └── customerAccount.isLoggedIn()
```

### 2. Product Data Flow
```
Product Route → PRODUCT_QUERY 
├── useOptimisticVariant() (client-side variant selection)
├── useSelectedOptionInUrlParam() (sync URL with variant)  
└── getProductOptions() (available options)
```

### 3. Cart State Management
```
Cart Updates:
CartForm.ACTIONS.LinesAdd → Server Action
├── useOptimisticCart() (immediate UI feedback)
├── Cart revalidation (server sync)
└── CartBadge updates (header count)
```

## 🔧 Context Providers

1. **Analytics.Provider** (`root.jsx:190`) - Shopify analytics tracking
2. **Aside.Provider** (`PageLayout.jsx:25`) - Sidebar state management

## 📝 Common Troubleshooting Areas

### Cart Issues
- **Cart not opening:** Check `useAside()` hook usage in cart buttons
- **Items not adding:** Verify `AddToCartButton` has correct `lines` prop
- **Count not updating:** Ensure `useOptimisticCart()` is used for immediate feedback

### Navigation Issues  
- **Links not working:** Check URL construction in `HeaderMenu.jsx:65-70`
- **Mobile menu not opening:** Verify `HeaderMenuMobileToggle` calls `open('mobile')`

### Product Display Issues
- **Variants not switching:** Check `ProductForm` option handling and `useOptimisticVariant()`
- **Images not showing:** Verify `ProductImage` component and Shopify CDN URLs

### Search Issues
- **Search not opening:** Check `SearchToggle` calls `open('search')`
- **No results:** Verify `SearchResultsPredictive` components are properly nested

This tree shows data originates from Shopify's GraphQL API through route loaders, flows down through React components, and updates optimistically for better UX.