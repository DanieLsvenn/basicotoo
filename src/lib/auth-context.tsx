"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Cookies from "js-cookie";

interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  accountId?: string;
  fullName?: string;
  gender?: number;
  accountTicketRequest?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  // Updated forgot password methods
  requestPasswordReset: (email: string) => Promise<void>;
  verifyResetOtp: (email: string, otp: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  username: string;
  gender: number;
}

interface UpdateProfileData {
  fullName: string;
  gender: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const API_BASE_AUTH = "https://localhost:7218/api/Account";
  const API_BASE_FORGOT_PASSWORD = "https://localhost:7218/api/ForgotPassword";
  const API_BASE_URL = "https://localhost:7218/api/Account";
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, [session, status]);

  const checkAuth = async () => {
    // Handle NextAuth session
    if (status === "loading") {
      return;
    }

    if (session?.backendToken) {
      // User is logged in via Google OAuth
      try {
        const response = await fetch(`${API_BASE_AUTH}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.backendToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const mappedUser: User = {
            id: userData.id,
            email: userData.email,
            name: userData.fullName,
            username: userData.username,
            fullName: userData.fullName,
            gender: userData.gender,
            accountTicketRequest: userData.accountTicketRequest,
          };
          setUser(mappedUser);
          Cookies.set("authToken", session.backendToken, { expires: 7 });
        }
      } catch (err) {
        console.error("Failed to fetch user profile from Google session", err);
      }
    } else {
      // Check for regular authentication token
      const token = Cookies.get("authToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_AUTH}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Unauthorized");
        }

        const userData = await response.json();

        const mappedUser: User = {
          id: userData.id,
          email: userData.email,
          name: userData.fullName,
          username: userData.username,
          fullName: userData.fullName,
          gender: userData.gender,
          accountTicketRequest: userData.accountTicketRequest,
        };

        setUser(mappedUser);
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        logout();
      }
    }

    setIsLoading(false);
  };

  const refreshUser = checkAuth;

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_AUTH}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Login failed");
      }

      const result = await response.json();
      const token = result.token;

      Cookies.set("authToken", token, { expires: 7 });

      await refreshUser(); // loads profile from /profile
      router.push("/");
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (error) {
      console.error("Google sign-in failed:", error);
      throw new Error("Google sign-in failed");
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const newUser = {
        accountUsername: registerData.username,
        accountPassword: registerData.password,
        confirmPassword: registerData.confirmPassword,
        accountEmail: registerData.email,
        accountFullName: registerData.fullName,
        accountGender: registerData.gender,
      };

      const response = await fetch(`${API_BASE_AUTH}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      console.log("Sending to API:", JSON.stringify(newUser));

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Registration failed");
      }

      router.push("/sign-in");
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const token = Cookies.get("authToken") || session?.backendToken;
      if (!token) throw new Error("No user logged in");

      const response = await fetch(`${API_BASE_URL}/Account/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          gender: profileData.gender,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Update failed");
      }

      // Refresh user data after successful update
      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    Cookies.remove("authToken");
    Cookies.remove("tokens");
    setUser(null);

    // Sign out from NextAuth if user was logged in via Google
    if (session) {
      await signOut({ redirect: false });
    }

    router.push("/");
  };

  // Fixed forgot password methods
  const requestPasswordReset = async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_FORGOT_PASSWORD}/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send reset email");
      }
    } catch (error) {
      throw error;
    }
  };

  const verifyResetOtp = async (email: string, otp: string) => {
    try {
      const response = await fetch(`${API_BASE_FORGOT_PASSWORD}/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Invalid or expired OTP");
      }
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE_FORGOT_PASSWORD}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        register,
        logout,
        requestPasswordReset,
        verifyResetOtp,
        resetPassword,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
