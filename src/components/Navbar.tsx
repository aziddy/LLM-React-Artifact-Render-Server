"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignOutButton } from "./SignOutButton";

export function Navbar({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-text-primary">
            Artifacts
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isLoggedIn && (
            <>
              <Link
                href="/"
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Gallery
              </Link>
              <Link
                href="/upload"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
              >
                Upload
              </Link>
              <SignOutButton />
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
