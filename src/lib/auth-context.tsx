"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  username: string;
}

interface UpdateProfileData {
  fullName: string;
  username: string;
  email: string;
  gender: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const API_BASE_AUTH = "https://localhost:7218/api/Account";
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
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
    } finally {
      setIsLoading(false);
    }
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

  const register = async (registerData: RegisterData) => {
    try {
      const newUser = {
        username: registerData.username,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        email: registerData.email,
        fullName: registerData.fullName,
      };

      const response = await fetch(`${API_BASE_AUTH}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Registration failed");
      }

      router.push("/login");
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("No user logged in");

      // const response = await fetch(`http://localhost:3001/accounts/${userId}`, {
      const response = await fetch(`${API_BASE_AUTH}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountUsername: profileData.username,
          accountEmail: profileData.email,
          accountFullName: profileData.fullName,
          accountGender: profileData.gender,
        }),
      });

      const updated = await response.json();

      const mappedUser: User = {
        id: updated.id.toString(),
        email: updated.accountEmail,
        name: updated.accountFullName,
        username: updated.accountUsername,
        accountId: updated.id.toString(),
        fullName: updated.accountFullName,
        gender: updated.accountGender,
        accountTicketRequest: updated.accountTicketRequest,
      };

      setUser(mappedUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove("authToken");
    Cookies.remove("tokens");
    setUser(null);
    router.push("/");
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await fetch(
        "http://localhost:5144/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send reset email");
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
        register,
        logout,
        forgotPassword,
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
