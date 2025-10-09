import { Await, Link, useRouteLoaderData, useLocation } from 'react-router';
import { Suspense, useId } from 'react';
import { Aside } from '~/components/Aside';
import { Footer } from '~/components/Footer';
import { Header, HeaderMenu } from '~/components/Header';
import { CartMain } from '~/components/CartMain';
import {
  SEARCH_ENDPOINT,
  SearchFormPredictive,
} from '~/components/SearchFormPredictive';
import { SearchResultsPredictive } from '~/components/SearchResultsPredictive';
import { Toast } from '~/components/Toast';
import { BackgroundGenerator } from './BackgroundGenerator';
import { AgentProvider } from '~/components/Agent/AgentProvider';
import { Agent } from '~/components/Agent/Agent';
import { ProductSidebar } from './ProductSidebar';
import { NavigationSidebar } from './NavigationSidebar';

/**
 * @param {PageLayoutProps}
 */
export function PageLayout({
  cart,
  children = null,
  footer,
  header,
  isLoggedIn,
  publicStoreDomain,
}) {
  const location = useLocation();
  const isProductPage = location.pathname.startsWith('/products/');

  // Try to access product route data
  const productRouteData = useRouteLoaderData('routes/products.$handle');

  console.log('=== PageLayout Route Data Debug ===');
  console.log('Current location:', location.pathname);
  console.log('Is product page:', isProductPage);
  console.log('Product route data:', productRouteData);

  if (isProductPage && productRouteData) {
    console.log('Product data available:', productRouteData.product?.title);
  }

  return (
    <Aside.Provider>
      <Toast.Provider>
        <AgentProvider>
          <CartAside cart={cart} />
          <SearchAside />
          <MobileMenuAside header={header} publicStoreDomain={publicStoreDomain} />
          <div className="site-grid">
            {header && (
              <Header
                header={header}
                cart={cart}
                isLoggedIn={isLoggedIn}
                publicStoreDomain={publicStoreDomain}
              />
            )}

            <div className="desktop-sidebar" role="complementary" aria-label="Site sidebar">
              {isProductPage && productRouteData ? (
                <ProductSidebar product={productRouteData.product} />
              ) : (
                <NavigationSidebar />
              )}
            </div>

            <main className="main">{children}</main>

            <Footer
              footer={footer}
              header={header}
              publicStoreDomain={publicStoreDomain}
            />
          </div>

          <BackgroundGenerator />
          <Agent />
        </AgentProvider>
      </Toast.Provider>
    </Aside.Provider>
  );
}

/**
 * @param {{cart: PageLayoutProps['cart']}}
 */
function CartAside({ cart }) {
  return (
    <Aside type="cart" heading="CART">
      <Suspense fallback={<p>Loading cart ...</p>}>
        <Await resolve={cart}>
          {(cart) => {
            return <CartMain cart={cart} layout="aside" />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function SearchCta() {
  return (
    <div
      className="search-cta"
      style={{
        textAlign: 'center',
        padding: '16px 0',
        borderBottom: '1px solid #eee',
        marginBottom: '16px'
      }}>
      <img
        src="/images/juggle-color.svg"
        alt="Good Neighbor character juggling records"
        style={{
          width: '120px',
          height: '120px',
          marginBottom: '12px',
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      <p style={{
        margin: '8px 0',
        fontSize: '14px',
        fontStyle: 'italic',
        color: '#666',
        lineHeight: '1.3'
      }}>
        🎵 Looking for that perfect vinyl? Let our magical record juggler help you find sonic treasures! 🎪
      </p>
    </div>
  );
}

function SearchAside() {
  const queriesDatalistId = useId();
  return (
    <Aside type="search" heading="SEARCH">
      <div className="predictive-search">

        <SearchFormPredictive>
          {({ fetchResults, goToSearch, inputRef }) => (
            <>
              <input
                name="q"
                onChange={fetchResults}
                onFocus={fetchResults}
                placeholder="Search"
                ref={inputRef}
                type="search"
                list={queriesDatalistId}
              />
              &nbsp;
              <button onClick={goToSearch}>Search</button>
            </>
          )}
        </SearchFormPredictive>

        <SearchResultsPredictive>
          {({ items, total, term, state, closeSearch }) => {
            const { articles, collections, pages, products, queries } = items;

            if (state === 'idle' && products.length === 0) {
              return <SearchCta />;
            }

            if (state === 'loading' && term.current) {
              return <div>Loading...</div>;
            }

            if (!total) {
              return <SearchResultsPredictive.Empty term={term} />;
            }

            return (
              <>
                <SearchResultsPredictive.Queries
                  queries={queries}
                  queriesDatalistId={queriesDatalistId}
                />
                <SearchResultsPredictive.Products
                  products={products}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Collections
                  collections={collections}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Pages
                  pages={pages}
                  closeSearch={closeSearch}
                  term={term}
                />
                <SearchResultsPredictive.Articles
                  articles={articles}
                  closeSearch={closeSearch}
                  term={term}
                />
                {term.current && total ? (
                  <Link
                    onClick={closeSearch}
                    to={`${SEARCH_ENDPOINT}?q=${term.current}`}
                  >
                    <p>
                      View all results for <q>{term.current}</q>
                      &nbsp; →
                    </p>
                  </Link>
                ) : null}
              </>
            );
          }}
        </SearchResultsPredictive>
      </div>
    </Aside>
  );
}

/**
 * @param {{
 *   header: PageLayoutProps['header'];
 *   publicStoreDomain: PageLayoutProps['publicStoreDomain'];
 * }}
 */
function MobileMenuAside({ header, publicStoreDomain }) {
  return (
    header.menu &&
    header.shop.primaryDomain?.url && (
      <Aside type="mobile" heading="">
        <div className="mobile-menu-logo">
          <img src="/images/stacked-no-r-tag.png" alt="Good Neighbor Records" />
        </div>
        <div className="mobile-menu-content">
          <HeaderMenu
            menu={header.menu}
            viewport="mobile"
            primaryDomainUrl={header.shop.primaryDomain.url}
            publicStoreDomain={publicStoreDomain}
          />
        </div>
      </Aside>
    )
  );
}

/**
 * @typedef {Object} PageLayoutProps
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 * @property {React.ReactNode} [children]
 */

/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
