"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  Hash,
  Building,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, API_ENDPOINTS } from "@/lib/api-utils";

// VNPay response codes mapping
const VNP_RESPONSE_CODES: Record<string, string> = {
  "00": "Success",
  "07": "Money deducted successfully. Transaction suspected (related to fraud, unusual transaction).",
  "09": "Transaction failed: Customer's card/account has not registered for InternetBanking service at the bank.",
  "10": "Transaction failed: Customer entered incorrect card/account information more than 3 times.",
  "11": "Transaction failed: Payment timeout exceeded. Please try the transaction again.",
  "12": "Transaction failed: Customer's card/account is locked.",
  "13": "Transaction failed: Customer entered incorrect transaction authentication password (OTP). Please try the transaction again.",
  "24": "Transaction failed: Customer canceled the transaction.",
  "51": "Transaction failed: Your account does not have sufficient balance to complete the transaction.",
  "65": "Transaction failed: Your account has exceeded the daily transaction limit.",
  "75": "Payment bank is under maintenance.",
  "79": "Transaction failed: Customer entered incorrect payment password more than the allowed number of times. Please try the transaction again.",
  "99": "Other errors (remaining errors not listed in the error code list)."
};

// VNPay transaction status mapping
const VNP_TRANSACTION_STATUS: Record<string, string> = {
  "00": "Success",
  "01": "Incomplete",
  "02": "Error",
  "04": "Reversed",
  "05": "Processing",
  "06": "Returned",
  "07": "Fraud suspected",
  "09": "Refund transaction successful"
};

// Bank code mapping
const BANK_CODES: Record<string, string> = {
  "NCB": "NCB Bank",
  "AGRIBANK": "Agribank",
  "SCB": "SCB Bank",
  "SACOMBANK": "SacomBank",
  "EXIMBANK": "EximBank",
  "MSBANK": "MSBank",
  "NAMABANK": "NamABank",
  "VNMART": "VnMart E-wallet",
  "VIETINBANK": "VietinBank",
  "VIETCOMBANK": "Vietcombank (VCB)",
  "HDBANK": "HDBank",
  "DONGABANK": "Dong A Bank",
  "TPBANK": "TPBank",
  "OJB": "OceanBank",
  "BIDV": "BIDV Bank",
  "TECHCOMBANK": "Techcombank",
  "VPBANK": "VPBank",
  "MBBANK": "MBBank",
  "ACB": "ACB Bank",
  "OCB": "OCB Bank",
  "IVB": "IVB Bank",
  "VISA": "International Card"
};

// Card type mapping
const CARD_TYPES: Record<string, string> = {
  "ATM": "Domestic ATM Card",
  "VISA": "International Payment Card",
  "MASTERCARD": "International Payment Card",
  "JCB": "International Payment Card",
  "UPI": "UPI Payment",
  "QRCODE": "QR Code Payment"
};

interface VNPayParams {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo?: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

interface PaymentDetails {
  type: "BOOKING" | "ORDER";
  id: string;
  amount: number;
  isSuccess: boolean;
  responseCode: string;
  transactionStatus: string;
  bankCode: string;
  cardType: string;
  transactionNo: string;
  paymentDate: Date;
  orderInfo: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [callbackSent, setCallbackSent] = useState(false);

  // Parse VNPay parameters from URL
  const parseVNPayParams = useCallback((): VNPayParams | null => {
    try {
      const params: Partial<VNPayParams> = {};
      
      // Required parameters
      const requiredParams = [
        'vnp_Amount', 'vnp_BankCode', 'vnp_CardType', 'vnp_OrderInfo',
        'vnp_PayDate', 'vnp_ResponseCode', 'vnp_TmnCode', 'vnp_TransactionNo',
        'vnp_TransactionStatus', 'vnp_TxnRef', 'vnp_SecureHash'
      ];

      for (const param of requiredParams) {
        const value = searchParams.get(param);
        if (!value) {
          console.error(`Missing required parameter: ${param}`);
          return null;
        }
        params[param as keyof VNPayParams] = value;
      }

      // Optional parameters
      const optionalParams = ['vnp_BankTranNo'];
      for (const param of optionalParams) {
        const value = searchParams.get(param);
        if (value) {
          params[param as keyof VNPayParams] = value;
        }
      }

      return params as VNPayParams;
    } catch (error) {
      console.error("Error parsing VNPay parameters:", error);
      return null;
    }
  }, [searchParams]);

  // Parse order info to determine type and ID
  const parseOrderInfo = useCallback((orderInfo: string) => {
    try {
      const decoded = decodeURIComponent(orderInfo);
      console.log("Decoded order info:", decoded);
      
      if (decoded.startsWith("BOOKING:")) {
        const bookingId = decoded.split(":")[1];
        return { type: "BOOKING" as const, id: bookingId };
      } else if (decoded.startsWith("ORDER:")) {
        const orderId = decoded.split(":")[1];
        return { type: "ORDER" as const, id: orderId };
      }
      
      throw new Error("Invalid order info format");
    } catch (error) {
      console.error("Error parsing order info:", error);
      return null;
    }
  }, []);

  // Format payment date
  const formatPaymentDate = useCallback((payDate: string): Date => {
    try {
      // VNPay date format: yyyyMMddHHmmss (e.g., 20250721024914)
      const year = payDate.substring(0, 4);
      const month = payDate.substring(4, 6);
      const day = payDate.substring(6, 8);
      const hour = payDate.substring(8, 10);
      const minute = payDate.substring(10, 12);
      const second = payDate.substring(12, 14);
      
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    } catch (error) {
      console.error("Error parsing payment date:", error);
      return new Date();
    }
  }, []);

  // Send payment callback to backend
  const sendPaymentCallback = useCallback(async (vnpParams: VNPayParams): Promise<boolean> => {
    if (callbackSent) {
      console.log("Callback already sent, skipping...");
      return true;
    }

    setProcessing(true);
    try {
      console.log("Sending payment callback to backend...");
      
      const response = await apiFetch(`${API_ENDPOINTS.ORDER.BASE.replace('/api/orders', '')}/api/Payment/payment-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vnpParams),
        requireAuth: false, // Payment callbacks usually don't require auth
      });

      if (response.data || response.status < 400) {
        console.log("Payment callback sent successfully:", response.data);
        setCallbackSent(true);
        return true;
      } else {
        console.error("Payment callback failed:", response.error);
        return false;
      }
    } catch (error) {
      console.error("Error sending payment callback:", error);
      return false;
    } finally {
      setProcessing(false);
    }
  }, [callbackSent]);

  // Initialize payment details
  const initializePayment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const vnpParams = parseVNPayParams();
      if (!vnpParams) {
        throw new Error("Invalid payment parameters");
      }

      console.log("VNPay parameters:", vnpParams);

      const orderInfo = parseOrderInfo(vnpParams.vnp_OrderInfo);
      if (!orderInfo) {
        throw new Error("Invalid order information");
      }

      const amount = parseInt(vnpParams.vnp_Amount) / 100; // VNPay amount is in đồng * 100
      const isSuccess = vnpParams.vnp_ResponseCode === "00" && vnpParams.vnp_TransactionStatus === "00";
      const paymentDate = formatPaymentDate(vnpParams.vnp_PayDate);

      const details: PaymentDetails = {
        type: orderInfo.type,
        id: orderInfo.id,
        amount,
        isSuccess,
        responseCode: vnpParams.vnp_ResponseCode,
        transactionStatus: vnpParams.vnp_TransactionStatus,
        bankCode: vnpParams.vnp_BankCode,
        cardType: vnpParams.vnp_CardType,
        transactionNo: vnpParams.vnp_TransactionNo,
        paymentDate,
        orderInfo: vnpParams.vnp_OrderInfo
      };

      setPaymentDetails(details);

      // Send callback to backend
      const callbackSuccess = await sendPaymentCallback(vnpParams);
      if (!callbackSuccess) {
        console.warn("Failed to send payment callback to backend");
        toast.error("Failed to update payment status. Please contact support if payment was successful.");
      } else if (isSuccess) {
        toast.success("Payment processed successfully!");
      }

    } catch (error) {
      console.error("Error initializing payment:", error);
      setError(error instanceof Error ? error.message : "Failed to process payment result");
    } finally {
      setLoading(false);
    }
  }, [parseVNPayParams, parseOrderInfo, formatPaymentDate, sendPaymentCallback]);

  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  // Format date
  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializePayment();
  }, [initializePayment]);

  // Handle navigation
  const handleGoToDashboard = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleGoToServices = useCallback(() => {
    router.push('/services');
  }, [router]);

  const handleGoToBuyTickets = useCallback(() => {
    router.push('/buy-tickets');
  }, [router]);

  // Render loading state
  if (loading) {
    return (
      <MaxWidthWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Processing Payment Result...</h2>
            <p className="text-gray-600">Please wait while we verify your payment.</p>
          </div>
        </div>
      </MaxWidthWrapper>
    );
  }

  // Render error state
  if (error || !paymentDetails) {
    return (
      <MaxWidthWrapper>
        <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
          <AlertTriangle className="h-16 w-16 text-red-500" />
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Payment Processing Error</h2>
            <p className="text-gray-600 max-w-md">
              {error || "Unable to process payment result. Please contact support if you believe this is an error."}
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={handleGoToDashboard} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            <Button onClick={handleGoToServices}>
              Try Again
            </Button>
          </div>
        </div>
      </MaxWidthWrapper>
    );
  }

  const { isSuccess, type, amount, responseCode, transactionStatus, bankCode, cardType, transactionNo, paymentDate } = paymentDetails;

  return (
    <MaxWidthWrapper>
      <div className="py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            {isSuccess ? (
              <CheckCircle className="h-20 w-20 text-green-500" />
            ) : (
              <XCircle className="h-20 w-20 text-red-500" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isSuccess ? "Payment Successful!" : "Payment Failed"}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              {isSuccess 
                ? `Your ${type.toLowerCase()} payment has been processed successfully.`
                : `Your ${type.toLowerCase()} payment could not be completed.`
              }
            </p>
          </div>
        </div>

        {/* Payment Details Card */}
        <Card className={`max-w-2xl mx-auto ${isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transaction Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Transaction Amount</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(amount)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Transaction Type</p>
                <p className="text-lg font-semibold text-gray-900">
                  {type === "BOOKING" ? "Booking Payment" : "Ticket Purchase"}
                </p>
              </div>
            </div>

            {/* Status Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Payment Status</p>
                <div className="flex items-center gap-2">
                  {isSuccess ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-medium ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
                    {VNP_RESPONSE_CODES[responseCode] || `Code: ${responseCode}`}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Transaction Status</p>
                <p className="font-medium text-gray-900">
                  {VNP_TRANSACTION_STATUS[transactionStatus] || `Status: ${transactionStatus}`}
                </p>
              </div>
            </div>

            {/* Bank & Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Bank</p>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">
                    {BANK_CODES[bankCode] || bankCode}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-900">
                  {CARD_TYPES[cardType] || cardType}
                </p>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Transaction Number</p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="font-mono text-sm text-gray-900">{transactionNo}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-500">Payment Time</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900">{formatDate(paymentDate)}</span>
                </div>
              </div>
            </div>

            {/* Processing Status */}
            {processing && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">Updating payment status...</span>
              </div>
            )}

            {/* Callback Status */}
            {!processing && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                callbackSent 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                {callbackSent ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-600" />
                )}
                <span className={`text-sm ${callbackSent ? 'text-green-700' : 'text-yellow-700'}`}>
                  {callbackSent 
                    ? 'Payment status updated successfully'
                    : 'Payment status update pending'
                  }
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
          <Button 
            onClick={handleGoToDashboard} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Button>
          
          {isSuccess ? (
            type === "BOOKING" ? (
              <Button onClick={handleGoToServices} className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Continue to Services
              </Button>
            ) : (
              <Button onClick={handleGoToBuyTickets} className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Continue to Buy Tickets
              </Button>
            )
          ) : (
            <Button onClick={type === "BOOKING" ? handleGoToServices : handleGoToBuyTickets}>
              Try Again
            </Button>
          )}
        </div>

        {/* Additional Info */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  {isSuccess 
                    ? "A confirmation email will be sent to your registered email address."
                    : "If you continue to experience issues, please contact our support team."
                  }
                </p>
                {!isSuccess && (
                  <p className="text-xs text-gray-500">
                    Reference Number: {transactionNo}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
