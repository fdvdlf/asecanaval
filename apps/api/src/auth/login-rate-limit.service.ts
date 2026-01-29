import { Injectable } from '@nestjs/common';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

@Injectable()
export class LoginRateLimitService {
  private readonly windowMs = 60_000;
  private readonly maxAttempts = 5;
  private readonly store = new Map<string, RateLimitEntry>();

  check(key: string) {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || entry.resetAt <= now) {
      this.store.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, remaining: this.maxAttempts - 1 };
    }

    if (entry.count >= this.maxAttempts) {
      return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
    }

    entry.count += 1;
    return { allowed: true, remaining: this.maxAttempts - entry.count };
  }
}
