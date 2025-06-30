import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          // Call your backend API to handle Google sign-in
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/Account/signin-google`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                idToken: account.id_token,
              }),
            }
          );

          if (!response.ok) {
            console.error("Failed to authenticate with backend");
            return false;
          }

          const result = await response.json();

          // Store the backend token in the user object
          user.backendToken = result.token;

          return true;
        } catch (error) {
          console.error("Error during Google sign-in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Store backend token in JWT
      if (user?.backendToken) {
        token.backendToken = user.backendToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Add backend token to session
      if (token.backendToken) {
        session.backendToken = token.backendToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
