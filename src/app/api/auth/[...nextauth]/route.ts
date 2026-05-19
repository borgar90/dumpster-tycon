import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

import { authOptions } from '@/auth';
import { getRateLimitKey, isRateLimited } from '@/lib/rateLimit';

const handler = NextAuth(authOptions);

const AUTH_POST_RATE_LIMIT = {
	windowMs: 60 * 1000,
	maxAttempts: 25,
	blockDurationMs: 2 * 60 * 1000,
};

const CREDENTIALS_POST_RATE_LIMIT = {
	windowMs: 10 * 60 * 1000,
	maxAttempts: 10,
	blockDurationMs: 10 * 60 * 1000,
};

export const GET = handler;

export async function POST(request: Request) {
	const url = new URL(request.url);
	const isCredentialsCallback = url.pathname.endsWith('/callback/credentials');
	const policy = isCredentialsCallback ? CREDENTIALS_POST_RATE_LIMIT : AUTH_POST_RATE_LIMIT;
	const rateLimitKey = getRateLimitKey('nextauth-post', request, url.pathname);
	const rateLimitStatus = isRateLimited(rateLimitKey, policy);

	if (rateLimitStatus.limited) {
		return NextResponse.json({ error: `Too many auth requests. Try again in ${rateLimitStatus.retryAfterSeconds} seconds.` }, { status: 429 });
	}

	return handler(request);
}
