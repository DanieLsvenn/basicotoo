"use client";

import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { assets } from "../../../public/assets/assets";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  HandCoins,
  Scale,
  Library,
  Users,
  BriefcaseMedical,
} from "lucide-react";

const Page = () => {
  const autoplay = Autoplay({ delay: 4000, stopOnInteraction: true });

  return (
    <>
      <MaxWidthWrapper>
        <div className="bg-white text-gray-800">
          {/* Hero Section with Carousel */}
          <section className="w-full">
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
                        <h2 className="text-4xl font-bold mb-4">
                          {slide.title}
                        </h2>
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

            <div className="relative flex h-64 w-full overflow-hidden">
              {/* Left Triangle */}
              <div
                className="flex-1 bg-black/80 text-white flex items-center justify-start p-6"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 95% 100%, 0 100%)",
                }}
              >
                <div>
                  <h3 className="text-2xl font-bold italic">
                    Legal Consultations
                  </h3>
                  <p className="font-medium italic mb-5">
                    basicotoo is the top choice priority of many leading
                    <br />
                    businesses in various industries and fields.
                  </p>
                  <Library size={50} />
                </div>
              </div>

              {/* Right Triangle */}
              <div
                className="flex-1 bg-black/80 text-white flex items-center justify-end p-6"
                style={{
                  clipPath: "polygon(5% 0, 100% 0, 100% 100%, 0 100%)",
                }}
              >
                <div className="flex flex-col items-end text-right">
                  <Users size={50} className="mb-2" />
                  <h3 className="text-2xl font-bold italic">
                    Expert Legal Team
                  </h3>
                  <p className="font-medium italic">
                    We’re here to support your legal needs
                    <br />
                    with precision and care.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-black mt-20 mb-10"></div>

          {/* Contact Section */}
          <section className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              {/* Left Image */}
              <div className="w-full h-full">
                <Image
                  className="rounded-lg w-full object-cover"
                  src={assets.Contact}
                  alt="Contact Us"
                />
              </div>

              {/* Right Text */}
              <div className="text-gray-800">
                <p className="text-lg font-medium italic mb-2">
                  Working with outstanding lawyers
                </p>
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  basicotoo - Your Trusted Legal Partner
                </h2>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  With highly skilled lawyers and a team of legal experts, along
                  with a diverse and rich background of experience and
                  knowledge, we will be able to meet your current legal needs.
                </p>

                {/* Icon Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div>
                    <Users className="mx-auto" size={32} />
                    <p className="font-semibold mt-2">
                      Affluent
                      <br />
                      experience
                    </p>
                  </div>
                  <div>
                    <Scale className="mx-auto" size={32} />
                    <p className="font-semibold mt-2">
                      In-depth
                      <br />
                      knowledge
                    </p>
                  </div>
                  <div>
                    <BriefcaseMedical className="mx-auto" size={32} />
                    <p className="font-semibold mt-2">
                      Realistic
                      <br />
                      solutions
                    </p>
                  </div>
                </div>

                {/* Button */}
                <div className="mt-6">
                  <button
                    className="px-6 py-2 border border-black text-black font-semibold rounded 
               hover:bg-black hover:text-white transition 
               mx-auto block md:ml-0 md:mr-0"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-black mt-20 mb-10"></div>

          {/* Services Section */}
          <section className="py-16 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4">
              <h3 className="text-3xl font-bold text-center mb-12">
                Our Services
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-6 bg-white shadow rounded text-center">
                  <div className="mb-4 justify-center flex">
                    <Scale size={50} />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">
                    In-house attorney services
                  </h4>
                  <p>
                    Regular, comprehensive advice closely connected with the
                    company's internal affairs.
                  </p>
                </div>
                <div className="p-6 bg-white shadow rounded text-center">
                  <div className="mb-4 justify-center flex">
                    <Briefcase size={50} />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">
                    Banking and finance
                  </h4>
                  <p>
                    Deep knowledgeable in every field of financial and banking
                    law
                  </p>
                </div>
                <div className="p-6 bg-white shadow rounded text-center">
                  <div className="mb-4 justify-center flex">
                    <HandCoins size={50} />
                  </div>
                  <h4 className="text-xl font-semibold mb-2">Capital market</h4>
                  <p>
                    Provide legal solutions, processes, and reasonable
                    structures for all transactions in the stock market.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-black mt-20 mb-32"></div>

          {/* Client Logos Section */}
          <section className="py-12 bg-black/80">
            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Left: Logos */}
              <div className="flex-1 flex flex-wrap justify-center gap-6">
                <Image
                  src={assets.MB}
                  alt="MB bank"
                  className="w-32 h-16 object-cover rounded"
                />
                <Image
                  src={assets.OCB}
                  alt="OCB bank"
                  className="w-32 h-16 object-cover rounded"
                />
                <Image
                  src={assets.VIB}
                  alt="VIB bank"
                  className="w-32 h-16 object-cover rounded"
                />
                <Image
                  src={assets.ACB}
                  alt="ACB bank"
                  className="w-32 h-16 object-cover rounded"
                />
                <Image
                  src={assets.BIDV}
                  alt="BIDV bank"
                  className="w-32 h-16 object-cover rounded"
                />
                <Image
                  src={assets.SHB}
                  alt="SHB bank"
                  className="w-32 h-16 object-cover rounded"
                />
              </div>

              {/* Right: Text */}
              <div className="flex-1 text-white text-center md:text-left">
                <h3 className="text-2xl font-semibold mb-4">
                  Trusted by Leading Clients
                </h3>
                <p className="text-sm font-light">
                  We are proud to be trusted by reputable financial institutions
                  and leading organizations across the region. Our partnerships
                  reflect our commitment to legal excellence and client success.
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col md:flex-row w-full py-6">
            {/* Left: Red Text Box */}
            <div className="flex-1 bg-black/80 text-white flex flex-col justify-center items-center px-6 py-12 text-center">
              <h3 className="text-xl md:text-2xl font-bold uppercase mb-4">
                Ready for Legal Support?
              </h3>
              <p className="text-base font-light mb-5">
                Buy your tickets now and receive legal support
              </p>
              <button className="border border-white px-6 py-2 rounded hover:bg-white hover:text-black transition font-medium">
                Buy Ticket &nbsp; &gt;
              </button>
            </div>

            {/* Right: Image */}
            <div className="flex-1 bg-black/40 relative">
              <Image
                src={assets.Buy} // Replace with actual import or path
                alt="Legal Support"
                className="w-full h-full object-cover"
              />
              {/* Overlay Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white text-center p-4" />
            </div>
          </section>
        </div>
      </MaxWidthWrapper>
    </>
  );
};

export default Page;
