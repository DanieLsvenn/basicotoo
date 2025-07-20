"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { XCircle, ArrowLeft, RefreshCw, Phone } from "lucide-react";

export default function PaymentErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [error, setError] = useState<string>("");
  const [errorCode, setErrorCode] = useState<string>("");

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const codeParam = searchParams.get('code');
    
    setError(errorParam || "An unknown error occurred");
    setErrorCode(codeParam || "");
  }, [searchParams]);

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case '01': return 'Transaction not completed. Please try again.';
      case '02': return 'Invalid merchant. Please contact support.';
      case '03': return 'Invalid data sent. Please try again.';
      case '04': return 'Transaction not allowed. Please contact your bank.';
      case '05': return 'Transaction failed. Please try again.';
      case '06': return 'Transaction error. Please contact support.';
      case '07': return 'Transaction suspended. Please contact your bank.';
      case '09': return 'Transaction failed at bank. Please try again.';
      case '10': return 'Transaction failed. Please verify your card information.';
      case '11': return 'Transaction timeout. Please try again.';
      case '12': return 'Account locked. Please contact your bank.';
      case '13': return 'Invalid OTP. Please try again.';
      case '24': return 'Transaction cancelled by user.';
      case '51': return 'Insufficient account balance.';
      case '65': return 'Transaction limit exceeded.';
      case '75': return 'Bank in maintenance. Please try again later.';
      case '79': return 'Invalid transaction amount.';
      case '99': return 'Unknown error occurred.';
      default: return 'Payment processing failed. Please try again.';
    }
  };

  const handleRetry = () => {
    router.back();
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleContactSupport = () => {
    // You can implement contact support functionality here
    // For example, open a chat widget or redirect to contact page
    router.push("/contact-us");
  };

  return (
    <MaxWidthWrapper>
      <div className="py-8 space-y-8">
        {/* Error Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-red-600 mb-2">Payment Failed</h1>
            <p className="text-gray-600">
              We encountered an issue while processing your payment.
            </p>
          </div>
        </div>

        {/* Error Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Error Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Error Message</p>
              <p className="font-medium text-red-600">
                {errorCode ? getErrorMessage(errorCode) : error}
              </p>
            </div>
            {errorCode && (
              <div>
                <p className="text-sm text-gray-500">Error Code</p>
                <p className="font-medium">{errorCode}</p>
              </div>
            )}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">What can you do?</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Check your internet connection and try again</li>
                <li>• Verify your payment information is correct</li>
                <li>• Ensure you have sufficient account balance</li>
                <li>• Try using a different payment method</li>
                <li>• Contact your bank if the issue persists</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={handleContactSupport} variant="outline">
            <Phone className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
          <Button onClick={handleGoHome} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
