"use client";

import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Mail,
  Phone,
  User,
  Calendar,
  ArrowLeft,
  Star,
  DollarSign,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface ServiceForLawyer {
  serviceId: string;
  pricePerHour: number;
}

interface Lawyer {
  accountId: string;
  accountUsername: string;
  accountEmail: string;
  accountFullName: string;
  accountDob: string;
  accountGender: 0 | 1 | 2;
  accountPhone: string;
  accountImage: string;
  aboutLawyer: string;
  accountStatus: "ACTIVE" | "INACTIVE";
  serviceForLawyer?: ServiceForLawyer[];
}

interface Service {
  serviceId: string;
  serviceName: string;
  status: "Active" | "Inactive";
}

const API_LAWYER = "https://localhost:7218/api/Lawyer";
const API_SERVICE = "https://localhost:7218/api/Service";

const LawyerDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGenderText = (gender: 0 | 1 | 2) => {
    switch (gender) {
      case 1:
        return "Male";
      case 2:
        return "Female";
      default:
        return "Not Specified";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const calculateAge = (dateString: string) => {
    try {
      const birthDate = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    } catch {
      return null;
    }
  };

  const getLawyerServices = () => {
    if (!lawyer?.serviceForLawyer || !services.length) return [];

    return lawyer.serviceForLawyer
      .map((ls) => {
        const service = services.find((s) => s.serviceId === ls.serviceId);
        return service
          ? {
              ...service,
              pricePerHour: ls.pricePerHour,
            }
          : null;
      })
      .filter(Boolean);
  };

  const extractIdFromSlug = (slug: string) => {
    // UUID pattern: 8-4-4-4-12 characters (hexadecimal)
    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = slug.match(uuidRegex);
    return match ? match[0] : slug;
  };

  const fetchLawyer = async (lawyerId: string) => {
    try {
      const response = await fetch(`${API_LAWYER}/${lawyerId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Lawyer not found");
        }
        throw new Error("Failed to fetch lawyer details");
      }
      const data = await response.json();

      if (data.accountStatus !== "ACTIVE") {
        throw new Error("This lawyer profile is not available");
      }

      setLawyer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch(API_SERVICE);
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      const data = await response.json();
      setServices(data);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!params.lawyerSlug) return;

      setLoading(true);
      const lawyerId = extractIdFromSlug(params.lawyerSlug as string);

      await Promise.all([fetchLawyer(lawyerId), fetchServices()]);

      setLoading(false);
    };

    fetchData();
  }, [params.lawyerSlug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading lawyer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !lawyer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            {error || "Lawyer not found"}
          </h2>
          <p className="text-gray-600 mb-4">
            The lawyer profile you're looking for is not available.
          </p>
          <Link href="/our-lawyers">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Our Lawyers
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const lawyerServices = getLawyerServices();
  const age = calculateAge(lawyer.accountDob);

  return (
    <>
      <div className="relative">
        <div className="relative z-10 h-full flex items-center">
          <MaxWidthWrapper>
            <Link href="/our-lawyers">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-black hover:bg-white/20 mb-4 mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Our Lawyers
              </Button>
            </Link>
          </MaxWidthWrapper>
        </div>
      </div>

      <MaxWidthWrapper>
        <div className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Image and Basic Info */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <Avatar className="h-48 w-48 mx-auto mb-4 border-4 border-blue-100 shadow-xl">
                      <AvatarImage
                        src={lawyer.accountImage || ""}
                        alt={lawyer.accountFullName}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-4xl font-bold bg-blue-600 text-white">
                        {getInitials(lawyer.accountFullName)}
                      </AvatarFallback>
                    </Avatar>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {lawyer.accountFullName}
                    </h1>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Available for Consultation
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Email
                        </p>
                        <p className="text-sm text-gray-600 break-all">
                          {lawyer.accountEmail}
                        </p>
                      </div>
                    </div>

                    {lawyer.accountPhone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Phone
                          </p>
                          <p className="text-sm text-gray-600">
                            {lawyer.accountPhone}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Gender
                        </p>
                        <p className="text-sm text-gray-600">
                          {getGenderText(lawyer.accountGender)}
                        </p>
                      </div>
                    </div>

                    {lawyer.accountDob && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Date of Birth
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatDate(lawyer.accountDob)}
                            {age && ` (${age} years old)`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      Schedule Consultation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    About {lawyer.accountFullName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lawyer.aboutLawyer ? (
                    <div
                      className="prose max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: lawyer.aboutLawyer }}
                    />
                  ) : (
                    <p className="text-gray-500 italic">
                      No detailed information provided about this lawyer.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Services and Pricing */}
              {lawyerServices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      Legal Services & Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lawyerServices.map((service: any, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {service.serviceName}
                            </h4>
                            <Badge
                              variant={
                                service.status === "Active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="ml-2"
                            >
                              {service.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span className="font-bold text-lg">
                              ${service.pricePerHour}
                            </span>
                            <span className="text-sm text-gray-600">
                              per hour
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call to Action */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      Ready to Get Legal Help?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Contact {lawyer.accountFullName} today to discuss your
                      legal needs and schedule a consultation.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Schedule Consultation
                      </Button>
                      <Button variant="outline" size="lg">
                        Send Message
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </>
  );
};

export default LawyerDetailPage;
