import { NextRequest, NextResponse } from 'next/server';

interface VnPayCallbackParams {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
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

interface PaymentResponse {
  orderDescription: string;
  transactionId: string;
  paymentId: string;
  success: boolean;
  status: number;
  paymentMethod: number;
  token: string;
  vnPayResponseCode: string;
  targetId: string;
  isBooking: boolean;
  accountId: string | null;
  amount: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract VnPay parameters
    const vnpParams: VnPayCallbackParams = {
      vnp_Amount: searchParams.get('vnp_Amount') || '',
      vnp_BankCode: searchParams.get('vnp_BankCode') || '',
      vnp_BankTranNo: searchParams.get('vnp_BankTranNo') || '',
      vnp_CardType: searchParams.get('vnp_CardType') || '',
      vnp_OrderInfo: searchParams.get('vnp_OrderInfo') || '',
      vnp_PayDate: searchParams.get('vnp_PayDate') || '',
      vnp_ResponseCode: searchParams.get('vnp_ResponseCode') || '',
      vnp_TmnCode: searchParams.get('vnp_TmnCode') || '',
      vnp_TransactionNo: searchParams.get('vnp_TransactionNo') || '',
      vnp_TransactionStatus: searchParams.get('vnp_TransactionStatus') || '',
      vnp_TxnRef: searchParams.get('vnp_TxnRef') || '',
      vnp_SecureHash: searchParams.get('vnp_SecureHash') || '',
    };

    // Process the payment response
    const paymentResponse = processVnPayResponse(vnpParams);
    
    // Construct the success page URL with payment information
    const successUrl = new URL('/payment/success', request.url);
    
    // Add payment data as query parameters
    successUrl.searchParams.set('transactionId', paymentResponse.transactionId);
    successUrl.searchParams.set('paymentId', paymentResponse.paymentId);
    successUrl.searchParams.set('amount', paymentResponse.amount.toString());
    successUrl.searchParams.set('targetId', paymentResponse.targetId);
    successUrl.searchParams.set('isBooking', paymentResponse.isBooking.toString());
    successUrl.searchParams.set('success', paymentResponse.success.toString());
    successUrl.searchParams.set('paymentMethod', paymentResponse.paymentMethod.toString());
    successUrl.searchParams.set('vnPayResponseCode', paymentResponse.vnPayResponseCode);
    successUrl.searchParams.set('orderDescription', encodeURIComponent(paymentResponse.orderDescription));

    // If payment failed, redirect to an error page or add error parameters
    if (!paymentResponse.success) {
      const errorUrl = new URL('/payment/error', request.url);
      errorUrl.searchParams.set('error', 'Payment failed');
      errorUrl.searchParams.set('code', paymentResponse.vnPayResponseCode);
      return NextResponse.redirect(errorUrl);
    }

    // Redirect to success page
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Payment callback error:', error);
    
    // Redirect to error page
    const errorUrl = new URL('/payment/error', request.url);
    errorUrl.searchParams.set('error', 'Processing failed');
    return NextResponse.redirect(errorUrl);
  }
}

function processVnPayResponse(params: VnPayCallbackParams): PaymentResponse {
  // Parse the order description to extract booking/order information
  const orderInfo = decodeURIComponent(params.vnp_OrderInfo);
  const isBooking = orderInfo.startsWith('BOOKING:');
  
  // Extract target ID (booking ID or order ID)
  let targetId = '';
  if (isBooking) {
    // Format: "BOOKING:a4aba532-4cbc-4157-9ad2-a0f9cfb99621:"
    const match = orderInfo.match(/BOOKING:([^:]+):/);
    targetId = match ? match[1] : '';
  } else {
    // Format for orders - you may need to adjust this based on your order description format
    const match = orderInfo.match(/ORDER:([^:]+):/);
    targetId = match ? match[1] : '';
  }

  // Check if payment was successful
  const success = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';
  
  // Convert amount from VnPay format (multiply by 100) back to normal
  const amount = parseInt(params.vnp_Amount) / 100;

  return {
    orderDescription: orderInfo,
    transactionId: params.vnp_TransactionNo,
    paymentId: params.vnp_TransactionNo,
    success,
    status: success ? 1 : 0,
    paymentMethod: 0, // VnPay
    token: params.vnp_SecureHash,
    vnPayResponseCode: params.vnp_ResponseCode,
    targetId,
    isBooking,
    accountId: null, // You might need to extract this from your system
    amount
  };
}
