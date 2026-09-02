import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const API_ORIGIN =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: "otp",
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.toLowerCase().trim();
        const code = (credentials?.otp as string)?.trim();
        if (!email || !code) return null;

        const res = await fetch(`${API_ORIGIN}/api/auth/admin/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: code }),
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
    maxAge: 7 * 24 * 60 * 60,
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
