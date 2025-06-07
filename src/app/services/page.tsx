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

const Page = () => {
  const autoplay = Autoplay({ delay: 4000, stopOnInteraction: true });
  return (
    <MaxWidthWrapper>
      <Carousel
        plugins={[autoplay]}
        className="w-full"
        onMouseEnter={autoplay.stop}
        onMouseLeave={autoplay.reset}
      >
        <CarouselContent>
          {[
            {
              src: assets.Landing1,
              alt: "Landing1",
              title: "Welcome to Our Law Services",
              description: "Expert legal support for all your needs",
              buttonText: "Book a Consultation",
            },
            {
              src: assets.Landing2,
              alt: "Landing2",
              title: "Trusted Legal Advisors",
              description: "Guiding you through complex legal matters",
              buttonText: "Meet Our Team",
            },
            {
              src: assets.Landing3,
              alt: "Landing3",
              title: "Your Justice, Our Priority.",
              description: "Committed to achieving the best outcomes",
              buttonText: "Learn More",
            },
          ].map((slide, index) => (
            <CarouselItem key={index}>
              <div className="relative w-full h-[500px]">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  className="w-full h-full object-cover"
                />
                {/* Overlay Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center p-4">
                  <h2 className="text-4xl font-bold mb-4">{slide.title}</h2>
                  <p className="text-lg mb-6">{slide.description}</p>
                  <Button className="bg-white text-black hover:bg-white/80">
                    {slide.buttonText}
                  </Button>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-center">Our Services</h1>
        <div className="text-xl italic mb-10 text-center">
          BASICOTOO provides a wide range of comprehensive legal services across
          all areas of core business activities.
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
      </div>
    </MaxWidthWrapper>
  );
};

export default Page;
