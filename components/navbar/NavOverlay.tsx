"use client";

import { useEffect } from "react";
import Link from "next/link";
import { trackBookStrategyCall } from "@/lib/analytics";
import type { MainNavLink } from "@/data/navigation";

type NavOverlayProps = {
  open: boolean;
  onClose: () => void;
  links: MainNavLink[];
};

export function NavOverlay({ open, onClose, links }: NavOverlayProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (window.matchMedia("(min-width: 1280px)").matches) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-hidden={open ? undefined : true}
      inert={open ? undefined : true}
      className={`xl:hidden fixed inset-0 z-40 h-[100dvh] overflow-y-auto overscroll-contain bg-background transition-opacity duration-300 ${
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      {/* pt-24 clears the fixed navbar (bar padding plus the 44px menu control). */}
      <div className="nav-overlay-content flex min-h-full flex-col items-center justify-center gap-8 px-6 pb-16 pt-24">
        {links.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            onClick={onClose}
            className="nav-overlay-link text-center font-sans text-[30px] font-bold leading-[1.15] text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
          >
            {link.name}
          </Link>
        ))}
        <Link
          href="/contact"
          onClick={() => {
            trackBookStrategyCall("mobile_menu");
            onClose();
          }}
          className="overlay-cta mt-6 inline-flex items-center justify-center rounded-xl bg-cobalt-gradient px-8 py-4 text-base font-semibold text-white shadow-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
        >
          Book a Strategy Call
        </Link>
      </div>
    </div>
  );
}
