import { QueryClient } from "@tanstack/react-query";
import { circuitBreaker, CircuitBreakerOpenError } from "./circuitBreaker";

/**
 * 🔄 EXPONENTIAL BACKOFF
 * Calculates delay for retry attempts with exponential backoff
 */
export function calculateBackoff(
  attemptIndex: number,
  is429Error: boolean
): number {
  // Base delay in milliseconds
  const baseDelay = is429Error ? 2000 : 1000; // 2s for 429, 1s for others

  // Exponential backoff: 2^attemptIndex * baseDelay
  // Attempt 1: 2s, 4s
  // Attempt 2: 4s, 8s
  // Attempt 3: 8s, 16s
  const exponentialDelay = Math.pow(2, attemptIndex) * baseDelay;

  // Add jitter (±20%) to prevent thundering herd
  const jitter = exponentialDelay * 0.2 * (Math.random() - 0.5);

  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
}

/**
 * 🛡️ RETRY LOGIC
 * Determines if a failed request should be retried
 * Now uses circuit breaker to stop ALL retries after 3 total 429 errors
 */
export function shouldRetry(failureCount: number, error: any): boolean {
  // 🚫 FIRST CHECK: Is circuit breaker open?
  if (circuitBreaker.isCircuitOpen()) {
    console.error("🚫 Circuit breaker is OPEN - blocking all API calls");
    return false;
  }

  // Check if circuit breaker allows more retries
  if (!circuitBreaker.canRetry()) {
    console.error("🚫 Max total retries reached across all calls - stopping");
    return false;
  }

  // Check if it's a 429 (rate limit) or 503 (overload) error
  const status = error?.response?.status || error?.status;
  const is429 = status === 429;
  const is503 = status === 503;
  const isOverload = is503 || error?.message?.includes("overload");

  if (is429) {
    // Record the 429 failure in circuit breaker
    circuitBreaker.recordFailure(error);

    // Check again if circuit is now open after recording
    if (circuitBreaker.isCircuitOpen()) {
      console.error("🚫 Circuit breaker opened after recording failure");
      return false;
    }

    console.log(
      `⏳ 429 Rate Limit - Retry ${failureCount + 1} (Total retries: ${
        circuitBreaker.getState().totalRetries
      }/3)`
    );
    return true;
  }

  if (isOverload) {
    console.log(
      `⏳ Overload Error - Retry ${failureCount + 1}/3 with exponential backoff`
    );
    return true;
  }

  // Don't retry for other errors (400, 401, 404, etc.)
  console.log(`❌ Non-retryable error (status: ${status})`);
  return false;
}

/**
 * 🎯 RETRY DELAY
 * Calculates the delay before the next retry attempt
 */
export function getRetryDelay(attemptIndex: number, error: any): number {
  const status = error?.response?.status || error?.status;
  const is429 = status === 429;

  // Use exponential backoff
  const delay = calculateBackoff(attemptIndex, is429);

  console.log(
    `⏱️ Waiting ${Math.round(delay / 1000)}s before retry ${
      attemptIndex + 1
    }... ${is429 ? "(429 Rate Limit)" : "(Overload)"}`
  );

  return delay;
}

/**
 * 📦 QUERY CLIENT CONFIGURATION
 * Creates a QueryClient with optimized retry and caching settings
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry configuration with circuit breaker
      retry: shouldRetry,
      retryDelay: getRetryDelay,

      // Refetch behavior
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
    mutations: {
      // Retry configuration for mutations (POST/PUT/DELETE requests)
      retry: shouldRetry,
      retryDelay: getRetryDelay,

      // Global success handler
      onSuccess: () => {
        // Record success in circuit breaker
        circuitBreaker.recordSuccess();
      },

      // Global error handler
      onError: (error: any) => {
        console.error("🚨 Mutation error:", error);

        // Check if it's a circuit breaker error
        if (error instanceof CircuitBreakerOpenError) {
          console.error(
            `🚫 Circuit breaker active: Wait ${error.remainingCooldown}s`
          );
          return;
        }

        const status = error?.response?.status || error?.status;
        if (status === 429) {
          const remaining = circuitBreaker.getRemainingCooldown();
          if (remaining > 0) {
            console.warn(
              `⚠️ Rate limit protection active. Wait ${remaining}s before trying again.`
            );
          } else {
            console.warn(
              "⚠️ Rate limit reached. Please wait before making more requests."
            );
          }
        } else if (status === 503) {
          console.warn("⚠️ Service overloaded. Retrying with backoff...");
        }
      },
    },
  },
});

/**
 * 🔧 UTILITY: Sleep function for manual delays
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 🔧 UTILITY: Parse error status from various error formats
 */
export function getErrorStatus(error: any): number | null {
  // Try different error formats
  return (
    error?.response?.status ||
    error?.status ||
    (error?.message?.includes("429") ? 429 : null) ||
    (error?.message?.includes("503") ? 503 : null) ||
    null
  );
}

/**
 * 🔧 UTILITY: Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const status = getErrorStatus(error);
  return (
    status === 429 || status === 503 || error?.message?.includes("overload")
  );
}
