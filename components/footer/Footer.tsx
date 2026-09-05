'use client'

import Link from "next/link"
import Image from "next/image"
import { Linkedin, Instagram, Mail, Phone, MapPin } from "lucide-react"
import { trackPhoneClick, trackEvent } from "@/lib/analytics"
import MadeInUSA from "@/components/ui/MadeInUSA"
import { America250 } from "@/components/footer/America250"

const Footer = () => {
  const calendarYear = new Date().getFullYear()
  const currentYear = Math.max(calendarYear, 2026)

  return (
    <footer 
      className="border-t"
      style={{
        background: 'var(--background)',
        borderColor: 'rgba(0,0,0,0.1)',
      }}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image 
                src="/logo/logo-light.svg" 
                alt="Vizantir Logo" 
                width={140}
                height={28}
                priority
                className="h-5 md:h-7 w-auto transition-opacity duration-300"
              />
            </Link>
            <p 
              className="mb-4 text-muted-foreground"
            >
              Premium website design studio for established businesses.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://www.linkedin.com/company/vizantir/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our LinkedIn"
                className="transition-all duration-300 hover:scale-110 text-muted-foreground"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--cobalt-primary)'
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(0, 112, 243, 0.8))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = ''
                  e.currentTarget.style.filter = 'none'
                }}
              >
                <Linkedin size={20} />
              </a>
              <a 
                href="https://www.instagram.com/vizantirdesignstudio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit our Instagram"
                className="transition-all duration-300 hover:scale-110 text-muted-foreground"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--cobalt-primary)'
                  e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(0, 112, 243, 0.8))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = ''
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
              className="font-bold mb-4 text-foreground"
            >
              Quick Links
            </h4>
            <ul className="space-y-2">
              {[
                { name: 'Services', href: '/services' },
                { name: 'Industries', href: '/industries' },
                { name: 'Technology', href: '/technology' },
                { name: 'About Us', href: '/about' },
                { name: 'Our Work', href: '/case-studies' },
                { name: 'Get Started', href: '/get-started' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="link-cobalt text-muted-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h4 
              className="font-bold mb-4 text-foreground"
            >
              Industries
            </h4>
            <ul className="space-y-2">
              {[
                { name: 'Hospitality Web Design', href: '/hospitality-web-design' },
                { name: 'Law Firm Web Design', href: '/law-firm-web-design' },
                { name: 'Commercial Real Estate Web Design', href: '/commercial-real-estate-web-design' },
                { name: 'Las Vegas Web Design', href: '/las-vegas-web-design' },
                { name: 'Website Redesign Las Vegas', href: '/website-redesign-las-vegas' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="link-cobalt text-muted-foreground"
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
              className="font-bold mb-4 text-foreground"
            >
              Resources
            </h4>
            <ul className="space-y-2">
              {[
                { name: 'Blog', href: '/blog' },
                { name: 'FAQ', href: '/faq' },
                // { name: 'Testimonials', href: '/testimonials' }, // Temporarily hidden
                { name: 'Next.js vs WordPress', href: '/nextjs-vs-wordpress' },
                { name: 'Landing Pages', href: '/landing-pages' },
                { name: 'Analytir', href: '/analytir' },
                { name: 'Sitemap', href: '/sitemap-page' },
              ].map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href} 
                    className="link-cobalt text-muted-foreground"
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
              className="font-bold mb-4 text-foreground"
            >
              Contact Us
            </h4>
            <ul className="space-y-3">
              <li 
                className="flex items-start gap-2 text-muted-foreground"
              >
                <Mail size={18} className="mt-1 flex-shrink-0" />
                <span>
                  <Link
                    href="/contact"
                    onClick={() => trackEvent('contact_click', { event_category: 'contact', event_label: 'footer_contact' })}
                    className="link-cobalt text-muted-foreground"
                  >
                    Contact
                  </Link>
                </span>
              </li>
              <li 
                className="flex items-start gap-2 text-muted-foreground"
              >
                <Phone size={18} className="mt-1 flex-shrink-0" />
                <a href="tel:+17022890758" onClick={() => trackPhoneClick()} className="link-cobalt">
                  +1 (702) 289-0758
                </a>
              </li>
              <li 
                className="flex items-start gap-2 text-muted-foreground"
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
          style={{ borderColor: 'rgba(0,0,0,0.1)' }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <p 
                className="text-sm text-meta"
              >
                © {currentYear} Vizantir. All rights reserved.
              </p>
              <MadeInUSA />
              <America250 />
            </div>
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
                  className="link-cobalt text-sm text-muted-foreground"
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
