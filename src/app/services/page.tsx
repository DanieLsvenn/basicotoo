"use client";

import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import { assets } from "../../../public/assets/assets";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";

const services = [
  {
    name: "In-house Lawyer Services",
    slug: "in-house-lawyer-services",
    image: "/assets/InHouseLawyerServices.png",
    description: "Expert advice from top-tier legal professionals.",
  },
  {
    name: "Taxes, Corporate Finance",
    slug: "taxes-corporate-finance",
    image: "/assets/TaxesCorporateFinance.png",
    description: "Ensure your contracts are legally sound and risk-free.",
  },
  {
    name: "Intellectual property",
    slug: "intellectual-property",
    image: "/assets/IntellectualProperty.png",
    description: "Manage all your legal cases in one secure dashboard.",
  },
  {
    name: "Corporate Legal Services",
    slug: "corporate-legal-services",
    image: "/assets/CorporateLegalServices.png",
    description: "Custom legal documents drafted by experts.",
  },
  {
    name: "Banking and finance",
    slug: "banking-finance",
    image: "/assets/BankingFinance.png",
    description: "Book appointments with qualified lawyers easily.",
  },
  {
    name: "Insurance",
    slug: "insurance",
    image: "/assets/Insurance.png",
    description: "Stay on top of legal obligations for your business.",
  },
];

const documentations = [
  {
    name: "Divorce Petition",
    slug: "divorce-petition",
    image: "/assets/DivorcePetition.png",
    description: "A divorce settlement template.",
  },
  {
    name: "Lease Agreement",
    slug: "lease-agreement",
    image: "/assets/LeaseAgreement.png",
    description: "Lease agreement template.",
  },
  {
    name: "Last Will and Testament",
    slug: "last-will-testament",
    image: "/assets/LastWillTestament.png",
    description: "Last will and testament template.",
  },
];

const Page = () => {
  const autoplay = Autoplay({ delay: 4000, stopOnInteraction: true });
  return (
    <>
      <div className="relative h-64 md:h-80 lg:h-[500px]">
        <Image
          src={assets.Services}
          alt="Services"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-start justify-center px-6 md:px-16 text-white">
          <h2 className="text-2xl md:text-3xl font-bold uppercase mb-2">
            Need counseling for your everything?
          </h2>
          <p className="text-base md:text-lg mb-4">
            <span className="text-white font-bold italic">BASICOTOO</span> -
            accompanies customers in every step of the way.
          </p>
        </div>
      </div>
      <MaxWidthWrapper>
        <div className="p-8 max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-10 text-center">Our Services</h1>
          <div className="text-xl italic mb-10 text-center">
            BASICOTOO provides a wide range of comprehensive legal services
            across all areas of core business activities.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition group"
              >
                <img
                  src={service.image}
                  alt={service.name}
                  className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{service.name}</h2>
                  <p className="text-gray-600 text-sm">{service.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <h1 className="text-4xl font-bold mb-10 text-center mt-20">
            Our Documentations
          </h1>
          <div className="text-xl italic mb-10 text-center">
            BASICOTOO provides official documentations for your legal needs.
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {documentations.map((doc) => (
              <Link
                key={doc.slug}
                href={`/documents/${doc.slug}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition group"
              >
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{doc.name}</h2>
                  <p className="text-gray-600 text-sm">{doc.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </MaxWidthWrapper>
    </>
  );
};

export default Page;
