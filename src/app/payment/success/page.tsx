"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  User, 
  CreditCard, 
  FileText, 
  ArrowLeft, 
  Download,
  Loader2 
} from "lucide-react";
import { toast } from "sonner";
import { bookingApi, orderApi, ticketApi } from "@/lib/api-utils";

interface PaymentData {
  transactionId: string;
  paymentId: string;
  amount: number;
  targetId: string;
  isBooking: boolean;
  success: boolean;
  paymentMethod: number;
  vnPayResponseCode: string;
  orderDescription: string;
}

interface BookingDetails {
  bookingId: string;
  bookingDate: string;
  price: number;
  lawyerName: string;
  customerName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  description: string;
}

interface OrderDetails {
  orderId: string;
  totalPrice: number;
  status: string;
  orderDetails: Array<{
    ticketPackageId: string;
    quantity: number;
    price: number;
    ticketPackageName?: string;
  }>;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract payment data from URL parameters
    const transactionId = searchParams.get('transactionId');
    const paymentId = searchParams.get('paymentId');
    const amount = searchParams.get('amount');
    const targetId = searchParams.get('targetId');
    const isBooking = searchParams.get('isBooking') === 'true';
    const success = searchParams.get('success') === 'true';
    const paymentMethod = searchParams.get('paymentMethod');
    const vnPayResponseCode = searchParams.get('vnPayResponseCode');
    const orderDescription = searchParams.get('orderDescription');

    if (!transactionId || !targetId || !success) {
      setError("Invalid payment information");
      setLoading(false);
      return;
    }

    const data: PaymentData = {
      transactionId,
      paymentId: paymentId || transactionId,
      amount: amount ? parseFloat(amount) : 0,
      targetId,
      isBooking,
      success,
      paymentMethod: paymentMethod ? parseInt(paymentMethod) : 0,
      vnPayResponseCode: vnPayResponseCode || '',
      orderDescription: orderDescription || ''
    };

    setPaymentData(data);
    
    // Fetch additional details based on whether it's a booking or order
    if (isBooking) {
      fetchBookingDetails(targetId);
    } else {
      fetchOrderDetails(targetId);
    }
  }, [searchParams]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const response = await bookingApi.getById(bookingId);
      if (response.data) {
        setBookingDetails(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch booking details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const response = await orderApi.getById(orderId);
      if (response.data) {
        setOrderDetails(response.data);
        
        // If it's a ticket order, also fetch ticket package names
        if (response.data.orderDetails) {
          const updatedOrderDetails = await Promise.all(
            response.data.orderDetails.map(async (detail: any) => {
              if (detail.ticketPackageId) {
                try {
                  const packages = await ticketApi.getActivePackages();
                  if (packages.data) {
                    const ticketPackage = packages.data.find(
                      (pkg: any) => pkg.ticketPackageId === detail.ticketPackageId
                    );
                    return {
                      ...detail,
                      ticketPackageName: ticketPackage?.ticketPackageName || 'Ticket Package'
                    };
                  }
                } catch (error) {
                  console.error("Failed to fetch ticket package details:", error);
                }
              }
              return detail;
            })
          );
          
          setOrderDetails({
            ...response.data,
            orderDetails: updatedOrderDetails
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    return timeString.slice(0, 5); // Convert "16:00:00" to "16:00"
  };

  const getPaymentMethodName = (method: number): string => {
    switch (method) {
      case 0: return "VnPay";
      case 1: return "Bank Transfer";
      case 2: return "Credit Card";
      default: return "Unknown";
    }
  };

  const handleDownloadReceipt = () => {
    // Implement receipt download functionality
    toast.success("Receipt download started");
  };

  const handleGoToProfile = () => {
    router.push("/profile");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <MaxWidthWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </MaxWidthWrapper>
    );
  }

  if (error || !paymentData || !paymentData.success) {
    return (
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6">
              {error || "There was an issue processing your payment. Please try again."}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </MaxWidthWrapper>
    );
  }

  return (
    <MaxWidthWrapper>
      <div className="py-8 space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">
              Your {paymentData.isBooking ? "booking" : "order"} has been confirmed and payment processed successfully.
            </p>
          </div>
        </div>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-medium">{paymentData.transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Method</p>
                <p className="font-medium">{getPaymentMethodName(paymentData.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Amount Paid</p>
                <p className="font-medium text-lg text-green-600">
                  {formatPrice(paymentData.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Completed
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking/Order Details */}
        {paymentData.isBooking && bookingDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium">{bookingDetails.serviceName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Lawyer</p>
                  <p className="font-medium">{bookingDetails.lawyerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(bookingDetails.bookingDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)}
                  </p>
                </div>
              </div>
              {bookingDetails.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{bookingDetails.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!paymentData.isBooking && orderDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {orderDetails.orderDetails.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.ticketPackageName || `Ticket Package`}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold">Total</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatPrice(orderDetails.totalPrice)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleDownloadReceipt} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
          <Button onClick={handleGoToProfile}>
            <User className="mr-2 h-4 w-4" />
            Go to Profile
          </Button>
          <Button onClick={handleGoToDashboard} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
