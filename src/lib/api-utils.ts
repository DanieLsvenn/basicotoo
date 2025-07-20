/**
 * API Utility Functions
 * Provides convenient wrapper functions for making API calls
 */

import API_ENDPOINTS from './api-config';
import Cookies from 'js-cookie';

// Types for common API responses
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

// Common fetch options
interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Enhanced fetch wrapper with automatic token handling and error parsing
 */
export const apiFetch = async <T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<ApiResponse<T>> => {
  const { requireAuth = true, ...fetchOptions } = options;
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add auth token if required
  if (requireAuth) {
    const token = Cookies.get('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    const status = response.status;

    // Handle different response types
    let data: T | undefined;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      if (status !== 204) { // No Content
        data = await response.json();
      }
    } else {
      // For non-JSON responses, return as text
      data = (await response.text()) as any;
    }

    if (response.ok) {
      return { data, status };
    } else {
      return { 
        error: typeof data === 'string' ? data : 'Request failed', 
        status 
      };
    }
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : 'Network error', 
      status: 0 
    };
  }
};

// Convenience methods for different HTTP verbs
export const apiGet = <T = any>(url: string, options?: FetchOptions) => 
  apiFetch<T>(url, { ...options, method: 'GET' });

export const apiPost = <T = any>(url: string, data?: any, options?: FetchOptions) => 
  apiFetch<T>(url, { 
    ...options, 
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined 
  });

export const apiPut = <T = any>(url: string, data?: any, options?: FetchOptions) => 
  apiFetch<T>(url, { 
    ...options, 
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined 
  });

export const apiDelete = <T = any>(url: string, options?: FetchOptions) => 
  apiFetch<T>(url, { ...options, method: 'DELETE' });

// Specific API service helpers
export const accountApi = {
  getProfile: () => apiGet(API_ENDPOINTS.ACCOUNT.PROFILE),
  updateProfile: (data: any) => apiPut(API_ENDPOINTS.ACCOUNT.PROFILE_UPDATE, data),
  login: (credentials: any) => apiPost(API_ENDPOINTS.ACCOUNT.LOGIN, credentials),
  register: (userData: any) => apiPost(API_ENDPOINTS.ACCOUNT.REGISTER, userData),
  getAllUsers: () => apiGet(API_ENDPOINTS.ACCOUNT.ALL_USERS),
  getUserById: (id: string) => apiGet(API_ENDPOINTS.ACCOUNT.USER_BY_ID(id)),
  activateUser: (id: string) => apiPut(API_ENDPOINTS.ACCOUNT.ACTIVATE_USER(id)),
};

export const bookingApi = {
  getAll: () => apiGet(API_ENDPOINTS.BOOKING.BASE),
  getById: (id: string) => apiGet(API_ENDPOINTS.BOOKING.BY_ID(id)),
  create: (data: any) => apiPost(API_ENDPOINTS.BOOKING.BASE, data),
  update: (id: string, data: any) => apiPut(API_ENDPOINTS.BOOKING.BY_ID(id), data),
  delete: (id: string) => apiDelete(API_ENDPOINTS.BOOKING.BY_ID(id)),
  getByCustomer: (customerId: string, status: string) => 
    apiGet(API_ENDPOINTS.BOOKING.BY_CUSTOMER(customerId, status)),
  getByLawyer: (lawyerId: string, status: string) => 
    apiGet(API_ENDPOINTS.BOOKING.BY_LAWYER(lawyerId, status)),
  checkIn: (bookingId: string) => apiPut(API_ENDPOINTS.BOOKING.CHECK_IN(bookingId)),
  checkOut: (bookingId: string) => apiPut(API_ENDPOINTS.BOOKING.CHECK_OUT(bookingId)),
};

export const ticketApi = {
  getAll: () => apiGet(API_ENDPOINTS.TICKET.ALL),
  create: (data: any) => apiPost(API_ENDPOINTS.TICKET.BASE, data),
  getByCustomer: (userId: string) => apiGet(API_ENDPOINTS.TICKET.BY_CUSTOMER(userId)),
  reply: (ticketId: string, data: any) => apiPost(API_ENDPOINTS.TICKET.REPLY(ticketId), data),
  getActivePackages: () => apiGet(API_ENDPOINTS.TICKET.PACKAGES_ACTIVE),
};

export const formApi = {
  getTemplates: () => apiGet(API_ENDPOINTS.FORM.TEMPLATES),
  getActiveTemplates: () => apiGet(API_ENDPOINTS.FORM.TEMPLATES_ACTIVE),
  getByCustomer: (customerId: string) => apiGet(API_ENDPOINTS.FORM.BY_CUSTOMER(customerId)),
  getCustomerForm: (customerFormId: string) => apiGet(API_ENDPOINTS.FORM.CUSTOMER_FORM(customerFormId)),
  updateCustomerForm: (customerFormId: string, data: any) => 
    apiPut(API_ENDPOINTS.FORM.CUSTOMER_FORM(customerFormId), data),
};

export const serviceApi = {
  getAll: () => apiGet(API_ENDPOINTS.SERVICE.BASE),
  getById: (serviceId: string) => apiGet(API_ENDPOINTS.SERVICE.BY_ID(serviceId)),
  getActive: () => apiGet(API_ENDPOINTS.SERVICE.ACTIVE),
};

export const lawyerApi = {
  getAll: () => apiGet(API_ENDPOINTS.LAWYER.BASE),
  getById: (lawyerId: string) => apiGet(API_ENDPOINTS.LAWYER.BY_ID(lawyerId)),
  getByService: (serviceId: string) => apiGet(API_ENDPOINTS.LAWYER.BY_SERVICE(serviceId)),
};

export const orderApi = {
  getAll: () => apiGet(API_ENDPOINTS.ORDER.BASE),
  getById: (orderId: string) => apiGet(API_ENDPOINTS.ORDER.BY_ID(orderId)),
  createForm: (data: any) => apiPost(API_ENDPOINTS.ORDER.CREATE_FORM, data),
  createTicketPackage: (data: any) => apiPost(API_ENDPOINTS.ORDER.TICKET_PACKAGE, data),
  createPaymentUrl: (data: any) => apiPost(API_ENDPOINTS.ORDER.PAYMENT_URL, data),
  delete: (orderId: string) => apiDelete(API_ENDPOINTS.ORDER.BY_ID(orderId)),
};

export const feedbackApi = {
  getAll: () => apiGet(API_ENDPOINTS.FEEDBACK.ALL),
  create: (data: any) => apiPost(API_ENDPOINTS.FEEDBACK.BASE, data),
  update: (feedbackId: string, data: any) => apiPut(API_ENDPOINTS.FEEDBACK.BY_ID(feedbackId), data),
  getByBooking: (bookingId: string) => apiGet(API_ENDPOINTS.FEEDBACK.BY_BOOKING(bookingId)),
};

export const slotApi = {
  getFreeSlots: (lawyerId: string, date: string) => apiGet(API_ENDPOINTS.SLOT.FREE_SLOTS(lawyerId, date)),
};

// Export everything for easy access
export {
  API_ENDPOINTS,
  apiFetch as default,
};
