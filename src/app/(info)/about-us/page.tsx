import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import Image from "next/image";
import React from "react";
import { assets } from "../../../../public/assets/assets";

const page = () => {
  return (
    <>
      <div className="relative h-64 md:h-80 lg:h-[400px]">
        <Image
          src={assets.AboutUs}
          alt="About Us"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-start justify-center px-6 md:px-16 text-white">
          <h2 className="text-2xl md:text-3xl font-bold uppercase mb-2">
            About Us
          </h2>
          <p className="text-base md:text-lg mb-4">
            <span className="text-white font-bold italic">BASICOTOO</span> -
            trusted partner for your legal needs.
          </p>
        </div>
      </div>
      <MaxWidthWrapper>
        <div></div>
      </MaxWidthWrapper>
    </>
  );
};

export default page;
