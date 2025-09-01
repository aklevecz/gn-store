import {WorkOS} from '@workos-inc/node';
import {redirect} from '@shopify/remix-oxygen';

/**
 * @param {LoaderFunctionArgs}
 */
export async function loader({request, context}) {
  const workos = new WorkOS(context.env.WORKOS_API_KEY);
  
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    throw new Response('Missing authorization code', {status: 400});
  }

  try {
    const {user} = await workos.userManagement.authenticateWithCode({
      code,
      clientId: context.env.WORKOS_CLIENT_ID,
    });

    // Store user info in session
    context.session.set('workos_user', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return redirect('/', {
      headers: {
        'Set-Cookie': await context.session.commit(),
      },
    });
  } catch (error) {
    console.error('WorkOS authentication error:', error);
    throw new Response('Authentication failed', {status: 401});
  }
}

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */