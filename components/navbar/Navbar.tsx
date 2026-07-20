'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { trackBookStrategyCallIntent, trackCTAClick } from "@/lib/analytics";
import { mainNavLinks } from "@/data/navigation";

/** Paths that use logo + CTA only (no menu links). */
const MINIMAL_NAV_PATHS = new Set(["/law-firm-web-design"]);

type NavbarProps = {
  /** When true, hide all nav links; logo + Book a Strategy Call only. */
  minimal?: boolean;
};

const Navbar = ({ minimal }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isMinimal = minimal ?? MINIMAL_NAV_PATHS.has(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when switching into minimal mode
  useEffect(() => {
    if (isMinimal) {
      setIsMobileMenuOpen(false);
    }
  }, [isMinimal]);

  const handleStrategyCallClick = (location: string) => {
    if (isMinimal) {
      trackBookStrategyCallIntent(location);
    } else {
      trackCTAClick('get_started', location);
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 112, 243, 0.4),
                        0 0 40px rgba(0, 112, 243, 0.2),
                        0 0 60px rgba(0, 112, 243, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(0, 112, 243, 0.6),
                        0 0 60px rgba(0, 112, 243, 0.3),
                        0 0 80px rgba(0, 112, 243, 0.15);
          }
        }
        
        .glow-button {
          animation: pulse-glow 2s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        
        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 35px rgba(0, 112, 243, 0.7),
                      0 0 70px rgba(0, 112, 243, 0.4),
                      0 0 100px rgba(0, 112, 243, 0.2) !important;
        }
      `}</style>

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: isScrolled ? 'rgba(250, 249, 245, 0.18)' : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: isScrolled ? '1px solid rgba(0, 0, 0, 0.03)' : 'none',
          boxShadow: isScrolled ? '0 4px 24px rgba(0, 0, 0, 0.04)' : 'none',
          paddingTop: isScrolled ? '0.75rem' : '1.25rem',
          paddingBottom: isScrolled ? '0.75rem' : '1.25rem',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center cursor-pointer">
              {!mounted ? (
                <div className="h-5 md:h-7 w-24" />
              ) : (
                <Image 
                  src="/logo/logo-light.svg" 
                  alt="Vizantir Logo" 
                  width={140}
                  height={28}
                  priority
                  className="h-5 md:h-7 w-auto transition-opacity duration-300"
                />
              )}
            </Link>

            {/* Desktop Navigation — hidden in minimal mode */}
            {!isMinimal && (
              <div className="hidden xl:flex items-center gap-8">
                {mainNavLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    title={link.description}
                    className="relative text-sm font-semibold text-foreground transition-colors duration-200 hover:text-[#0070F3]"
                    style={{
                      color: pathname === link.path ? 'var(--cobalt-primary)' : undefined,
                    }}
                  >
                    {link.name}
                    {pathname === link.path && (
                      <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
                    )}
                  </Link>
                ))}
              </div>
            )}

            <div
              className={
                isMinimal
                  ? 'flex items-center gap-4'
                  : 'hidden xl:flex items-center gap-4'
              }
            >
              <Link
                href="/contact"
                onClick={() => handleStrategyCallClick(isMinimal ? 'navbar_minimal' : 'navbar')}
              >
                <button
                  type="button"
                  className="bg-cobalt-gradient px-5 py-2.5 sm:px-6 rounded-xl text-sm font-semibold text-white shadow-cobalt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
                >
                  Book a Strategy Call
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button — full nav only */}
            {!isMinimal && !isMobileMenuOpen && (
              <button
                className="xl:hidden z-50 relative text-foreground"
                aria-label="Open menu"
                aria-expanded={false}
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 8h16" />
                  <path d="M4 16h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Sheet — full nav only */}
      {!isMinimal && (
      <div
        className={`xl:hidden fixed top-0 left-0 right-0 z-[60] h-[100dvh] max-h-[100dvh] min-h-0 ${
          isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        inert={!isMobileMenuOpen ? true : undefined}
      >
        {/* Backdrop */}
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute inset-0"
          style={{
            opacity: isMobileMenuOpen ? 1 : 0,
            transition: 'opacity 500ms ease',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />

        {/* Sheet */}
        <div
          className="absolute inset-0 shadow-2xl flex flex-col min-h-0 overscroll-y-contain"
          style={{
            transform: isMobileMenuOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform',
            background: 'rgba(255, 255, 255, 1)',
          }}
        >
          {/* Header Row */}
          <div
            className="shrink-0 flex items-center justify-between px-6 pt-3 pb-3"
            style={{
              borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            {mounted && (
              <Image
                src="/logo/logo-light.svg"
                alt="Vizantir Logo"
                width={120}
                height={24}
                className="h-5 w-auto"
              />
            )}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{
                background: 'rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.06)',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-1 flex-col min-h-0 overflow-y-auto overscroll-contain px-6 pb-8">
            <div className="flex flex-1 flex-col justify-evenly short-landscape:justify-start short-landscape:gap-4 min-h-0">
              {mainNavLinks.map((link, idx) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`link-cobalt block py-3 sm:py-4 ${
                    idx !== mainNavLinks.length - 1 ? 'border-b border-border/40' : ''
                  } ${mounted && pathname === link.path ? 'text-cobalt-primary' : 'text-foreground'}`}
                >
                  <span className="text-xl sm:text-2xl font-medium">{link.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {mounted && (
            <div className="shrink-0 px-6 pt-4 pb-6 space-y-4 border-t border-border/40 bg-white">
              <Link
                href="/contact"
                onClick={() => {
                  trackCTAClick('get_started', 'navbar');
                  setIsMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center rounded-xl py-4 text-base font-semibold bg-cobalt-gradient text-white shadow-cobalt transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070F3]/40 focus-visible:ring-offset-2"
              >
                Book a Strategy Call
              </Link>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
};

export default Navbar;
