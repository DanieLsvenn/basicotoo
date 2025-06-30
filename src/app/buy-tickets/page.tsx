"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Package, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";

// Constants
const API_BASE_URL = "https://localhost:7103/api";

// Types
interface TicketPackage {
  ticketPackageId: string;
  ticketPackageName: string;
  requestAmount: number;
  price: number;
  status: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

const BuyTicketsPage = () => {
  // --- STATE MANAGEMENT ---
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [usdToVndRate, setUsdToVndRate] = useState<number>(24000);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  // FAQ Data
  const faqData: FAQItem[] = [
    {
      question: "What are tickets used for?",
      answer: "Tickets are used to access legal forms and documents (divorce forms, real estate contracts, etc.), contact our legal staff, and request various legal services through our platform."
    },
    {
      question: "Do tickets expire?",
      answer: "No, your tickets never expire. Once purchased, they remain in your account until you use them."
    },
    {
      question: "Can I get a refund for unused tickets?",
      answer: "Tickets are non-refundable once purchased. However, if you have technical issues or concerns, please contact our support team for assistance."
    },
    {
      question: "How many tickets do I need for different services?",
      answer: "Basic legal forms typically cost 1-3 tickets, complex documents may require 5-10 tickets, and staff consultations usually cost 2-5 tickets depending on the complexity."
    },
    {
      question: "Is there a minimum purchase amount?",
      answer: "No, you can purchase any of our available ticket packages. We offer various package sizes to suit different needs and budgets."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers. All payments are processed securely through our encrypted payment system."
    }
  ];

  // --- LOGIC METHODS ---

  // API request wrapper
  const apiRequest = useCallback(async (url: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return response.json();
  }, []);

  // Fetch active packages
  const fetchActivePackages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest("/ticket-packages-active");
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Get best value package (lowest price per ticket)
  const getBestValue = useCallback(() => {
    if (packages.length === 0) return null;
    
    return packages.reduce((best, current) => {
      const currentValue = current.price / current.requestAmount;
      const bestValue = best.price / best.requestAmount;
      return currentValue < bestValue ? current : best;
    });
  }, [packages]);

  // Get most popular package (cheapest total price)
  const getMostPopular = useCallback(() => {
    if (packages.length === 0) return null;
    
    return packages.reduce((cheapest, current) => {
      return current.price < cheapest.price ? current : cheapest;
    });
  }, [packages]);

  // Convert VND price to USD
  const convertToUSD = useCallback((vndPrice: number): number => {
    return vndPrice / usdToVndRate;
  }, [usdToVndRate]);

  // Format USD price
  const formatUSDPrice = useCallback((vndPrice: number): string => {
    const usdPrice = convertToUSD(vndPrice);
    return usdPrice.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [convertToUSD]);

  // --- HANDLER METHODS ---

  // Handle package purchase
  const handlePurchase = useCallback((packageId: string) => {
    setSelectedPackage(packageId);
    // Navigate to checkout page
    window.location.href = `/checkout/ticket/${packageId}`;
  }, []);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    fetchActivePackages();
  }, [fetchActivePackages]);

  // Toggle FAQ
  const toggleFAQ = useCallback((index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  }, [openFAQ]);

  // --- EFFECTS ---
  useEffect(() => {
    fetchActivePackages();
  }, [fetchActivePackages]);

  useEffect(() => {
    // Fetch USD to VND exchange rate
    fetch("https://api.getgeoapi.com/v2/currency/convert?api_key=05585d2dbe81b54873e6a5ec72b0ad7e423bbcc0&from=USD&to=VND&amount=1&format=json")
      .then(res => res.json())
      .then(data => {
        if (
          data &&
          data.status === "success" &&
          data.rates &&
          data.rates.VND &&
          data.rates.VND.rate
        ) {
          setUsdToVndRate(Number(data.rates.VND.rate));
        }
      })
      .catch(() => {
        setUsdToVndRate(26086.9826);
      });
  }, []);

  // --- RENDER METHODS ---

  const renderLoadingState = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-lg text-gray-600">Loading ticket packages...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <Package className="h-16 w-16 mx-auto mb-4 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Oops! Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        No packages available
      </h3>
      <p className="text-gray-600">
        Please check back later for available ticket packages.
      </p>
    </div>
  );

  const renderPackageItem = (pkg: TicketPackage, isFeatured = false, isPopular = false) => {
    const usdPrice = convertToUSD(pkg.price);
    const pricePerTicket = usdPrice / pkg.requestAmount;
    const isProcessing = selectedPackage === pkg.ticketPackageId;

    let borderClass = "border border-gray-200";
    let badgeElement = null;

    if (isFeatured) {
      borderClass = "border-2 bg-gradient-to-r from-blue-500 to-purple-600 p-0.5";
      badgeElement = (
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
          Best Value
        </div>
      );
    } else if (isPopular) {
      borderClass = "border-2 bg-gradient-to-r from-orange-400 to-yellow-500 p-0.5";
      badgeElement = (
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-orange-400 to-yellow-500 text-white px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      );
    }

    const content = (
      <div className="bg-white rounded-lg p-6 flex items-center justify-between hover:shadow-md transition-shadow relative">
        {badgeElement}
        
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {pkg.ticketPackageName}
          </h3>
          <div className="flex items-center gap-4 text-gray-600">
            <span>{pkg.requestAmount.toLocaleString()} Tickets</span>
            <span className="text-gray-400">•</span>
            <span>${pricePerTicket.toFixed(2)} per ticket</span>
          </div>
        </div>

        <div className="text-right mr-6">
          <div className="text-2xl font-bold text-gray-900">
            {formatUSDPrice(pkg.price)}
          </div>
        </div>

        <button
          onClick={() => handlePurchase(pkg.ticketPackageId)}
          disabled={isProcessing}
          className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
            isProcessing
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-gray-900 hover:bg-gray-800 text-white hover:shadow-lg"
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Buy Now
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    );

    if (isFeatured || isPopular) {
      return (
        <div key={pkg.ticketPackageId} className={`relative rounded-lg ${borderClass}`}>
          {content}
        </div>
      );
    }

    return (
      <div key={pkg.ticketPackageId} className={`relative rounded-lg ${borderClass}`}>
        {content}
      </div>
    );
  };

  const renderHeader = () => (
    <div className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Buy Legal Service Tickets
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Purchase tickets to access legal forms, documents, and professional consultation services. 
          Choose the package that best fits your needs.
        </p>
      </div>
    </div>
  );

  const renderPackagesSection = () => {
    if (packages.length === 0) return renderEmptyState();

    const bestValue = getBestValue();
    const mostPopular = getMostPopular();

    // Separate featured packages from regular ones
    const featuredPackages = packages.filter(pkg => 
      pkg.ticketPackageId === bestValue?.ticketPackageId || 
      pkg.ticketPackageId === mostPopular?.ticketPackageId
    );

    const regularPackages = packages.filter(pkg => 
      pkg.ticketPackageId !== bestValue?.ticketPackageId && 
      pkg.ticketPackageId !== mostPopular?.ticketPackageId
    );

    return (
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Featured Packages */}
          {featuredPackages.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Featured Packages</h2>
              <div className="space-y-4">
                {featuredPackages.map(pkg => 
                  renderPackageItem(
                    pkg, 
                    pkg.ticketPackageId === bestValue?.ticketPackageId,
                    pkg.ticketPackageId === mostPopular?.ticketPackageId
                  )
                )}
              </div>
            </div>
          )}

          {/* Regular Packages */}
          {regularPackages.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                {featuredPackages.length > 0 ? "More Options" : "Available Packages"}
              </h2>
              <div className="space-y-4">
                {regularPackages.map(pkg => renderPackageItem(pkg))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFAQSection = () => (
    <div className="bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Get answers to common questions about our ticket system
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {openFAQ === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMainContent = () => (
    <div className="min-h-screen bg-white">
      {renderHeader()}
      {renderPackagesSection()}
      {renderFAQSection()}
    </div>
  );

  // --- MAIN RENDER ---
  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  
  return renderMainContent();
};

export default BuyTicketsPage;