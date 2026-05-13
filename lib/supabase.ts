import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
const defaultAuthPath = "/rooms";

let browserClient: SupabaseClient | null = null;

function normalizeBaseUrl(value?: string) {
  if (!value) {
    return null;
  }

  const withProtocol = value.startsWith("http") ? value : "https://" + value;
  return withProtocol.replace(/\/$/, "");
}

function getBrowserBaseUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.location.origin;
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabasePublishableKey);
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    browserClient ??= createClient(supabaseUrl as string, supabasePublishableKey as string, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: "topictime-auth",
      },
    });
  } catch (error) {
    console.warn("Supabase client non inizializzato", error);
    return null;
  }

  return browserClient;
}

export function getAuthRedirectUrl(path = defaultAuthPath) {
  const baseUrl = getBrowserBaseUrl() ?? normalizeBaseUrl(siteUrl) ?? normalizeBaseUrl(vercelUrl);

  if (!baseUrl) {
    return undefined;
  }

  try {
    return new URL(path, baseUrl + "/").toString();
  } catch {
    const normalizedPath = path.startsWith("/") ? path : "/" + path;
    return baseUrl + normalizedPath;
  }
}
