/**
 * Centralized API Configuration
 * This file contains all API endpoints used throughout the application.
 * Modify the base URLs here to change the API endpoints for different environments.
 */

// Base URLs for different services
const API_BASES = {
  // Account & Authentication Service (Port 7218)
  ACCOUNT: "https://localhost:7095",

  // Booking Service (Port 7286)
  BOOKING: "https://localhost:7095",

  // Ticket Service (Port 7103)
  TICKET: "https://localhost:7095",

  // Order/Payment Service (Port 7024)
  ORDER: "https://localhost:7095",

  // Form/Template Service (Port 7276)
  FORM: "https://localhost:7095",

  // External APIs
  CURRENCY: "https://api.getgeoapi.com/v2/currency",

  // Internal APIs (relative paths)
  UPLOAD: "/api/upload",
} as const;

// API Endpoints organized by service
export const API_ENDPOINTS = {
  // Account & Authentication endpoints
  ACCOUNT: {
    BASE: `${API_BASES.ACCOUNT}/api/Account`,
    PROFILE: `${API_BASES.ACCOUNT}/api/Account/profile`,
    PROFILE_UPDATE: `${API_BASES.ACCOUNT}/api/Account/profile/update`,
    LOGIN: `${API_BASES.ACCOUNT}/api/Account/login`,
    REGISTER: `${API_BASES.ACCOUNT}/api/Account/register`,
    SIGNIN_GOOGLE: `${API_BASES.ACCOUNT}/api/Account/signin-google`,
    ALL_USERS: `${API_BASES.ACCOUNT}/api/Account/all-user`,
    USER_BY_PHONE: `${API_BASES.ACCOUNT}/api/Account`, // ?phone=
    USER_BY_ID: (id: string) => `${API_BASES.ACCOUNT}/api/Account/user/${id}`,
    ACTIVATE_USER: (id: string) =>
      `${API_BASES.ACCOUNT}/api/Account/active-user/${id}`,
  },

  // Service endpoints
  SERVICE: {
    BASE: `${API_BASES.ACCOUNT}/api/Service`,
    BY_ID: (serviceId: string) =>
      `${API_BASES.ACCOUNT}/api/Service/${serviceId}`,
    ACTIVE: `${API_BASES.ACCOUNT}/active-services`,
  },

  // Lawyer endpoints
  LAWYER: {
    BASE: `${API_BASES.ACCOUNT}/api/Lawyer`,
    BY_ID: (lawyerId: string) => `${API_BASES.ACCOUNT}/api/Lawyer/${lawyerId}`,
    BY_SERVICE: (serviceId: string) =>
      `${API_BASES.ACCOUNT}/api/Lawyer/service/${serviceId}`,
  },

  // Staff endpoints
  STAFF: {
    BASE: `${API_BASES.ACCOUNT}/api/Staff`,
    ACTIVE: `${API_BASES.ACCOUNT}/api/Staff/Active`,
    BY_ID: (staffId: string) => `${API_BASES.ACCOUNT}/api/Staff/${staffId}`,
    PAGINATED: (page: number, pageSize: number) =>
      `${API_BASES.ACCOUNT}/api/Staff?page=${page}&pageSize=${pageSize}`,
    ACTIVE_PAGINATED: (page: number, pageSize: number) =>
      `${API_BASES.ACCOUNT}/api/Staff/Active?page=${page}&pageSize=${pageSize}`,
  },

  // Shifts & Day-off endpoints
  SHIFTS: {
    ALL: `${API_BASES.ACCOUNT}/api/shifts`,
    DAY_OFF: `${API_BASES.ACCOUNT}/api/day-off`,
    DAY_OFF_BY_ID: (dayOffId: string) =>
      `${API_BASES.ACCOUNT}/api/day-off/${dayOffId}`,
    DAY_OFF_QUERY: (fromDate: string, toDate: string) =>
      `${API_BASES.ACCOUNT}/api/day-off?fromDate=${fromDate}&toDate=${toDate}`,
    JUSTIFY_DAY_OFF: (dayOffId: string) =>
      `${API_BASES.ACCOUNT}/api/day-off/justify/${dayOffId}`,
  },

  // Booking endpoints
  BOOKING: {
    BASE: `${API_BASES.BOOKING}/api/Booking`,
    BY_ID: (bookingId: string) =>
      `${API_BASES.BOOKING}/api/Booking/${bookingId}`,
    BY_CUSTOMER: (customerId: string, status: string) =>
      `${API_BASES.BOOKING}/api/Booking?customerId=${customerId}&status=${status}`,
    BY_LAWYER: (lawyerId: string, status: string) =>
      `${API_BASES.BOOKING}/api/Booking/lawyer-all/${lawyerId}?status=${status}`,
    BY_STAFF: (status: string, date: string) =>
      `${API_BASES.BOOKING}/api/Booking/staff?status=${status}&bookingDate=${date}`,
    CHECK_IN: (bookingId: string) =>
      `${API_BASES.BOOKING}/api/Booking/check-in/${bookingId}`,
    CHECK_OUT: (bookingId: string) =>
      `${API_BASES.BOOKING}/api/Booking/check-out/${bookingId}`,
  },

  // Slot endpoints
  SLOT: {
    FREE_SLOTS: (lawyerId: string, date: string) =>
      `${API_BASES.BOOKING}/api/Slot/free-slot?lawyerId=${lawyerId}&date=${date}`,
  },

  // Feedback endpoints
  FEEDBACK: {
    BASE: `${API_BASES.BOOKING}/api/feedback`,
    ALL: `${API_BASES.BOOKING}/api/feedbacks`,
    BY_ID: (feedbackId: string) =>
      `${API_BASES.BOOKING}/api/feedback/${feedbackId}`,
    BY_BOOKING: (bookingId: string) =>
      `${API_BASES.BOOKING}/api/feedback/booking/${bookingId}`,
  },

  // Ticket endpoints
  TICKET: {
    BASE: `${API_BASES.TICKET}/api/Ticket`,
    TICKET_BASE: `${API_BASES.TICKET}/api/Ticket`,
    ALL: `${API_BASES.TICKET}/api/Ticket/all`,
    BY_CUSTOMER: (userId: string) =>
      `${API_BASES.TICKET}/api/Ticket/by-customer?userid=${userId}`,
    REPLY: (ticketId: string) =>
      `${API_BASES.TICKET}/api/Ticket/${ticketId}/reply`,

    PACKAGES_ACTIVE: `${API_BASES.TICKET}/api/ticket-packages-active`,
    PACKAGE: `${API_BASES.TICKET}/api/ticket-packages`,
    PACKAGE_BY_ID: (packageId: string) =>
      `${API_BASES.TICKET}/api/ticket-package/${packageId}`,
  },

  // Order & Payment endpoints
  ORDER: {
    BASE: `${API_BASES.ORDER}/api/orders`,
    BY_ID: (orderId: string) => `${API_BASES.ORDER}/api/order/${orderId}`,
    CREATE_FORM: `${API_BASES.ORDER}/api/order/create-form`,
    TICKET_PACKAGE: `${API_BASES.ORDER}/api/order/ticket-package`,
    PAYMENT_URL: `${API_BASES.ORDER}/api/Payment/create-payment-url`,
    PAYMENT_CALLBACK: `${
      typeof window !== "undefined"
        ? window.location.origin
        : "https://localhost:3000"
    }/api/payment/payment-callback`,
  },

  // Dashboard endpoints
  DASHBOARD: {
    ACCOUNT: `${API_BASES.ACCOUNT}/api/Dashboard/account`,
    REVENUE_YEARLY: (startDate: string, endDate: string) =>
      `${API_BASES.ORDER}/api/Dashboard/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=yearly`,
    REVENUE_MONTHLY: (startDate: string, endDate: string) =>
      `${API_BASES.ORDER}/api/Dashboard/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=monthly`,
    REVENUE_DAILY: (startDate: string, endDate: string) =>
      `${API_BASES.ORDER}/api/Dashboard/revenue?startDate=${startDate}&endDate=${endDate}&groupBy=daily`,
  },

  // Form & Template endpoints
  FORM: {
    BASE: `${API_BASES.FORM}/api`,
    TEMPLATES: `${API_BASES.FORM}/api/templates`,
    TEMPLATES_ACTIVE: `${API_BASES.FORM}/api/templates-active`,
    TEMPLATES_PAGINATED: `${API_BASES.FORM}/api/template?page=1`,
    BY_CUSTOMER: (customerId: string) =>
      `${API_BASES.FORM}/api/form/customer/${customerId}`,
    CUSTOMER_FORM: (customerFormId: string) =>
      `${API_BASES.FORM}/api/customer-form/${customerFormId}`,
  },

  // Forgot Password endpoints
  FORGOT_PASSWORD: {
    BASE: `${API_BASES.ACCOUNT}/api/ForgotPassword`,
    REQUEST: `${API_BASES.ACCOUNT}/api/ForgotPassword/request`,
    VERIFY: `${API_BASES.ACCOUNT}/api/ForgotPassword/verify`,
    RESET: `${API_BASES.ACCOUNT}/api/ForgotPassword/reset`,
  },

  // External APIs
  EXTERNAL: {
    CURRENCY_CONVERT: (
      apiKey: string,
      from: string,
      to: string,
      amount: number
    ) =>
      `${API_BASES.CURRENCY}/convert?api_key=${apiKey}&from=${from}&to=${to}&amount=${amount}&format=json`,
  },

  // Internal APIs
  INTERNAL: {
    UPLOAD: API_BASES.UPLOAD,
  },
} as const;

// Environment-specific configuration
export const getApiConfig = () => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const isProduction = process.env.NODE_ENV === "production";

  return {
    isDevelopment,
    isProduction,
    baseUrls: API_BASES,
    endpoints: API_ENDPOINTS,
  };
};

// Utility function to get the full API endpoint
export const getApiUrl = (
  endpoint: string,
  params?: Record<string, string | number>
) => {
  let url = endpoint;

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, String(value));
    });
  }

  return url;
};

// Default export for easy importing
export default API_ENDPOINTS;
