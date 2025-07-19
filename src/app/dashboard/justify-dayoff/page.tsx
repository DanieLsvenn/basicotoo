// src/app/dashboard/justify-dayoff/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  accountId: string;
  username: string;
  email: string;
  fullName: string;
  image: string;
  gender: number;
  accountTicketRequest: number;
  role: string;
}

interface Shift {
  shiftId: string;
  startTime: string;
  endTime: string;
}

interface SpecificDayOff {
  shiftId: string;
  fromTime: string;
  toTime: string;
  status: "WAITING" | "REJECTED" | "APPROVED";
}

interface DayOff {
  dayOffId: string;
  lawyerId: string;
  lawyerName: string;
  dayOff: string;
  specificDayOffs: SpecificDayOff[];
}

interface ShiftJustification {
  shiftId: string;
  status: "WAITING" | "APPROVED" | "REJECTED";
}

function formatDate(date: Date): string {
  // Returns YYYY-MM-DD in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const Shifts: Shift[] = [];

const JustifyDayOffPage = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dayOffs, setDayOffs] = useState<DayOff[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState({
    waiting: true,
    approved: true,
    rejected: true,
  });
  const [lawyerFilter, setLawyerFilter] = useState<string>("all");
  const [pendingJustifications, setPendingJustifications] = useState<Map<string, ShiftJustification[]>>(new Map());

  const fetchProfile = useCallback(async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      if (!token) {
        console.error("Please login to continue");
        return;
      }

      const response = await fetch(
        "https://localhost:7218/api/Account/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }, []);

  const fetchAllShifts = useCallback(async () => {
    if (Shifts.length > 1) return; // Only fetch if Shifts is empty or only have 1

    try {
      const response = await fetch("https://localhost:7218/api/shifts");
      
      if (response.ok) {
        const data = await response.json();
        Shifts.push(...data);
        console.log("Shifts fetched:", Shifts);
      } else {
        throw new Error("Failed to fetch shifts");
      }
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    }
  }, []);

  const autoRejectPastDayOffs = async (dayOffs: DayOff[]) => {
    const today = new Date();
    const todayDateString = formatDate(today);
    
    const pastDayOffsToReject = dayOffs.filter(dayOff => {
      // Check if the day off is today or before today
      const dayOffDate = new Date(dayOff.dayOff);
      const dayOffDateString = formatDate(dayOffDate);
      
      if (dayOffDateString <= todayDateString) {
        // Check if any shifts are still waiting
        return dayOff.specificDayOffs.some(shift => shift.status === "WAITING");
      }
      return false;
    });

    if (pastDayOffsToReject.length === 0) {
      return;
    }

    console.log(`Auto-rejecting ${pastDayOffsToReject.length} past day-off requests with WAITING status`);

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    if (!token) {
      console.error("Please login to continue");
      return;
    }

    // Process each day off that needs auto-rejection
    for (const dayOff of pastDayOffsToReject) {
      try {
        // Create justifications array with all WAITING shifts set to REJECTED
        const justifications = dayOff.specificDayOffs.map(shift => ({
          shiftId: shift.shiftId,
          status: shift.status === "WAITING" ? "REJECTED" as const : shift.status as "WAITING" | "APPROVED" | "REJECTED"
        }));

        console.log(`Auto-rejecting day off ${dayOff.dayOffId} for ${dayOff.lawyerName} on ${dayOff.dayOff}`);

        const response = await fetch(`https://localhost:7218/api/day-off/justify/${dayOff.dayOffId}`, {
          method: "PUT",
          headers: {
            "accept": "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(justifications),
        });

        if (response.ok) {
          console.log(`Successfully auto-rejected day off ${dayOff.dayOffId}`);
        } else {
          const errorText = await response.text();
          console.error(`Failed to auto-reject day off ${dayOff.dayOffId}:`, response.status, errorText);
        }
      } catch (error) {
        console.error(`Error auto-rejecting day off ${dayOff.dayOffId}:`, error);
      }
    }
  };

  const fetchDaysOff = useCallback(async () => {
    try {
      console.log("Starting fetchDaysOff for justify page...");
      const today = new Date();
      const fromDate = formatDate(today);
      
      // Get date 3 months from now
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      const toDate = formatDate(threeMonthsLater);

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      if (!token) {
        console.error("Please login to continue");
        return;
      }

      const response = await fetch(
        `https://localhost:7218/api/day-off?fromDate=${fromDate}&toDate=${toDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log("All days off data from API:", data);
        
        // Auto-reject past day offs that are still waiting
        await autoRejectPastDayOffs(data);
        
        // Fetch fresh data after auto-rejection
        const refreshResponse = await fetch(
          `https://localhost:7218/api/day-off?fromDate=${fromDate}&toDate=${toDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        if (refreshResponse.ok) {
          const refreshedData = await refreshResponse.json();
          setDayOffs(refreshedData);
          console.log("Days off state updated with", refreshedData.length, "records after auto-rejection");
        } else {
          // Fallback to original data if refresh fails
          setDayOffs(data);
          console.log("Days off state updated with", data.length, "records (refresh failed)");
        }
      } else {
        throw new Error("Failed to fetch days off");
      }
    } catch (error) {
      console.error("Failed to fetch days off:", error);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchAllShifts();
    fetchDaysOff();
  }, [fetchProfile, fetchAllShifts, fetchDaysOff]);

  const getUniqueStatusOptions = () => {
    const statuses = new Set<string>();
    dayOffs.forEach(dayOff => {
      dayOff.specificDayOffs.forEach(shift => {
        statuses.add(shift.status);
      });
    });
    return Array.from(statuses);
  };

  const getUniqueLawyers = () => {
    const lawyers = new Set<string>();
    dayOffs.forEach(dayOff => {
      lawyers.add(dayOff.lawyerName);
    });
    return Array.from(lawyers).sort();
  };

  const filteredDayOffs = dayOffs.filter(dayOff => {
    // Filter by lawyer
    if (lawyerFilter !== "all" && dayOff.lawyerName !== lawyerFilter) {
      return false;
    }

    // Filter by status
    const hasMatchingStatus = dayOff.specificDayOffs.some(shift => {
      if (shift.status === "WAITING" && statusFilter.waiting) return true;
      if (shift.status === "APPROVED" && statusFilter.approved) return true;
      if (shift.status === "REJECTED" && statusFilter.rejected) return true;
      return false;
    });

    return hasMatchingStatus;
  });

  const sortedDayOffs = filteredDayOffs.sort((a, b) => {
    // Sort by lawyer name first
    if (a.lawyerName !== b.lawyerName) {
      return a.lawyerName.localeCompare(b.lawyerName);
    }
    
    // Then sort by date
    return new Date(a.dayOff).getTime() - new Date(b.dayOff).getTime();
  });

  const getShiftDisplayName = (shift: SpecificDayOff): string => {
    if (shift.fromTime === "08:00:00" && shift.toTime === "12:00:00") {
      return "Morning (8:00 AM - 12:00 PM)";
    } else if (shift.fromTime === "13:00:00" && shift.toTime === "17:00:00") {
      return "Evening (1:00 PM - 5:00 PM)";
    }
    return `${shift.fromTime.slice(0, 5)} - ${shift.toTime.slice(0, 5)}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "WAITING":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "APPROVED":
        return "bg-green-500 hover:bg-green-600";
      case "REJECTED":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Check className="h-4 w-4" />;
      case "REJECTED":
        return <X className="h-4 w-4" />;
      case "WAITING":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleShiftStatusChange = (dayOffId: string, shiftId: string, newStatus: "WAITING" | "APPROVED" | "REJECTED") => {
    setPendingJustifications(prev => {
      const newMap = new Map(prev);
      
      // Get all shifts for this day off to ensure we always send complete data
      const dayOff = dayOffs.find(d => d.dayOffId === dayOffId);
      if (!dayOff) return newMap;
      
      // Start with existing justifications or create defaults based on original status
      let allJustifications = newMap.get(dayOffId) || dayOff.specificDayOffs.map(shift => ({
        shiftId: shift.shiftId,
        status: shift.status === "WAITING" ? "WAITING" : shift.status as "WAITING" | "APPROVED" | "REJECTED"
      }));
      
      // Update the specific shift that was changed
      allJustifications = allJustifications.map(j => 
        j.shiftId === shiftId ? { ...j, status: newStatus } : j
      );
      
      newMap.set(dayOffId, allJustifications);
      return newMap;
    });
  };

  const getCurrentShiftStatus = (dayOff: DayOff, shiftId: string): "WAITING" | "APPROVED" | "REJECTED" => {
    // Check if there's a pending justification for this shift
    const pendingForDayOff = pendingJustifications.get(dayOff.dayOffId);
    if (pendingForDayOff) {
      const pendingJustification = pendingForDayOff.find((j: ShiftJustification) => j.shiftId === shiftId);
      if (pendingJustification) {
        return pendingJustification.status;
      }
    }
    
    // Fall back to the original status - use original status as default if not WAITING
    const shift = dayOff.specificDayOffs.find(s => s.shiftId === shiftId);
    return shift?.status || "WAITING";
  };

  const isShiftEditable = (dayOff: DayOff, shiftId: string): boolean => {
    // Check the original status - if it's already APPROVED or REJECTED, it's not editable
    const originalShift = dayOff.specificDayOffs.find(s => s.shiftId === shiftId);
    return originalShift?.status === "WAITING";
  };

  const justifyDayOff = async (dayOff: DayOff) => {
    const justifications = pendingJustifications.get(dayOff.dayOffId);
    if (!justifications || justifications.length === 0) {
      setDialogMessage("No changes to justify for this day off request.");
      setShowDialog(true);
      return;
    }

    // Ensure we have all shifts represented in the justifications
    const completeJustifications = dayOff.specificDayOffs.map(shift => {
      const pendingJustification = justifications.find(j => j.shiftId === shift.shiftId);
      return pendingJustification || {
        shiftId: shift.shiftId,
        status: shift.status === "WAITING" ? "WAITING" : shift.status as "WAITING" | "APPROVED" | "REJECTED"
      };
    });

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      if (!token) {
        console.error("Please login to continue");
        return;
      }

      console.log("Justifying day off with complete data:", completeJustifications);

      const response = await fetch(`https://localhost:7218/api/day-off/justify/${dayOff.dayOffId}`, {
        method: "PUT",
        headers: {
          "accept": "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completeJustifications),
      });

      console.log("Justify response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        setResponseMessage(data.message || "Day off justification completed successfully");
        
        // Remove the processed justifications
        setPendingJustifications(prev => {
          const newMap = new Map(prev);
          newMap.delete(dayOff.dayOffId);
          return newMap;
        });
        
        // Refresh the data
        await fetchDaysOff();
      } else {
        const errorText = await response.text();
        console.error("Justify request failed:", response.status, errorText);
        throw new Error(`Failed to justify day off: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Failed to justify day off:", error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      setDialogMessage(`Failed to justify day off. ${errorMessage}`);
      setShowDialog(true);
    }
  };

  const toggleStatusFilter = (status: "waiting" | "approved" | "rejected") => {
    setStatusFilter((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const hasPendingChanges = (dayOffId: string): boolean => {
    const dayOff = dayOffs.find(d => d.dayOffId === dayOffId);
    if (!dayOff) return false;
    
    const justifications = pendingJustifications.get(dayOffId);
    if (!justifications) return false;
    
    // Check if any shift has been changed to APPROVED or REJECTED from its original WAITING state
    // OR if any originally WAITING shift has been changed when there are already APPROVED/REJECTED shifts
    return justifications.some(j => {
      const originalShift = dayOff.specificDayOffs.find(s => s.shiftId === j.shiftId);
      if (!originalShift) return false;
      
      // If original was WAITING, check if it's now APPROVED or REJECTED
      if (originalShift.status === "WAITING") {
        return j.status === "APPROVED" || j.status === "REJECTED";
      }
      
      // If original was already APPROVED or REJECTED, check if any other WAITING shifts are now APPROVED or REJECTED
      const waitingShifts = dayOff.specificDayOffs.filter(s => s.status === "WAITING");
      if (waitingShifts.length > 0) {
        return justifications.some(otherJ => 
          waitingShifts.some(waitingShift => 
            waitingShift.shiftId === otherJ.shiftId && 
            (otherJ.status === "APPROVED" || otherJ.status === "REJECTED")
          )
        );
      }
      
      return false;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Justify Day Off Requests</h1>
          <p className="text-gray-600 mt-2">Review and approve/reject day off requests from lawyers</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {/* Lawyer Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Lawyer:</span>
                <select
                  value={lawyerFilter}
                  onChange={(e) => setLawyerFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Lawyers</option>
                  {getUniqueLawyers().map(lawyer => (
                    <option key={lawyer} value={lawyer}>{lawyer}</option>
                  ))}
                </select>
              </div>

              {/* Status Filters */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Status:</span>
                <button
                  onClick={() => toggleStatusFilter("waiting")}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-all ${
                    statusFilter.waiting
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Waiting</span>
                </button>
                <button
                  onClick={() => toggleStatusFilter("approved")}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-all ${
                    statusFilter.approved
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>Approved</span>
                </button>
                <button
                  onClick={() => toggleStatusFilter("rejected")}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-all ${
                    statusFilter.rejected
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <X className="w-3 h-3" />
                  <span>Rejected</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm">Loading day off requests...</span>
          </div>
        )}

        {/* Day Off Requests */}
        <div className="space-y-4">
          {sortedDayOffs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">No day off requests found matching your filters.</p>
              </CardContent>
            </Card>
          ) : (
            sortedDayOffs.map((dayOff) => (
              <Card key={dayOff.dayOffId} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <User className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">{dayOff.lawyerName}</CardTitle>
                        <p className="text-sm text-gray-600">
                          Request for {new Date(dayOff.dayOff).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {hasPendingChanges(dayOff.dayOffId) && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Has Changes
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Shifts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Sort shifts to ensure morning (08:00-12:00) is always on the left and evening (13:00-17:00) is always on the right */}
                      {dayOff.specificDayOffs
                        .sort((a, b) => {
                          // Morning shift (08:00-12:00) comes first, evening shift (13:00-17:00) comes second
                          if (a.fromTime === "08:00:00" && b.fromTime === "13:00:00") return -1;
                          if (a.fromTime === "13:00:00" && b.fromTime === "08:00:00") return 1;
                          return 0;
                        })
                        .map((shift) => {
                        const currentStatus = getCurrentShiftStatus(dayOff, shift.shiftId);
                        const isEditable = isShiftEditable(dayOff, shift.shiftId);
                        
                        return (
                          <div key={shift.shiftId} className="p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium">{getShiftDisplayName(shift)}</span>
                              <Badge 
                                variant="secondary" 
                                className={`${getStatusColor(shift.status)} text-white`}
                              >
                                Original: {shift.status}
                              </Badge>
                            </div>
                            
                            {isEditable ? (
                              <div className="flex space-x-2">
                                {["WAITING", "APPROVED", "REJECTED"].map((status) => (
                                  <Button
                                    key={status}
                                    size="sm"
                                    variant={currentStatus === status ? "default" : "outline"}
                                    onClick={() => 
                                      handleShiftStatusChange(
                                        dayOff.dayOffId, 
                                        shift.shiftId, 
                                        status as "WAITING" | "APPROVED" | "REJECTED"
                                      )
                                    }
                                    className={`flex items-center space-x-1 ${
                                      currentStatus === status ? getStatusColor(status) + " text-white" : ""
                                    }`}
                                  >
                                    {getStatusIcon(status)}
                                    <span className="capitalize">{status.toLowerCase()}</span>
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                Already {shift.status.toLowerCase()} - cannot be changed
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Justify Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={() => justifyDayOff(dayOff)}
                        disabled={!hasPendingChanges(dayOff.dayOffId)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Justify Day Off Request
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Response Message */}
        {responseMessage && (
          <div className="fixed bottom-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg">
            <p className="text-sm text-green-800">{responseMessage}</p>
            <button
              onClick={() => setResponseMessage("")}
              className="mt-2 text-xs text-green-600 hover:text-green-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Info Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Information</DialogTitle>
            </DialogHeader>
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-8 w-8 text-blue-400" />
              <p className="text-gray-600">{dialogMessage}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default JustifyDayOffPage;
