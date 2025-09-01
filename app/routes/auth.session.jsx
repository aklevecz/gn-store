import {getWorkOSUser} from '~/lib/workos';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  const user = getWorkOSUser(context.session);
  
  // Return a Response with JSON data
  return new Response(JSON.stringify({
    authenticated: Boolean(user),
    user: user || null,
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */