// Tiny dependency-free, in-memory rate limiter.
//
// Keeps the app portable (no extra packages, no external store). It uses a
// fixed-window counter per key: the first hit for a key starts a window, and
// once the count passes `max` within `windowMs` further hits are rejected until
// the window rolls over. Stale entries are swept lazily so memory stays bounded.
//
// Note: state lives in this process only. That's plenty to stop inbox spam /
// runaway email costs from a single source. If the app is ever scaled to
// multiple instances, swap this for a shared store (e.g. Redis).

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  resetAt: number;
};

export class RateLimiter {
  private buckets = new Map<string, Bucket>();
  private lastSweep = 0;

  constructor(
    private readonly max: number,
    private readonly windowMs: number,
  ) {}

  // Record a hit for `key`. Returns whether this hit is over the limit.
  hit(key: string): RateLimitResult {
    const now = Date.now();
    this.maybeSweep(now);

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + this.windowMs };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;

    const limited = bucket.count > this.max;
    const remaining = Math.max(0, this.max - bucket.count);
    return { limited, remaining, resetAt: bucket.resetAt };
  }

  // Drop expired buckets occasionally so the map doesn't grow without bound.
  private maybeSweep(now: number) {
    if (now - this.lastSweep < this.windowMs) return;
    this.lastSweep = now;
    this.buckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    });
  }
}
