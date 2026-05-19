import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/authEmail';

describe('authEmail', () => {
  it('returns local preview links when SMTP is not configured', async () => {
    const request = new Request('http://localhost:3000/api/auth/verify-email');

    const verificationResult = await sendVerificationEmail({
      request,
      to: 'scavenger@example.com',
      token: 'verify-token',
    });

    const resetResult = await sendPasswordResetEmail({
      request,
      to: 'scavenger@example.com',
      token: 'reset-token',
    });

    expect(verificationResult).toEqual({
      delivered: false,
      previewUrl: 'http://localhost:3000/api/auth/verify-email?token=verify-token',
    });
    expect(resetResult).toEqual({
      delivered: false,
      previewUrl: 'http://localhost:3000/?resetToken=reset-token',
    });
  });
});