import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB, Otp } from "@getmaterials/database";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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

        // Check if email is in the admin list
        if (!ADMIN_EMAILS.includes(email)) return null;

        await connectDB();

        // Find valid OTP
        const otp = await Otp.findOne({
          email,
          code,
          used: false,
          expiresAt: { $gt: new Date() },
        });

        if (!otp) return null;

        // Mark OTP as used
        otp.used = true;
        await otp.save();

        return {
          id: email,
          email,
          name: "Admin",
          role: "admin",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (1 week)
  },
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
