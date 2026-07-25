  import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from 'react';

  import { ApiError } from '../api/client';
  import { authApi, type AuthUser } from '../api/authApi';
  import { tokenStorage } from '../api/tokenStorage';

  interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (params: {
      name: string;
      username: string;
      email: string;
      password: string;
    }) => Promise<void>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (
      email: string,
      code: string,
      newPassword: string
    ) => Promise<void>;
    signOut: () => Promise<void>;
  }

  const AuthContext = createContext<AuthContextValue | undefined>(undefined);

  export function AuthProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const restoreSession = async () => {
        try {
          const accessToken = await tokenStorage.getaccessToken();

          if (!accessToken) {
            setUser(null);
            return;
          }

          const me = await authApi.getMe();
          setUser(me);
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            await tokenStorage.clear();
          }

          setUser(null);
        } finally {
          setIsLoading(false);
        }
      };

      void restoreSession();
    }, []);

    const value = useMemo<AuthContextValue>(
      () => ({
        user,
        isLoading,

        signIn: async (email, password) => {
          const loggedInUser = await authApi.login(email, password);
          setUser(loggedInUser);
        },

        signUp: async (params) => {
          await authApi.register(params);
        },

        verifyEmail: async (email, code) => {
          await authApi.verifyEmail(email, code);
        },

        forgotPassword: async (email) => {
          await authApi.forgotPassword(email);
        },

        resetPassword: async (email, code, newPassword) => {
          await authApi.resetPassword(email, code, newPassword);
        },

        signOut: async () => {
          await authApi.signOut();
          await tokenStorage.clear();
          setUser(null);
        },
      }),
      [user, isLoading]
    );

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }

  export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);

    if (!ctx) {
      throw new Error('useAuth must be used inside an AuthProvider');
    }

    return ctx;
  }