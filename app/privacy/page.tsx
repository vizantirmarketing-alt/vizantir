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

export default function PrivacyPolicy() {
  const { isNightMode } = useTheme()

  const sections: Section[] = [
    {
      title: "Information We Collect",
      subsections: [
        {
          subtitle: "Personal Information",
          content: "We may collect personal information that you voluntarily provide, including:",
          list: [
            "Contact Information: Name, email address, phone number, business address",
            "Business Information: Company name, website, industry, job title",
            "Communication Records: Messages, inquiries, support requests",
            "Account Information: Login credentials, user preferences",
            "Payment Information: Billing address, payment method details"
          ]
        },
        {
          subtitle: "Automatically Collected Information",
          content: "We automatically collect certain information when you visit our website:",
          list: [
            "Device Information: IP address, browser type, operating system",
            "Usage Data: Pages visited, time spent, click patterns",
            "Location Data: General geographic location based on IP address",
            "Referral Information: Source of traffic to our website"
          ]
        },
        {
          subtitle: "Cookies and Tracking Technologies",
          content: "We use cookies, web beacons, and similar technologies to collect:",
          list: [
            "Website usage analytics",
            "User preferences and settings",
            "Marketing and advertising data",
            "Performance and functionality metrics"
          ]
        }
      ]
    },
    {
      title: "How We Use Your Information",
      subsections: [
        {
          subtitle: "Service Delivery",
          list: [
            "Provide and maintain our digital marketing services",
            "Process payments and manage accounts",
            "Communicate about services and projects",
            "Provide customer support and technical assistance"
          ]
        },
        {
          subtitle: "Business Operations",
          list: [
            "Analyze website traffic and user behavior",
            "Improve our services and user experience",
            "Develop new features and services",
            "Conduct market research and analysis"
          ]
        },
        {
          subtitle: "Marketing and Communications",
          list: [
            "Send newsletters and marketing materials",
            "Provide information about our services",
            "Conduct promotional campaigns",
            "Personalize content and advertisements"
          ]
        },
        {
          subtitle: "Legal and Security",
          list: [
            "Comply with legal obligations",
            "Protect against fraud and security threats",
            "Enforce our Terms and Conditions",
            "Resolve disputes and legal matters"
          ]
        }
      ]
    },
    {
      title: "Information Sharing and Disclosure",
      subsections: [
        {
          subtitle: "Service Providers",
          content: "We may share information with trusted third parties who assist us:",
          list: [
            "Analytics Providers: Google Analytics, website performance tools",
            "Marketing Platforms: Google Ads, Facebook, LinkedIn advertising",
            "Communication Tools: Email marketing services, CRM systems",
            "Payment Processors: Secure payment handling services",
            "Technical Services: Web hosting, security, and maintenance providers"
          ]
        },
        {
          subtitle: "Business Transfers",
          content: "Information may be transferred in connection with mergers, acquisitions, or sale of business assets."
        },
        {
          subtitle: "Legal Requirements",
          content: "We may disclose information when required by law or to:",
          list: [
            "Comply with legal processes or government requests",
            "Protect our rights, property, or safety",
            "Prevent fraud or illegal activities",
            "Enforce our agreements and policies"
          ]
        }
      ]
    },
    {
      title: "Data Retention",
      subsections: [
        {
          content: "We retain personal information only as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, resolve disputes, and enforce agreements.",
          subtitle: "Typical Retention Periods",
          list: [
            "Client Data: Duration of business relationship plus 7 years",
            "Marketing Data: 3 years from last interaction",
            "Website Analytics: 26 months (Google Analytics default)",
            "Communication Records: 3-7 years depending on type"
          ]
        }
      ]
    },
    {
      title: "Your Privacy Rights",
      subsections: [
        {
          subtitle: "Access and Portability",
          list: ["Request access to your personal information", "Receive a copy of your data in a portable format"]
        },
        {
          subtitle: "Correction and Updates",
          list: ["Correct inaccurate or incomplete information", "Update your preferences and settings"]
        },
        {
          subtitle: "Deletion and Erasure",
          list: ["Request deletion of your personal information", "Exercise 'right to be forgotten' where applicable"]
        },
        {
          subtitle: "Opt-Out and Consent",
          list: ["Unsubscribe from marketing communications", "Withdraw consent for data processing", "Opt out of targeted advertising"]
        }
      ]
    },
    {
      title: "Data Security",
      subsections: [
        {
          subtitle: "Technical Safeguards",
          list: [
            "Encryption of data in transit and at rest",
            "Secure servers and hosting environments",
            "Regular security updates and patches",
            "Access controls and authentication systems"
          ]
        },
        {
          subtitle: "Organizational Measures",
          list: [
            "Staff training on privacy and security",
            "Regular security audits and assessments",
            "Incident response procedures",
            "Data breach notification protocols"
          ]
        }
      ]
    },
    {
      title: "International Data Transfers",
      subsections: [
        {
          content: "If you are located outside the United States, please note that we may transfer your information to and process it in the United States, where privacy laws may differ from your jurisdiction.",
          subtitle: "Transfer Safeguards",
          list: ["Standard contractual clauses", "Privacy Shield frameworks (where applicable)", "Other legally recognized transfer mechanisms"]
        }
      ]
    },
    {
      title: "Children's Privacy",
      subsections: [
        {
          content: "Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete the information."
        }
      ]
    },
    {
      title: "California Privacy Rights (CCPA)",
      subsections: [
        {
          content: "If you are a California resident, you have additional rights:",
          list: [
            "Right to Know: Request information about personal information collected, used, or shared",
            "Right to Delete: Request deletion of personal information we have collected",
            "Right to Opt-Out: Opt out of the 'sale' of personal information to third parties",
            "Non-Discrimination: We will not discriminate against you for exercising your privacy rights"
          ]
        }
      ]
    },
    {
      title: "European Privacy Rights (GDPR)",
      subsections: [
        {
          content: "If you are in the European Economic Area, you have rights under GDPR including:",
          list: [
            "Access, rectification, and erasure",
            "Data portability and restriction of processing",
            "Objection to processing and automated decision-making",
            "Withdrawal of consent"
          ]
        },
        {
          subtitle: "Legal Basis for Processing",
          list: ["Contract performance", "Legitimate business interests", "Legal compliance", "Your consent"]
        }
      ]
    },
    {
      title: "Updates to This Privacy Policy",
      subsections: [
        {
          content: "We may update this Privacy Policy periodically to reflect changes in our information practices, legal requirements, business operations, and technology developments. Changes will be posted on this page with an updated effective date."
        }
      ]
    },
    {
      title: "Contact Information",
      subsections: [
        {
          content: "For questions about this Privacy Policy or our privacy practices:",
          contactEmail: "info@vizantir.com"
        }
      ]
    }
  ]

  return (
    <main className="min-h-screen" style={{ background: isNightMode ? '#000000' : '#FAFAFA', transition: 'background-color 0.5s ease' }}>
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>Privacy Policy</h1>
            <p className="text-lg" style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B' }}>Effective Date: January 1, 2025</p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-lg leading-relaxed" style={{ color: isNightMode ? 'rgba(255,255,255,0.8)' : '#4A4A4A' }}>
            Vizantir.com (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
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
                  {subsection.contactEmail && <a href={`mailto:${subsection.contactEmail}`} className="inline-block mt-2 font-medium transition-colors hover:opacity-80" style={{ color: '#FFC64C' }}>{subsection.contactEmail}</a>}
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

