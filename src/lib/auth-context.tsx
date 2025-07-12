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
  ADMIN = "ADMIN", // <-- Added
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

interface AdminUser extends BaseUser {
  role: UserRole.ADMIN;
}

type User = RegularUser | LawyerUser | StaffUser | AdminUser;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
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

  // Fixed admin credentials (for testing only)
  const ADMIN_USERNAME = "AdminToiCao69";
  const ADMIN_PASSWORD = "1";

  const checkAuth = async () => {
    const authToken = Cookies.get("authToken");
    const userRole = Cookies.get("userRole") as UserRole;

    if (userRole === UserRole.ADMIN) {
      setUser({
        id: "admin-id",
        email: "admin@example.com",
        name: "Admin",
        username: ADMIN_USERNAME,
        role: UserRole.ADMIN,
      });
      setIsLoading(false);
      return;
    }

    if (!authToken || !userRole) {
      setIsLoading(false);
      return;
    }

    try {
      await fetchUserProfile(authToken, userRole);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      logout();
    }

    setIsLoading(false);
  };

  // Set user role to cookie
  const setUserRoleToCookie = async (token: string) => {
    const response = await fetch(`${API_BASE_AUTH}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err || "[auth-context.tsx] Error at setUserRoleToCookie");
    }

    const userProfile = await response.json();

    // Determine role from the userProfile
    let userRole: UserRole;
    if (userProfile.role) {
      userRole = userProfile.role;
    } 
    else if (userProfile.userRole) {
      userRole = userProfile.userRole;
    } 
    else if (userProfile.accountType) {
      userRole = userProfile.accountType;
    } 
    else {
      userRole = UserRole.USER;
    }

    // Store the determined role
    Cookies.set("userRole", userRole, { expires: 7 });
  };

  const fetchUserProfile = async (token: string, role: UserRole) => {
    if (role === UserRole.ADMIN) {
      setUser({
        id: "admin-id",
        email: "admin@example.com",
        name: "Admin",
        username: ADMIN_USERNAME,
        role: UserRole.ADMIN,
      });
      return;
    }

    let apiUrl = `${API_BASE_AUTH}/profile`;
    let userProfile: any;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "[auth-context.tsx] Error at fetchUserProfile");
    }

    userProfile = await response.json();

    let mappedUser: User;

    switch (role) {
      case UserRole.USER:
        mappedUser = {
          id: userProfile.accountId || userProfile.id,
          email: userProfile.email,
          name: userProfile.fullName,
          username: userProfile.username,
          role: UserRole.USER,
          fullName: userProfile.fullName,
          gender: userProfile.gender,
          accountTicketRequest: userProfile.accountTicketRequest,
          image: userProfile.image || "",
        } as RegularUser;

        if (userProfile.accountTicketRequest) {
          Cookies.set("ticket", userProfile.accountTicketRequest.toString(), {
            expires: 7,
          });
        }
        break;

      case UserRole.LAWYER:
        mappedUser = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.fullName,
          username: userProfile.username,
          role: UserRole.LAWYER,
          aboutLawyer: userProfile.aboutLawyer,
          phone: userProfile.phone,
          dob: userProfile.dob,
          gender: userProfile.gender,
          services: userProfile.services,
          image: userProfile.image || "",
        } as LawyerUser;
        break;

      case UserRole.STAFF:
        mappedUser = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.fullName,
          username: userProfile.username,
          role: UserRole.STAFF,
          fullName: userProfile.fullName,
          gender: userProfile.gender,
          image: userProfile.imageUrl || "",
        } as StaffUser;
        break;
    }

    setUser(mappedUser);
  };

  const refreshUser = checkAuth;

  // Helper to handle login response, set cookies, fetch profile, and redirect
  const handleLoginAndRedirect = async (
    response: Response,
    getToken: (data: any) => string
  ) => {
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Sign-in failed");
    }

    const data = await response.json();
    console.log("Login response data:", data);
    const token = getToken(data);

    Cookies.set("authToken", token, { expires: 7 });

    // Determine user role and fetch profile
    await setUserRoleToCookie(token);

    // Get the user role that was determined
    const userRole = Cookies.get("userRole") as UserRole;

    // Fetch user profile based on the role
    await fetchUserProfile(token, userRole);

    // Redirect based on user role
    switch (userRole) {
      case UserRole.USER:
        router.push("/");
        break;
      case UserRole.LAWYER:
        router.push("/dashboard/lawyer-dashboard");
        break;
      case UserRole.STAFF:
        router.push("/dashboard/staff-dashboard");
        break;
      default:
        router.push("/");
    }
  };

  const login = async (username: string, password: string) => {
    // Fixed admin login for testing
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const adminUser: AdminUser = {
        id: "admin-id",
        email: "admin@example.com",
        name: "Admin",
        username: ADMIN_USERNAME,
        role: UserRole.ADMIN,
      };
      Cookies.set("authToken", "admin-token", { expires: 7 });
      Cookies.set("userRole", UserRole.ADMIN, { expires: 7 });
      setUser(adminUser);
      router.push("/");
      return;
    }

    try {
      // Use the unified login endpoint for all user types
      const response = await fetch(`${API_BASE_AUTH}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      await handleLoginAndRedirect(response, (data) => data.token);
    } catch (error) {
      console.error("[auth-context.tsx] Login failed:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await fetch(`${API_BASE_AUTH}/signin-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });

      await handleLoginAndRedirect(response, (data) => data.token);
    } catch (error) {
      console.error("[auth-context.tsx] Google sign-in failed:", error);
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

  // Remove if lawyer can only be registered through admin
  // If they can be registered through the frontend, keep these functions
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

  // Remove if staff can only be registered through admin
  // If they can be registered through the frontend, keep these functions
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
        // Remove if lawyer and staff can only be updated through admin
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
    Cookies.remove("ticket");
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

// Old code where admin role was not present
// ==============================================================================
/*
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
  login: (username: string, password: string) => Promise<void>;
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
    const authToken = Cookies.get("authToken");
    const userRole = Cookies.get("userRole") as UserRole;

    if (!authToken || !userRole) {
      setIsLoading(false);
      return;
    }

    try {
      await fetchUserProfile(authToken, userRole);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      logout();
    }

    setIsLoading(false);
  };

  // Set user role to cookie
  const setUserRoleToCookie = async (token: string) => {
    const response = await fetch(`${API_BASE_AUTH}/profile`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err || "[auth-context.tsx] Error at setUserRoleToCookie");
    }

    const userProfile = await response.json();

    // Determine role from the userProfile
    let userRole: UserRole;
    if (userProfile.role) {
      userRole = userProfile.role;
    } 
    else if (userProfile.userRole) {
      userRole = userProfile.userRole;
    } 
    else if (userProfile.accountType) {
      userRole = userProfile.accountType;
    } 
    else {
      userRole = UserRole.USER;
    }

    // Store the determined role
    Cookies.set("userRole", userRole, { expires: 7 });
  };

  const fetchUserProfile = async (token: string, role: UserRole) => {
    let apiUrl = `${API_BASE_AUTH}/profile`;
    let userProfile: any;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "[auth-context.tsx] Error at fetchUserProfile");
    }

    userProfile = await response.json();

    let mappedUser: User;

    switch (role) {
      case UserRole.USER:
        mappedUser = {
          id: userProfile.accountId || userProfile.id,
          email: userProfile.email,
          name: userProfile.fullName,
          username: userProfile.username,
          role: UserRole.USER,
          fullName: userProfile.fullName,
          gender: userProfile.gender,
          accountTicketRequest: userProfile.accountTicketRequest,
          image: userProfile.image || "",
        } as RegularUser;

        if (userProfile.accountTicketRequest) {
          Cookies.set("ticket", userProfile.accountTicketRequest.toString(), {
            expires: 7,
          });
        }
        break;

      case UserRole.LAWYER:
        mappedUser = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.fullName,
          username: userProfile.username,
          role: UserRole.LAWYER,
          aboutLawyer: userProfile.aboutLawyer,
          phone: userProfile.phone,
          dob: userProfile.dob,
          gender: userProfile.gender,
          services: userProfile.services,
          image: userProfile.image || "",
        } as LawyerUser;
        break;

      case UserRole.STAFF:
        mappedUser = {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.fullName,
          username: userProfile.username,
          role: UserRole.STAFF,
          fullName: userProfile.fullName,
          gender: userProfile.gender,
          image: userProfile.imageUrl || "",
        } as StaffUser;
        break;
    }

    setUser(mappedUser);
  };

  const refreshUser = checkAuth;

  // Helper to handle login response, set cookies, fetch profile, and redirect
  const handleLoginAndRedirect = async (
    response: Response,
    getToken: (data: any) => string
  ) => {
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Sign-in failed");
    }

    const data = await response.json();
    console.log("Login response data:", data);
    const token = getToken(data);

    Cookies.set("authToken", token, { expires: 7 });

    // Determine user role and fetch profile
    await setUserRoleToCookie(token);

    // Get the user role that was determined
    const userRole = Cookies.get("userRole") as UserRole;

    // Fetch user profile based on the role
    await fetchUserProfile(token, userRole);

    // Redirect based on user role
    switch (userRole) {
      case UserRole.USER:
        router.push("/");
        break;
      case UserRole.LAWYER:
        router.push("/dashboard/lawyer-dashboard");
        break;
      case UserRole.STAFF:
        router.push("/dashboard/staff-dashboard");
        break;
      default:
        router.push("/");
    }
  };

  const login = async (username: string, password: string) => {
    try {
      // Use the unified login endpoint for all user types
      const response = await fetch(`${API_BASE_AUTH}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      await handleLoginAndRedirect(response, (data) => data.token);
    } catch (error) {
      console.error("[auth-context.tsx] Login failed:", error);
      throw error;
    }
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      const response = await fetch(`${API_BASE_AUTH}/signin-google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credential }),
      });

      await handleLoginAndRedirect(response, (data) => data.token);
    } catch (error) {
      console.error("[auth-context.tsx] Google sign-in failed:", error);
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

  // Remove if lawyer can only be registered through admin
  // If they can be registered through the frontend, keep these functions
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

  // Remove if staff can only be registered through admin
  // If they can be registered through the frontend, keep these functions
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
        // Remove if lawyer and staff can only be updated through admin
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
    Cookies.remove("ticket");
    setUser(null);

    router.push("/sign-in");
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
*/