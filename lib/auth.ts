import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { resolveApiOrigin } from "@/lib/api-origin";

const API_ORIGIN = resolveApiOrigin();

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const password = credentials?.password as string;
        if (!email || !password) return null;

        const res = await fetch(`${API_ORIGIN}/api/auth/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return null;

        const data = await res.json();
        const user = data.user;
        if (!user?.id || !user?.email) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name || "Admin",
          role: "admin",
          status: user.status || "active",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = (user as any).role || "admin";
        token.status = (user as any).status || "active";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
        session.user.name = (token.name as string) || "Admin";
        (session.user as any).role = token.role || "admin";
        (session.user as any).status = token.status || "active";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60,
  },
  trustHost: true,
  cookies: {
    sessionToken: {
      name: "getmaterials-admin-session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
});
