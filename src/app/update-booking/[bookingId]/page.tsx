// src/app/update-booking/[bookingId]/page.tsx

"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  Loader2,
  MessageCircleMore,
  XCircle,
  User,
  Package,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Cookies from "js-cookie";

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

interface BookingDetail {
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

interface UpdatedBookingInfo {
  serviceName: string;
  lawyerName: string;
  bookingDate: string;
  timeSlots: string;
  price: number;
  description: string;
}

function formatDate(date: Date): string {
  // Returns YYYY-MM-DD in local time
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(timeString: string): string {
  return timeString.slice(0, 5); // Convert "16:00:00" to "16:00"
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
}

function parseTimeToSlots(startTime: string, endTime: string): number {
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);
  return endHour - startHour;
}

function areTimeSlotsConsecutive(slots: Slot[], selectedSlotIds: string[]): boolean {
  if (selectedSlotIds.length <= 1) return true;

  // Get selected slots and sort by start time
  const selectedSlots = slots
    .filter(slot => selectedSlotIds.includes(slot.slotId))
    .sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime));

  // Check if each slot is consecutive to the next
  for (let i = 0; i < selectedSlots.length - 1; i++) {
    const currentSlot = selectedSlots[i];
    const nextSlot = selectedSlots[i + 1];

    // Current slot's end time should match next slot's start time
    if (currentSlot.slotEndTime !== nextSlot.slotStartTime) {
      return false;
    }
  }

  return true;
}

function canAddSlot(slots: Slot[], selectedSlotIds: string[], newSlotId: string): boolean {
  if (selectedSlotIds.length === 0) return true;

  const newSlot = slots.find(slot => slot.slotId === newSlotId);
  if (!newSlot) return false;

  // Check if the new slot can be added to maintain consecutiveness
  const testSelection = [...selectedSlotIds, newSlotId];
  return areTimeSlotsConsecutive(slots, testSelection);
}

function isSlotSelectable(slots: Slot[], selectedSlotIds: string[], slotId: string, maxSlots?: number): boolean {
  // If slot is already selected, it can be deselected
  if (selectedSlotIds.includes(slotId)) return true;

  // If no slots selected, any slot can be selected
  if (selectedSlotIds.length === 0) return true;

  // Check max slots limit for paid bookings
  if (maxSlots && selectedSlotIds.length >= maxSlots) return false;

  // Check if adding this slot maintains consecutiveness
  return canAddSlot(slots, selectedSlotIds, slotId);
}

export default function UpdateBookingPage() {
  const router = useRouter();
  const { bookingId } = useParams();

  if (!bookingId || typeof bookingId !== 'string') {
    notFound();
  }

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updatedBookingInfo, setUpdatedBookingInfo] = useState<UpdatedBookingInfo | null>(null);

  // Calculate max slots for paid bookings
  const maxSlots = booking?.status === "Paid"
    ? parseTimeToSlots(booking.startTime, booking.endTime)
    : undefined;

  // Get selected lawyer info
  const selectedLawyer = lawyers.find(l => l.lawyerId === selectedLawyerId);

  // Calculate total price
  const totalPrice = selectedLawyer ? selectedLawyer.pricePerHour * selectedSlots.length : 0;

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

  // Fetch booking details
  const fetchBooking = useCallback(async () => {
    if (!profile?.accountId) return;

    try {
      console.log(profile.accountId, bookingId);
      const response = await fetch(
        `https://localhost:7286/api/Booking/${bookingId}`
      );

      if (response.ok) {
        const foundBooking: BookingDetail = await response.json();
        console.log("Found booking:", foundBooking);

        if (!foundBooking) {
          toast.error("Booking not found");
          router.push("/dashboard");
          return;
        }

        setBooking(foundBooking);
        setSelectedServiceId(foundBooking.serviceId);
        setSelectedLawyerId(foundBooking.lawyerId);
        setDescription(foundBooking.description);
        setSelectedDate(new Date(foundBooking.bookingDate));
      } else {
        throw new Error("Failed to fetch booking");
      }
    } catch (error) {
      console.error("Failed to fetch booking:", error);
      toast.error("Failed to load booking details");
      router.push("/dashboard");
    }
  }, [profile?.accountId, bookingId, router]);

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      const response = await fetch("https://localhost:7218/api/Service");
      if (response.ok) {
        const data: Service[] = await response.json();
        setServices(data.filter(s => s.status === "Active"));
      }
    } catch (error) {
      console.error("Failed to fetch services:", error);
    }
  }, []);

  // Fetch lawyers for selected service
  const fetchLawyers = useCallback(async (serviceId: string) => {
    if (!serviceId) return;

    try {
      const response = await fetch(`https://localhost:7218/api/Lawyer/service/${serviceId}`);
      if (response.ok) {
        const data: Lawyer[] = await response.json();
        setLawyers(data);
      }
    } catch (error) {
      console.error("Failed to fetch lawyers:", error);
    }
  }, []);

  // Fetch available slots
  const fetchAvailableSlots = useCallback(async (date: Date, lawyerId: string) => {
    if (!lawyerId) return;

    setSlotsLoading(true);
    try {
      const formattedDate = formatDate(date);
      const response = await fetch(
        `https://localhost:7286/api/Slot/free-slot?lawyerId=${lawyerId}&date=${formattedDate}`
      );

      if (response.ok) {
        const slots: Slot[] = await response.json();
        slots.sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime));
        setAvailableSlots(slots);
        setSelectedSlots([]);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // Handle slot selection
  const handleSlotSelection = (slotId: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        // Remove the slot
        return prev.filter(id => id !== slotId);
      } else {
        // Add the slot only if it maintains consecutiveness and doesn't exceed max slots
        if (isSlotSelectable(availableSlots, prev, slotId, maxSlots)) {
          return [...prev, slotId];
        } else {
          if (maxSlots && prev.length >= maxSlots) {
            toast.error(`You can only select up to ${maxSlots} slots for paid bookings`);
          } else {
            toast.error("Please select consecutive time slots only");
          }
          return prev;
        }
      }
    });
  };

  // Handle service change
  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setSelectedLawyerId("");
    setLawyers([]);
    setAvailableSlots([]);
    setSelectedSlots([]);
    fetchLawyers(serviceId);
  };

  // Handle lawyer change
  const handleLawyerChange = (lawyerId: string) => {
    setSelectedLawyerId(lawyerId);
    setAvailableSlots([]);
    setSelectedSlots([]);
    if (selectedDate) {
      fetchAvailableSlots(selectedDate, lawyerId);
    }
  };

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    setAvailableSlots([]);
    setSelectedSlots([]);
    if (date && selectedLawyerId) {
      fetchAvailableSlots(date, selectedLawyerId);
    }
  };

  // Handle booking update
  const handleUpdateBooking = async () => {
    if (!booking || !profile || !selectedLawyer) return;

    // Validation
    if (booking.status === "Pending") {
      if (!selectedServiceId || !selectedLawyerId) {
        toast.error("Please select a service and lawyer");
        return;
      }
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    if (selectedSlots.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    // For paid bookings, check if slots count matches original
    if (booking.status === "Paid" && selectedSlots.length !== maxSlots) {
      toast.error(`You must select exactly ${maxSlots} slots for paid bookings`);
      return;
    }

    setUpdating(true);
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        router.push("/sign-in");
        return;
      }

      const updateData = {
        bookingDate: formatDate(selectedDate),
        description: description.trim(),
        price: totalPrice,
        customerId: profile.accountId,
        lawyerId: selectedLawyerId,
        serviceId: selectedServiceId,
        slotId: selectedSlots
      };

      const response = await fetch(`https://localhost:7286/api/Booking/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Prepare updated booking info for dialog
        const selectedService = services.find(s => s.serviceId === selectedServiceId);
        const sortedSlots = availableSlots
          .filter(slot => selectedSlots.includes(slot.slotId))
          .sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime));

        const timeSlots = sortedSlots.length > 0
          ? `${formatTime(sortedSlots[0].slotStartTime)} - ${formatTime(sortedSlots[sortedSlots.length - 1].slotEndTime)}`
          : "";

        setUpdatedBookingInfo({
          serviceName: selectedService?.serviceName || "",
          lawyerName: selectedLawyer.fullName,
          bookingDate: selectedDate.toLocaleDateString(),
          timeSlots,
          price: totalPrice,
          description: description.trim()
        });

        setShowUpdateDialog(true);
        toast.success("Booking updated successfully!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update booking");
      }
    } catch (error) {
      console.error("Failed to update booking:", error);
      toast.error("Failed to update booking. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  // Handle payment redirect
  const handlePayment = async () => {
    if (!booking || !updatedBookingInfo) return;

    try {
      const paymentData = {
        orderId: null,
        bookingId: booking.bookingId,
        amount: updatedBookingInfo.price,
      };

      const response = await fetch("https://localhost:7024/api/Payment/create-payment-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          toast.error("No payment URL returned from server.");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment URL");
      }
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Failed to create payment order. Please try again.");
    }
  };

  // Effects
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchProfile();
      await fetchServices();
      setLoading(false);
    };

    initializeData();
  }, [fetchProfile, fetchServices]);

  useEffect(() => {
    if (profile) {
      fetchBooking();
    }
  }, [profile, fetchBooking]);

  useEffect(() => {
    if (booking && selectedServiceId) {
      fetchLawyers(selectedServiceId);
    }
  }, [booking, selectedServiceId, fetchLawyers]);

  useEffect(() => {
    if (selectedDate && selectedLawyerId) {
      fetchAvailableSlots(selectedDate, selectedLawyerId);
    }
  }, [selectedDate, selectedLawyerId, fetchAvailableSlots]);

  if (loading) {
    return (
      <MaxWidthWrapper>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading...</span>
        </div>
      </MaxWidthWrapper>
    );
  }

  if (!booking) {
    return (
      <MaxWidthWrapper>
        <div className="py-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Booking Not Found</h1>
          <p className="text-muted-foreground mt-2">The booking you're looking for doesn't exist.</p>
        </div>
      </MaxWidthWrapper>
    );
  }

  return (
    <MaxWidthWrapper>
      <div className="py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Update Booking
            </h1>
            <p className="text-muted-foreground">
              Status: <span className={`font-semibold ${booking.status === 'Paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                {booking.status}
              </span>
              {booking.status === 'Paid' && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (You can only update time slots - must select {maxSlots} slots)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Current Booking Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Service:</strong> {booking.serviceName}</p>
                <p><strong>Lawyer:</strong> {booking.lawyerName}</p>
                <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p><strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                <p><strong>Price:</strong> {formatPrice(booking.price)}</p>
                <p><strong>Status:</strong> {booking.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Update Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Service and Lawyer Selection (only for pending bookings) */}
          {booking.status === "Pending" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span>Service & Lawyer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="service">Select Service</Label>
                  <Select value={selectedServiceId} onValueChange={handleServiceChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.serviceId} value={service.serviceId}>
                          {service.serviceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lawyer">Select Lawyer</Label>
                  <Select
                    value={selectedLawyerId}
                    onValueChange={handleLawyerChange}
                    disabled={!selectedServiceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a lawyer" />
                    </SelectTrigger>
                    <SelectContent>
                      {lawyers.map((lawyer) => (
                        <SelectItem key={lawyer.lawyerId} value={lawyer.lawyerId}>
                          <div className="flex items-center justify-between w-full">
                            <span>{lawyer.fullName}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatPrice(lawyer.pricePerHour)}/hour
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span>Select Date</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Available Time Slots</span>
                {selectedDate && (
                  <span className="text-sm font-normal text-muted-foreground">
                    for {selectedDate.toLocaleDateString()}
                  </span>
                )}
              </CardTitle>
              {maxSlots && (
                <p className="text-sm text-muted-foreground">
                  You must select exactly {maxSlots} consecutive slots
                </p>
              )}
            </CardHeader>
            <CardContent>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="ml-2 text-blue-600">Loading available slots...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No available slots for this date</p>
                  <p className="text-sm">Please select another date</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlots.includes(slot.slotId);
                    const isSelectable = isSlotSelectable(availableSlots, selectedSlots, slot.slotId, maxSlots);

                    return (
                      <Button
                        key={slot.slotId}
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleSlotSelection(slot.slotId)}
                        disabled={!isSelectable}
                        className={`justify-center ${!isSelectable && !isSelected
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                          }`}
                      >
                        {formatTime(slot.slotStartTime)} - {formatTime(slot.slotEndTime)}
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Case Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircleMore className="h-5 w-5 text-primary" />
                <span>Case Description</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-medium">
                  Please describe your case or legal matter
                </Label>
                <Textarea
                  id="description"
                  placeholder="Please provide details about your legal matter, any specific questions you have, or what you'd like to discuss during the consultation."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>This information will be shared with your lawyer</span>
                  <span>{description.length}/1000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Summary */}
        {selectedLawyer && selectedSlots.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <span>Price Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedSlots.length} hour(s) × {formatPrice(selectedLawyer.pricePerHour)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatPrice(totalPrice)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Update Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleUpdateBooking}
            disabled={updating || selectedSlots.length === 0 || !description.trim()}
            className="px-8 py-3"
            size="lg"
          >
            {updating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Booking"
            )}
          </Button>
        </div>

        {/* Update Confirmation Dialog */}
        <AlertDialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-green-600" />
                Booking Updated Successfully
              </AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>Your booking has been updated with the following details:</p>
                  {updatedBookingInfo && (
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      <p><strong>Service:</strong> {updatedBookingInfo.serviceName}</p>
                      <p><strong>Lawyer:</strong> {updatedBookingInfo.lawyerName}</p>
                      <p><strong>Date:</strong> {updatedBookingInfo.bookingDate}</p>
                      <p><strong>Time:</strong> {updatedBookingInfo.timeSlots}</p>
                      <p><strong>Price:</strong> {formatPrice(updatedBookingInfo.price)}</p>
                      <p><strong>Description:</strong> {updatedBookingInfo.description}</p>
                    </div>
                  )}
                  {booking?.status === "Pending" && (
                    <p className="text-sm text-muted-foreground">
                      Please proceed to payment to confirm your booking.
                    </p>
                  )}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </AlertDialogCancel>
              {booking?.status === "Pending" && (
                <AlertDialogAction onClick={handlePayment}>
                  Pay Now
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MaxWidthWrapper>
  );
}
