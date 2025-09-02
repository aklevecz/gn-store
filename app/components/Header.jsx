import { Suspense, useState, useEffect } from 'react';
import { Await, NavLink, useAsyncValue } from 'react-router';
import { useAnalytics, useOptimisticCart } from '@shopify/hydrogen';
import { useAside } from '~/components/Aside';
import { SearchIcon, CartIcon, HamburgerIcon, CatalogIcon, RecordIcon, ApparelIcon } from '~/components/Icons';
import { useUser, useAuth } from '~/hooks/useUser';

/**
 * Custom hook to detect scroll position
 */
function useScrollPosition() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrolled;
}

/**
 * @param {HeaderProps}
 */
export function Header({ header, isLoggedIn, cart, publicStoreDomain }) {
  const { shop, menu } = header;
  const scrolled = useScrollPosition();

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <NavLink prefetch="intent" to="/" style={activeLinkStyle} end>
        {/* <strong>{shop.name}</strong> */}
        <img style={{ width: 140, height: 'auto', paddingTop: '10px' }} src="/images/header-stacked.png" alt="Good Neighbor Records" />
      </NavLink>
      <HeaderMenu
        menu={menu}
        viewport="desktop"
        primaryDomainUrl={header.shop.primaryDomain.url}
        publicStoreDomain={publicStoreDomain}
      />
      <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} />
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
/**
 * Maps menu item titles to their corresponding icons
 * @param {string} title - The menu item title
 * @returns {React.ReactNode|null} - The icon component or null
 */
function getMenuItemIcon(title) {
  const iconMap = {
    'records': <RecordIcon />,
    'merch': <ApparelIcon />,
    'catalog': <CatalogIcon />,
    'catalogue': <CatalogIcon />, // Alternative spelling
    'collections': <CatalogIcon />,
    // Add more icon mappings here as needed
    // 'blog': <BlogIcon width={24} height={24} />,
    // 'about': <InfoIcon width={24} height={24} />,
    // 'shop': <ShopIcon width={24} height={24} />,
  };

  const lowerTitle = title?.toLowerCase() || '';
  return iconMap[lowerTitle] || null;
}

export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const className = `header-menu-${viewport}`;
  const { close, open } = useAside();

  return (
    <nav className={className} role="navigation">
      <div className="header-menu-wrapper">
      {viewport === 'mobile' && (
        <>
          <button
            className="header-menu-item"
            onClick={() => {
              close();
              open('search');
            }}
            style={activeLinkStyle({ isActive: false, isPending: false })}
          >
            <div
              className="header-menu-item"
              style={{width: '100%'}}
            >
              <div className="icon-text-wrapper">
                <SearchIcon /> Search</div>
            </div>
          </button>
        </>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        const icon = getMenuItemIcon(item.title);
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {icon ? (
              <div className="icon-text-wrapper">
                {icon}
                {item.title}
              </div>
            ) : (
              item.title
            )}
          </NavLink>
        );
      })}
      </div>
      {viewport === 'mobile' && (

        <div className="mobile-menu-footer" style={{ marginTop: 'auto', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          <img src="/images/infatuation-color.svg" alt="Infatuation Color" style={{ width: "50%", height: 'auto' }} />
          <img src="/images/header-stacked.png" alt="Good Neighbor Records" style={{ width: "50%", height: 'auto' }} />
        </div>
      )}
    </nav>
  );
}

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart'>}
 */
function HeaderCtas({ isLoggedIn, cart }) {
  const { user, displayName } = useUser();
  const { logout } = useAuth();
  
  return (
    <nav className="header-ctas" role="navigation">
      <HeaderMenuMobileToggle />
      <div className="header-ctas-desktop">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{displayName || user.email}</span>
            <button 
              onClick={logout}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <NavLink prefetch="intent" to="/auth/login" style={activeLinkStyle}>
            Sign in
          </NavLink>
        )}
        <SearchToggle />
      </div>
      <CartToggle cart={cart} />
    </nav>
  );
}

function HeaderMenuMobileToggle() {
  const { open, close, type } = useAside();
  return (
    <button
      className="header-menu-mobile-toggle reset"
      style={{ marginTop: '8px' }}
      onClick={() => {
        if (type === 'mobile') {
          close();
        } else {
          open('mobile');
        }
      }}
    >
      <HamburgerIcon />
    </button>
  );
}

function SearchToggle() {
  const { open } = useAside();
  return (
    <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="reset" onClick={() => open('search')}>
      <SearchIcon />
    </button>
  );
}

/**
 * @param {{count: number | null}}
 */
function CartBadge({ count }) {
  const { open, type, close } = useAside();
  const { publish, shop, cart, prevCart } = useAnalytics();

  return (
    <a
      href="/cart"
      style={{ position: 'relative', display: 'flex' }}
      onClick={(e) => {
        e.preventDefault();
        if (type === 'closed') {
          open('cart');
        } else {
          close();
        }
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
    >
      <CartIcon />
      <span className="cart-quantity">{count === null ? <span>&nbsp;</span> : count}</span>
    </a>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({ cart }) {
  return (
    <Suspense fallback={<CartBadge count={null} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Records',
      type: 'HTTP',
      url: '/collections/records',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609500729',
      resourceId: null,
      tags: [],
      title: 'Merch & Apparel',
      type: 'HTTP',
      url: '/collections/merch-apparel',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs/journal',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/**
 * @param {{
 *   isActive: boolean;
 *   isPending: boolean;
 * }}
 */
function activeLinkStyle({ isActive, isPending }) {
  return {
    fontWeight: isActive ? 'bold' : undefined,
    color: isPending ? 'grey' : 'black',
  };
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
