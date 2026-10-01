export const useAuth = () => ({
  user: { name: 'Admin', role: 'admin' },
  loading: false,
  can: () => true,
  login: async () => {},
  logout: () => {},
});
