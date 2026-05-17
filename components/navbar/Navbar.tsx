'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { trackCTAClick } from "@/lib/analytics";
import { mainNavLinks } from "@/data/navigation";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isNightMode, toggleTheme } = useTheme();

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

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 198, 76, 0.4),
                        0 0 40px rgba(255, 198, 76, 0.2),
                        0 0 60px rgba(255, 198, 76, 0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 198, 76, 0.6),
                        0 0 60px rgba(255, 198, 76, 0.3),
                        0 0 80px rgba(255, 198, 76, 0.15);
          }
        }
        
        .glow-button {
          animation: pulse-glow 2s ease-in-out infinite;
          transition: all 0.3s ease;
        }
        
        .glow-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 35px rgba(255, 198, 76, 0.7),
                      0 0 70px rgba(255, 198, 76, 0.4),
                      0 0 100px rgba(255, 198, 76, 0.2) !important;
        }
      `}</style>

      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: isScrolled
            ? (!mounted
                ? 'rgba(10, 10, 10, 0.98)'
                : isNightMode
                  ? 'rgba(10, 10, 10, 0.12)'
                  : 'rgba(250, 250, 250, 0.18)')
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(20px) saturate(180%)' : 'none',
          borderBottom: isScrolled
            ? (!mounted
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : isNightMode
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.03)')
            : 'none',
          boxShadow: isScrolled ? '0 4px 24px rgba(0, 0, 0, 0.04)' : 'none',
          paddingTop: isScrolled ? '0.75rem' : '1.25rem',
          paddingBottom: isScrolled ? '0.75rem' : '1.25rem',
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center cursor-pointer transition-opacity duration-300 hover:opacity-80">
              {!mounted ? (
                <div className="h-5 md:h-7 w-24" />
              ) : (
                <Image 
                  src={isNightMode ? "/logo/logo-dark.svg" : "/logo/logo-light.svg"} 
                  alt="Vizantir Logo" 
                  width={140}
                  height={28}
                  priority
                  className="h-5 md:h-7 w-auto transition-opacity duration-300"
                />
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden xl:flex items-center gap-8">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  title={link.description}
                  className="relative text-sm font-medium transition-all duration-300 hover:opacity-80"
                  style={{
                    color: pathname === link.path 
                      ? '#FFC64C'
                      : !mounted
                        ? '#F8F8F8'
                        : isNightMode 
                          ? '#F8F8F8'
                          : '#1A1A1A',
                  }}
                >
                  {link.name}
                  {pathname === link.path && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden xl:flex items-center gap-4">
              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  style={{
                    background: isNightMode ? "rgba(30, 41, 59, 0.6)" : "rgba(255, 255, 255, 0.6)",
                    border: isNightMode ? "1px solid rgba(148, 163, 184, 0.3)" : "1px solid rgba(0, 0, 0, 0.1)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {isNightMode ? (
                    <Moon size={16} style={{ color: "#94a3b8" }} />
                  ) : (
                    <Sun size={16} style={{ color: "#1A1A1A" }} />
                  )}
                  <div
                    className="relative w-8 h-4 rounded-full transition-all duration-300"
                    style={{
                      background: isNightMode
                        ? "linear-gradient(135deg, #1e293b, #334155)"
                        : "linear-gradient(135deg, #FFC64C, #FFB84D)",
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 shadow-md"
                      style={{
                        left: isNightMode ? "1rem" : "0.125rem",
                        background: isNightMode ? "#FAFAFA" : "#000000",
                      }}
                    />
                  </div>
                </button>
              )}

              <Link href="/contact" onClick={() => trackCTAClick('get_started', 'navbar')}>
                <button
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-[#1A1A1A] transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #FFC64C 0%, #FFB84D 100%)',
                    color: '#1A1A1A',
                    boxShadow: '0 8px 30px rgba(255, 198, 76, 0.3)',
                  }}
                >
                  Book a Strategy Call
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            {!isMobileMenuOpen && (
              <button
                className="xl:hidden z-50 relative"
                aria-label="Open menu"
                aria-expanded={false}
                onClick={() => setIsMobileMenuOpen(true)}
                style={{ color: !mounted ? '#F7F7F7' : isNightMode ? '#F7F7F7' : '#1A1A1A' }}
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

      {/* Mobile Bottom Sheet */}
      <div
        className={`xl:hidden fixed top-0 left-0 right-0 z-[60] h-[100dvh] max-h-[100dvh] min-h-0 ${
          isMobileMenuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!isMobileMenuOpen}
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
            background: !mounted
              ? 'rgba(10, 10, 10, 1)'
              : isNightMode
                ? 'rgba(10, 10, 10, 1)'
                : 'rgba(255, 255, 255, 1)',
          }}
        >
          {/* Header Row */}
          <div
            className="shrink-0 flex items-center justify-between px-6 pt-3 pb-3"
            style={{
              borderBottom: !mounted
                ? '1px solid rgba(255, 255, 255, 0.08)'
                : isNightMode
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : '1px solid rgba(0, 0, 0, 0.06)',
            }}
          >
            {mounted && (
              <Image
                src={isNightMode ? '/logo/logo-dark.svg' : '/logo/logo-light.svg'}
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
                background: !mounted
                  ? 'rgba(255, 255, 255, 0.05)'
                  : isNightMode
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.04)',
                border: !mounted
                  ? '1px solid rgba(255, 255, 255, 0.08)'
                  : isNightMode
                    ? '1px solid rgba(255, 255, 255, 0.08)'
                    : '1px solid rgba(0, 0, 0, 0.06)',
                color: !mounted
                  ? '#F7F7F7'
                  : isNightMode
                    ? '#F7F7F7'
                    : '#1A1A1A',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain px-6">
            <div className="min-h-full flex flex-col justify-center">
              {mainNavLinks.map((link, idx) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-3 transition-all duration-300"
                  style={{
                    borderBottom:
                      idx === mainNavLinks.length - 1
                        ? 'none'
                        : !mounted
                          ? '1px solid rgba(255, 255, 255, 0.06)'
                          : isNightMode
                            ? '1px solid rgba(255, 255, 255, 0.06)'
                            : '1px solid rgba(0, 0, 0, 0.04)',
                    color:
                      pathname === link.path
                        ? '#FFC64C'
                        : !mounted
                          ? '#F8F8F8'
                          : isNightMode
                            ? '#F8F8F8'
                            : '#1A1A1A',
                  }}
                >
                  <span className="text-lg font-medium">{link.name}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="shrink-0 px-6 pb-5 pt-3 space-y-2.5">
            {/* Primary CTA */}
            <Link
              href="/contact"
              className="block w-full max-w-sm mx-auto"
              onClick={() => {
                setIsMobileMenuOpen(false)
                trackCTAClick('get_started', 'mobile_menu')
              }}
            >
              <button
                className="w-full rounded-xl px-8 py-3 text-base font-medium text-[#1A1A1A] transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, #FFC64C 0%, #FFB84D 100%)',
                  color: '#1A1A1A',
                  boxShadow: '0 8px 30px rgba(255, 198, 76, 0.3)',
                }}
              >
                Book a Strategy Call
              </button>
            </Link>

            {/* Theme Toggle — centered below CTAs */}
            {mounted && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300"
                  style={{
                    background: isNightMode ? 'rgba(30, 41, 59, 0.6)' : 'rgba(0, 0, 0, 0.05)',
                    border: isNightMode ? '1px solid rgba(148, 163, 184, 0.3)' : '1px solid rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Sun
                    size={18}
                    style={{
                      color: !isNightMode ? '#FFC64C' : '#64748b',
                      transition: 'color 0.3s ease',
                    }}
                  />
                  <div
                    className="relative w-10 h-5 rounded-full transition-all duration-300"
                    style={{
                      background: isNightMode
                        ? 'linear-gradient(135deg, #1e293b, #334155)'
                        : 'linear-gradient(135deg, #FFC64C, #FFB84D)',
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-md"
                      style={{
                        left: isNightMode ? '1.375rem' : '0.125rem',
                        background: isNightMode ? '#FAFAFA' : '#1A1A1A',
                      }}
                    />
                  </div>
                  <Moon
                    size={18}
                    style={{
                      color: isNightMode ? '#FFC64C' : '#64748b',
                      transition: 'color 0.3s ease',
                    }}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;