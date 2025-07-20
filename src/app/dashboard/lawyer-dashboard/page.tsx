// src/app/dashboard/lawyer-dashboard/page.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  FileText,
  DollarSign,
  Phone,
  Mail,
  XCircle,
  Filter,
  Loader2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, API_ENDPOINTS } from "@/lib/api-utils";

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

interface Booking {
  bookingId: string;
  bookingDate: string;
  price: number;
  description: string;
  lawyerName: string;
  customerName: string;
  serviceName: string;
  customerId: string;
  lawyerId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  status: "Pending" | "Paid";
}

interface TimeSlot {
  slotStartTime: string;
  slotEndTime: string;
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

function formatDate(date: Date): string {
  // Returns YYYY-MM-DD in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const timeSlots: TimeSlot[] = [
  { slotStartTime: "08:00:00", slotEndTime: "09:00:00" },
  { slotStartTime: "09:00:00", slotEndTime: "10:00:00" },
  { slotStartTime: "10:00:00", slotEndTime: "11:00:00" },
  { slotStartTime: "11:00:00", slotEndTime: "12:00:00" },
  { slotStartTime: "13:00:00", slotEndTime: "14:00:00" },
  { slotStartTime: "14:00:00", slotEndTime: "15:00:00" },
  { slotStartTime: "15:00:00", slotEndTime: "16:00:00" },
  { slotStartTime: "16:00:00", slotEndTime: "17:00:00" },
];

const Shifts: Shift[] = [];

const LawyerDashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState({
    pending: true,
    paid: true,
  });
  const [selectedShifts, setSelectedShifts] = useState<Shift[]>([]);
  const [showShiftPanel, setShowShiftPanel] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [dayOffs, setDayOffs] = useState<DayOff[]>([]);
  const [dayOffStatusMessage, setDayOffStatusMessage] = useState("");
  const [showDayOffDialog, setShowDayOffDialog] = useState(false);
  const [dayOffStatusFilter, setDayOffStatusFilter] = useState({
    waiting: true,
    rejected: true,
    approved: true,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Generate calendar dates for current month
  const generateCalendarDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const dates = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const fetchProfile = useCallback(async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.ACCOUNT.PROFILE);
      if (response.data) {
        setProfile(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch profile");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  }, []);

  const fetchAllShifts = useCallback(async () => {
    if (Shifts.length > 1) return; // Only fetch if Shifts is empty or only have 1

    try {
      const response = await apiFetch(API_ENDPOINTS.SHIFTS.ALL);
      
      if (response.data) {
        Shifts.push(...response.data);
        console.log("Shifts fetched:", Shifts);
      } else {
        throw new Error(response.error || "Failed to fetch shifts");
      }
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
    }
  }, []);

  const fetchDaysOff = useCallback(async () => {
    if (!profile?.accountId) return;

    try {
      console.log("Starting fetchDaysOff...");
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      
      // First day of the month
      const firstDay = new Date(year, month, 1);
      const fromDate = formatDate(firstDay);
      
      // Last day of the month
      const lastDay = new Date(year, month + 1, 0);
      const toDate = formatDate(lastDay);

      const response = await apiFetch(API_ENDPOINTS.SHIFTS.DAY_OFF_QUERY(fromDate, toDate));
      
      if (response.data) {
        // Filter for current lawyer only
        const lawyerDayOffs = response.data.filter((dayOff: DayOff) => dayOff.lawyerId === profile.accountId);
        
        console.log("New days off data from API:", lawyerDayOffs);
        
        setDayOffs(lawyerDayOffs);
        console.log("Days off state updated with", lawyerDayOffs.length, "records");
        
        // Small delay to ensure state update is processed
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        throw new Error(response.error || "Failed to fetch days off");
      }
    } catch (error) {
      console.error("Failed to fetch days off:", error);
    }
  }, [profile?.accountId]);

  const fetchAllBookings = useCallback(async () => {
    if (!profile?.accountId) return;

    setLoading(true);
    try {
      const statuses = ["Pending", "Paid"];
      const allBookings: Booking[] = [];

      for (const statusType of statuses) {
        try {
          const response = await apiFetch(
            API_ENDPOINTS.BOOKING.BY_LAWYER(profile.accountId, statusType)
          );

          console.log(
            `Fetching: lawyer-all/${profile.accountId}?status=${statusType}`
          );

          if (response.data) {
            allBookings.push(...response.data);
          } else if (response.status !== 204) {
            console.error(
              `Failed to fetch ${statusType} bookings:`,
              response.error
            );
          }
        } catch (error) {
          console.error(`Error fetching ${statusType} bookings:`, error);
        }
      }

      setAllBookings(allBookings);
      console.log("Total bookings fetched:", allBookings.length);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.accountId]);

  useEffect(() => {
    fetchProfile();
    fetchAllShifts();
  }, [fetchProfile, fetchAllShifts]);

  useEffect(() => {
    if (profile) {
      fetchAllBookings();
      fetchDaysOff();
    }
  }, [profile, fetchAllBookings, fetchDaysOff]);

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const getBookingForSlot = (
    slotStart: string,
    slotEnd: string,
    date: Date
  ) => {
    const formattedDate = formatDate(date);
    const dateBookings = allBookings.filter(
      (booking) => booking.bookingDate === formattedDate
    );

    return dateBookings.find((booking) => {
      const bookingStart = booking.startTime.slice(0, 5);
      const bookingEnd = booking.endTime.slice(0, 5);
      const slotStartFormatted = slotStart.slice(0, 5);
      const slotEndFormatted = slotEnd.slice(0, 5);

      return (
        bookingStart <= slotStartFormatted && bookingEnd > slotStartFormatted
      );
    });
  };

  const getBookingsForDate = (date: Date) => {
    const formattedDate = formatDate(date);
    return allBookings.filter(
      (booking) => booking.bookingDate === formattedDate
    );
  };

  const hasBookingsOnDate = (date: Date) => {
    const dateBookings = getBookingsForDate(date);
    const filteredBookings = dateBookings.filter((booking) => {
      if (booking.status === "Pending" && statusFilter.pending) return true;
      if (booking.status === "Paid" && statusFilter.paid) return true;
      return false;
    });
    return filteredBookings.length > 0;
  };

  const getDateStatusIndicator = (date: Date) => {
    const dateBookings = getBookingsForDate(date);
    const hasPending = dateBookings.some(
      (b) => b.status === "Pending" && statusFilter.pending
    );
    const hasPaid = dateBookings.some(
      (b) => b.status === "Paid" && statusFilter.paid
    );

    if (hasPending && hasPaid) return "both";
    if (hasPending) return "pending";
    if (hasPaid) return "paid";
    return "none";
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (hasBookingsOnDate(date)) {
      setShowDetailPanel(true);
    } else {
      setShowDetailPanel(false);
    }
  };

  const handleDayOffDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowShiftPanel(true);
    setSelectedShifts([]);
    setResponseMessage("");
  };

  const getDayOffForDate = useCallback((date: Date) => {
    const formattedDate = formatDate(date);
    const result = dayOffs.find(dayOff => dayOff.dayOff === formattedDate);
    console.log(`getDayOffForDate(${formattedDate}):`, result ? `Found day off with ${result.specificDayOffs.length} shifts` : 'No day off found', 'from', dayOffs.length, 'total day offs');
    return result;
  }, [dayOffs, refreshTrigger]);

  const getDayOffStatusIndicator = useCallback((date: Date) => {
    const dayOff = getDayOffForDate(date);
    if (!dayOff || dayOff.specificDayOffs.length === 0) return "none";

    const statuses = dayOff.specificDayOffs.map(shift => shift.status);
    const filteredStatuses = statuses.filter(status => {
      if (status === "WAITING" && dayOffStatusFilter.waiting) return true;
      if (status === "REJECTED" && dayOffStatusFilter.rejected) return true;
      if (status === "APPROVED" && dayOffStatusFilter.approved) return true;
      return false;
    });

    if (filteredStatuses.length === 0) return "none";
    return filteredStatuses; // Return array of statuses for multiple dots
  }, [getDayOffForDate, dayOffStatusFilter, refreshTrigger]);

  const forceRefresh = useCallback(() => {
    console.log("Forcing manual refresh...");
    setRefreshTrigger(prev => prev + 1);
    fetchDaysOff();
  }, [fetchDaysOff]);

  const hasDayOffOnDate = useCallback((date: Date) => {
    const statusIndicator = getDayOffStatusIndicator(date);
    return statusIndicator !== "none" && Array.isArray(statusIndicator) && statusIndicator.length > 0;
  }, [getDayOffStatusIndicator, refreshTrigger]);

  const hasBookingConflict = useCallback((date: Date, shiftStartTime: string, shiftEndTime: string) => {
    const formattedDate = formatDate(date);
    const dateBookings = allBookings.filter(
      (booking) => booking.bookingDate === formattedDate && 
      (booking.status === "Pending" || booking.status === "Paid")
    );

    return dateBookings.some((booking) => {
      const bookingStart = booking.startTime;
      const bookingEnd = booking.endTime;
      
      // Check if booking time overlaps with shift time
      // Convert times to minutes for easier comparison
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const shiftStart = timeToMinutes(shiftStartTime);
      const shiftEnd = timeToMinutes(shiftEndTime);
      const bookingStartMin = timeToMinutes(bookingStart);
      const bookingEndMin = timeToMinutes(bookingEnd);

      // Check for overlap: booking starts before shift ends AND booking ends after shift starts
      return bookingStartMin < shiftEnd && bookingEndMin > shiftStart;
    });
  }, [allBookings]);

  const handleDayOffShiftClick = (shift: Shift) => {
    const dayOff = getDayOffForDate(selectedDate);
    if (!dayOff) {
      // No day off exists, use original logic for creating new day off
      handleShiftClick(shift);
      return;
    }

    // Find the specific shift in the day off
    const specificShift = dayOff.specificDayOffs.find(
      s => s.fromTime === shift.startTime && s.toTime === shift.endTime
    );

    if (specificShift) {
      const shiftType = shift.startTime === "08:00:00" ? "Morning" : "Evening";
      const statusText = specificShift.status === "WAITING" 
        ? "is still pending" 
        : `has been ${specificShift.status.toLowerCase()}`;
      
      setDayOffStatusMessage(
        `${shiftType} shift of date ${selectedDate.toLocaleDateString()} ${statusText}`
      );
      setShowDayOffDialog(true);
    } else {
      // Shift not found in day off but day off exists with other shifts
      // Check if there's at least one other shift in the dayOff
      if (dayOff.specificDayOffs.length > 0) {
        // Add this shift to selection for updating the entire day off
        handleShiftClick(shift);
      } else {
        // Use original logic if no other shifts exist
        handleShiftClick(shift);
      }
    }
  };

  const toggleDayOffStatusFilter = (status: "waiting" | "rejected" | "approved") => {
    setDayOffStatusFilter((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const handleShiftClick = (shift: Shift) => {
    const existingIndex = selectedShifts.findIndex(s => s.shiftId === shift.shiftId);
    
    if (existingIndex === -1) {
      // Add shift if not exists
      setSelectedShifts(prev => [...prev, shift]);
    } else {
      // Remove shift if exists
      setSelectedShifts(prev => prev.filter(s => s.shiftId !== shift.shiftId));
    }
  };

  const registerDayOff = async () => {
    if (!profile?.accountId || selectedShifts.length === 0) return;

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];

      if (!token) {
        console.error("Please login to continue");
        return;
      }

      const existingDayOff = getDayOffForDate(selectedDate);
      
      if (existingDayOff && existingDayOff.specificDayOffs.length > 0) {
        // Update existing day off - only include the selected shift that's being added
        const existingShiftIds = existingDayOff.specificDayOffs.map(s => s.shiftId);
        const newShiftIds = selectedShifts
          .map(shift => shift.shiftId)
          .filter(shiftId => !existingShiftIds.includes(shiftId));
        
        console.log("Existing day off:", existingDayOff);
        console.log("Existing shift IDs:", existingShiftIds);
        console.log("Selected shifts:", selectedShifts);
        console.log("New shift IDs to add:", newShiftIds);
        
        if (newShiftIds.length === 0) {
          setResponseMessage("No new shifts to add - all selected shifts already exist for this date.");
          return;
        }
        
        // Combine existing and new shift IDs
        const allShiftIds = [...existingShiftIds, ...newShiftIds];
        
        const requestData = {
          dayOff: formatDate(selectedDate),
          shiftId: allShiftIds
        };

        console.log("Updating day off with data:", requestData);
        console.log("Day off ID:", existingDayOff.dayOffId);

        const response = await apiFetch(API_ENDPOINTS.SHIFTS.DAY_OFF_BY_ID(existingDayOff.dayOffId), {
          method: "PUT",
          body: JSON.stringify(requestData),
        });

        console.log("PUT response status:", response.status);
        
        if (response.data) {
          setResponseMessage(response.data.message || "Day off schedule updated successfully");
          setSelectedShifts([]);
          // Force refresh the days off data to update UI
          console.log("PUT successful, refreshing days off data...");
          await fetchDaysOff();
          console.log("Days off data refreshed after PUT");
          // Force component re-render
          setRefreshTrigger(prev => prev + 1);
        } else {
          console.error("PUT request failed:", response.error);
          throw new Error(`Failed to update day off: ${response.error}`);
        }
      } else {
        // Create new day off
        const requestData = {
          lawyerId: profile.accountId,
          dayOff: formatDate(selectedDate),
          shiftId: selectedShifts.map(shift => shift.shiftId)
        };

        console.log("Creating new day off with data:", requestData);

        const response = await apiFetch(API_ENDPOINTS.SHIFTS.DAY_OFF, {
          method: "POST",
          body: JSON.stringify(requestData),
        });

        console.log("POST response status:", response.status);

        if (response.data) {
          setResponseMessage(response.data.message || "Day off schedule created successfully");
          setSelectedShifts([]);
          // Force refresh the days off data to update UI
          console.log("POST successful, refreshing days off data...");
          await fetchDaysOff();
          console.log("Days off data refreshed after POST");
          // Force component re-render
          setRefreshTrigger(prev => prev + 1);
        } else {
          console.error("POST request failed:", response.error);
          throw new Error(`Failed to register day off: ${response.error}`);
        }
      }
    } catch (error) {
      console.error("Failed to register day off:", error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      setResponseMessage(`Failed to register day off. ${errorMessage}`);
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    const booking = getBookingForSlot(
      slot.slotStartTime,
      slot.slotEndTime,
      selectedDate
    );

    if (!booking) {
      setDialogMessage("No booking available on this date");
      setShowDialog(true);
      return;
    }

    // Check if booking matches current filter
    const matchesFilter =
      (booking.status === "Pending" && statusFilter.pending) ||
      (booking.status === "Paid" && statusFilter.paid);

    if (!matchesFilter) {
      const activeFilters = [];
      if (statusFilter.pending) activeFilters.push("Pending");
      if (statusFilter.paid) activeFilters.push("Paid");

      setDialogMessage(
        `No booking with ${activeFilters.join(
          " or "
        )} status available on this date`
      );
      setShowDialog(true);
      return;
    }

    setSelectedBooking(booking);
  };

  const toggleStatusFilter = (status: "pending" | "paid") => {
    setStatusFilter((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const calendarDates = generateCalendarDates();
  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lawyer Dashboard</h1>
        </div>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">My Schedule</TabsTrigger>
            <TabsTrigger value="days-off">Register Days Off</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-6">
            <div
              className={`grid gap-6 transition-all duration-300 ${
                showDetailPanel ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Schedule Calendar</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Loading indicator */}
                    {loading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="ml-2 text-sm">
                          Loading bookings...
                        </span>
                      </div>
                    )}

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="p-2 text-center text-sm font-medium text-gray-600"
                          >
                            {day}
                          </div>
                        )
                      )}
                      {calendarDates.map((date, index) => {
                        const isToday =
                          date.toDateString() === today.toDateString();
                        const isSelected =
                          date.toDateString() === selectedDate.toDateString();
                        const statusIndicator = getDateStatusIndicator(date);
                        const isCurrentMonth =
                          date.getMonth() === today.getMonth();

                        return (
                          <button
                            key={index}
                            onClick={() => handleDateClick(date)}
                            className={`
                              relative p-2 text-sm rounded-lg transition-all duration-200 hover:bg-blue-50 
                              ${
                                isSelected
                                  ? "bg-blue-500 text-white hover:bg-blue-600"
                                  : ""
                              }
                              ${
                                isToday && !isSelected
                                  ? "bg-blue-100 text-blue-700"
                                  : ""
                              }
                              ${
                                !isCurrentMonth
                                  ? "text-gray-300"
                                  : "text-gray-700"
                              }
                              ${isSelected ? "text-white" : ""}
                            `}
                          >
                            {date.getDate()}
                            {statusIndicator !== "none" && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                {statusIndicator === "both" && (
                                  <>
                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                  </>
                                )}
                                {statusIndicator === "pending" && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                )}
                                {statusIndicator === "paid" && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend and Sort */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Sort by:</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleStatusFilter("pending")}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all ${
                            statusFilter.pending
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          <span>Pending</span>
                        </button>
                        <button
                          onClick={() => toggleStatusFilter("paid")}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all ${
                            statusFilter.paid
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span>Paid</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detail Panel */}
              {showDetailPanel && (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>
                        Schedule for {selectedDate.toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot, index) => {
                        const booking = getBookingForSlot(
                          slot.slotStartTime,
                          slot.slotEndTime,
                          selectedDate
                        );
                        const hasValidBooking =
                          booking &&
                          ((booking.status === "Pending" &&
                            statusFilter.pending) ||
                            (booking.status === "Paid" && statusFilter.paid));

                        return (
                          <Button
                            key={index}
                            variant={hasValidBooking ? "default" : "outline"}
                            onClick={() => handleSlotClick(slot)}
                            className={`justify-center relative ${
                              hasValidBooking
                                ? booking.status === "Pending"
                                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                  : "bg-green-500 hover:bg-green-600 text-white"
                                : ""
                            }`}
                          >
                            {formatTime(slot.slotStartTime)} -{" "}
                            {formatTime(slot.slotEndTime)}
                            {hasValidBooking && (
                              <Badge
                                variant="secondary"
                                className="absolute -top-2 -right-2 text-xs"
                              >
                                {booking.status}
                              </Badge>
                            )}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="days-off" className="mt-6">
            <div
              className={`grid gap-6 transition-all duration-300 ${
                showShiftPanel ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Choose a date for registering day off</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1" key={`days-off-calendar-${refreshTrigger}`}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                          <div
                            key={day}
                            className="p-2 text-center text-sm font-medium text-gray-600"
                          >
                            {day}
                          </div>
                        )
                      )}
                      {calendarDates.map((date, index) => {
                        const isToday =
                          date.toDateString() === today.toDateString();
                        const isSelected =
                          date.toDateString() === selectedDate.toDateString();
                        const isCurrentMonth =
                          date.getMonth() === today.getMonth();
                        const statusIndicator = getDayOffStatusIndicator(date);

                        return (
                          <button
                            key={index}
                            onClick={() => handleDayOffDateClick(date)}
                            className={`
                              relative p-2 text-sm rounded-lg transition-all duration-200 hover:bg-blue-50 
                              ${
                                isSelected
                                  ? "bg-blue-500 text-white hover:bg-blue-600"
                                  : ""
                              }
                              ${
                                isToday && !isSelected
                                  ? "bg-blue-100 text-blue-700"
                                  : ""
                              }
                              ${
                                !isCurrentMonth
                                  ? "text-gray-300"
                                  : "text-gray-700"
                              }
                              ${isSelected ? "text-white" : ""}
                            `}
                          >
                            {date.getDate()}
                            {statusIndicator !== "none" && Array.isArray(statusIndicator) && (
                              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                {statusIndicator.map((status, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      status === "WAITING"
                                        ? "bg-yellow-400"
                                        : status === "REJECTED"
                                        ? "bg-red-400"
                                        : "bg-green-400"
                                    }`}
                                  ></div>
                                ))}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend and Sort for Days Off */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Sort by:</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleDayOffStatusFilter("waiting")}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all ${
                            dayOffStatusFilter.waiting
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                          <span>Waiting</span>
                        </button>
                        <button
                          onClick={() => toggleDayOffStatusFilter("rejected")}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all ${
                            dayOffStatusFilter.rejected
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-red-400"></div>
                          <span>Rejected</span>
                        </button>
                        <button
                          onClick={() => toggleDayOffStatusFilter("approved")}
                          className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm transition-all ${
                            dayOffStatusFilter.approved
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span>Approved</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shift Selection Panel */}
              {showShiftPanel && (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>
                        Select shifts for {selectedDate.toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4" key={`shift-panel-${refreshTrigger}`}>
                      <div className="grid grid-cols-1 gap-3">
                        {/* Morning Shift Button */}
                        {(() => {
                          const dayOff = getDayOffForDate(selectedDate);
                          const morningShift = Shifts.find(s => s.startTime === "08:00:00" && s.endTime === "12:00:00");
                          const morningDayOffShift = dayOff?.specificDayOffs.find(
                            s => s.fromTime === "08:00:00" && s.toTime === "12:00:00"
                          );
                          const isSelected = selectedShifts.some(s => s.startTime === "08:00:00" && s.endTime === "12:00:00");
                          const isDateInPast = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));
                          const hasConflict = hasBookingConflict(selectedDate, "08:00:00", "12:00:00");
                          const isDisabled = isDateInPast || hasConflict;
                          
                          return (
                            <Button
                              variant={isSelected || morningDayOffShift ? "default" : "outline"}
                              onClick={() => {
                                if (morningShift && !isDisabled) handleDayOffShiftClick(morningShift);
                              }}
                              disabled={isDisabled}
                              className={`justify-center p-4 relative ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : morningDayOffShift
                                  ? morningDayOffShift.status === "WAITING"
                                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                    : morningDayOffShift.status === "REJECTED"
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                                  : isSelected
                                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                                  : ""
                              }`}
                            >
                              Morning Shift (8:00 AM - 12:00 PM)
                              {isDateInPast && (
                                <span className="text-xs text-gray-500 block">
                                  (Past date - unavailable)
                                </span>
                              )}
                              {hasConflict && !isDateInPast && (
                                <span className="text-xs text-gray-500 block">
                                  (Booking conflict - unavailable)
                                </span>
                              )}
                              {morningDayOffShift && (
                                <Badge
                                  variant="secondary"
                                  className="absolute -top-2 -right-2 text-xs bg-white text-gray-800"
                                >
                                  {morningDayOffShift.status}
                                </Badge>
                              )}
                            </Button>
                          );
                        })()}

                        {/* Evening Shift Button */}
                        {(() => {
                          const dayOff = getDayOffForDate(selectedDate);
                          const eveningShift = Shifts.find(s => s.startTime === "13:00:00" && s.endTime === "17:00:00");
                          const eveningDayOffShift = dayOff?.specificDayOffs.find(
                            s => s.fromTime === "13:00:00" && s.toTime === "17:00:00"
                          );
                          const isSelected = selectedShifts.some(s => s.startTime === "13:00:00" && s.endTime === "17:00:00");
                          const isDateInPast = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));
                          const hasConflict = hasBookingConflict(selectedDate, "13:00:00", "17:00:00");
                          const isDisabled = isDateInPast || hasConflict;
                          
                          return (
                            <Button
                              variant={isSelected || eveningDayOffShift ? "default" : "outline"}
                              onClick={() => {
                                if (eveningShift && !isDisabled) handleDayOffShiftClick(eveningShift);
                              }}
                              disabled={isDisabled}
                              className={`justify-center p-4 relative ${
                                isDisabled
                                  ? "opacity-50 cursor-not-allowed"
                                  : eveningDayOffShift
                                  ? eveningDayOffShift.status === "WAITING"
                                    ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                    : eveningDayOffShift.status === "REJECTED"
                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                    : "bg-green-500 hover:bg-green-600 text-white"
                                  : isSelected
                                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                                  : ""
                              }`}
                            >
                              Evening Shift (1:00 PM - 5:00 PM)
                              {isDateInPast && (
                                <span className="text-xs text-gray-500 block">
                                  (Past date - unavailable)
                                </span>
                              )}
                              {hasConflict && !isDateInPast && (
                                <span className="text-xs text-gray-500 block">
                                  (Booking conflict - unavailable)
                                </span>
                              )}
                              {eveningDayOffShift && (
                                <Badge
                                  variant="secondary"
                                  className="absolute -top-2 -right-2 text-xs bg-white text-gray-800"
                                >
                                  {eveningDayOffShift.status}
                                </Badge>
                              )}
                            </Button>
                          );
                        })()}
                      </div>

                      {/* Register Button */}
                      {(() => {
                        const isDateInPast = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));
                        const hasAnyBookingConflict = selectedShifts.some(shift => 
                          hasBookingConflict(selectedDate, shift.startTime, shift.endTime)
                        );
                        const isRegisterDisabled = selectedShifts.length === 0 || isDateInPast || hasAnyBookingConflict;
                        
                        let buttonText = "Register Day Off";
                        if (isDateInPast) {
                          buttonText = "Cannot register for past dates";
                        } else if (hasAnyBookingConflict) {
                          buttonText = "Cannot register - booking conflict";
                        }
                        
                        return (
                          <Button
                            onClick={registerDayOff}
                            disabled={isRegisterDisabled}
                            className="w-full mt-4"
                            variant={selectedShifts.length > 0 && !isRegisterDisabled ? "default" : "outline"}
                          >
                            {buttonText}
                          </Button>
                        );
                      })()}

                      {/* Response Message */}
                      {responseMessage && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">{responseMessage}</p>
                        </div>
                      )}

                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Booking Detail Dialog */}
        <Dialog
          open={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge
                    variant={
                      selectedBooking.status === "Paid"
                        ? "default"
                        : "secondary"
                    }
                    className={
                      selectedBooking.status === "Paid"
                        ? "bg-green-500"
                        : "bg-yellow-500"
                    }
                  >
                    {selectedBooking.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <User className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">Client</p>
                      <p className="text-sm text-gray-600">
                        {selectedBooking.customerName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Clock className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(selectedBooking.startTime)} -{" "}
                        {formatTime(selectedBooking.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">Service</p>
                      <p className="text-sm text-gray-600">
                        {selectedBooking.serviceName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <DollarSign className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">Fee</p>
                      <p className="text-sm text-gray-600">
                        {formatPrice(selectedBooking.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <FileText className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p className="font-medium">Description</p>
                      <p className="text-sm text-gray-600">
                        {selectedBooking.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Info Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>No Booking</DialogTitle>
            </DialogHeader>
            <div className="flex items-center space-x-3">
              <XCircle className="h-8 w-8 text-gray-400" />
              <p className="text-gray-600">{dialogMessage}</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Day Off Status Dialog */}
        <Dialog open={showDayOffDialog} onOpenChange={setShowDayOffDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Day Off Status</DialogTitle>
            </DialogHeader>
            <div className="flex items-center space-x-3">
              <XCircle className="h-8 w-8 text-gray-400" />
              <p className="text-gray-600">{dayOffStatusMessage}</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default LawyerDashboard;
