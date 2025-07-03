// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && account?.id_token) {
        try {
          // Send the Google ID token to your backend
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

          if (response.ok) {
            // Check if backend returns JSON data
            const contentType = response.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
              const backendData = await response.json();
              // Store the backend token if provided
              user.backendToken =
                backendData.token ||
                backendData.accessToken ||
                backendData.authToken;
              user.backendRole = backendData.role || backendData.userRole;
            } else {
              // If backend only returns 200 OK without JSON body,
              // we might need to fetch the user profile separately
              // For now, we'll assume success and handle token retrieval in the auth context
              console.log(
                "Google sign-in successful, but no token returned from backend"
              );
            }
            return true;
          } else {
            console.error("Backend Google sign-in failed:", response.status);
            return false;
          }
        } catch (error) {
          console.error("Error during Google sign-in with backend:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Persist the backend token and role in the JWT
      if (user?.backendToken) {
        token.backendToken = user.backendToken;
      }
      if (user?.backendRole) {
        token.backendRole = user.backendRole;
      }
      return token;
    },
    async session({ session, token }) {
      // Send the backend token and role to the client
      if (token.backendToken) {
        session.backendToken = token.backendToken as string;
      }
      if (token.backendRole) {
        session.backendRole = token.backendRole as string;
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

// types/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    backendToken?: string;
    backendRole?: string;
  }

  interface User {
    backendToken?: string;
    backendRole?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
    backendRole?: string;
  }
}
