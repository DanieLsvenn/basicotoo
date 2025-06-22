"use client";

import Link from "next/link";
import { MaxWidthWrapper } from "./max-width-wrapper";
import { buttonVariants } from "./ui/button";
import { ArrowRight, Menu, X, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import Dock from "./ui/dock";
import { useRouter } from "next/navigation";
import { on } from "events";

export const Navbar = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();

  const isLoggedIn = !!user && !isLoading;

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleChangePage = (href: string) => {
    router.push(href);
  };

  const items = [
    { name: "Services", onClick: () => handleChangePage("/services") },
    { name: "About us", onClick: () => handleChangePage("/about-us") },
    { name: "Our lawyers", onClick: () => handleChangePage("/our-lawyers") },
    { name: "Contact us", onClick: () => handleChangePage("/contact-us") },
  ];

  return (
    <nav className="sticky z-[100] h-16 inset-x-0 top-0 w-full border-b border-gray-200 bg-white/80 backdrop-blur-lg transition-all">
      <MaxWidthWrapper>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex z-40 font-semibold">
            Basico
            <span className="text-brand-700 text-slate-400">Too</span>
          </Link>

          {/* Dock and Buy Ticket in a flex row */}
          <div className="flex flex-1 items-center gap-3">
            <Dock
              className="hidden md:flex flex-auto items-center justify-center mx-4 gap-17 lg:mx-20 lg:gap-30 py-3 bg-white/50 shadow-sm dark:border dark:border-white/50 dark:bg-transparent"
              items={items}
              panelHeight={45}
              baseItemSize={40}
              magnification={20}
            />
            <Link
              href="/buy-tickets"
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
              })}
            >
              Buy Ticket
            </Link>
          </div>

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
                {isLoggedIn && (
                  <li>
                    <Link href="/profile" className="block px-4 py-2">
                      My Profile
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          )}

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

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="User menu"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.image || ""} alt={user?.name} />
                      <AvatarFallback className="text-xs">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
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
