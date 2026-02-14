import { MLB_API_BASE } from "./constants";

interface FetchOptions {
  params?: Record<string, string | number | boolean>;
  revalidate?: number;
}

export async function mlbFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = new URL(`${MLB_API_BASE}${endpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: options.revalidate ?? 300 },
  });

  if (!response.ok) {
    throw new Error(`MLB API error: ${response.status} ${response.statusText} for ${url.toString()}`);
  }

  return response.json() as Promise<T>;
}
