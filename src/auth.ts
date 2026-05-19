import { compare } from 'bcryptjs';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { Adapter, AdapterUser } from 'next-auth/adapters';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import DiscordProvider from 'next-auth/providers/discord';
import GoogleProvider from 'next-auth/providers/google';

import { validateEmail } from '@/lib/authValidation';
import { createStarterProfileData, normalizeUsernameBase } from '@/lib/defaultProfile';
import { parseSettingsJson } from '@/lib/profileState';
import { prisma } from '@/lib/prisma';

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-only-secret-change-me';

const getDateKey = (value: Date) => value.toISOString().slice(0, 10);

const getDayDiff = (from: string, to: string) => {
  const start = new Date(`${from}T00:00:00.000Z`).getTime();
  const end = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.round((end - start) / 86400000);
};

export const enabledAuthProviders = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  discord: Boolean(process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET),
};

async function reserveUniqueUsername(seed: string) {
  const base = normalizeUsernameBase(seed);

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const suffix = attempt === 0 ? '' : `_${Math.floor(Math.random() * 900 + 100)}`;
    const username = `${base}${suffix}`.slice(0, 24);
    const existing = await prisma.user.findUnique({ where: { username } });

    if (!existing) {
      return username;
    }
  }

  return `${base}_${Date.now().toString().slice(-6)}`.slice(0, 24);
}

async function ensureUserProfile(userId: string, fallbackName: string) {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!currentUser) {
    return null;
  }

  let username = currentUser.username;
  if (!username) {
    username = await reserveUniqueUsername(currentUser.name || currentUser.email || fallbackName);
    await prisma.user.update({
      where: { id: userId },
      data: { username },
    });
  }

  if (!currentUser.profile) {
    await prisma.playerProfile.create({
      data: {
        userId,
        ...createStarterProfileData(currentUser.name || username || fallbackName),
      },
    });
  }

  return {
    username,
    image: currentUser.image,
    name: currentUser.name || username,
  };
}

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Email and Password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : '';
      const password = typeof credentials?.password === 'string' ? credentials.password : '';

      if (!email || !password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user?.hashedPassword) {
        return null;
      }

      const isValid = await compare(password, user.hashedPassword);
      if (!isValid) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || user.username,
        image: user.image,
        username: user.username,
        emailVerified: user.emailVerified,
      };
    },
  }),
];

if (enabledAuthProviders.google) {
  providers.push(
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

if (enabledAuthProviders.discord) {
  providers.push(
    DiscordProvider({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

const baseAdapter = PrismaAdapter(prisma);

const authAdapter: Adapter = {
  ...baseAdapter,
  async createUser(user: Omit<AdapterUser, 'id'>) {
    const username = await reserveUniqueUsername(user.name || user.email || 'Scavenger');

    return prisma.user.create({
      data: {
        email: user.email,
        name: user.name,
        image: user.image,
        emailVerified: user.emailVerified,
        username,
      },
    });
  },
};

export const authOptions: NextAuthOptions = {
  adapter: authAdapter,
  session: {
    strategy: 'jwt',
  },
  secret: authSecret,
  pages: {
    signIn: '/',
  },
  providers,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials' && user.email) {
        const currentUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { emailVerified: true },
        });

        if (!currentUser?.emailVerified) {
          return `/?authError=email_not_verified&email=${encodeURIComponent(user.email)}`;
        }
      }

      if (account?.provider && account.provider !== 'credentials') {
        if (!user.email) {
          return '/?authError=provider_email_missing';
        }

        if (validateEmail(user.email)) {
          return '/?authError=provider_email_invalid';
        }

        const providerProfile = profile as Record<string, unknown> | undefined;
        const emailVerified = providerProfile && 'verified' in providerProfile
          ? Boolean(providerProfile.verified)
          : providerProfile && 'email_verified' in providerProfile
            ? Boolean(providerProfile.email_verified)
            : true;

        if (!emailVerified) {
          return '/?authError=provider_email_unverified';
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.username = user.username || user.name || null;
      }

      if (token.sub && !token.username) {
        const currentUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { username: true, name: true, image: true },
        });

        if (currentUser) {
          token.username = currentUser.username || currentUser.name || null;
          token.picture = currentUser.image || token.picture;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.username = typeof token.username === 'string' ? token.username : session.user.name || 'scavenger';
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) {
        return;
      }

      await ensureUserProfile(user.id, user.name || user.email || 'Scavenger');
    },
    async signIn({ user, account, profile }) {
      if (!user.id) {
        return;
      }

      const ensured = await ensureUserProfile(user.id, user.name || user.email || 'Scavenger');
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
      const providerProfile = profile as Record<string, unknown> | undefined;
      const providerEmailVerified = providerProfile && 'verified' in providerProfile
        ? Boolean(providerProfile.verified)
        : providerProfile && 'email_verified' in providerProfile
          ? Boolean(providerProfile.email_verified)
          : false;
      const shouldVerifyEmail = account?.provider !== 'credentials' && providerEmailVerified && !currentUser?.emailVerified;

      const today = getDateKey(new Date());
      const currentSettings = parseSettingsJson(currentUser?.profile?.settingsJson ?? '');
      const lastActiveDate = currentSettings.lastActiveDate;
      const sessionStreak = lastActiveDate === today
        ? currentSettings.sessionStreak
        : lastActiveDate && getDayDiff(lastActiveDate, today) === 1
          ? currentSettings.sessionStreak + 1
          : 1;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          name: ensured?.name || user.name,
          image: ensured?.image || user.image,
          ...(shouldVerifyEmail ? { emailVerified: new Date() } : {}),
        },
      });

      if (currentUser?.profile) {
        await prisma.playerProfile.update({
          where: { userId: user.id },
          data: {
            settingsJson: JSON.stringify({
              ...currentSettings,
              sessionStreak,
              lastActiveDate: today,
            }),
          },
        });
      }
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function createUsernameForSeed(seed: string) {
  return reserveUniqueUsername(seed);
}
