import type { CurrentUser } from './services/api';

export default (initialState: { currentUser?: CurrentUser } | undefined) => {
  const { currentUser } = initialState ?? {};
  return {
    isAdmin: currentUser?.role === 'admin',
  };
};
