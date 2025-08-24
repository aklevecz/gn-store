import {useLoaderData, Link} from 'react-router';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return {...deferredData, ...criticalData};
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
async function loadCriticalData({context, request}) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 4,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  return {collections};
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collections() {
  /** @type {LoaderReturnData} */
  const {collections} = useLoaderData();

  // Separate collections by type based on title/handle
  const recordCollections = [];
  const merchCollections = [];
  
  collections?.nodes?.forEach(collection => {
    const title = collection.title.toLowerCase();
    const handle = collection.handle.toLowerCase();
    console.log(collection)
    // Check if it's a record/vinyl/album collection
    if (title.includes('record') || title.includes('vinyl') || 
        title.includes('album') || title.includes('music') ||
        handle.includes('record') || handle.includes('vinyl')) {
      recordCollections.push(collection);
    } else {
      // Everything else is merch (hats, clothing, etc.)
      merchCollections.push(collection);
    }
  });

  return (
    <div className="collections">
      <h1>Shop Good Neighbor</h1>
      
      {/* Records Section */}
      {recordCollections.length > 0 && (
        <div className="collections-section collections-section--records">
          <h2>Records & Music</h2>
          <div className="collections-grid">
            {recordCollections.map((collection, index) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Merch Section */}
      {merchCollections.length > 0 && (
        <div className="collections-section collections-section--merch">
          <h2>Merch & Apparel</h2>
          <div className="collections-grid">
            {merchCollections.map((collection, index) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                index={index + recordCollections.length}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* If no specific categorization, show all */}
      {recordCollections.length === 0 && merchCollections.length === 0 && (
        <PaginatedResourceSection
          connection={collections}
          resourcesClassName="collections-grid"
        >
          {({node: collection, index}) => (
            <CollectionItem
              key={collection.id}
              collection={collection}
              index={index}
            />
          )}
        </PaginatedResourceSection>
      )}
    </div>
  );
}

/**
 * @param {{
 *   collection: CollectionFragment;
 *   index: number;
 * }}
 */
function CollectionItem({collection, index}) {
  return (
    <Link
      className="collection-item"
      key={collection.id}
      to={`/collections/${collection.handle}`}
      prefetch="intent"
    >
      {collection?.image && (
        <Image
          alt={collection.image.altText || collection.title}
          aspectRatio="1/1"
          data={collection.image}
          loading={index < 3 ? 'eager' : undefined}
          sizes="(min-width: 45em) 400px, 100vw"
        />
      )}
      <h5>{collection.title}</h5>
    </Link>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
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
`;

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('storefrontapi.generated').CollectionFragment} CollectionFragment */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
