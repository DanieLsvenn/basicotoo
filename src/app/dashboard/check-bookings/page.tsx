"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, CheckCircle, LogOut } from "lucide-react";
import { toast } from "sonner";
import Cookies from "js-cookie";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { apiFetch, API_ENDPOINTS } from "@/lib/api-utils";

// Booking type
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
  status: string;
}

function formatTime(time: string) {
  return time?.slice(0, 5);
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

export default function CheckBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [tab, setTab] = useState<"checkin" | "checkout">("checkin");

  // Fetch bookings for selected tab
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const status = tab === "checkin" ? "Paid" : "CheckedIn";
      const response = await apiFetch(API_ENDPOINTS.BOOKING.BY_STAFF(status, date));
      if (!response.data) {
        toast.error(response.error || "Failed to fetch bookings");
        setBookings([]);
        return;
      }
      setBookings(response.data);
    } catch (error) {
      toast.error("Failed to fetch bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [date, tab]);

  // Check-in booking
  const handleCheckIn = async (bookingId: string) => {
    try {
      const response = await apiFetch(API_ENDPOINTS.BOOKING.CHECK_IN(bookingId), {
        method: "PUT",
      });
      if (response.data) {
        toast.success("Checked in successfully");
        fetchBookings();
      } else {
        toast.error(response.error || "Failed to check in");
      }
    } catch (error) {
      toast.error("Failed to check in");
    }
  };

  // Check-out booking
  const handleCheckOut = async (bookingId: string) => {
    try {
      const response = await apiFetch(API_ENDPOINTS.BOOKING.CHECK_OUT(bookingId), {
        method: "PUT",
      });
      if (response.data) {
        toast.success("Checked out successfully");
        fetchBookings();
      } else {
        toast.error(response.error || "Failed to check out");
      }
    } catch (error) {
      toast.error("Failed to check out");
    }
  };

  return (
    <MaxWidthWrapper>
      <div className="mb-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Lawyer Dashboard</h1>
        <p className="text-gray-600 mt-2"></p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"></CardTitle>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBookings}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant={tab === "checkin" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("checkin")}
            >
              Check In
            </Button>
            <Button
              variant={tab === "checkout" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("checkout")}
            >
              Check Out
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No bookings found for this date.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="border rounded-lg p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        {booking.customerName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        with {booking.lawyerName}
                      </span>
                    </div>
                    <Badge
                      variant={
                        booking.status === "CheckedIn"
                          ? "default"
                          : booking.status === "Paid"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        booking.status === "CheckedIn"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "Paid"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {booking.bookingDate}
                    </span>
                    <span>
                      <Clock className="inline h-4 w-4 mr-1" />
                      {formatTime(booking.startTime)} -{" "}
                      {formatTime(booking.endTime)}
                    </span>
                    <span>
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      {booking.serviceName}
                    </span>
                    <span>
                      <LogOut className="inline h-4 w-4 mr-1" />
                      {formatPrice(booking.price)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {tab === "checkin" && booking.status === "Paid" && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(booking.bookingId)}
                      >
                        Check In
                      </Button>
                    )}
                    {tab === "checkout" && booking.status === "CheckedIn" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCheckOut(booking.bookingId)}
                      >
                        Check Out
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </MaxWidthWrapper>
  );
}
