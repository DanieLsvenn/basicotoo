"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Cookies from "js-cookie";

// Define user roles
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
  loginWithGoogle: () => Promise<void>;
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
  const { data: session, status } = useSession();

  useEffect(() => {
    checkAuth();
  }, [session, status]);

  const checkAuth = async () => {
    if (status === "loading") {
      return;
    }

    if (session?.backendToken) {
      // Handle Google OAuth session (assuming it's always for regular users)
      try {
        const response = await fetch(`${API_BASE_AUTH}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.backendToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          const mappedUser: RegularUser = {
            id: userData.accountId || userData.id,
            email: userData.email,
            name: userData.fullName,
            username: userData.username,
            role: UserRole.USER,
            fullName: userData.fullName,
            gender: userData.gender,
            accountTicketRequest: userData.accountTicketRequest,
            image: userData.image || "",
          };
          setUser(mappedUser);
          Cookies.set("authToken", session.backendToken, { expires: 7 });
          Cookies.set("userRole", UserRole.USER, { expires: 7 });
        }
      } catch (err) {
        console.error("Failed to fetch user profile from Google session", err);
      }
    } else {
      // Check for regular authentication token
      const token = Cookies.get("authToken");
      const userRole = Cookies.get("userRole") as UserRole;

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        if (userRole) {
          // If we have a stored role, fetch profile with that role
          await fetchUserProfile(token, userRole);
        } else {
          // If no stored role, try to determine from the profile endpoint
          await determineUserRoleAndFetchProfile(token);
        }
      } catch (err) {
        console.error("Failed to fetch user profile", err);
        logout();
      }
    }

    setIsLoading(false);
  };

  const determineUserRoleAndFetchProfile = async (token: string) => {
    // First try the main account profile endpoint to get user info
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
    
    // Determine role from the userData (adjust these field names based on your backend response)
    let userRole: UserRole;
    if (userData.role) {
      userRole = userData.role;
    } else if (userData.userRole) {
      userRole = userData.userRole;
    } else if (userData.accountType) {
      userRole = userData.accountType;
    } else {
      // Default fallback - you might need to adjust this logic
      userRole = UserRole.USER;
    }

    // Store the determined role
    Cookies.set("userRole", userRole, { expires: 7 });

    // Now fetch the full profile based on the determined role
    await fetchUserProfile(token, userRole);
  };

  const fetchUserProfile = async (token: string, role: UserRole) => {
    let apiUrl = "";
    let userData: any;

    // Remove if unified profile for all roles instead of separate endpoints
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
      // If specific role endpoint fails, fallback to main account profile
      if (role !== UserRole.USER) {
        const fallbackResponse = await fetch(`${API_BASE_AUTH}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (fallbackResponse.ok) {
          userData = await fallbackResponse.json();
        } else {
          throw new Error("Unauthorized");
        }
      } else {
        throw new Error("Unauthorized");
      }
    } else {
      userData = await response.json();
    }

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

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Login failed");
      }

      const result = await response.json();
      const token = result.token;

      Cookies.set("authToken", token, { expires: 7 });

      // Determine user role and fetch profile
      await determineUserRoleAndFetchProfile(token);

      // Get the user role that was determined
      const userRole = Cookies.get("userRole") as UserRole;

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

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Registration failed");
      }

      router.push("/sign-in");
    } catch (error) {
      throw error;
    }
  };

  // Remove if lawyer and staff can only be registered through admin
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
      const token = Cookies.get("authToken") || session?.backendToken;
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
        default:
          throw new Error("Invalid user role");
      }

      const response = await fetch(apiUrl, {
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

    if (session) {
      await signOut({ redirect: false });
    }

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