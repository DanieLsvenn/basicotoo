// src/app/checkout/[...params]/page.tsx

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
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
  Minus,
  MessageCircleMore,
  RefreshCw
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
import { accountApi, bookingApi, serviceApi, lawyerApi, ticketApi, orderApi, apiFetch, API_ENDPOINTS } from "@/lib/api-utils";
import { notFound } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

interface OrderDetail {
  orderDetailId: string;
  orderId: string;
  ticketPackageId: string;
  formTemplateId: string | null;
  quantity: number;
  price: number;
}

interface PendingOrder {
  orderId: string;
  userId: string;
  totalPrice: number;
  status: string;
  orderDetails: OrderDetail[];
  payment: any;
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

function isBookingExpired(bookingDate: string): boolean {
  const today = new Date();
  const booking = new Date(bookingDate + 'T00:00:00'); // Ensure consistent timezone
  
  // Set both dates to start of day for fair comparison
  today.setHours(0, 0, 0, 0);
  booking.setHours(0, 0, 0, 0);
  
  return booking <= today;
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

function isSlotSelectable(slots: Slot[], selectedSlotIds: string[], slotId: string): boolean {
  // If slot is already selected, it can be deselected
  if (selectedSlotIds.includes(slotId)) return true;

  // If no slots selected, any slot can be selected
  if (selectedSlotIds.length === 0) return true;

  // Check if adding this slot maintains consecutiveness
  return canAddSlot(slots, selectedSlotIds, slotId);
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
  const [usdToVndRate, setUsdToVndRate] = useState<number>(0);

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
  const [description, setDescription] = useState("");

  // Ticket-specific state
  const [ticketPackage, setTicketPackage] = useState<TicketPackage | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [cancellingOrders, setCancellingOrders] = useState<Set<string>>(new Set());

  // Manual refresh states
  const [refreshingBookings, setRefreshingBookings] = useState(false);
  const [refreshingOrders, setRefreshingOrders] = useState(false);
  const [refreshingSlots, setRefreshingSlots] = useState(false);

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    try {
      const token = Cookies.get("authToken");
      if (!token) {
        router.push("/sign-in");
        return;
      }

      const response = await accountApi.getProfile();

      if (response.data) {
        setProfile(response.data);
      } else {
        throw new Error(response.error || "Failed to fetch profile");
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
      const response = await apiFetch(
        API_ENDPOINTS.EXTERNAL.CURRENCY_CONVERT("05585d2dbe81b54873e6a5ec72b0ad7e423bbcc0", "USD", "VND", 1)
      );

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.rates &&
        response.data.rates.VND &&
        response.data.rates.VND.rate
      ) {
        setUsdToVndRate(Number(response.data.rates.VND.rate));
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
      const response = await bookingApi.getByCustomer(profile.accountId, "Pending");

      if (response.status === 204 || !response.data) {
        // No content, skip further processing
        setPendingBookings([]);
        return;
      }

      const data: PendingBooking[] = response.data;
      
      // Filter out expired bookings and auto-cancel them
      const validBookings: PendingBooking[] = [];
      const expiredBookings: PendingBooking[] = [];
      
      data.forEach(booking => {
        if (isBookingExpired(booking.bookingDate)) {
          expiredBookings.push(booking);
        } else {
          validBookings.push(booking);
        }
      });
      
      // Auto-cancel expired bookings in the background
      if (expiredBookings.length > 0) {
        console.log(`Found ${expiredBookings.length} expired booking(s), auto-cancelling...`);
        
        // Cancel expired bookings without blocking the UI
        const cancellationPromises = expiredBookings.map(async (expiredBooking) => {
          try {
            const response = await bookingApi.delete(expiredBooking.bookingId);
            
            if (response.data || response.status < 400) {
              console.log(`Auto-cancelled expired booking: ${expiredBooking.bookingId} (Date: ${expiredBooking.bookingDate})`);
              return { success: true, bookingId: expiredBooking.bookingId };
            } else {
              throw new Error(response.error || `HTTP ${response.status}`);
            }
          } catch (error) {
            console.error(`Failed to auto-cancel expired booking ${expiredBooking.bookingId}:`, error);
            return { success: false, bookingId: expiredBooking.bookingId, error };
          }
        });
        
        // Process cancellation results
        Promise.all(cancellationPromises).then((results) => {
          const successful = results.filter(r => r.success).length;
          const failed = results.filter(r => !r.success).length;
          
          if (successful > 0) {
            toast.success(`Cleaned up ${successful} expired booking(s)`);
          }
          if (failed > 0) {
            console.warn(`Failed to cancel ${failed} expired booking(s)`);
          }
        });
      }
      
      // Set only valid (non-expired) bookings
      setPendingBookings(validBookings);

      // Check if there's a pending booking for this service and lawyer
      const matchingBooking = validBookings.find(
        booking => booking.serviceId === serviceId && booking.lawyerId === lawyerId
      );

      if (matchingBooking) {
        setBookingId(matchingBooking.bookingId);
      }
    } catch (error) {
      console.error("Failed to fetch pending bookings:", error);
    }
  }, [profile?.accountId, serviceId, lawyerId, mode]);

  const handleCancelBooking = async (cancelBookingId: string) => {
    setCancellingBookings(prev => new Set([...prev, cancelBookingId]));

    try {
      const response = await bookingApi.delete(cancelBookingId);

      if (response.data || response.status < 400) {
        toast.success("Booking cancelled successfully");
        // Instantly update UI by removing the cancelled booking from state
        setPendingBookings(prev => prev.filter(booking => booking.bookingId !== cancelBookingId));
        // Also update the bookingId if this was the current booking
        if (cancelBookingId === bookingId) {
          setBookingId(null);
        }
      } else {
        throw new Error(response.error || "Failed to cancel booking");
      }
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setCancellingBookings(prev => {
        const newSet = new Set(prev);
        newSet.delete(cancelBookingId);
        return newSet;
      });
    }
  };

  const fetchService = useCallback(async () => {
    if (mode !== "booking") return;

    try {
      const response = await serviceApi.getById(serviceId);
      if (!response.data) throw new Error(response.error || "Service not found");

      setService(response.data);
    } catch (error) {
      console.error("Failed to fetch service:", error);
      setError("Failed to load service details");
    }
  }, [serviceId, mode]);

  const fetchLawyer = useCallback(async () => {
    if (mode !== "booking") return;

    try {
      const response = await lawyerApi.getByService(serviceId);
      if (!response.data) throw new Error(response.error || "Failed to fetch lawyers");

      const lawyers: Lawyer[] = response.data;
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
      const response = await apiFetch(
        API_ENDPOINTS.SLOT.FREE_SLOTS(lawyerId, formattedDate)
      );

      if (!response.data) throw new Error(response.error || "Failed to fetch available slots");

      const slots: Slot[] = response.data;
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
        // Remove the slot
        return prev.filter(id => id !== slotId);
      } else {
        // Add the slot only if it maintains consecutiveness
        if (canAddSlot(availableSlots, prev, slotId)) {
          return [...prev, slotId];
        } else {
          toast.error("Please select consecutive time slots only");
          return prev;
        }
      }
    });
  };

  // Ticket-specific functions
  const fetchTicketPackage = useCallback(async () => {
    if (mode !== "ticket") return;

    try {
      const response = await ticketApi.getActivePackages();
      if (!response.data) throw new Error(response.error || "Failed to fetch ticket packages");

      const packages: TicketPackage[] = response.data;
      const foundPackage = packages.find(pkg => pkg.ticketPackageId === ticketPackageId);

      if (!foundPackage) throw new Error("Ticket package not found");
      setTicketPackage(foundPackage);
    } catch (error) {
      console.error("Failed to fetch ticket package:", error);
      setError("Failed to load ticket package details");
    }
  }, [ticketPackageId, mode]);

  const fetchPendingOrders = useCallback(async () => {
    if (!profile?.accountId || mode !== "ticket") return;

    try {
      const response = await orderApi.getAll();

      if (response.status === 204 || !response.data) {
        setPendingOrders([]);
        return;
      }

      const data: PendingOrder[] = response.data;
      // Filter for current user and pending status
      console.log("Fetched pending orders:", data);
      const filteredOrders = data.filter(
        order =>
          order.userId === profile.accountId &&
          order.status === "Pending"
      );
      console.log("Pending orders:", filteredOrders);
      setPendingOrders(filteredOrders);
    } catch (error) {
      console.error("Failed to fetch pending orders:", error);
    }
  }, [profile?.accountId, mode]);

  const handleCancelOrder = async (orderId: string) => {
    setCancellingOrders(prev => new Set([...prev, orderId]));

    try {
      const response = await orderApi.delete(orderId);

      if (response.data || response.status < 400) {
        toast.success("Order cancelled successfully");
        // Instantly update UI by removing the cancelled order from state
        setPendingOrders(prev => prev.filter(order => order.orderId !== orderId));
      } else {
        throw new Error(response.error || "Failed to cancel order");
      }
    } catch (error) {
      console.error("Failed to cancel order:", error);
      toast.error("Failed to cancel order. Please try again.");
    } finally {
      setCancellingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => Math.max(1, prev + delta));
  };

  // Manual refresh functions
  const handleRefreshBookings = useCallback(async () => {
    if (mode !== "booking") return;
    setRefreshingBookings(true);
    try {
      await fetchPendingBookings();
      toast.success("Bookings refreshed");
    } catch (error) {
      toast.error("Failed to refresh bookings");
    } finally {
      setRefreshingBookings(false);
    }
  }, [mode, fetchPendingBookings]);

  const handleRefreshOrders = useCallback(async () => {
    if (mode !== "ticket") return;
    setRefreshingOrders(true);
    try {
      await fetchPendingOrders();
      toast.success("Orders refreshed");
    } catch (error) {
      toast.error("Failed to refresh orders");
    } finally {
      setRefreshingOrders(false);
    }
  }, [mode, fetchPendingOrders]);

  const handleRefreshSlots = useCallback(async () => {
    if (mode !== "booking" || !selectedDate) return;
    setRefreshingSlots(true);
    try {
      await fetchAvailableSlots(selectedDate);
      toast.success("Available slots refreshed");
    } catch (error) {
      toast.error("Failed to refresh slots");
    } finally {
      setRefreshingSlots(false);
    }
  }, [mode, selectedDate, fetchAvailableSlots]);

  // Handle booking creation
  const handleBooking = async () => {
    if (mode !== "booking") return;

    if (!selectedSlots.length) {
      toast.error("Please select at least one time slot");
      return;
    }

    if (!profile) {
      toast.error("Missing user profile. Please log in again.");
      return;
    }
    if (!lawyer) {
      toast.error("Lawyer information is missing or unavailable.");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a booking date.");
      return;
    }

    if (!description.trim()) {
      toast.error("Please provide a description of your case");
      return;
    }

    setBooking(true);
    try {
      const bookingData = {
        bookingDate: formatDate(selectedDate),
        price: lawyer.pricePerHour * selectedSlots.length,
        description: description.trim(),
        customerId: profile.accountId,
        lawyerId: lawyerId,
        serviceId: serviceId,
        slotId: selectedSlots
      };

      const response = await bookingApi.create(bookingData);

      if (response.data) {
        const data = response.data;
        setBookingId(data.bookingId);
        toast.success("Booking created successfully! Redirecting to payment...");
        await handleOrder(data.bookingId, lawyer.pricePerHour * selectedSlots.length);
      } else {
        throw new Error(response.error || "Failed to create booking");
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
      const orderData = {
        userId: profile.accountId,
        ticketPackageId: ticketPackageId,
        quantity: quantity,
        price: ticketPackage.price * quantity
      };

      console.log(orderData);

      const response = await orderApi.createTicketPackage(orderData);

      if (response.data) {
        toast.success("Order created successfully! Redirecting to payment...");
        await handleOrder(null, null, response.data.orderId);
      } else {
        throw new Error(response.error || "Failed to create order");
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

      const response = await orderApi.createPaymentUrl(paymentData);

      if (response.data && response.data.url) {
        window.location.href = response.data.url;
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

  // Optimized calculated values with useMemo
  const totalPrice = useMemo(() => {
    return mode === "booking"
      ? (lawyer ? lawyer.pricePerHour * selectedSlots.length : 0)
      : (ticketPackage ? ticketPackage.price * quantity : 0);
  }, [mode, lawyer?.pricePerHour, selectedSlots.length, ticketPackage?.price, quantity]);

  const currentPendingBooking = useMemo(() => {
    return mode === "booking"
      ? pendingBookings.find(booking => booking.serviceId === serviceId && booking.lawyerId === lawyerId)
      : null;
  }, [mode, pendingBookings, serviceId, lawyerId]);

  const currentPendingOrder = useMemo(() => {
    return mode === "ticket"
      ? pendingOrders.find(order => order.orderDetails.some(detail => detail.ticketPackageId === ticketPackageId))
      : null;
  }, [mode, pendingOrders, ticketPackageId]);

  // Memoized slot validation
  const areSelectedSlotsConsecutive = useMemo(() => 
    areTimeSlotsConsecutive(availableSlots, selectedSlots),
    [availableSlots, selectedSlots]
  );

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
    }
  }, [fetchPendingBookings, profile?.accountId, mode]);

  // Ticket-specific effects
  useEffect(() => {
    if (mode === "ticket" && ticketPackageId) {
      fetchTicketPackage();
    }
  }, [ticketPackageId, fetchTicketPackage, mode]);

  useEffect(() => {
    if (mode === "ticket" && profile?.accountId) {
      fetchPendingOrders();
    }
  }, [fetchPendingOrders, profile?.accountId, mode]);

  // --- UI ---
  if (loading) {
    return (
      <MaxWidthWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </MaxWidthWrapper>
    );
  }

  if (error) {
    return (
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-semibold text-destructive">{error}</p>
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
        <div className="flex items-center gap-4 mb-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">
              {mode === "booking" ? "Book Appointment" : "Buy Tickets"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "booking"
                ? `Schedule your consultation with ${lawyer?.fullName}`
                : `Purchase ${ticketPackage?.ticketPackageName} tickets`}
            </p>
          </div>
        </div>

        {/* Pending Bookings Alert */}
        {mode === "booking" && pendingBookings.length > 0 && (
          <Card className="border-orange-300 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
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
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-orange-900">{booking.serviceName}</h4>
                        <p className="text-sm text-orange-700">Lawyer: {booking.lawyerName}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-orange-600">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{booking.bookingDate}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Landmark className="h-4 w-4" />
                            <span>{formatPrice(booking.price)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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

        {/* Pending Orders Alert */}
        {mode === "ticket" && pendingOrders.length > 0 && (
          <Card className="border-orange-300 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                <span>Pending Orders ({pendingOrders.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-orange-900">
                          Order #{order.orderId}
                        </h4>
                        <p className="text-sm text-orange-700">
                          {order.orderDetails.reduce((sum, detail) => sum + detail.quantity, 0)} package(s)
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-orange-600">
                          <span className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span>
                              {order.orderDetails.reduce((sum, detail) => sum + detail.quantity, 0)} package(s)
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Landmark className="h-4 w-4" />
                            <span>{formatPrice(order.totalPrice)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleOrder(null, null, order.orderId)}
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
                          disabled={cancellingOrders.has(order.orderId)}
                        >
                          {cancellingOrders.has(order.orderId) ? (
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
                          <AlertDialogTitle>Are you sure you want to cancel this order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will cancel your order:
                            <br />
                            <strong>Order #{order.orderId.slice(-8)}</strong>
                            <br />
                            Packages: <strong>{order.orderDetails.reduce((sum, detail) => sum + detail.quantity, 0)}</strong>
                            <br />
                            Amount: <strong>{formatPrice(order.totalPrice)}</strong>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Order</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelOrder(order.orderId)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Yes, Cancel Order
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
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {mode === "booking" ? (
                    <>
                      <User className="h-5 w-5 text-primary" />
                      <span>Booking Details</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="h-5 w-5 text-primary" />
                      <span>Ticket Package Details</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mode === "booking" ? (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={lawyer?.image} alt={lawyer?.fullName} />
                        <AvatarFallback className="text-lg">
                          {lawyer ? getInitials(lawyer.fullName) : ""}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-primary">{lawyer?.fullName}</h3>
                        <p className="text-muted-foreground">{lawyer?.email}</p>
                        <p className="text-muted-foreground">{lawyer?.phone}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-medium text-green-700">
                            {lawyer ? formatPrice(lawyer.pricePerHour) : ""}/hour
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-primary">Service</h4>
                      <p className="text-muted-foreground">{service?.serviceName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {service?.serviceDescription}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-primary">{ticketPackage?.ticketPackageName}</h3>
                        <p className="text-muted-foreground">
                          {ticketPackage?.requestAmount.toLocaleString()} Tickets per package
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="font-medium text-green-700">
                            {ticketPackage ? formatUSDPrice(ticketPackage.price, usdToVndRate) : ""} per package
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {ticketPackage ? formatPrice(ticketPackage.price) : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 text-primary">Quantity</h4>
                      <div className="flex items-center gap-4">
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

            {/* Date & Slots */}
            {mode === "booking" && (
              <>
                <div className="flex flex-col md:flex-row gap-6">
                  <Card className="flex-1">
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
                  <Card className="flex-1">
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
                            const isSelectable = isSlotSelectable(availableSlots, selectedSlots, slot.slotId);

                            return (
                              <Button
                                key={slot.slotId}
                                variant={isSelected ? "default" : "outline"}
                                onClick={() => handleSlotSelection(slot.slotId)}
                                disabled={!isSelectable}
                                className="justify-center"
                                style={
                                  !isSelectable && !isSelected
                                    ? { opacity: 0.25, pointerEvents: "none" }
                                    : undefined
                                }
                              >
                                {formatTime(slot.slotStartTime)} - {formatTime(slot.slotEndTime)}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
                <div>
                  <Card className="flex-1">
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
                          placeholder="Please provide details about your legal matter, any specific questions you have, or what you'd like to discuss during the consultation. This helps the lawyer prepare for your session."
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
              </>
            )}
          </div>

          {/* Right Column - Summary & Action */}
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
                            <div>{formatPrice(ticketPackage.price)}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatUSDPrice(ticketPackage.price, usdToVndRate)}
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
                              <div>{formatPrice(totalPrice)}</div>
                              <div className="text-sm font-normal text-muted-foreground">
                                {formatUSDPrice(totalPrice, usdToVndRate)}
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
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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
                          disabled={
                            booking ||
                            selectedSlots.length === 0 ||
                            !selectedDate ||
                            !description.trim() ||
                            !areSelectedSlotsConsecutive
                          }
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                    <>
                      {currentPendingOrder ? (
                        <div className="space-y-3">
                          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800 font-medium">
                              You have a pending order for this ticket package
                            </p>
                            <p className="text-xs text-orange-600 mt-1">
                              {currentPendingOrder.orderDetails.reduce((total, detail) => total + detail.quantity, 0)} packages • {formatPrice(currentPendingOrder.totalPrice)}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleOrder(null, null, currentPendingOrder.orderId)}
                            disabled={orderProcessing}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
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
                                Pay for Existing Order ({formatPrice(currentPendingOrder.totalPrice)})
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleTicketOrder}
                          disabled={orderProcessing || !ticketPackage}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
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
                    </>
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