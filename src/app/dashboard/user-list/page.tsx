"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";

interface User {
  accountId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  image?: string;
  status: "ACTIVE" | "INACTIVE";
}

const API_BASE_URL = "https://localhost:7218/api/Account";

const UserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [viewMode, setViewMode] = useState<"active" | "banned">("active");
  const [searchPhone, setSearchPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/all-user`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      toast.error("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  // Search user by phone
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}?phone=${searchPhone}`);
      if (!res.ok) throw new Error("User not found");
      const user = await res.json();
      setUsers(user ? [user] : []);
    } catch (err) {
      toast.error("User not found");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Ban user
  const handleBan = async (id: string) => {
    if (!window.confirm("Are you sure you want to ban this user?")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/user/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to ban user");
      toast.success("User banned");
      fetchUsers();
    } catch (err) {
      toast.error("Error banning user");
    } finally {
      setLoading(false);
    }
  };

  // Unban user
  const handleUnban = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/active-user/${id}`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Failed to unban user");
      toast.success("User unbanned");
      fetchUsers();
    } catch (err) {
      toast.error("Error unbanning user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by status
  const filteredUsers = users.filter((u) =>
    viewMode === "active" ? u.status === "ACTIVE" : u.status === "INACTIVE"
  );

  return (
    <MaxWidthWrapper>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
      </div>
      <Card>
        <CardHeader>
          <div className="flex gap-2 mt-2">
            <Button
              variant={viewMode === "active" ? "default" : "outline"}
              onClick={() => setViewMode("active")}
            >
              Show Active
            </Button>
            <Button
              variant={viewMode === "banned" ? "default" : "outline"}
              onClick={() => setViewMode("banned")}
            >
              Show Banned
            </Button>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 mt-4">
            <Input
              placeholder="Search by phone number"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
            <Button type="submit" disabled={loading}>
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={fetchUsers}
              disabled={loading}
            >
              Reset
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center">No users found</div>
          ) : (
            <table className="w-full border-collapse mt-4">
              <thead>
                <tr>
                  <th className="text-left p-2">Full Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Phone</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-right p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.accountId} className="border-b">
                    <td className="p-2">{user.fullName}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">{user.phoneNumber}</td>
                    <td className="p-2">{user.status}</td>
                    <td className="p-2 text-right">
                      {user.status === "ACTIVE" ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBan(user.accountId)}
                          disabled={loading}
                        >
                          Ban
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnban(user.accountId)}
                          disabled={loading}
                        >
                          Unban
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </MaxWidthWrapper>
  );
};

export default UserListPage;
