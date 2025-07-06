// lib/auth-context.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

// Define user roles - match your backend exactly
export enum UserRole {
  USER = "USER",
  LAWYER = "LAWYER",
  STAFF = "STAFF",
}

interface BaseUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  image?: string;
  gender?: number;
}

interface RegularUser extends BaseUser {
  role: UserRole.USER;
  accountTicketRequest?: number;
  fullName?: string;
}

interface LawyerUser extends BaseUser {
  role: UserRole.LAWYER;
  aboutLawyer?: string;
  phone?: string;
  dob?: string;
  services?: Array<{
    serviceId: string;
    pricePerHour: number;
  }>;
}

interface StaffUser extends BaseUser {
  role: UserRole.STAFF;
  fullName?: string;
}

type User = RegularUser | LawyerUser | StaffUser;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string, role?: UserRole) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  registerLawyer: (data: LawyerRegisterData) => Promise<void>;
  registerStaff: (data: StaffRegisterData) => Promise<void>;
  logout: () => void;
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

interface LawyerRegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  dob: string;
  gender: number;
  phone: string;
  image?: string;
  aboutLawyer: string;
  services: Array<{
    serviceId: string;
    pricePerHour: number;
  }>;
}

interface StaffRegisterData {
  username: string;
  fullName: string;
  email: string;
  gender: number;
  password: string;
  imageUrl?: string;
}

interface UpdateProfileData {
  fullName: string;
  gender: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const API_BASE_AUTH = "https://localhost:7218/api/Account";
  const API_BASE_LAWYER = "https://localhost:7218/api/Lawyer";
  const API_BASE_STAFF = "https://localhost:7218/api/Staff";
  const API_BASE_FORGOT_PASSWORD = "https://localhost:7218/api/ForgotPassword";

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = Cookies.get("authToken");
    const userRole = Cookies.get("userRole") as UserRole;

    if (!token || !userRole) {
      setIsLoading(false);
      return;
    }

    try {
      await fetchUserProfile(token, userRole);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      logout();
    }

    setIsLoading(false);
  };

  const fetchUserProfile = async (token: string, role: UserRole) => {
    let apiUrl = "";

    switch (role) {
      case UserRole.USER:
        apiUrl = `${API_BASE_AUTH}/profile`;
        break;
      case UserRole.LAWYER:
        apiUrl = `${API_BASE_LAWYER}/profile`;
        break;
      case UserRole.STAFF:
        apiUrl = `${API_BASE_STAFF}/profile`;
        break;
      default:
        throw new Error("Invalid user role");
    }

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unauthorized");
    }

    const userData = await response.json();
    let mappedUser: User;

    switch (role) {
      case UserRole.USER:
        mappedUser = {
          id: userData.accountId || userData.id,
          email: userData.email,
          name: userData.fullName,
          username: userData.username,
          role: UserRole.USER,
          fullName: userData.fullName,
          gender: userData.gender,
          accountTicketRequest: userData.accountTicketRequest,
          image: userData.image || "",
        } as RegularUser;

        if (userData.accountTicketRequest) {
          Cookies.set("tokens", userData.accountTicketRequest.toString(), {
            expires: 7,
          });
        }
        break;

      case UserRole.LAWYER:
        mappedUser = {
          id: userData.id,
          email: userData.email,
          name: userData.fullName,
          username: userData.username,
          role: UserRole.LAWYER,
          aboutLawyer: userData.aboutLawyer,
          phone: userData.phone,
          dob: userData.dob,
          gender: userData.gender,
          services: userData.services,
          image: userData.image || "",
        } as LawyerUser;
        break;

      case UserRole.STAFF:
        mappedUser = {
          id: userData.id,
          email: userData.email,
          name: userData.fullName,
          username: userData.username,
          role: UserRole.STAFF,
          fullName: userData.fullName,
          gender: userData.gender,
          image: userData.imageUrl || "",
        } as StaffUser;
        break;

      default:
        throw new Error("Invalid user role");
    }

    setUser(mappedUser);
  };

  const refreshUser = checkAuth;

  const login = async (
    username: string,
    password: string,
    role: UserRole = UserRole.USER
  ) => {
    const apiUrl = `${API_BASE_AUTH}/login`;
    const requestBody = { username, password };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Login failed");
      }

      const result = await response.json();
      const token = result.token;

      // Get user profile to determine actual role
      const userResponse = await fetch(`${API_BASE_AUTH}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userData = await userResponse.json();
      const actualUserRole =
        userData.role || userData.userRole || UserRole.USER;

      // Validate that the selected role matches the user's actual role
      if (role !== actualUserRole) {
        throw new Error(
          `You don't have permission to login as ${role}. Your account role is ${actualUserRole}.`
        );
      }

      Cookies.set("authToken", token, { expires: 7 });
      Cookies.set("userRole", actualUserRole, { expires: 7 });

      await fetchUserProfile(token, actualUserRole);

      // Redirect based on actual role
      switch (actualUserRole) {
        case UserRole.USER:
          router.push("/dashboard");
          break;
        case UserRole.LAWYER:
          router.push("/lawyer-dashboard");
          break;
        case UserRole.STAFF:
          router.push("/staff-dashboard");
          break;
      }
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      // console.log("Google credential:", credential);

      const response = await fetch(`${API_BASE_AUTH}/signin-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });

      if (!response.ok) {
        throw new Error("Google sign-in failed");
      }

      const data = await response.json();
      const role = data.role || "USER";

      Cookies.set("authToken", data.token, { expires: 7 });
      Cookies.set("userRole", data.role, { expires: 7 });

      if (role === UserRole.USER && data.tokens) {
        Cookies.set("tokens", data.tokens.toString(), { expires: 7 });
      }

      await fetchUserProfile(data.token, role);

      // redirect based on role
      if (role === UserRole.LAWYER) router.push("/lawyer-dashboard");
      else if (role === UserRole.STAFF) router.push("/staff-dashboard");
      else router.push("/");
    } catch (error) {
      console.error("Google sign-in failed:", error);
      throw error;
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

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Registration failed");
      }

      router.push("/sign-in");
    } catch (error) {
      throw error;
    }
  };

  const registerLawyer = async (registerData: LawyerRegisterData) => {
    try {
      const newLawyer = {
        accountUsername: registerData.username,
        accountPassword: registerData.password,
        accountEmail: registerData.email,
        accountFullName: registerData.fullName,
        accountDob: registerData.dob,
        accountGender: registerData.gender,
        accountPhone: registerData.phone,
        accountImage: registerData.image || "",
        aboutLawyer: registerData.aboutLawyer,
        serviceForLawyerDTOs: registerData.services,
      };

      const response = await fetch(`${API_BASE_LAWYER}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newLawyer),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Lawyer registration failed");
      }

      router.push("/sign-in");
    } catch (error) {
      throw error;
    }
  };

  const registerStaff = async (registerData: StaffRegisterData) => {
    try {
      const newStaff = {
        username: registerData.username,
        fullName: registerData.fullName,
        email: registerData.email,
        gender: registerData.gender,
        password: registerData.password,
        imageUrl: registerData.imageUrl || "",
      };

      const response = await fetch(`${API_BASE_STAFF}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newStaff),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Staff registration failed");
      }

      router.push("/sign-in");
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (profileData: UpdateProfileData) => {
    try {
      const token = Cookies.get("authToken");
      const userRole = Cookies.get("userRole") as UserRole;

      if (!token || !userRole) throw new Error("No user logged in");

      let apiUrl = "";
      switch (userRole) {
        case UserRole.USER:
          apiUrl = `${API_BASE_AUTH}/profile/update`;
          break;
        case UserRole.LAWYER:
          apiUrl = `${API_BASE_LAWYER}/profile/update`;
          break;
        case UserRole.STAFF:
          apiUrl = `${API_BASE_STAFF}/profile/update`;
          break;
      }

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Update failed");
      }

      await refreshUser();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    Cookies.remove("authToken");
    Cookies.remove("userRole");
    Cookies.remove("tokens");
    setUser(null);

    router.push("/");
  };

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
        registerLawyer,
        registerStaff,
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
