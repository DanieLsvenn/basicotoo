"use client";

import { useState } from "react";
import { useAuth, UserRole } from "@/lib/auth-context";
import { GoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Scale, Users } from "lucide-react";

export function SignInForm() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.USER);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(userName, password, selectedRole);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleGoogleSignIn = useGoogleLogin({
  //   onSuccess: async (tokenResponse) => {
  //     setError("");
  //     setIsGoogleLoading(true);

  //     try {
  //       await loginWithGoogle(tokenResponse.access_token);
  //     } catch (err: any) {
  //       setError(err.message || "Google sign-in failed");
  //     } finally {
  //       setIsGoogleLoading(false);
  //     }
  //   },
  //   onError: () => {
  //     setError("Google sign-in failed");
  //     setIsGoogleLoading(false);
  //   },
  //   flow: "implicit",
  // });

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.USER:
        return <User className="w-4 h-4" />;
      case UserRole.LAWYER:
        return <Scale className="w-4 h-4" />;
      case UserRole.STAFF:
        return <Users className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.USER:
        return "User";
      case UserRole.LAWYER:
        return "Lawyer";
      case UserRole.STAFF:
        return "Staff";
      default:
        return "User";
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sign In</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Please sign in to your account.
        </p>
      </div>

      {/* Google Sign-In Button - Only for regular users */}
      {selectedRole === UserRole.USER && (
        <>
          <div className="w-full mb-4 flex items-center justify-center gap-2">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                setError("");
                setIsGoogleLoading(true);
                try {
                  if (credentialResponse.credential) {
                    await loginWithGoogle(credentialResponse.credential);
                  } else {
                    throw new Error("Google credential not found");
                  }
                } catch (err: any) {
                  setError(err.message || "Google sign-in failed");
                } finally {
                  setIsGoogleLoading(false);
                }
              }}
              onError={() => {
                setError("Google sign-in failed");
                setIsGoogleLoading(false);
              }}
              width="100%"
              theme="outline"
              size="large"
              text="continue_with"
            />
          </div>
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="userName">Username</Label>
          <Input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your username"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading
            ? "Signing in..."
            : `Sign In as ${getRoleLabel(selectedRole)}`}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <Link
          href="/forgot-password"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Forgot your password?
        </Link>
        <div className="text-sm text-gray-600 space-y-1">
          <p>
            Don't have a user account?{" "}
            <Link href="/sign-up" className="text-blue-600 hover:text-blue-800">
              Sign up as User
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
