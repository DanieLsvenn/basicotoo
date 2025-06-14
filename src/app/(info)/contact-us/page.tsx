import Image from "next/image";
import React from "react";
import { assets } from "../../../../public/assets/assets";

const page = () => {
  return (
    <section id="contact" className="w-full">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 lg:h-[500px]">
        <Image
          src={assets.ContactUs}
          alt="Contact Us"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 flex flex-col items-start justify-center px-6 md:px-16 text-white">
          <h2 className="text-2xl md:text-3xl font-bold uppercase mb-2">
            Contact Us
          </h2>
          <p className="text-base md:text-lg mb-4">
            <span className="text-white font-bold italic">BASICOTOO</span> -
            accompanies customers in building a sustainable business foundation.
          </p>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 md:px-16 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Info Text */}
        <div>
          <h3 className="text-2xl font-bold uppercase tracking-wide relative inline-block mb-8">
            LIMITED LIABILITY LAW FIRM BANK - SECURITIES - INVESTMENT
            <span className="block w-16 h-1 bg-black/40 mt-2 rounded"></span>
          </h3>

          {/* Hà Nội Office */}
          <div className="mb-8">
            <p>
              <span className="font-bold text-black">BASICOTOO</span> HA NOI
            </p>
            <p>
              <span className="font-semibold">Địa chỉ:</span> Số 286, Phố Ngọc
              Thụy, Phường Ngọc Thụy, Quận Long Biên, Hà Nội.
            </p>
            <p>
              <span className="font-semibold">ĐT:</span> 024-3732.6646
            </p>
            <p>
              <span className="font-semibold">E-mail:</span>{" "}
              anh.nn@basico.com.vn
            </p>
          </div>

          {/* Sài Gòn Office */}
          <div className="mb-8">
            <p>
              <span className="font-bold text-black">BASICOTOO</span> SAI GON
            </p>
            <p>
              <span className="font-semibold">Địa chỉ:</span> 2.01 – 2.02, Cao
              ốc GALAXY, số 09, Nguyễn Khoái, Phường 1, Quận 4, TP Hồ Chí Minh
            </p>
            <p>
              <span className="font-semibold">ĐT:</span> 028-3826.8343
            </p>
            <p>
              <span className="font-semibold">E-mail:</span>{" "}
              hai.tm@basico.com.vn
            </p>
          </div>

          {/* Button */}
          <button className="border border-black text-black px-6 py-2 uppercase tracking-wider hover:bg-black hover:text-white transition">
            SEND REQUEST
          </button>
        </div>

        {/* Image */}
        <div className="w-full"></div>
      </div>
    </section>
  );
};

export default page;
