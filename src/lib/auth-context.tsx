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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const userId = Cookies.get("authToken");
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // const response = await fetch(`http://localhost:3001/accounts/${userId}`);
      const response = await fetch(`http://localhost:5144/api/profile`);
      const userData = await response.json();

      const mappedUser: User = {
        id: userData.id.toString(),
        email: userData.accountEmail,
        name: userData.accountFullName,
        username: userData.accountUsername,
        accountId: userData.id.toString(),
        fullName: userData.accountFullName,
        gender: userData.accountGender,
        accountTicketRequest: userData.accountTicketRequest,
      };

      setUser(mappedUser);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = checkAuth;

  const login = async (username: string, password: string) => {
    try {
      // const response = await fetch(
      //   `http://localhost:3001/accounts?accountUsername=${username}&accountPassword=${password}`
      // );
      const response = await fetch(`http://localhost:5144/api/login`);
      const result = await response.json();

      if (result.length === 0) {
        throw new Error("Invalid username or password");
      }

      const userData = result[0];
      const mappedUser: User = {
        id: userData.id.toString(),
        email: userData.accountEmail,
        name: userData.accountFullName,
        username: userData.accountUsername,
        accountId: userData.id.toString(),
        fullName: userData.accountFullName,
        gender: userData.accountGender,
        accountTicketRequest: userData.accountTicketRequest,
      };

      Cookies.set("authToken", userData.id.toString(), { expires: 7 }); // 7-day session
      Cookies.set("tokens", userData.accountTicketRequest.toString() || "0");

      setUser(mappedUser);
      router.push("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const register = async (registerData: RegisterData) => {
    try {
      const newUser = {
        accountUsername: registerData.username,
        accountPassword: registerData.password,
        accountEmail: registerData.email,
        accountFullName: registerData.fullName,
        accountGender: 0,
        accountTicketRequest: 0,
      };

      // const response = await fetch("http://localhost:3001/accounts", {
      const response = await fetch(" http://localhost:5144/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const createdUser = await response.json();

      localStorage.setItem("userId", createdUser.id.toString());

      const mappedUser: User = {
        id: createdUser.id.toString(),
        email: createdUser.accountEmail,
        name: createdUser.accountFullName,
        username: createdUser.accountUsername,
        accountId: createdUser.id.toString(),
        fullName: createdUser.accountFullName,
        gender: createdUser.accountGender,
        accountTicketRequest: createdUser.accountTicketRequest,
      };

      Cookies.set("authToken", createdUser.id.toString(), { expires: 7 }); // 7-day session
      Cookies.set("tokens", createdUser.accountTicketRequest.toString() || "0");

      setUser(mappedUser);
      router.push("/welcome");
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("No user logged in");

      // const response = await fetch(`http://localhost:3001/accounts/${userId}`, {
      const response = await fetch(`http://localhost:5144/api/profile`, {
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
