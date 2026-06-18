'use client'

import { motion } from 'framer-motion'

export default function CopyrightNotice() {
  return (
    <main className="min-h-screen" style={{ background: '#FAF9F5', transition: 'background-color 0.5s ease' }}>
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Copyright Notice</h1>
            <p className="text-xl font-medium" style={{ color: '#4A4A4A' }}>Vizantir.com – All Rights Reserved</p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-lg leading-relaxed" style={{ color: '#4A4A4A' }}>
            © 2026 Vizantir.com. All rights reserved.
          </motion.p>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Image Copyright Protection */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Image Copyright Protection</h2>
            <p className="leading-relaxed" style={{ color: '#4A4A4A' }}>
              All images, photographs, graphics, illustrations, and visual content displayed on this website are the exclusive property of Vizantir.com and are protected by United States and international copyright laws.
            </p>
          </motion.div>

          {/* Prohibited Uses */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Prohibited Uses</h2>
            <p className="leading-relaxed mb-4" style={{ color: '#4A4A4A' }}>
              The following activities are strictly prohibited without express written permission:
            </p>
            <ul className="space-y-3 ml-6">
              {[
                "Copying, downloading, or saving any images from this website",
                "Reproducing or redistributing any visual content in any format",
                "Using any images for commercial or non-commercial purposes",
                "Modifying, editing, or creating derivative works from our content",
                "Displaying our images on other websites, social media platforms, or publications"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3" style={{ color: '#4A4A4A' }}>
                  <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--gold-primary)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Permission Requests */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Permission Requests</h2>
            <p className="leading-relaxed" style={{ color: '#4A4A4A' }}>
              If you wish to use any content from this website, you must obtain written permission in advance. Please contact us through our official channels to discuss licensing opportunities.
            </p>
          </motion.div>

          {/* Legal Enforcement */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Legal Enforcement</h2>
            <p className="leading-relaxed mb-4" style={{ color: '#4A4A4A' }}>
              Unauthorized use of any copyrighted material from this website may result in:
            </p>
            <ul className="space-y-3 ml-6">
              {[
                "Civil liability under applicable copyright laws",
                "Criminal prosecution where applicable",
                "Legal action to recover damages and attorney fees",
                "Immediate cease and desist demands"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-3" style={{ color: '#4A4A4A' }}>
                  <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--gold-primary)' }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Digital Rights Management */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Digital Rights Management</h2>
            <p className="leading-relaxed" style={{ color: '#4A4A4A' }}>
              Please note that all images on this website may contain digital watermarks and metadata for tracking and identification purposes.
            </p>
          </motion.div>

          {/* Contact Information */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: '#1A1A1A' }}>Contact Information</h2>
            <p className="leading-relaxed mb-3" style={{ color: '#4A4A4A' }}>
              For questions regarding copyright permissions or to report unauthorized use of our content, please contact:
            </p>
            <a href="mailto:info@vizantir.com" className="font-medium transition-colors hover:opacity-80" style={{ color: 'var(--gold-primary)' }}>
              info@vizantir.com
            </a>
          </motion.div>

          {/* Footer Note */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }} className="pt-8 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
            <p className="text-sm" style={{ color: '#888888' }}>
              This copyright notice is effective as of 2026 and applies to all content on Vizantir.com.
            </p>
          </motion.div>

        </div>
      </section>
    </main>
  )
}

