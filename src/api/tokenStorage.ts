// stores the tokens we get back from /api/auth/login. using SecureStore
// instead of AsyncStorage since these are real credentials now

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  accessToken: 'iter_accessToken',
} as const;

export interface StoredTokens {
  accessToken: string;
}

export const tokenStorage = {
  async save(tokens: StoredTokens): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken),
    ]);
  },

  async getaccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.accessToken);
  },

  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
    ]);
  },
};
