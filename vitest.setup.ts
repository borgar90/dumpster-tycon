import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

afterEach(() => {
  const globalStore = globalThis as typeof globalThis & {
    __dumpsterTycoonRateLimits?: Map<string, unknown>;
  };

  globalStore.__dumpsterTycoonRateLimits?.clear();
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  delete process.env.SMTP_SECURE;
  delete process.env.EMAIL_FROM;
  delete process.env.AUTH_URL;
  process.env.NEXTAUTH_URL = 'http://localhost:3000';
});