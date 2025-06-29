"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Check, Star, Package, ArrowRight } from "lucide-react";

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

const BuyTicketsPage = () => {
  // --- STATE MANAGEMENT ---
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [usdToVndRate, setUsdToVndRate] = useState<number>(24000); // fallback default

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

  // Get most popular package (best value)
  const getMostPopular = useCallback(() => {
    if (packages.length === 0) return null;
    
    return packages.reduce((best, current) => {
      const currentValue = current.price / current.requestAmount;
      const bestValue = best.price / best.requestAmount;
      return currentValue < bestValue ? current : best;
    });
  }, [packages]);

  // Get package features based on request amount
  const getPackageFeatures = useCallback((pkg: TicketPackage) => {
    const features = [
      `${pkg.requestAmount.toLocaleString()} Tickets`,
      "24/7 Customer support",
      "No expiration date",
    ];

    if (pkg.requestAmount >= 50) {
      features.push("Priority processing");
    }

    if (pkg.requestAmount >= 75) {
      features.push("Dedicated account manager");
      features.push("Custom integrations");
    }

    return features;
  }, []);

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
  const handlePurchase = useCallback((packageId: string, packageName: string) => {
    setSelectedPackage(packageId);
    // Here you would integrate with your payment system
    alert(`Purchasing ${packageName}...`);
    // Reset selection after a delay to simulate processing
    setTimeout(() => setSelectedPackage(null), 2000);
  }, []);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    fetchActivePackages();
  }, [fetchActivePackages]);

  // Handle contact sales
  const handleContactSales = useCallback(() => {
    // Here you would open a contact form or redirect to sales page
    alert("Contact sales functionality would be implemented here");
  }, []);

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
        setUsdToVndRate(26086.9826); // fallback rate
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

  const renderPackageCard = (pkg: TicketPackage) => {
    const mostPopular = getMostPopular();
    const isPopular = mostPopular?.ticketPackageId === pkg.ticketPackageId;
    const usdPrice = convertToUSD(pkg.price);
    const pricePerRequest = usdPrice / pkg.requestAmount;
    const features = getPackageFeatures(pkg);
    const isProcessing = selectedPackage === pkg.ticketPackageId;

    return (
      <div
        key={pkg.ticketPackageId}
        className={`relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
          isPopular
            ? "ring-4 ring-blue-500 ring-opacity-50 scale-105"
            : ""
        }`}
      >
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-1">
              <Star className="h-4 w-4" />
              Most Popular
            </div>
          </div>
        )}

        <div className="p-8">
          {/* Package Header */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {pkg.ticketPackageName}
            </h3>
            <div className="mb-4">
              <span className="text-5xl font-bold text-gray-900">
                {formatUSDPrice(pkg.price)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              <span className="bg-gray-100 px-3 py-1 rounded-full">
                ${pricePerRequest.toFixed(2)} per request
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="mb-8">
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Purchase Button */}
          <button
            onClick={() => handlePurchase(pkg.ticketPackageId, pkg.ticketPackageName)}
            disabled={isProcessing}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              isPopular
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                : "bg-gray-900 hover:bg-gray-800 text-white"
            } ${
              isProcessing
                ? "opacity-75 cursor-not-allowed"
                : "hover:shadow-lg transform hover:scale-105"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Purchase {pkg.ticketPackageName}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <div className="pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Choose Your Perfect Plan
        </h1>
        <p className="text-lg text-gray-500">
          All plans include unlimited access with no hidden fees
        </p>
      </div>
    </div>
  );

  const renderPricingSection = () => (
    <div className="px-4 sm:px-6 lg:px-8 pb-16">
      <div className="max-w-6xl mx-auto">
        {packages.length === 0 
          ? renderEmptyState()
          : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6">
              {packages.map(renderPackageCard)}
            </div>
          )
        }
      </div>
    </div>
  );

  const renderCTASection = () => (
    <div className="bg-gray-900 text-white py-16">
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold mb-4">Need a custom solution?</h2>
        <p className="text-xl text-gray-300 mb-8">
          Contact our sales team for enterprise pricing and custom packages
          tailored to your needs.
        </p>
        <button 
          onClick={handleContactSales}
          className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
        >
          Contact Sales
        </button>
      </div>
    </div>
  );

  const renderMainContent = () => (
    <div className="min-h-screen">
      {renderHeader()}
      {renderPricingSection()}
      {renderCTASection()}
    </div>
  );

  // --- MAIN RENDER ---
  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  
  return renderMainContent();
};

export default BuyTicketsPage;