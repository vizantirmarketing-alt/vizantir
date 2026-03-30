'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface Subsection {
  subtitle?: string
  content?: string
  list?: string[]
  contactEmail?: string
  phone?: string
}

interface Section {
  title: string
  subsections: Subsection[]
}

export default function CookiePolicy() {
  const { isNightMode } = useTheme()

  const sections: Section[] = [
    {
      title: "What Are Cookies?",
      subsections: [
        {
          content: "Cookies are small text files that are placed on your device when you visit a website. They help websites remember your preferences, improve your browsing experience, and provide analytics about website usage."
        }
      ]
    },
    {
      title: "Types of Cookies We Use",
      subsections: [
        {
          subtitle: "1. Essential Cookies",
          content: "These cookies are necessary for our website to function properly and cannot be disabled:",
          list: [
            "Session Cookies: Maintain your session while browsing",
            "Security Cookies: Protect against fraudulent activity",
            "Load Balancing: Ensure optimal website performance"
          ]
        },
        {
          subtitle: "2. Performance and Analytics Cookies",
          content: "These cookies help us understand how visitors interact with our website:",
          list: [
            "Google Analytics: Tracks website traffic and user behavior",
            "Page Load Times: Monitors website performance",
            "Error Tracking: Identifies and fixes technical issues"
          ]
        },
        {
          subtitle: "3. Functionality Cookies",
          content: "These cookies enhance your browsing experience:",
          list: [
            "Preference Settings: Remember your language and regional preferences",
            "Form Data: Save information you've entered in contact forms",
            "Chat Features: Enable live chat functionality"
          ]
        },
        {
          subtitle: "4. Marketing and Advertising Cookies",
          content: "These cookies are used for marketing purposes:",
          list: [
            "Google Ads: Track ad performance and conversions",
            "Facebook Pixel: Measure advertising effectiveness",
            "Retargeting: Show relevant ads on other websites",
            "Lead Tracking: Monitor conversion and lead generation"
          ]
        },
        {
          subtitle: "5. Social Media Cookies",
          content: "These cookies enable social media features:",
          list: [
            "Social Sharing: Allow sharing content on social platforms",
            "Social Login: Enable login through social media accounts",
            "Embedded Content: Display social media feeds or posts"
          ]
        }
      ]
    },
    {
      title: "Third-Party Cookies",
      subsections: [
        {
          subtitle: "Analytics Services",
          list: [
            "Google Analytics: Web analytics service",
            "Google Tag Manager: Tag management system",
            "Hotjar: User behavior analytics"
          ]
        },
        {
          subtitle: "Marketing Platforms",
          list: [
            "Google Ads: Advertising platform",
            "Facebook: Social media advertising",
            "LinkedIn: Professional network advertising",
            "Microsoft Advertising: Bing advertising platform"
          ]
        },
        {
          subtitle: "Communication Tools",
          list: [
            "Live Chat Software: Customer support tools",
            "Email Marketing: Newsletter and email tracking",
            "CRM Integration: Customer relationship management"
          ]
        }
      ]
    },
    {
      title: "How We Use Cookies",
      subsections: [
        {
          content: "We use cookies to:",
          list: [
            "Ensure our website functions properly",
            "Analyze website traffic and user behavior",
            "Improve user experience and website performance",
            "Deliver personalized content and advertisements",
            "Measure the effectiveness of our marketing campaigns",
            "Provide customer support through chat features",
            "Remember your preferences and settings"
          ]
        }
      ]
    },
    {
      title: "Cookie Duration",
      subsections: [
        {
          subtitle: "Session Cookies",
          content: "Temporary cookies that expire when you close your browser."
        },
        {
          subtitle: "Persistent Cookies",
          content: "Remain on your device for a set period or until manually deleted:",
          list: [
            "Short-term: 24 hours to 30 days",
            "Medium-term: 30 days to 1 year",
            "Long-term: 1-2 years (primarily for analytics and preferences)"
          ]
        }
      ]
    },
    {
      title: "Managing Your Cookie Preferences",
      subsections: [
        {
          subtitle: "Browser Settings",
          content: "You can control cookies through your browser settings in Chrome, Firefox, Safari, or Edge under Privacy/Security settings."
        },
        {
          subtitle: "Opt-Out Options",
          content: "You can opt out of specific tracking:",
          list: [
            "Google Analytics: Google Analytics Opt-out",
            "Google Ads: Ad Settings",
            "Facebook: Ad Preferences"
          ]
        },
        {
          subtitle: "Cookie Consent Management",
          content: "We provide a cookie consent banner that allows you to:",
          list: [
            "Accept all cookies",
            "Accept only essential cookies",
            "Customize your cookie preferences",
            "Withdraw consent at any time"
          ]
        }
      ]
    },
    {
      title: "Impact of Disabling Cookies",
      subsections: [
        {
          content: "Disabling cookies may affect your website experience:",
          list: [
            "Some features may not work properly",
            "You may need to re-enter information repeatedly",
            "Personalized content may not be available",
            "We cannot remember your preferences"
          ]
        }
      ]
    },
    {
      title: "Data Protection and Privacy",
      subsections: [
        { subtitle: "Data Security", content: "We implement appropriate security measures to protect cookie data." },
        { subtitle: "Data Retention", content: "Cookie data is retained only as long as necessary for the stated purposes." },
        { subtitle: "International Transfers", content: "Some third-party services may transfer data internationally in compliance with applicable privacy laws." }
      ]
    },
    {
      title: "Legal Compliance",
      subsections: [
        {
          content: "This Cookie Policy complies with:",
          list: [
            "General Data Protection Regulation (GDPR)",
            "California Consumer Privacy Act (CCPA)",
            "Other applicable privacy laws"
          ]
        }
      ]
    },
    {
      title: "Children's Privacy",
      subsections: [
        {
          content: "Our website is not intended for children under 18, and we do not knowingly collect personal information from children through cookies."
        }
      ]
    },
    {
      title: "Updates to This Policy",
      subsections: [
        {
          content: "We may update this Cookie Policy periodically. Changes will be posted on this page with an updated effective date. We encourage you to review this policy regularly."
        }
      ]
    },
    {
      title: "Contact Us",
      subsections: [
        {
          content: "If you have questions about our Cookie Policy or privacy practices, please contact us:",
          contactEmail: "info@vizantir.com",
          phone: "(702) 289-0758"
        }
      ]
    }
  ]

  return (
    <main className="min-h-screen" style={{ background: isNightMode ? '#000000' : '#FAFAFA', transition: 'background-color 0.5s ease' }}>
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>Cookie Policy</h1>
            <p className="text-lg" style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B' }}>Effective Date: January 1, 2025</p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-lg leading-relaxed" style={{ color: isNightMode ? 'rgba(255,255,255,0.8)' : '#4A4A4A' }}>
            This Cookie Policy explains how Vizantir.com (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) uses cookies and similar tracking technologies when you visit our website.
          </motion.p>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          {sections.map((section, sectionIndex) => (
            <motion.div key={sectionIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 + sectionIndex * 0.05 }} className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>{section.title}</h2>
              {section.subsections.map((subsection, subIndex) => (
                <div key={subIndex} className="mb-6">
                  {subsection.subtitle && <h3 className="text-xl font-semibold mb-3" style={{ color: isNightMode ? 'rgba(255,255,255,0.9)' : '#2A2A2A' }}>{subsection.subtitle}</h3>}
                  {subsection.content && <p className="leading-relaxed mb-3" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#4A4A4A' }}>{subsection.content}</p>}
                  {subsection.list && (
                    <ul className="space-y-2 ml-6">
                      {subsection.list.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#4A4A4A' }}>
                          <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#FFC64C' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {subsection.contactEmail && (
                    <div className="mt-3">
                      <a href={`mailto:${subsection.contactEmail}`} className="font-medium transition-colors hover:opacity-80 block" style={{ color: '#FFC64C' }}>{subsection.contactEmail}</a>
                      {subsection.phone && <p className="mt-1" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#4A4A4A' }}>{subsection.phone}</p>}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="pt-8 border-t" style={{ borderColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
            <p className="text-sm" style={{ color: isNightMode ? 'rgba(255,255,255,0.5)' : '#888888' }}>Last Updated: January 1, 2025</p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

