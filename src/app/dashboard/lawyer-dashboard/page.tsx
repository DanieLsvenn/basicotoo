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

  const fetchAllBookings = useCallback(async () => {
    if (!profile?.accountId) return;

    setLoading(true);
    try {
      const statuses = ["Pending", "Paid"];
      const allBookings: Booking[] = [];

      for (const statusType of statuses) {
        try {
          const response = await fetch(
            `https://localhost:7286/api/Booking/lawyer-all/${profile.accountId}?status=${statusType}`
          );

          console.log(
            `Fetching: lawyer-all/${profile.accountId}?status=${statusType}`
          );
          console.log("Response status:", response.status);

          if (response.status === 204) {
            // No content, skip
            continue;
          }

          if (response.ok) {
            const data = await response.json();
            allBookings.push(...data);
          } else {
            console.error(
              `Failed to fetch ${statusType} bookings:`,
              response.status
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
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchAllBookings();
    }
  }, [profile, fetchAllBookings]);

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
            <TabsTrigger value="days-off" disabled>
              Register Days Off
            </TabsTrigger>
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
      </div>
    </div>
  );
};

export default LawyerDashboard;
