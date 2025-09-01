import {redirect} from '@shopify/remix-oxygen';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({context}) {
  // Clear the WorkOS user from session
  context.session.unset('workos_user');

  return redirect('/', {
    headers: {
      'Set-Cookie': await context.session.commit(),
    },
  });
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */