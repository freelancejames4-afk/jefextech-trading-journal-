import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://tqqttaswtuwqflbtbwmd.supabase.co';

const DEFAULT_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_Azs9ax6YIO2W8APRAlDevA_7siwm76O';

// Retrieve stored overrides if available
export const getSupabaseConfig = () => {
  const url = localStorage.getItem('supabase_url_override') || DEFAULT_URL;
  const key = localStorage.getItem('supabase_anon_key_override') || DEFAULT_KEY;
  return {
    url: url.trim(),
    key: key.trim(),
  };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return Boolean(
    url &&
    key &&
    !key.includes('<paste') &&
    key.length > 20
  );
};

// Build supabase client instance
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  const { url, key } = getSupabaseConfig();

  // If valid credentials exist, create or return client
  const effectiveKey = (key && !key.includes('<paste')) ? key : 'placeholder-anon-key-prevent-crash';
  const effectiveUrl = url || 'https://tqqttaswtuwqflbtbwmd.supabase.co';

  if (!supabaseInstance) {
    supabaseInstance = createClient(effectiveUrl, effectiveKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
};

export const updateSupabaseCredentials = (url: string, key: string) => {
  if (url) localStorage.setItem('supabase_url_override', url.trim());
  if (key) localStorage.setItem('supabase_anon_key_override', key.trim());
  
  // Re-create instance
  const effectiveUrl = url.trim() || DEFAULT_URL;
  const effectiveKey = key.trim();
  supabaseInstance = createClient(effectiveUrl, effectiveKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return supabaseInstance;
};

export const clearSupabaseCredentials = () => {
  localStorage.removeItem('supabase_anon_key_override');
  localStorage.removeItem('supabase_url_override');
  supabaseInstance = null;
};

export const supabase = getSupabaseClient();

/**
 * Uploads a trade screenshot image to Supabase Storage bucket 'trade-screenshots'.
 * If the bucket doesn't exist yet or storage permissions fail, falls back to a base64 data URL
 * so that user trades are never broken.
 */
export async function uploadTradeScreenshot(file: File, userId: string): Promise<string> {
  const client = getSupabaseClient();

  if (!isSupabaseConfigured()) {
    // If not connected to real backend, generate a base64 data URL
    return fileToDataUrl(file);
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

  try {
    const { error: uploadError } = await client.storage
      .from('trade-screenshots')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Supabase storage upload returned error (falling back to local preview):', uploadError.message);
      return await fileToDataUrl(file);
    }

    // Get public URL
    const { data: publicData } = client.storage
      .from('trade-screenshots')
      .getPublicUrl(fileName);

    if (publicData?.publicUrl) {
      return publicData.publicUrl;
    }
    return await fileToDataUrl(file);
  } catch (err) {
    console.warn('Storage upload exception (falling back to data URL):', err);
    return await fileToDataUrl(file);
  }
}

/**
 * Helper to convert File to base64 Data URL with automatic image resizing if large
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // If image is under 500KB, return as-is
      if (file.size < 500 * 1024) {
        resolve(result);
        return;
      }

      // If larger, compress lightly via canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
