import { redirect } from 'react-router';
import { parseCookies, verifyJwt } from '@api/utils';
import { getUserById } from '~/models/user.server';
import { createSafeUser } from '~/types';

export const sharedLoader = async (request: Request) => {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies({ headers: { cookie: cookieHeader } });

  if (!cookies.token) {
    throw redirect('/sign-in');
  }

  const payload = verifyJwt(cookies.token);
  if (!payload || !payload.userId) {
    throw redirect('/sign-in');
  }

  const fullUser = await getUserById(payload.userId);
  const user = createSafeUser(fullUser);

  if (!user) {
    throw redirect('/sign-in');
  }

  return user;
};
