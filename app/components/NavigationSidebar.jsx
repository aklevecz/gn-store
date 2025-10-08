export function NavigationSidebar() {
  return (
    <div className="navigation-sidebar">
      <img src="/images/stacked-no-r-tag.png" style={{ width: 280 }} alt="Good Neighbor Records" />
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 100 }}>
        <div className="shop-category-vertical-menu">
          <a>Latest</a>
          <a>Apparel</a>
          <a>Accessories</a>
          <a>Collectibles</a>
          <a>Exclusives</a>
        </div>
        <div className="sidebar-subtagline">
          <h1>Big Passion <br />
            Superior Quality</h1>
          <div className="sidebar-description">
            At Good Neighbor, our merch has the same mission. A high-quality item that stands side-by-side with our commitment to preserving our planet.
          </div>
        </div>

        <img style={{ padding: 70 }} src="/images/spin-blackwhite.png" alt="Spin" />
      </nav >
    </div >
  );
}