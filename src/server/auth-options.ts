import { env } from "@/lib/env";
import { authenticateWpUserWithPassword } from "@/server/wp-auth";
import { findOrCreateWpUser } from "@/server/wp-client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

function slugifyUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: "storefront.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: env.NODE_ENV === "production",
      },
    },
  },
  secret: env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.email?.trim();
        const password = credentials?.password;
        if (!identifier || !password) return null;

        const wpUser = await authenticateWpUserWithPassword(identifier, password);
        if (!wpUser?.id) return null;

        return {
          id: String(wpUser.id),
          email: wpUser.email ?? identifier,
          name: wpUser.name ?? undefined,
          wpUserId: wpUser.id,
          role: wpUser.roles?.[0],
        };
      },
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google" && profile?.email) {
        const usernameSeed = profile.email.split("@")[0];
        const wpUser = await findOrCreateWpUser({
          email: profile.email,
          name: profile.name,
          username: `${slugifyUsername(usernameSeed)}-${Math.floor(Math.random() * 9999)}`,
        });
        token.wpUserId = wpUser.id;
        token.wpRole = wpUser.roles?.[0];
        token.email = profile.email;
        token.name = profile.name ?? null;
        const pic = (profile as { picture?: string }).picture;
        token.picture = pic ?? null;
        token.sub = String(wpUser.id);
      } else if (account?.provider === "credentials" && user) {
        token.wpUserId = user.wpUserId;
        token.wpRole = user.role;
        token.email = user.email ?? null;
        token.name = user.name ?? null;
        token.picture = null;
        token.sub = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.wpUserId = token.wpUserId;
      session.user.role = token.wpRole;
      session.user.email = token.email ?? session.user.email;
      session.user.name = token.name ?? session.user.name;
      session.user.image = token.picture ?? session.user.image;
      return session;
    },
  },
  pages: {
    signIn: "/fr/login",
  },
};
