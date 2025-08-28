/**
 * Reusable icon components
 */

/**
 * Search icon component
 * @param {{
 *   width?: string | number;
 *   height?: string | number;
 *   className?: string;
 * }}
 */
export function SearchIcon({ width = 48, height = 48, className = "search-icon" }) {
  return (
    <svg 
      className={className} 
      aria-hidden="true" 
      focusable="false" 
      viewBox="0 0 24 24" 
      role="img" 
      width={width} 
      height={height} 
      fill="none"
    >
      <path 
        stroke="currentColor" 
        strokeWidth="2" 
        d="M13.962 16.296a6.716 6.716 0 01-3.462.954 6.728 6.728 0 01-4.773-1.977A6.728 6.728 0 013.75 10.5c0-1.864.755-3.551 1.977-4.773A6.728 6.728 0 0110.5 3.75c1.864 0 3.551.755 4.773 1.977A6.728 6.728 0 0117.25 10.5a6.726 6.726 0 01-.921 3.407c-.517.882-.434 1.988.289 2.711l3.853 3.853" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

/**
 * Cart icon component
 * @param {{
 *   width?: string | number;
 *   height?: string | number;
 *   className?: string;
 * }}
 */
export function CartIcon({ width = 48, height = 48, className = "cart-icon" }) {
  return (
    <svg 
      className={className} 
      aria-hidden="true" 
      focusable="false" 
      viewBox="0 0 24 24" 
      role="img" 
      width={width} 
      height={height} 
      fill="none"
    >
      <path 
        stroke="currentColor" 
        strokeWidth="2.0" 
        d="M8.25 8.25V6a2.25 2.25 0 012.25-2.25h3a2.25 2.25 0 110 4.5H3.75v8.25a3.75 3.75 0 003.75 3.75h9a3.75 3.75 0 003.75-3.75V8.25H17.5"
      />
    </svg>
  );
}

/**
 * Hamburger menu icon component
 * @param {{
 *   width?: string | number;
 *   height?: string | number;
 *   className?: string;
 * }}
 */
export function HamburgerIcon({ width = 36, height = 36, className = "hamburger" }) {
  return (
    <svg 
      className={className} 
      aria-hidden="true" 
      focusable="false" 
      viewBox="0 0 24 24" 
      role="img" 
      width={width} 
      height={height} 
      fill="none"
    >
      <path 
        stroke="currentColor" 
        strokeWidth="2.0" 
        d="M21 5.25H3M21 12H3m18 6.75H3"
      />
    </svg>
  );
}

/**
 * Catalog/Book icon component
 * @param {{
 *   width?: string | number;
 *   height?: string | number;
 *   className?: string;
 * }}
 */
export function CatalogIcon({ width = 48, height = 48, className = "catalog-icon" }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width={width} 
      height={height} 
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 4.706c-2.938-1.83-7.416-2.566-12-2.706v17.714c3.937.12 7.795.681 10.667 1.995.846.388 1.817.388 2.667 0 2.872-1.314 6.729-1.875 10.666-1.995v-17.714c-4.584.14-9.062.876-12 2.706zm-10 13.104v-13.704c5.157.389 7.527 1.463 9 2.334v13.168c-1.525-.546-4.716-1.504-9-1.798zm20 0c-4.283.293-7.475 1.252-9 1.799v-13.171c1.453-.861 3.83-1.942 9-2.332v13.704zm-2-10.214c-2.086.312-4.451 1.023-6 1.672v-1.064c1.668-.622 3.881-1.315 6-1.626v1.018zm0 3.055c-2.119.311-4.332 1.004-6 1.626v1.064c1.549-.649 3.914-1.361 6-1.673v-1.017zm0-2.031c-2.119.311-4.332 1.004-6 1.626v1.064c1.549-.649 3.914-1.361 6-1.673v-1.017zm0 6.093c-2.119.311-4.332 1.004-6 1.626v1.064c1.549-.649 3.914-1.361 6-1.673v-1.017zm0-2.031c-2.119.311-4.332 1.004-6 1.626v1.064c1.549-.649 3.914-1.361 6-1.673v-1.017zm-16-6.104c2.119.311 4.332 1.004 6 1.626v1.064c-1.549-.649-3.914-1.361-6-1.672v-1.018zm0 5.09c2.086.312 4.451 1.023 6 1.673v-1.064c-1.668-.622-3.881-1.315-6-1.626v1.017zm0-2.031c2.086.312 4.451 1.023 6 1.673v-1.064c-1.668-.622-3.881-1.316-6-1.626v1.017zm0 6.093c2.086.312 4.451 1.023 6 1.673v-1.064c-1.668-.622-3.881-1.315-6-1.626v1.017zm0-2.031c2.086.312 4.451 1.023 6 1.673v-1.064c-1.668-.622-3.881-1.315-6-1.626v1.017z"/>
    </svg>
  );
}