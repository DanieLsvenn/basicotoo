"use client";

import React from "react";

export const Footer = () => {
  return (
    <div>
      <footer className="bg-black/80 text-white py-4 ">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} basicotoo. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            Follow us on{" "}
            <a href="#" className="text-blue-400 hover:underline">
              Twitter
            </a>
            ,{" "}
            <a href="#" className="text-blue-400 hover:underline">
              Facebook
            </a>
            , and{" "}
            <a href="#" className="text-blue-400 hover:underline">
              Instagram
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
