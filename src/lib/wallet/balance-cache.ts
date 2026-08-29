/**
 * Balance Cache Manager
 * Provides client-side caching with TTL and exponential backoff retry
 * for Stellar wallet account balance queries.
 *
 * Privacy guarantee: wallet addresses are ONLY ever sent to the first-party
 * proxy (/api/wallet/balance). No direct third-party (Horizon) fallback is
 * performed from the client — see issue #202.
 */

export interface WalletBalance {
  xlm: string;
  usdc: string;
}

interface CacheEntry {
  data: WalletBalance;
  timestamp: number;
}

export const BALANCE_CACHE_TTL_MS = 30_000; // 30 seconds

const balanceCache = new Map<string, CacheEntry>();

/** Helper delay function for exponential backoff */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface FetchBalanceOptions {
  forceRefresh?: boolean;
  maxRetries?: number;
  initialDelayMs?: number;
}

/**
 * Fetches account balance for a Stellar address using backend proxy,
 * client-side TTL caching, and exponential backoff retries on failure.
 */
export async function fetchBalanceWithBackoff(
  address: string,
  options: FetchBalanceOptions = {}
): Promise<WalletBalance> {
  const {
    forceRefresh = false,
    maxRetries = 3,
    initialDelayMs = 500,
  } = options;

  // 1. Check client-side cache unless forceRefresh is true
  if (!forceRefresh) {
    const cached = balanceCache.get(address);
    if (cached && Date.now() - cached.timestamp < BALANCE_CACHE_TTL_MS) {
      return cached.data;
    }
  }

  let lastError: Error | null = null;
  let currentDelay = initialDelayMs;

  // 2. Retry loop with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        await delay(currentDelay);
        currentDelay *= 2;
      }

      // First try backend API proxy endpoint
      const response = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}`);

      if (response.ok) {
        const data: WalletBalance = await response.json();
        const result: WalletBalance = {
          xlm: data.xlm ?? "0",
          usdc: data.usdc ?? "0",
        };

        // Update client-side cache
        balanceCache.set(address, {
          data: result,
          timestamp: Date.now(),
        });

        return result;
      }

      // If non-ok HTTP response, check if status is 404 (unfunded account)
      if (response.status === 404) {
        const emptyBalance = { xlm: "0", usdc: "0" };
        balanceCache.set(address, {
          data: emptyBalance,
          timestamp: Date.now(),
        });
        return emptyBalance;
      }

      lastError = new Error(`Balance request failed with status ${response.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  // 3. No direct third-party fallback. The proxy was already retried with
  // exponential backoff above; the address must never leave the app except
  // via the first-party proxy. Return stale cached data if available rather
  // than breaking the UI, otherwise surface the last proxy error.
  const stale = balanceCache.get(address);
  if (stale) {
    console.warn(
      `[balance-cache] Proxy unavailable — returning stale balance for ${address}`, 
    );
    return stale.data;
  }

  console.warn(
    `[balance-cache] Proxy unavailable and no stale cache — balance unavailable for ${address}`,
  );
  throw lastError || new Error("Failed to fetch balance after retries");
}

/** Clear client-side balance cache (useful for testing or logout) */
export function clearBalanceCache(address?: string) {
  if (address) {
    balanceCache.delete(address);
  } else {
    balanceCache.clear();
  }
}

/** Utility to inspect cached balance for testing */
export function getCachedBalance(address: string): CacheEntry | undefined {
  return balanceCache.get(address);
}
