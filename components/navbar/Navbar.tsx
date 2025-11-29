'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isNightMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "How We Work", path: "/how-we-work" },
    { name: "Portfolio", path: "/case-studies" },
    { name: "Blog", path: "/blog" },
    { name: "Contact Us", path: "/contact" },
  ];

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
            ? (isNightMode 
                ? 'rgba(10, 10, 10, 0.12)'
                : 'rgba(250, 250, 250, 0.18)')
            : 'transparent',
          backdropFilter: isScrolled ? 'blur(14px) saturate(180%)' : 'none',
          WebkitBackdropFilter: isScrolled ? 'blur(14px) saturate(180%)' : 'none',
          borderBottom: isScrolled
            ? (isNightMode
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
            <Link href="/" className="flex items-center transition-opacity duration-300 hover:opacity-80">
              <img 
                src={isNightMode ? "/logo/logo-dark.svg" : "/logo/logo-light.svg"} 
                alt="Vizantir Logo" 
                className="h-5 md:h-7 w-auto transition-opacity duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="relative text-sm font-medium transition-all duration-300 hover:opacity-80"
                  style={{
                    color: pathname === link.path 
                      ? '#FFC64C'  // Active link = gold
                      : isNightMode 
                        ? '#F8F8F8'  // Inactive in dark mode = white
                        : '#1A1A1A',  // Inactive in light mode = black
                  }}
                >
                  {link.name}
                  {pathname === link.path && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
                  )}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4">
              {/* Theme Toggle */}
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
                      background: isNightMode ? "#f1f5f9" : "#FFFFFF",
                    }}
                  />
                </div>
              </button>

              <Link href="/contact">
                <button
                  className="glow-button px-6 py-2.5 rounded-lg font-semibold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #FFC64C 0%, #FFB84D 100%)',
                    color: '#1A1A1A',
                    border: 'none',
                  }}
                >
                  Get Started
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="lg:hidden" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div 
              className="lg:hidden mt-4 pb-4 pt-4 rounded-lg"
              style={{
                background: isNightMode 
                  ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.75) 100%)'
                  : 'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.75) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isNightMode 
                  ? '1px solid rgba(255, 255, 255, 0.1)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isNightMode 
                  ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className="block py-2 px-4 text-sm font-medium transition-colors hover:opacity-80"
                  style={{
                    color: pathname === link.path 
                      ? '#FFC64C'  // Active link = gold
                      : isNightMode 
                        ? '#F8F8F8'  // Inactive in dark mode = white
                        : '#1A1A1A',  // Inactive in light mode = black
                    background: pathname === link.path 
                      ? (isNightMode ? 'rgba(255, 198, 76, 0.1)' : 'rgba(255, 198, 76, 0.1)')
                      : 'transparent',
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Mobile Theme Toggle */}
              <div className="flex items-center justify-center gap-3 py-3 px-4">
                <span className="text-sm" style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}>
                  {isNightMode ? 'Dark' : 'Light'}
                </span>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm transition-all duration-300"
                  style={{
                    background: isNightMode ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    border: isNightMode ? '1px solid rgba(148, 163, 184, 0.4)' : '1px solid rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {isNightMode ? <Moon size={16} style={{ color: '#94a3b8' }} /> : <Sun size={16} style={{ color: '#1A1A1A' }} />}
                  <div 
                    className="relative w-8 h-4 rounded-full transition-all duration-300"
                    style={{
                      background: isNightMode ? 'linear-gradient(135deg, #1e293b, #334155)' : 'linear-gradient(135deg, #FFC64C, #FFB84D)',
                    }}
                  >
                    <div 
                      className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 shadow-md"
                      style={{
                        left: isNightMode ? '1rem' : '0.125rem',
                        background: isNightMode ? '#f1f5f9' : '#FFFFFF',
                      }}
                    />
                  </div>
                </button>
              </div>
              
              <div className="mt-4 px-4">
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)}>
                  <button
                    className="glow-button w-full px-6 py-2.5 rounded-lg font-semibold text-sm"
                    style={{
                      background: 'linear-gradient(135deg, #FFC64C 0%, #FFB84D 100%)',
                      color: '#1A1A1A',
                      border: 'none',
                    }}
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
