import {WorkOS} from '@workos-inc/node';
import {redirect} from '@shopify/remix-oxygen';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context}) {
  const workos = new WorkOS(context.env.WORKOS_API_KEY);
  
  const authorizationUrl = workos.userManagement.getAuthorizationUrl({
    provider: 'authkit',
    redirectUri: new URL('/auth/callback', request.url).toString(),
    clientId: context.env.WORKOS_CLIENT_ID,
  });

  return redirect(authorizationUrl);
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */