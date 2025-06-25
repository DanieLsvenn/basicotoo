"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Star, Package, ArrowRight } from "lucide-react";

interface TicketPackage {
  ticketPackageId: string;
  ticketPackageName: string;
  requestAmount: number;
  price: number;
  status: string;
}

const BuyTicketsPage = () => {
  const [packages, setPackages] = useState<TicketPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  useEffect(() => {
    fetchActivePackages();
  }, []);

  const fetchActivePackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://localhost:7103/api/ticket-packages-active"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch packages");
      }
      const data = await response.json();
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (packageId: string, packageName: string) => {
    setSelectedPackage(packageId);
    // Here you would integrate with your payment system
    alert(`Purchasing ${packageName}...`);
    // Reset selection after a delay to simulate processing
    setTimeout(() => setSelectedPackage(null), 2000);
  };

  const getMostPopular = () => {
    if (packages.length === 0) return null;
    // Find package with best value (lowest price per request)
    return packages.reduce((best, current) => {
      const currentValue = current.price / current.requestAmount;
      const bestValue = best.price / best.requestAmount;
      return currentValue < bestValue ? current : best;
    });
  };

  const getPackageFeatures = (pkg: TicketPackage) => {
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg text-gray-600">Loading ticket packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <Package className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchActivePackages}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const mostPopular = getMostPopular();

  return (
    <div className="min-h-screen">
      {/* Header Section */}
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

      {/* Pricing Cards */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-6xl mx-auto">
          {packages.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No packages available
              </h3>
              <p className="text-gray-600">
                Please check back later for available ticket packages.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6">
              {packages.map((pkg) => {
                const isPopular =
                  mostPopular?.ticketPackageId === pkg.ticketPackageId;
                const pricePerRequest = pkg.price / pkg.requestAmount;
                const features = getPackageFeatures(pkg);

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
                            ${pkg.price}
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
                        onClick={() =>
                          handlePurchase(
                            pkg.ticketPackageId,
                            pkg.ticketPackageName
                          )
                        }
                        disabled={selectedPackage === pkg.ticketPackageId}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                          isPopular
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                            : "bg-black/80 hover:bg-black/70 text-white"
                        } ${
                          selectedPackage === pkg.ticketPackageId
                            ? "opacity-75 cursor-not-allowed"
                            : "hover:shadow-lg transform hover:scale-105"
                        }`}
                      >
                        {selectedPackage === pkg.ticketPackageId ? (
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
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-black/80 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4">Need a custom solution?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Contact our sales team for enterprise pricing and custom packages
            tailored to your needs.
          </p>
          <button className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyTicketsPage;
