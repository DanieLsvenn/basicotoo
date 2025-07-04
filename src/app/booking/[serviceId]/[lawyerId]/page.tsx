"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Calendar as CalendarIcon,
  Clock,
  User,
  XCircle,
  CreditCard,
  Trash2,
  Landmark
} from "lucide-react";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Cookies from "js-cookie";

interface Service {
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
  status: "Active" | "Inactive";
}

interface Lawyer {
  lawyerId: string;
  fullName: string;
  email: string;
  phone: string;
  image: string;
  pricePerHour: number;
}

interface Slot {
  slotId: string;
  slotStartTime: string;
  slotEndTime: string;
  bookingSlots: any[];
}

interface UserProfile {
  accountId: string;
  email: string;
  fullName: string;
  username: string;
}

interface PendingBooking {
  bookingId: string;
  bookingDate: string;
  price: number;
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

// Helper functions
function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

function formatTime(timeString: string): string {
  return timeString.slice(0, 5); // Convert "16:00:00" to "16:00"
}

function formatDate(date: Date): string {
  // Returns YYYY-MM-DD in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  const lawyerId = params.lawyerId as string;

  const [service, setService] = useState<Service | null>(null);
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(new Set());

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        router.push("/sign-in");
        return;
      }

      const response = await fetch("https://localhost:7218/api/Account/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        throw new Error("Failed to fetch profile");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Please login to continue");
      router.push("/sign-in");
    }
  }, [router]);

  // Fetch pending bookings
  const fetchPendingBookings = useCallback(async () => {
    if (!profile?.accountId) return;

    try {
      const response = await fetch(
        `https://localhost:7286/api/Booking?customerId=${profile.accountId}&status=Pending`
      );

      if (response.ok) {
        const data: PendingBooking[] = await response.json();
        setPendingBookings(data);

        // Check if there's a pending booking for this service and lawyer
        const matchingBooking = data.find(
          booking => booking.serviceId === serviceId && booking.lawyerId === lawyerId
        );

        if (matchingBooking) {
          setBookingId(matchingBooking.bookingId);
        }
      }
    } catch (error) {
      console.error("Failed to fetch pending bookings:", error);
    }
  }, [profile?.accountId, serviceId, lawyerId]);

  // Cancel booking function
  const handleCancelBooking = async (bookingId: string) => {
    setCancellingBookings(prev => new Set([...prev, bookingId]));
    
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`https://localhost:7286/api/Booking/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success("Booking cancelled successfully");
        // Refresh pending bookings
        await fetchPendingBookings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setCancellingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  // Fetch service details
  const fetchService = useCallback(async () => {
    try {
      const response = await fetch(`https://localhost:7218/api/Service/${serviceId}`);
      if (!response.ok) throw new Error("Failed to fetch services");

      const foundService = await response.json();

      if (!foundService) throw new Error("Service not found");
      setService(foundService);
    } catch (error) {
      console.error("Failed to fetch service:", error);
      setError("Failed to load service details");
    }
  }, [serviceId]);

  // Fetch lawyer details
  const fetchLawyer = useCallback(async () => {
    try {
      const response = await fetch(`https://localhost:7218/api/Lawyer/service/${serviceId}`);
      if (!response.ok) throw new Error("Failed to fetch lawyers");

      const lawyers: Lawyer[] = await response.json();
      const foundLawyer = lawyers.find(l => l.lawyerId === lawyerId);

      if (!foundLawyer) throw new Error("Lawyer not found");
      setLawyer(foundLawyer);
    } catch (error) {
      console.error("Failed to fetch lawyer:", error);
      setError("Failed to load lawyer details");
      toast.error("Lawyer not found or unavailable for this service");
    }
  }, [serviceId, lawyerId]);

  // Fetch available slots for selected date
  const fetchAvailableSlots = useCallback(async (date: Date) => {
    if (!lawyerId) return;

    setSlotsLoading(true);
    try {
      const formattedDate = formatDate(date);
      const response = await fetch(
        `https://localhost:7286/api/Slot/free-slot?lawyerId=${lawyerId}&date=${formattedDate}`
      );

      if (!response.ok) throw new Error("Failed to fetch available slots");

      const slots: Slot[] = await response.json();
      // Sort slots by start time
      slots.sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime));
      setAvailableSlots(slots);

      // Clear selected slots when date changes
      setSelectedSlots([]);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [lawyerId]);

  // Handle slot selection
  const handleSlotSelection = (slotId: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Handle booking and redirect to payment
  const handleBooking = async () => {
    if (!selectedSlots.length) {
      toast.error("Please select at least one time slot");
      return;
    }

    if (!profile) {
      toast.error("Missing user profile information");
      return;
    }
    if (!lawyer) {
      toast.error("Missing lawyer information");
      return;
    }
    if (!selectedDate) {
      toast.error("Missing selected date");
      return;
    }

    setBooking(true);
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        router.push("/login");
        return;
      }

      const bookingData = {
        bookingDate: formatDate(selectedDate),
        price: lawyer.pricePerHour * selectedSlots.length,
        customerId: profile.accountId,
        lawyerId: lawyerId,
        serviceId: serviceId,
        slotId: selectedSlots
      };

      const response = await fetch("https://localhost:7286/api/Booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (response.ok) {
        const data = await response.json();
        setBookingId(data.bookingId);
        toast.success("Booking created successfully! Redirecting to payment...");

        // Immediately redirect to payment
        await handleOrder(data.bookingId, lawyer.pricePerHour * selectedSlots.length);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Failed to create booking. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  // Handle order (payment redirect)
  const handleOrder = async (bookingIdParam?: string, amountParam?: number) => {
    const targetBookingId = bookingIdParam || bookingId;
    const targetAmount = amountParam || totalPrice;

    if (!targetBookingId) {
      toast.error("No booking found to pay for.");
      return;
    }

    setOrderProcessing(true);
    try {
      const response = await fetch("https://localhost:7024/api/Payment/create-payment-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: null,
          bookingId: targetBookingId,
          amount: targetAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment URL");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url; // Use window.location.href for external redirect
      } else {
        toast.error("No payment URL returned from server.");
      }
    } catch (error) {
      console.error("Payment order failed:", error);
      toast.error("Failed to create payment order. Please try again.");
    } finally {
      setOrderProcessing(false);
    }
  };

  // Calculate total price
  const totalPrice = lawyer ? lawyer.pricePerHour * selectedSlots.length : 0;

  // Get pending booking for current service/lawyer combination
  const currentPendingBooking = pendingBookings.find(
    booking => booking.serviceId === serviceId && booking.lawyerId === lawyerId
  );

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchService(),
        fetchLawyer()
      ]);
      setLoading(false);
    };

    initializeData();
  }, [fetchProfile, fetchService, fetchLawyer]);

  // Fetch slots when date or lawyer changes
  useEffect(() => {
    if (selectedDate && lawyerId) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, lawyerId, fetchAvailableSlots]);

  // Fetch pending bookings periodically
  useEffect(() => {
    if (profile?.accountId) {
      fetchPendingBookings();

      // Set up interval to check for pending bookings every 5 seconds
      const interval = setInterval(fetchPendingBookings, 5000);

      return () => clearInterval(interval);
    }
  }, [fetchPendingBookings, profile?.accountId]);

  if (loading) {
    return (
      <MaxWidthWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MaxWidthWrapper>
    );
  }

  if (error) {
    return (
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="text-lg font-medium text-red-600">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </MaxWidthWrapper>
    );
  }

  return (
    <MaxWidthWrapper>
      <div className="py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Book Appointment</h1>
            <p className="text-muted-foreground">
              Schedule your consultation with {lawyer?.fullName}
            </p>
          </div>
        </div>

        {/* Pending Bookings Alert */}
        {pendingBookings.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                <span>Pending Bookings ({pendingBookings.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingBookings.map((booking) => (
                <div 
                  key={booking.bookingId} 
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-orange-900">{booking.serviceName}</h4>
                        <p className="text-sm text-orange-700">Lawyer: {booking.lawyerName}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-orange-600">
                          <span className="flex items-center space-x-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{booking.bookingDate}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Landmark className="h-4 w-4" />
                            <span>{formatPrice(booking.price)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleOrder(booking.bookingId, booking.price)}
                      disabled={orderProcessing}
                      variant="outline"
                      size="sm"
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      {orderProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Pay Now
                        </>
                      )}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          disabled={cancellingBookings.has(booking.bookingId)}
                        >
                          {cancellingBookings.has(booking.bookingId) ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Cancel
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to cancel this booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will cancel your booking for:
                            <br />
                            <strong>{booking.serviceName}</strong> with <strong>{booking.lawyerName}</strong>
                            <br />
                            Date: <strong>{booking.bookingDate}</strong>
                            <br />
                            Time: <strong>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</strong>
                            <br />
                            Amount: <strong>{formatPrice(booking.price)}</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelBooking(booking.bookingId)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, Cancel Booking
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service & Lawyer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Booking Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={lawyer?.image} alt={lawyer?.fullName} />
                    <AvatarFallback className="text-lg">
                      {lawyer ? getInitials(lawyer.fullName) : ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{lawyer?.fullName}</h3>
                    <p className="text-muted-foreground">{lawyer?.email}</p>
                    <p className="text-muted-foreground">{lawyer?.phone}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="font-medium">
                        {lawyer ? formatPrice(lawyer.pricePerHour) : ""}/hour
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <h4 className="font-medium">Service</h4>
                  <p className="text-muted-foreground">{service?.serviceName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {service?.serviceDescription}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Date Selection & Time Slots side by side */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Date Selection */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>Select Date</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={[
                      {
                        before: (() => {
                          const date = new Date();
                          date.setDate(date.getDate() + 1);
                          return date;
                        })()
                      },
                      {
                        after: (() => {
                          const date = new Date();
                          date.setMonth(date.getMonth() + 3);
                          return date;
                        })()
                      }
                    ]}
                    className="rounded-md border w-full h-auto"
                  />
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Available Time Slots</span>
                    {selectedDate && (
                      <span className="text-sm font-normal text-muted-foreground">
                        for {selectedDate.toLocaleDateString()}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading available slots...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No available slots for this date</p>
                      <p className="text-sm">Please select another date</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.slotId}
                          variant={selectedSlots.includes(slot.slotId) ? "default" : "outline"}
                          onClick={() => handleSlotSelection(slot.slotId)}
                          className="justify-center"
                        >
                          {formatTime(slot.slotStartTime)} - {formatTime(slot.slotEndTime)}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Booking Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Lawyer</span>
                    <span>{lawyer?.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service</span>
                    <span>{service?.serviceName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Date</span>
                    <span>
                      {selectedDate ? selectedDate.toLocaleDateString() : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Time Slots</span>
                    <span>{selectedSlots.length} hour(s)</span>
                  </div>
                </div>

                {selectedSlots.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="font-medium text-sm">Selected Times:</h4>
                    {selectedSlots.map((slotId) => {
                      const slot = availableSlots.find(s => s.slotId === slotId);
                      return slot ? (
                        <div key={slotId} className="flex items-center justify-between text-sm">
                          <span>
                            {formatTime(slot.slotStartTime)} - {formatTime(slot.slotEndTime)}
                          </span>
                          <span>{formatPrice(lawyer?.pricePerHour || 0)}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={selectedSlots.length === 0 || booking}
                  className="w-full"
                  size="lg"
                >
                  {booking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Book & Pay ({selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''})
                    </>
                  )}
                </Button>

                {selectedSlots.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please select at least one time slot to continue
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}