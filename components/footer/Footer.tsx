'use client'

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { trackPhoneClick, trackEvent } from "@/lib/analytics"

const Footer = () => {
  const pathname = usePathname()
  const calendarYear = new Date().getFullYear()
  const currentYear =
    pathname?.startsWith('/services') ? Math.max(calendarYear, 2026) : calendarYear
  const { isNightMode } = useTheme()

  return (
    <footer 
      className="border-t"
      style={{
        background: isNightMode ? '#000000' : '#FAFAFA',
        borderColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image 
                src={isNightMode ? "/logo/logo-dark.svg" : "/logo/logo-light.svg"} 
                alt="Vizantir Logo" 
                width={140}
                height={28}
                priority
                className="h-5 md:h-7 w-auto transition-opacity duration-300"
              />
            </Link>
            <p 
              className="mb-4"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              Premium web design and development agency delivering websites that convert.
            </p>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="transition-all duration-300 hover:scale-110"
                style={{ 
                  color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFC64C'
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(255, 198, 76, 0.8))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B'
                  e.currentTarget.style.filter = 'none'
                }}
              >
                <Facebook size={20} />
              </a>
              <a 
                href="#" 
                className="transition-all duration-300 hover:scale-110"
                style={{ 
                  color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFC64C'
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(255, 198, 76, 0.8))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B'
                  e.currentTarget.style.filter = 'none'
                }}
              >
                <Twitter size={20} />
              </a>
              <a 
                href="#" 
                className="transition-all duration-300 hover:scale-110"
                style={{ 
                  color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFC64C'
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(255, 198, 76, 0.8))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B'
                  e.currentTarget.style.filter = 'none'
                }}
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="#" 
                className="transition-all duration-300 hover:scale-110"
                style={{ 
                  color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#FFC64C'
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(255, 198, 76, 0.8))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B'
                  e.currentTarget.style.filter = 'none'
                }}
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 
              className="font-bold mb-4"
              style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { name: 'Services', href: '/services' },
                { name: 'About Us', href: '/about' },
                // { name: 'Case Studies', href: '/case-studies' }, // Temporarily hidden
                // { name: 'Portfolio', href: '/portfolio' }, // Temporarily hidden
                { name: 'Careers', href: '/careers' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="transition-colors hover:opacity-80"
                    style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 
              className="font-bold mb-4"
              style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}
            >
              Resources
            </h4>
            <ul className="space-y-2">
              {[
                { name: 'Blog', href: '/blog' },
                { name: 'FAQ', href: '/faq' },
                // { name: 'Testimonials', href: '/testimonials' }, // Temporarily hidden
                { name: 'Sitemap', href: '/sitemap-page' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="transition-colors hover:opacity-80"
                    style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 
              className="font-bold mb-4"
              style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}
            >
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li 
                className="flex items-start gap-2"
                style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
              >
                <Mail size={18} className="mt-1 flex-shrink-0" />
                <span>
                  <a 
                    href="mailto:info@vizantir.com"
                    onClick={() => trackEvent('email_click', { event_category: 'contact', event_label: 'info@vizantir.com' })}
                    className="hover:opacity-80 transition-opacity"
                    style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
                  >
                    info@vizantir.com
                  </a>
                </span>
              </li>
              <li 
                className="flex items-start gap-2"
                style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
              >
                <Phone size={18} className="mt-1 flex-shrink-0" />
                <a href="tel:+17026046177" onClick={() => trackPhoneClick()} className="hover:opacity-80 transition-opacity">
                  +1 (702) 604-6177
                </a>
              </li>
              <li 
                className="flex items-start gap-2"
                style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
              >
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <span>Las Vegas, NV 89139</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="border-t pt-8"
          style={{ borderColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p 
              className="text-sm"
              style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
            >
              © {currentYear} Vizantir. All rights reserved.
            </p>
            <div className="flex gap-6">
              {[
                { name: 'Privacy Policy', href: '/privacy' },
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Cookie Policy', href: '/cookies' },
                { name: 'Copyright', href: '/copyright' },
              ].map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="text-sm transition-colors hover:opacity-80"
                  style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
