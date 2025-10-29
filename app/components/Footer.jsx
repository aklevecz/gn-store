import { Suspense } from 'react';
import { Await, NavLink, Link } from 'react-router';
import { InstagramIcon, TikTokIcon, XIcon } from '~/components/Icons';

/**
 * @param {FooterProps}
 */
export function Footer({ footer: footerPromise, header, publicStoreDomain }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-header">
          <h2 className="footer-title">Vinyl<br/>Reimagined</h2>
        </div>

        <div className="footer-columns">
          <div className="footer-column">
            <h3 className="footer-section-title">Make Records</h3>
            <nav className="footer-nav">
              <Link to="/pages/color-gallery" className="footer-link">Color Gallery</Link>
              <Link to="/pages/faq" className="footer-link">FAQ</Link>
              <Link to="/pages/meet-your-neighbors" className="footer-link">Meet Your Neighbors</Link>
              <Link to="/pages/in-the-press" className="footer-link">In the Press</Link>
              <Link to="/pages/start-your-order" className="footer-link">Start Your Order</Link>
            </nav>
          </div>

          <div className="footer-column">
            <h3 className="footer-section-title">Shop</h3>
            <nav className="footer-nav">
              <Link to="/collections/latest" className="footer-link">Latest</Link>
              <Link to="/collections/apparel" className="footer-link">Apparel</Link>
              <Link to="/collections/accessories" className="footer-link">Accessories</Link>
              <Link to="/collections/collectibles" className="footer-link">Collectibles</Link>
              <Link to="/collections/exclusives" className="footer-link">Exclusives</Link>
            </nav>
          </div>

          <div className="footer-column">
            <h3 className="footer-section-title">More</h3>
            <nav className="footer-nav">
              <Link to="/pages/returns" className="footer-link">Returns</Link>
              <NavLink to="/policies/privacy-policy" className="footer-link">Privacy</NavLink>
              <NavLink to="/policies/terms-of-service" className="footer-link">Terms</NavLink>
            </nav>
            <div className="footer-social-icons">
              <a href="https://instagram.com/goodneighbormusic" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <InstagramIcon width={24} height={24} />
              </a>
              <a href="https://tiktok.com/@goodneighbormusic" target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                <TikTokIcon width={24} height={24} />
              </a>
              <a href="https://twitter.com/goodneighbormusic" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                <XIcon width={24} height={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-copyright">
          <p>© 2024 Good Neighbor</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * @param {{
 *   menu: FooterQuery['menu'];
 *   primaryDomainUrl: FooterProps['header']['shop']['primaryDomain']['url'];
 *   publicStoreDomain: string;
 * }}
 */
function FooterMenu({ menu, primaryDomainUrl, publicStoreDomain }) {
  return (
    <nav className="footer-menu" role="navigation">
      {(menu || FALLBACK_FOOTER_MENU).items.map((item) => {
        if (!item.url) return null;
        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
            item.url.includes(publicStoreDomain) ||
            item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        const isExternal = !url.startsWith('/');
        return isExternal ? (
          <a href={url} key={item.id} rel="noopener noreferrer" target="_blank">
            {item.title}
          </a>
        ) : (
          <NavLink
            end
            key={item.id}
            prefetch="intent"
            style={activeLinkStyle}
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

const FALLBACK_FOOTER_MENU = {
  id: 'gid://shopify/Menu/199655620664',
  items: [
    {
      id: 'gid://shopify/MenuItem/461633060920',
      resourceId: 'gid://shopify/ShopPolicy/23358046264',
      tags: [],
      title: 'Privacy Policy',
      type: 'SHOP_POLICY',
      url: '/policies/privacy-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633093688',
      resourceId: 'gid://shopify/ShopPolicy/23358013496',
      tags: [],
      title: 'Refund Policy',
      type: 'SHOP_POLICY',
      url: '/policies/refund-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633126456',
      resourceId: 'gid://shopify/ShopPolicy/23358111800',
      tags: [],
      title: 'Shipping Policy',
      type: 'SHOP_POLICY',
      url: '/policies/shipping-policy',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461633159224',
      resourceId: 'gid://shopify/ShopPolicy/23358079032',
      tags: [],
      title: 'Terms of Service',
      type: 'SHOP_POLICY',
      url: '/policies/terms-of-service',
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
    color: isPending ? 'grey' : 'white',
  };
}

/**
 * @typedef {Object} FooterProps
 * @property {Promise<FooterQuery|null>} footer
 * @property {HeaderQuery} header
 * @property {string} publicStoreDomain
 */

/** @typedef {import('storefrontapi.generated').FooterQuery} FooterQuery */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
