"use client";

import Link from "next/link";
import { MaxWidthWrapper } from "./max-width-wrapper";
import { UserButton, useUser } from "@clerk/nextjs";
import { buttonVariants } from "./ui/button";
import { ArrowRight, Menu, X } from "lucide-react";
import { useState } from "react";

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const { user } = useUser();
  const isLoggedIn = !!user;

  return (
    <nav className="sticky z-[100] h-16 inset-x-0 top-0 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg transition-all">
      <MaxWidthWrapper>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex z-40 font-semibold">
            Basico
            <span className="text-brand-700 text-slate-400">Too</span>
          </Link>

          <ul className="hidden md:flex items-center gap-6 lg:gap-20 rounded-full px-12 py-3 bg-white/50 shadow-sm dark:border dark:border-white/50 dark:bg-transparent">
            <li>
              <a href="/services">Services</a>
            </li>
            <li>
              <a href="/about-us">About us</a>
            </li>
            <li>
              <a href="/our-lawyers">Our lawyers</a>
            </li>
            <li>
              <a href="/contact-us">Contact us</a>
            </li>
          </ul>

          {/* Burger button for mobile */}
          <div className="md:hidden flex justify-end p-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded focus:outline-none focus:ring"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <nav className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-800 shadow-lg">
              <ul className="flex flex-col items-center gap-4 py-4">
                <li>
                  <a href="/services" className="block px-4 py-2">
                    Services
                  </a>
                </li>
                <li>
                  <a href="/about-us" className="block px-4 py-2">
                    About us
                  </a>
                </li>
                <li>
                  <a href="/our-lawyers" className="block px-4 py-2">
                    Our lawyers
                  </a>
                </li>
                <li>
                  <a href="/contact-us" className="block px-4 py-2">
                    Contact us
                  </a>
                </li>
              </ul>
            </nav>
          )}

          <Link
            href="/buy-tickets"
            className={buttonVariants({
              size: "sm",
              variant: "ghost",
            })}
          >
            Buy Ticket
          </Link>

          <div className="h-full flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={buttonVariants({
                    size: "sm",
                    className: "flex items-center gap-1",
                  })}
                >
                  Dashboard <ArrowRight className="ml-1.5 size-4" />
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className={buttonVariants({
                    size: "sm",
                    variant: "ghost",
                  })}
                >
                  Sign in
                </Link>

                <div className="h-8 w-px bg-gray-200" />

                <Link
                  href="/sign-up"
                  className={buttonVariants({
                    size: "sm",
                    className: "flex items-center gap-1.5",
                  })}
                >
                  Sign up <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};
