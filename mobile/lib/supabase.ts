import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1900;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const chunk1 = await SecureStore.getItemAsync(key);
    if (!chunk1) return null;
    if (!chunk1.startsWith('__CHUNKED__')) return chunk1;
    const chunkCount = parseInt(chunk1.replace('__CHUNKED__', ''), 10);
    const chunks = await Promise.all(
      Array.from({ length: chunkCount }, (_, i) =>
        SecureStore.getItemAsync(`${key}_chunk_${i}`)
      )
    );
    return chunks.join('');
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(key, `__CHUNKED__${chunks.length}`);
    await Promise.all(
      chunks.map((chunk, i) =>
        SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk)
      )
    );
  },

  removeItem: async (key: string): Promise<void> => {
    const chunk1 = await SecureStore.getItemAsync(key);
    if (chunk1?.startsWith('__CHUNKED__')) {
      const chunkCount = parseInt(chunk1.replace('__CHUNKED__', ''), 10);
      await Promise.all(
        Array.from({ length: chunkCount }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}_chunk_${i}`)
        )
      );
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/** True when stored session cannot be refreshed — clear local auth to stop error loops. */
export function isRefreshTokenAuthError(err: { message?: string } | null | undefined): boolean {
  const m = (err?.message ?? '').toLowerCase();
  return (
    m.includes('invalid refresh token') ||
    m.includes('refresh token not found') ||
    m.includes('refresh token revoked')
  );
}

/** Removes broken session from SecureStore without calling the server. */
export async function clearInvalidLocalSession(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}
