import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string; code: string; fullName: string; email: string;
  role: string; avatar?: string; department?: { name: string }; position?: string;
  annualLeaveLeft?: number; isFaceRegistered?: boolean;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, access: string, refresh: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isHR: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setAuth: (user, access, refresh) => {
        set({ user, accessToken: access, refreshToken: refresh });
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
        }
      },
      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null });
        if (typeof window !== 'undefined') localStorage.clear();
      },
      isAuthenticated: () => !!get().accessToken && !!get().user,
      isHR: () => ['HR_MANAGER', 'SUPER_ADMIN'].includes(get().user?.role || ''),
      isAdmin: () => get().user?.role === 'SUPER_ADMIN',
    }),
    { name: 'diemdanh-auth' },
  ),
);
