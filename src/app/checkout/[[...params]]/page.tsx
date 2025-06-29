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
  Landmark,
  Package,
  Ticket,
  Plus,
  Minus
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
import { notFound } from "next/navigation";

// Types for booking
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

// Types for tickets
interface TicketPackage {
  ticketPackageId: string;
  ticketPackageName: string;
  requestAmount: number;
  price: number;
  status: string;
}

interface UserProfile {
  accountId: string;
  email: string;
  fullName: string;
  username: string;
}

interface CheckoutMode {
  mode: "booking" | "ticket";
  ids: Record<string, string>;
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

function formatUSDPrice(vndPrice: number, usdToVndRate: number): string {
  const usdPrice = vndPrice / usdToVndRate;
  return usdPrice.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

function parseCheckoutParams(params: string[]): CheckoutMode | null {
  if (params[0] === "booking" && params.length === 3) {
    return {
      mode: "booking",
      ids: { serviceId: params[1], lawyerId: params[2] }
    };
  } else if (params[0] === "ticket" && params.length === 2) {
    return {
      mode: "ticket", 
      ids: { ticketPackageId: params[1] }
    };
  }
  return null;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const path = (params.params as string[]) || [];

  // Parse checkout mode and IDs
  const checkoutConfig = parseCheckoutParams(path);
  if (!checkoutConfig) {
    notFound();
  }

  const { mode, ids } = checkoutConfig;
  const { serviceId, lawyerId, ticketPackageId } = ids;

  // Common state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [usdToVndRate, setUsdToVndRate] = useState<number>(24000);

  // Booking-specific state
  const [service, setService] = useState<Service | null>(null);
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  });
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);
  const [cancellingBookings, setCancellingBookings] = useState<Set<string>>(new Set());

  // Ticket-specific state
  const [ticketPackage, setTicketPackage] = useState<TicketPackage | null>(null);
  const [quantity, setQuantity] = useState(1);

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

  // Fetch USD to VND exchange rate
  const fetchExchangeRate = useCallback(async () => {
    try {
      const response = await fetch("https://api.getgeoapi.com/v2/currency/convert?api_key=05585d2dbe81b54873e6a5ec72b0ad7e423bbcc0&from=USD&to=VND&amount=1&format=json");
      const data = await response.json();
      
      if (
        data &&
        data.status === "success" &&
        data.rates &&
        data.rates.VND &&
        data.rates.VND.rate
      ) {
        setUsdToVndRate(Number(data.rates.VND.rate));
      }
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
      setUsdToVndRate(26086.9826); // Fallback rate
    }
  }, []);

  // Booking-specific functions
  const fetchPendingBookings = useCallback(async () => {
    if (!profile?.accountId || mode !== "booking") return;

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
  }, [profile?.accountId, serviceId, lawyerId, mode]);

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

  const fetchService = useCallback(async () => {
    if (mode !== "booking") return;
    
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
  }, [serviceId, mode]);

  const fetchLawyer = useCallback(async () => {
    if (mode !== "booking") return;
    
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
  }, [serviceId, lawyerId, mode]);

  const fetchAvailableSlots = useCallback(async (date: Date) => {
    if (mode !== "booking" || !lawyerId) return;

    setSlotsLoading(true);
    try {
      const formattedDate = formatDate(date);
      const response = await fetch(
        `https://localhost:7286/api/Slot/free-slot?lawyerId=${lawyerId}&date=${formattedDate}`
      );

      if (!response.ok) throw new Error("Failed to fetch available slots");

      const slots: Slot[] = await response.json();
      slots.sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime));
      setAvailableSlots(slots);
      setSelectedSlots([]);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, [lawyerId, mode]);

  const handleSlotSelection = (slotId: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        return [...prev, slotId];
      }
    });
  };

  // Ticket-specific functions
  const fetchTicketPackage = useCallback(async () => {
    if (mode !== "ticket") return;
    
    try {
      const response = await fetch("https://localhost:7103/api/ticket-packages-active");
      if (!response.ok) throw new Error("Failed to fetch ticket packages");

      const packages: TicketPackage[] = await response.json();
      const foundPackage = packages.find(pkg => pkg.ticketPackageId === ticketPackageId);

      if (!foundPackage) throw new Error("Ticket package not found");
      setTicketPackage(foundPackage);
    } catch (error) {
      console.error("Failed to fetch ticket package:", error);
      setError("Failed to load ticket package details");
    }
  }, [ticketPackageId, mode]);

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  // Handle booking creation
  const handleBooking = async () => {
    if (mode !== "booking") return;
    
    if (!selectedSlots.length) {
      toast.error("Please select at least one time slot");
      return;
    }

    if (!profile || !lawyer || !selectedDate) {
      toast.error("Missing required information");
      return;
    }

    setBooking(true);
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        router.push("/sign-in");
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

  // Handle ticket order creation
  const handleTicketOrder = async () => {
    if (mode !== "ticket" || !profile || !ticketPackage) return;

    setOrderProcessing(true);
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        router.push("/sign-in");
        return;
      }

      const orderData = {
        userId: profile.accountId,
        ticketPackageId: ticketPackageId,
        quantity: quantity,
        price: ticketPackage.price * quantity
      };

      const response = await fetch("https://localhost:7024/api/orders/ticket-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Order created successfully! Redirecting to payment...");
        await handleOrder(null, null, data.orderId);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }
    } catch (error) {
      console.error("Order failed:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setOrderProcessing(false);
    }
  };

  // Handle payment redirect
  const handleOrder = async (bookingIdParam?: string | null, amountParam?: number | null, orderIdParam?: string | null) => {
    setOrderProcessing(true);
    try {
      let paymentData;

      if (mode === "booking") {
        const targetBookingId = bookingIdParam || bookingId;
        const targetAmount = amountParam || (lawyer ? lawyer.pricePerHour * selectedSlots.length : 0);

        if (!targetBookingId) {
          toast.error("No booking found to pay for.");
          return;
        }

        paymentData = {
          orderId: null,
          bookingId: targetBookingId,
          amount: targetAmount,
        };
      } else {
        // ticket mode
        if (!orderIdParam || !ticketPackage) {
          toast.error("Missing order information.");
          return;
        }

        paymentData = {
          orderId: orderIdParam,
          bookingId: null,
          amount: ticketPackage.price * quantity,
        };
      }

      const response = await fetch("https://localhost:7024/api/Payment/create-payment-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create payment URL");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
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

  // Calculate totals
  const totalPrice = mode === "booking" 
    ? (lawyer ? lawyer.pricePerHour * selectedSlots.length : 0)
    : (ticketPackage ? ticketPackage.price * quantity : 0);

  const currentPendingBooking = mode === "booking" 
    ? pendingBookings.find(booking => booking.serviceId === serviceId && booking.lawyerId === lawyerId)
    : null;

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchExchangeRate(),
        ...(mode === "booking" ? [fetchService(), fetchLawyer()] : [fetchTicketPackage()])
      ]);
      setLoading(false);
    };

    initializeData();
  }, [fetchProfile, fetchExchangeRate, fetchService, fetchLawyer, fetchTicketPackage, mode]);

  // Booking-specific effects
  useEffect(() => {
    if (mode === "booking" && selectedDate && lawyerId) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, lawyerId, fetchAvailableSlots, mode]);

  useEffect(() => {
    if (mode === "booking" && profile?.accountId) {
      fetchPendingBookings();
      const interval = setInterval(fetchPendingBookings, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchPendingBookings, profile?.accountId, mode]);

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
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {mode === "booking" ? "Book Appointment" : "Buy Tickets"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "booking" 
                ? `Schedule your consultation with ${lawyer?.fullName}`
                : `Purchase ${ticketPackage?.ticketPackageName} tickets`
              }
            </p>
          </div>
        </div>

        {/* Pending Bookings Alert - Only for booking mode */}
        {mode === "booking" && pendingBookings.length > 0 && (
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
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service & Lawyer Info OR Ticket Package Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {mode === "booking" ? (
                    <>
                      <User className="h-5 w-5" />
                      <span>Booking Details</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="h-5 w-5" />
                      <span>Ticket Package Details</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === "booking" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{ticketPackage?.ticketPackageName}</h3>
                        <p className="text-muted-foreground">
                          {ticketPackage?.requestAmount.toLocaleString()} Tickets per package
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="font-medium">
                            {ticketPackage ? formatUSDPrice(ticketPackage.price, usdToVndRate) : ""} per package
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {ticketPackage ? formatPrice(ticketPackage.price) : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Quantity</h4>
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="text-lg font-medium px-4">{quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuantityChange(1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Date Selection & Time Slots side by side */}
            {mode === "booking" && (
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
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === "booking" ? (
                  <>
                    {lawyer && (
                      <div className="flex justify-between">
                        <span>Rate per hour</span>
                        <span>{formatPrice(lawyer.pricePerHour)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Selected slots</span>
                      <span>{selectedSlots.length}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <div className="text-right">
                          <div>{formatPrice(totalPrice)}</div>
                          <div className="text-sm font-normal text-muted-foreground">
                            {formatUSDPrice(totalPrice, usdToVndRate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {ticketPackage && (
                      <>
                        <div className="flex justify-between">
                          <span>Price per package</span>
                          <div className="text-right">
                            <div>{formatUSDPrice(ticketPackage.price, usdToVndRate)}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatPrice(ticketPackage.price)}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Tickets per package</span>
                          <span>{ticketPackage.requestAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Quantity</span>
                          <span>{quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total tickets</span>
                          <span>{(ticketPackage.requestAmount * quantity).toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-4">
                          <div className="flex justify-between text-lg font-semibold">
                            <span>Total</span>
                            <div className="text-right">
                              <div>{formatUSDPrice(totalPrice, usdToVndRate)}</div>
                              <div className="text-sm font-normal text-muted-foreground">
                                {formatPrice(totalPrice)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Button */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {mode === "booking" ? (
                    <>
                      {/* Show existing pending booking payment button if exists */}
                      {currentPendingBooking ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800 font-medium">
                              You have a pending booking for this service
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                              {currentPendingBooking.bookingDate} • {formatTime(currentPendingBooking.startTime)} - {formatTime(currentPendingBooking.endTime)}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleOrder(currentPendingBooking.bookingId, currentPendingBooking.price)}
                            disabled={orderProcessing}
                            className="w-full"
                            size="lg"
                          >
                            {orderProcessing ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Processing Payment...
                              </>
                            ) : (
                              <>
                                <CreditCard className="mr-2 h-5 w-5" />
                                Pay for Existing Booking ({formatPrice(currentPendingBooking.price)})
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleBooking}
                          disabled={booking || selectedSlots.length === 0 || !selectedDate}
                          className="w-full"
                          size="lg"
                        >
                          {booking ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Creating Booking...
                            </>
                          ) : (
                            <>
                              <User className="mr-2 h-5 w-5" />
                              Book Lawyer & Pay ({formatPrice(totalPrice)})
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={handleTicketOrder}
                      disabled={orderProcessing || !ticketPackage}
                      className="w-full"
                      size="lg"
                    >
                      {orderProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing Order...
                        </>
                      ) : (
                        <>
                          <Package className="mr-2 h-5 w-5" />
                          Place Order & Pay ({formatUSDPrice(totalPrice, usdToVndRate)})
                        </>
                      )}
                    </Button>
                  )}
                  
                  <p className="text-xs text-muted-foreground text-center">
                    {mode === "booking" 
                      ? "You will be redirected to payment after booking confirmation"
                      : "You will be redirected to payment after order confirmation"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}