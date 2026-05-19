type RateLimitPolicy = {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs?: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
  blockedUntil: number | null;
};

const globalStore = globalThis as typeof globalThis & {
  __dumpsterTycoonRateLimits?: Map<string, RateLimitEntry>;
};

const rateLimitStore = globalStore.__dumpsterTycoonRateLimits ?? new Map<string, RateLimitEntry>();

if (!globalStore.__dumpsterTycoonRateLimits) {
  globalStore.__dumpsterTycoonRateLimits = rateLimitStore;
}

function getEntry(key: string, policy: RateLimitPolicy) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextEntry: RateLimitEntry = {
      count: 0,
      resetAt: now + policy.windowMs,
      blockedUntil: null,
    };
    rateLimitStore.set(key, nextEntry);
    return nextEntry;
  }

  return existing;
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'local';
  }

  return request.headers.get('x-real-ip') || 'local';
}

export function getRateLimitKey(prefix: string, request: Request, suffix = '') {
  const ip = getClientIp(request);
  return `${prefix}:${ip}${suffix ? `:${suffix}` : ''}`;
}

export function isRateLimited(key: string, policy: RateLimitPolicy) {
  const entry = getEntry(key, policy);
  const now = Date.now();

  if (entry.blockedUntil && entry.blockedUntil > now) {
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000)),
    };
  }

  if (entry.count >= policy.maxAttempts) {
    entry.blockedUntil = now + (policy.blockDurationMs ?? policy.windowMs);
    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil(((entry.blockedUntil ?? now) - now) / 1000)),
    };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

export function registerRateLimitFailure(key: string, policy: RateLimitPolicy) {
  const entry = getEntry(key, policy);
  const now = Date.now();

  if (entry.resetAt <= now) {
    entry.count = 0;
    entry.resetAt = now + policy.windowMs;
    entry.blockedUntil = null;
  }

  entry.count += 1;

  if (entry.count >= policy.maxAttempts) {
    entry.blockedUntil = now + (policy.blockDurationMs ?? policy.windowMs);
  }
}

export function clearRateLimit(key: string) {
  rateLimitStore.delete(key);
}