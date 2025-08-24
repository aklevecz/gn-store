// Test route to inspect menu structure
// Access at: /api/test-menu

export async function loader({context}) {
  const {storefront} = context;
  
  const query = `#graphql
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
      # Also try common menu handles
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
      # Get all available menus
      shop {
        name
        primaryDomain {
          url
        }
      }
    }
  `;

  try {
    const result = await storefront.query(query);
    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({error: error.message}, null, 2), {
      headers: {
        'Content-Type': 'application/json',
      },
      status: 500,
    });
  }
}