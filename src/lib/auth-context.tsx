"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      // const response = await fetch("http://localhost:5144/api/profile", {
      const response = await fetch("http://localhost:3001/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        // Map API response to User interface
        const mappedUser: User = {
          id: userData.accountId || userData.id,
          email: userData.email,
          name: userData.fullName || userData.name,
          username: userData.username,
          accountId: userData.accountId,
          fullName: userData.fullName,
          gender: userData.gender,
          accountTicketRequest: userData.accountTicketRequest,
        };
        setUser(mappedUser);
      } else {
        // Token is invalid, remove it
        console.warn("Token validation failed, status:", response.status);
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // const response = await fetch("http://localhost:5144/api/profile", {
      const response = await fetch("http://localhost:3001/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        const mappedUser: User = {
          id: userData.accountId || userData.id,
          email: userData.email,
          name: userData.fullName || userData.name,
          username: userData.username,
          accountId: userData.accountId,
          fullName: userData.fullName,
          gender: userData.gender,
          accountTicketRequest: userData.accountTicketRequest,
        };
        setUser(mappedUser);
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
    }
  };

  const login = async (userName: string, password: string) => {
    try {
      // const response = await fetch("http://localhost:5144/api/login", {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);

      // Map login response to User interface
      // const mappedUser: User = {
      //   id: data.user.accountId || data.user.id,
      //   email: data.user.email,
      //   name: data.user.fullName || data.user.name,
      //   username: data.user.username,
      //   accountId: data.user.accountId,
      //   fullName: data.user.fullName,
      //   gender: data.user.gender,
      //   accountTicketRequest: data.user.accountTicketRequest,
      // };

      // setUser(mappedUser);
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      // const response = await fetch("http://localhost:5144/api/register", {
      const response = await fetch("http://localhost:3001/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountUsername: registerData.username,
          accountPassword: registerData.password,
          confirmPassword: registerData.confirmPassword,
          accountEmail: registerData.email,
          accountFullName: registerData.fullName,
          accountGender: 0,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();
      localStorage.setItem("authToken", data.token);

      // Map register response to User interface
      const mappedUser: User = {
        id: data.user.accountId || data.user.id,
        email: data.user.email,
        name: data.user.fullName || data.user.name,
        username: data.user.username,
        accountId: data.user.accountId,
        fullName: data.user.fullName,
        gender: data.user.gender,
        accountTicketRequest: data.user.accountTicketRequest,
      };

      setUser(mappedUser);
      router.push("/welcome");
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token");

      // const response = await fetch("http://localhost:5144/api/profile", {
      const response = await fetch("http://localhost:3001/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: profileData.fullName,
          username: profileData.username,
          email: profileData.email,
          gender: profileData.gender,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Profile update failed");
      }

      const updatedData = await response.json();

      // Map updated response to User interface
      const mappedUser: User = {
        id: updatedData.accountId || updatedData.id,
        email: updatedData.email,
        name: updatedData.fullName || updatedData.name,
        username: updatedData.username,
        accountId: updatedData.accountId,
        fullName: updatedData.fullName,
        gender: updatedData.gender,
        accountTicketRequest: updatedData.accountTicketRequest,
      };

      setUser(mappedUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
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
