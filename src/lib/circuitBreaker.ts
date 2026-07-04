/**
 * 🛡️ CIRCUIT BREAKER for Rate Limiting
 *
 * Prevents excessive API calls when hitting rate limits.
 * After 3 failed attempts due to 429, the circuit "opens" and blocks
 * all subsequent calls for a cooldown period.
 */

interface CircuitBreakerState {
  failureCount: number;
  lastFailureTime: number | null;
  isOpen: boolean;
  totalRetries: number; // Track total retries across all calls
}

class CircuitBreaker {
  private state: CircuitBreakerState = {
    failureCount: 0,
    lastFailureTime: null,
    isOpen: false,
    totalRetries: 0,
  };

  private readonly maxRetries = 3; // Max TOTAL retries across all calls
  private readonly resetTimeout = 60000; // 60 seconds cooldown

  /**
   * Check if circuit breaker is open (blocking calls)
   */
  isCircuitOpen(): boolean {
    // If circuit is open, check if cooldown period has passed
    if (this.state.isOpen && this.state.lastFailureTime) {
      const timeSinceFailure = Date.now() - this.state.lastFailureTime;

      if (timeSinceFailure > this.resetTimeout) {
        console.log("✅ Circuit breaker: Cooldown period passed, resetting...");
        this.reset();
        return false;
      }

      const remainingTime = Math.ceil(
        (this.resetTimeout - timeSinceFailure) / 1000
      );
      console.warn(
        `🚫 Circuit breaker OPEN: Rate limit protection active. Wait ${remainingTime}s before trying again.`
      );
      return true;
    }

    return this.state.isOpen;
  }

  /**
   * Record a 429 failure
   */
  recordFailure(error: any): void {
    const status = error?.response?.status || error?.status;

    if (status === 429) {
      this.state.failureCount++;
      this.state.totalRetries++;
      this.state.lastFailureTime = Date.now();

      console.warn(
        `⚠️ Rate limit hit (${this.state.totalRetries}/${this.maxRetries} total retries)`
      );

      // Open circuit if we've hit max retries
      if (this.state.totalRetries >= this.maxRetries) {
        this.state.isOpen = true;
        console.error(
          `🚫 Circuit breaker OPENED: Max retries (${this.maxRetries}) reached. ` +
            `Blocking all API calls for ${this.resetTimeout / 1000}s.`
        );
      }
    }
  }

  /**
   * Record a successful call
   */
  recordSuccess(): void {
    // Don't reset on success if circuit is open
    // Only reset after cooldown period
    if (!this.state.isOpen) {
      this.state.failureCount = 0;
    }
  }

  /**
   * Reset the circuit breaker
   */
  reset(): void {
    console.log("🔄 Circuit breaker: Resetting state");
    this.state = {
      failureCount: 0,
      lastFailureTime: null,
      isOpen: false,
      totalRetries: 0,
    };
  }

  /**
   * Get current state for debugging
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Get remaining cooldown time in seconds
   */
  getRemainingCooldown(): number {
    if (!this.state.isOpen || !this.state.lastFailureTime) {
      return 0;
    }

    const elapsed = Date.now() - this.state.lastFailureTime;
    const remaining = Math.max(0, this.resetTimeout - elapsed);
    return Math.ceil(remaining / 1000);
  }

  /**
   * Manually open the circuit (for testing or emergency shutoff)
   */
  open(): void {
    this.state.isOpen = true;
    this.state.lastFailureTime = Date.now();
    console.warn("🚫 Circuit breaker manually OPENED");
  }

  /**
   * Check if we should allow retry based on total retries
   */
  canRetry(): boolean {
    return this.state.totalRetries < this.maxRetries;
  }
}

// Global circuit breaker instance
export const circuitBreaker = new CircuitBreaker();

/**
 * Error class for circuit breaker open state
 */
export class CircuitBreakerOpenError extends Error {
  public readonly remainingCooldown: number;

  constructor(remainingCooldown: number) {
    super(
      `Rate limit protection active. Please wait ${remainingCooldown} seconds before trying again.`
    );
    this.name = "CircuitBreakerOpenError";
    this.remainingCooldown = remainingCooldown;
  }
}
