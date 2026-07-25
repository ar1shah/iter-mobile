// auth calls to the backend (backend handles Cognito on its end, we just
// hit the REST routes)

import { apiRequest } from './client';
import { tokenStorage, type StoredTokens } from './tokenStorage';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  createdAt: string;
  isVerified: boolean;
}

interface MeResponse {
  _id: string;
  email: string;
  username: string;
  name: string;
  createdAt: string;
  isVerified?: boolean;
}

function toAuthUser(me: MeResponse): AuthUser {
  return {
    id: me._id,
    email: me.email,
    username: me.username,
    name: me.name,
    createdAt: me.createdAt,
    isVerified: me.isVerified ?? false,
  };
}

export const authApi = {
  async register(params: { name: string; username: string; email: string; password: string }): Promise<void> {
    await apiRequest<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: params,
    });
  },

  async verifyEmail(email: string, code: string): Promise<void> {
    await apiRequest<{ message: string }>('/api/auth/verify', {
      method: 'POST',
      body: { email, code },
    });
  },

  // login only returns tokens, no profile info, so fetch that separately
  async login(email: string, password: string): Promise<AuthUser> {
    const result = await apiRequest<{
      message: string;
      accessToken: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    const tokens: StoredTokens = {
      accessToken: result.accessToken,
    };

    await tokenStorage.save(tokens);

    const user = await authApi.getMe();

    if (!user.isVerified) {
      await tokenStorage.clear();
      throw new Error('EMAIL_NOT_VERIFIED');
    }

    return user;
  },

  async forgotPassword(email: string): Promise<void> {
    await apiRequest<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    await apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: { email, code, newPassword },
    });
  },

  async getMe(): Promise<AuthUser> {
    const me = await apiRequest<MeResponse>('/api/user/me', { auth: true });
    return toAuthUser(me);
  },

  async signOut(): Promise<void> {
    await tokenStorage.clear();
  },
};
