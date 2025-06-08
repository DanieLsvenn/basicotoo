"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Shield,
  Bell,
  Mail,
  Smartphone,
  Lock,
  AlertTriangle,
  Download,
  Trash2,
} from "lucide-react";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  passwordChanged: string;
  lastLogin: string;
  activeSessions: number;
}

interface NotificationSettings {
  emailBookings: boolean;
  emailPromotions: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export default function ProfileSettings() {
  const { user, logout } = useAuth();
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginNotifications: true,
    passwordChanged: "30 days ago",
    lastLogin: "2 hours ago",
    activeSessions: 3,
  });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailBookings: true,
      emailPromotions: false,
      smsNotifications: true,
      pushNotifications: true,
    });

  const [isLoading, setIsLoading] = useState(false);

  const handleSecurityToggle = async (
    setting: keyof SecuritySettings,
    value: boolean
  ) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSecuritySettings((prev) => ({
        ...prev,
        [setting]: value,
      }));

      toast.success("Security Updated", {
        description: "Your security settings have been updated successfully.",
        onDismiss: (t) => console.log(`Dismissed ${t.id}`),
      });
    } catch (error) {
      toast.error("Failed to update security settings", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async (
    setting: keyof NotificationSettings,
    value: boolean
  ) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setNotificationSettings((prev) => ({
        ...prev,
        [setting]: value,
      }));

      toast.success("Preferences Updated", {
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast.error("Failed to update notification settings", {
        description: "Try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = () => {
    // Navigate to change password page or open modal
    toast("Change Password", {
      description: "Redirecting to password change form...",
    });
  };

  const handleDownloadData = async () => {
    setIsLoading(true);
    try {
      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast("Data Export Started", {
        description: "You'll receive an email shortly.",
      });
    } catch (error) {
      toast.error("Failed to export data", {
        description: "Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    // Open confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (confirmed) {
      toast.error("Account Deletion", {
        description: "Check your email to confirm deletion.",
        duration: Infinity,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {securitySettings.twoFactorEnabled && (
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
              <Switch
                checked={securitySettings.twoFactorEnabled}
                onCheckedChange={(value) =>
                  handleSecurityToggle("twoFactorEnabled", value)
                }
                disabled={isLoading}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Login Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified of new sign-ins to your account
              </p>
            </div>
            <Switch
              checked={securitySettings.loginNotifications}
              onCheckedChange={(value) =>
                handleSecurityToggle("loginNotifications", value)
              }
              disabled={isLoading}
            />
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Password</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Last changed: {securitySettings.passwordChanged}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChangePassword}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Sessions</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {securitySettings.activeSessions} active sessions
                </span>
                <Button variant="outline" size="sm">
                  Manage
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>
                <Label>Booking Confirmations</Label>
                <p className="text-sm text-muted-foreground">
                  Email confirmations for bookings and tickets
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.emailBookings}
              onCheckedChange={(value) =>
                handleNotificationToggle("emailBookings", value)
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center">
              <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>
                <Label>Promotional Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Updates about new services and offers
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.emailPromotions}
              onCheckedChange={(value) =>
                handleNotificationToggle("emailPromotions", value)
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center">
              <Smartphone className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Important updates via text message
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.smsNotifications}
              onCheckedChange={(value) =>
                handleNotificationToggle("smsNotifications", value)
              }
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex items-center">
              <Bell className="h-4 w-4 mr-2 text-muted-foreground" />
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Browser notifications for real-time updates
                </p>
              </div>
            </div>
            <Switch
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(value) =>
                handleNotificationToggle("pushNotifications", value)
              }
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Data & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Download Your Data</h4>
              <p className="text-sm text-muted-foreground">
                Get a copy of all your account data and activity
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDownloadData}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoading ? "Preparing..." : "Download"}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <h4 className="text-sm font-medium text-red-600">
                  Delete Account
                </h4>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
