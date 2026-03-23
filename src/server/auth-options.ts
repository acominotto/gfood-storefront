import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { env } from "@/lib/env";
import { findOrCreateWpUser } from "@/server/wp-client";

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
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const usernameSeed = profile.email.split("@")[0];
        const wpUser = await findOrCreateWpUser({
          email: profile.email,
          name: profile.name,
          username: `${slugifyUsername(usernameSeed)}-${Math.floor(Math.random() * 9999)}`,
        });
        token.wpUserId = wpUser.id;
        token.wpRole = wpUser.roles?.[0];
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.wpUserId = token.wpUserId;
      session.user.role = token.wpRole;
      return session;
    },
  },
  pages: {
    signIn: "/fr/login",
  },
};
