'use client'

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

export default function TermsAndConditions() {
  const sections: Section[] = [
    {
      title: "1. Services",
      subsections: [
        {
          subtitle: "1.1 Services",
          content: "Vizantir.com provides website design and development services, including website strategy, custom design, custom development, CMS integration, and website care and maintenance."
        },
        {
          subtitle: "1.2 Service Modifications",
          content: "We reserve the right to modify, suspend, or discontinue any service at any time without prior notice."
        }
      ]
    },
    {
      title: "2. Client Responsibilities",
      subsections: [
        {
          subtitle: "2.1 Information and Materials",
          content: "Clients must provide:",
          list: [
            "Accurate and complete business information",
            "Necessary access to accounts and platforms",
            "Timely feedback and approvals",
            "Required content, images, and materials"
          ]
        },
        {
          subtitle: "2.2 Compliance",
          content: "Clients are responsible for ensuring their business and content comply with all applicable laws and platform policies."
        }
      ]
    },
    {
      title: "3. Payment Terms",
      subsections: [
        {
          subtitle: "3.1 Fees and Billing",
          list: [
            "All fees are due in advance unless otherwise agreed in writing",
            "Monthly services are billed at the beginning of each month",
            "Project-based work requires 50% deposit before commencement",
            "Additional work outside the agreed scope will be billed separately"
          ]
        },
        {
          subtitle: "3.2 Late Payments",
          list: [
            "Late payments may incur a 1.5% monthly service charge",
            "Services may be suspended for accounts 30+ days overdue",
            "Collection costs and legal fees may be charged to delinquent accounts"
          ]
        },
        {
          subtitle: "3.3 Refunds",
          list: [
            "Setup fees and deposits are non-refundable",
            "Monthly fees are non-refundable once the service period begins",
            "Refunds for project work are at our sole discretion"
          ]
        }
      ]
    },
    {
      title: "4. Contract Terms",
      subsections: [
        {
          subtitle: "4.1 Service Agreements",
          list: [
            "Monthly services require 30-day written notice for cancellation",
            "Project contracts are binding until completion",
            "Changes to scope require written approval and may affect pricing"
          ]
        },
        {
          subtitle: "4.2 Termination",
          content: "Either party may terminate services with written notice as specified in the service agreement. Upon termination:",
          list: [
            "Client remains responsible for all charges incurred",
            "We will provide reasonable assistance with transition",
            "All work products become client property upon full payment"
          ]
        }
      ]
    },
    {
      title: "5. Intellectual Property",
      subsections: [
        { subtitle: "5.1 Client Content", content: "Clients retain ownership of their original content, trademarks, and proprietary materials." },
        { subtitle: "5.2 Work Product", content: "Creative work, strategies, and deliverables become client property upon full payment, except for our proprietary methods and tools." },
        { subtitle: "5.3 Third-Party Materials", content: "Any third-party materials used require appropriate licensing, which may be an additional cost." }
      ]
    },
    {
      title: "6. Confidentiality",
      subsections: [{ content: "We maintain strict confidentiality regarding client information, strategies, and business data. This obligation continues beyond the termination of services." }]
    },
    {
      title: "7. Performance and Results",
      subsections: [
        {
          subtitle: "7.1 No Guarantees",
          content: "While we strive for excellent results, we cannot guarantee:",
          list: ["Specific rankings, traffic, or conversion improvements", "Platform approval for ads or content", "Timeline adherence due to factors outside our control"]
        },
        {
          subtitle: "7.2 Third-Party Dependencies",
          content: "Performance may be affected by:",
          list: ["Search engine algorithm changes", "Social media platform policy updates", "Website technical issues", "Market conditions and competition"]
        }
      ]
    },
    {
      title: "8. Limitation of Liability",
      subsections: [
        { subtitle: "8.1 Liability Cap", content: "Our total liability for any claim shall not exceed the amount paid by the client in the 12 months preceding the claim." },
        {
          subtitle: "8.2 Excluded Damages",
          content: "We are not liable for:",
          list: ["Indirect, consequential, or punitive damages", "Lost profits or business opportunities", "Data loss or corruption", "Third-party actions or platform decisions"]
        }
      ]
    },
    {
      title: "9. Indemnification",
      subsections: [{
        content: "Clients agree to indemnify and hold us harmless from any claims arising from:",
        list: ["Content provided by the client", "Client's business practices or compliance failures", "Violation of these Terms by the client"]
      }]
    },
    {
      title: "10. Force Majeure",
      subsections: [{ content: "We are not liable for delays or failures due to circumstances beyond our control, including natural disasters, government actions, or technical failures." }]
    },
    {
      title: "11. Dispute Resolution",
      subsections: [
        { subtitle: "11.1 Governing Law", content: "These Terms are governed by the laws of Nevada, United States." },
        { subtitle: "11.2 Dispute Process", content: "Disputes will be resolved through:", list: ["Good faith negotiation", "Binding arbitration if negotiation fails", "Legal jurisdiction in Nevada courts"] }
      ]
    },
    {
      title: "12. General Provisions",
      subsections: [
        { subtitle: "12.1 Entire Agreement", content: "These Terms, along with any signed service agreements, constitute the entire agreement between parties." },
        { subtitle: "12.2 Modifications", content: "Terms may only be modified in writing and signed by both parties." },
        { subtitle: "12.3 Severability", content: "If any provision is deemed invalid, the remaining terms remain in full effect." },
        { subtitle: "12.4 Assignment", content: "We may assign these Terms to affiliates or successors. Clients may not assign without written consent." }
      ]
    },
    {
      title: "13. Contact Information",
      subsections: [{ content: "For questions about these Terms and Conditions, please contact:", contactEmail: "info@vizantir.com" }]
    }
  ]

  return (
    <main className="min-h-screen" style={{ background: '#FAF9F5', transition: 'background-color 0.5s ease' }}>
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">Terms and Conditions</h1>
            <p className="text-lg text-muted-foreground">Effective Date: January 1, 2025</p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-lg leading-relaxed text-body">
            Welcome to Vizantir.com. These Terms and Conditions (&quot;Terms&quot;) govern your use of our website and services. By accessing our website or engaging our services, you agree to be bound by these Terms.
          </motion.p>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          {sections.map((section, sectionIndex) => (
            <motion.div key={sectionIndex} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 + sectionIndex * 0.05 }} className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground">{section.title}</h2>
              {section.subsections.map((subsection, subIndex) => (
                <div key={subIndex} className="mb-6">
                  {subsection.subtitle && <h3 className="text-xl font-semibold mb-3 text-foreground">{subsection.subtitle}</h3>}
                  {subsection.content && <p className="leading-relaxed mb-3 text-body">{subsection.content}</p>}
                  {subsection.list && (
                    <ul className="space-y-2 ml-6">
                      {subsection.list.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3 text-body">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--cobalt-primary)' }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {subsection.contactEmail && <a href={`mailto:${subsection.contactEmail}`} className="inline-block mt-2 font-medium transition-colors hover:opacity-80" style={{ color: 'var(--cobalt-primary)' }}>{subsection.contactEmail}</a>}
                </div>
              ))}
            </motion.div>
          ))}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }} className="pt-8 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <p className="text-sm text-meta">Last Updated: January 1, 2025</p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

