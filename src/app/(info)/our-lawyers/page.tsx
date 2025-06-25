"use client";

import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { assets } from "../../../../public/assets/assets";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Phone, User } from "lucide-react";
import Link from "next/link";

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

const OurLawyersPage = () => {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
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

  const getServiceNames = (lawyerServices: ServiceForLawyer[] | undefined) => {
    if (!lawyerServices || lawyerServices.length === 0) return [];

    return lawyerServices
      .map((ls) => {
        const service = services.find((s) => s.serviceId === ls.serviceId);
        return service ? service.serviceName : null;
      })
      .filter(Boolean) as string[];
  };

  const createSlug = (name: string, id: string) => {
    const nameSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    return `${nameSlug}-${id}`;
  };

  const fetchLawyers = async () => {
    try {
      const response = await fetch(API_LAWYER);
      if (!response.ok) {
        throw new Error("Failed to fetch lawyers");
      }
      const data = await response.json();
      setLawyers(
        data.filter((lawyer: Lawyer) => lawyer.accountStatus === "ACTIVE")
      );
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
      setLoading(true);
      await Promise.all([fetchLawyers(), fetchServices()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative h-64 md:h-80 lg:h-[500px]">
        <Image
          src={assets.OurLawyers}
          alt="Our Lawyers"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-start justify-center px-6 md:px-16 text-white">
          <h2 className="text-2xl md:text-3xl font-bold uppercase mb-2">
            Our Lawyers
          </h2>
          <p className="text-base md:text-lg mb-4">
            <span className="text-white font-bold italic">BASICOTOO</span> -
            provides professional lawyers to help you resolve your legal issues.
          </p>
        </div>
      </div>

      <MaxWidthWrapper>
        <div className="py-12">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Meet Our Expert Legal Team
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our team of experienced attorneys is dedicated to providing you
              with the highest quality legal representation and personalized
              service.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-lg text-gray-600">
                Loading our lawyers...
              </span>
            </div>
          ) : lawyers.length === 0 ? (
            <div className="text-center py-16">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Lawyers Available
              </h3>
              <p className="text-gray-600">
                We're currently updating our team. Please check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {lawyers.map((lawyer) => {
                const serviceNames = getServiceNames(lawyer.serviceForLawyer);
                const slug = createSlug(
                  lawyer.accountFullName,
                  lawyer.accountId
                );

                return (
                  <Link key={lawyer.accountId} href={`/our-lawyers/${slug}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg hover:scale-105">
                      <CardContent className="p-0">
                        <div className="relative">
                          <div className="h-64 flex items-center justify-center">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                              <AvatarImage
                                src={lawyer.accountImage || ""}
                                alt={lawyer.accountFullName}
                                className="object-cover"
                              />
                              <AvatarFallback className="text-2xl font-bold bg-blue-600 text-white">
                                {getInitials(lawyer.accountFullName)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Available
                            </Badge>
                          </div>
                        </div>

                        <div className="p-6">
                          <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                            {lawyer.accountFullName}
                          </h4>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{getGenderText(lawyer.accountGender)}</span>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {lawyer.accountEmail}
                              </span>
                            </div>
                            {lawyer.accountPhone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{lawyer.accountPhone}</span>
                              </div>
                            )}
                          </div>

                          {serviceNames.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Specializations:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {serviceNames
                                  .slice(0, 2)
                                  .map((serviceName, index) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-50"
                                    >
                                      {serviceName}
                                    </Badge>
                                  ))}
                                {serviceNames.length > 2 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-100"
                                  >
                                    +{serviceNames.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="pt-4 border-t border-gray-100">
                            <div className="text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                              View Profile →
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </MaxWidthWrapper>
    </>
  );
};

export default OurLawyersPage;
