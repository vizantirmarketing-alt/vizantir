'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { trackFormSubmission, trackPhoneClick } from '@/lib/analytics'

export default function ContactPageClient() {
  const { isNightMode } = useTheme()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    budget: '',
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate form submission - replace with actual form handler
    await new Promise(resolve => setTimeout(resolve, 1500))
    trackFormSubmission('contact_form')
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  const services = [
    "New Website",
    "Website Redesign",
    "Platform Migration",
    "Custom Development",
    "Website Refresh",
    "Website Care / Retainer",
    "Not Sure Yet",
  ]

  const budgets = [
    "$10,000 – $20,000",
    "$20,000 – $40,000",
    "$40,000 – $70,000",
    "$70,000+",
    "Not Sure Yet",
  ]

  const inputStyle = {
    background: isNightMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
    color: isNightMode ? '#FFFFFF' : '#1A1A1A',
  }

  const labelStyle = {
    color: isNightMode ? 'rgba(255,255,255,0.8)' : '#4A4A4A'
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: isNightMode ? '#000000' : '#FAFAFA', transition: 'background-color 0.5s ease' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-4 max-w-lg"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(34, 197, 94, 0.15)' }}
          >
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
            Message Sent!
          </h1>
          <p className="text-lg mb-8" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
            Thank you for reaching out. We&apos;ll get back to you within 24 hours.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-300 hover:scale-105"
            style={{ background: '#FFC64C', color: '#1A1A1A', borderRadius: '8px' }}
          >
            Back to Home
          </Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: isNightMode ? '#000000' : '#FAFAFA', transition: 'background-color 0.5s ease' }}>
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
              Start the Conversation
            </h1>
            <p className="text-lg md:text-xl" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
              Tell me what you&apos;re working on. I&apos;ll let you know if we&apos;re a good fit and what the next step looks like
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            
            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2 space-y-8"
            >
              <div>
                <h2 className="text-2xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 198, 76, 0.15)' }}>
                      <svg className="w-6 h-6" style={{ color: '#FFC64C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>Email</p>
                      <a href="mailto:info@vizantir.com" className="transition-colors hover:opacity-80" style={{ color: '#FFC64C' }}>
                        info@vizantir.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 198, 76, 0.15)' }}>
                      <svg className="w-6 h-6" style={{ color: '#FFC64C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>Phone</p>
                      <a 
                        href="tel:+17022890758" 
                        onClick={trackPhoneClick}
                        className="transition-colors hover:opacity-80" 
                        style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#4A4A4A' }}
                      >
                        +1 (702) 289-0758
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255, 198, 76, 0.15)' }}>
                      <svg className="w-6 h-6" style={{ color: '#FFC64C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold mb-1" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>Location</p>
                      <p style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#4A4A4A' }}>
                        Las Vegas, NV 89139
                      </p>
                      <p className="text-sm mt-1" style={{ color: isNightMode ? 'rgba(255,255,255,0.5)' : '#888888' }}>
                        Remote-first studio serving clients nationwide
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="p-6 rounded-xl" style={{ background: isNightMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
                <h3 className="font-semibold mb-4" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>Business Hours</h3>
                <div className="space-y-2 text-sm" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#4A4A4A' }}>
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 6:00 PM PST</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>By appointment</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>Closed</span>
                  </div>
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <p className="text-sm" style={{ color: isNightMode ? 'rgba(255,255,255,0.8)' : '#4A4A4A' }}>
                  Average response time: <strong>Under 24 hours</strong>
                </p>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <div className="p-6 md:p-8 rounded-2xl" style={{ background: isNightMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF', border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`, boxShadow: isNightMode ? 'none' : '0 4px 24px rgba(0,0,0,0.06)' }}>
                <h2 className="text-2xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
                  Start Your Project
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={labelStyle}>Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                        style={inputStyle}
                        placeholder="John Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={labelStyle}>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                        style={inputStyle}
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={labelStyle}>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                        style={inputStyle}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={labelStyle}>Company Name</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                        style={inputStyle}
                        placeholder="Your Company"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={labelStyle}>Service Interested In *</label>
                      <select
                        name="service"
                        required
                        value={formData.service}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all appearance-none cursor-pointer"
                        style={inputStyle}
                      >
                        <option value="">Select a service</option>
                        {services.map((service, index) => (
                          <option key={index} value={service}>{service}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={labelStyle}>Project Budget</label>
                      <select
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all appearance-none cursor-pointer"
                        style={inputStyle}
                      >
                        <option value="">Select your budget</option>
                        {budgets.map((budget, index) => (
                          <option key={index} value={budget}>{budget}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={labelStyle}>Tell Us About Your Project *</label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all resize-none"
                      style={inputStyle}
                      placeholder="What are your goals? What challenges are you facing? Any specific requirements?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: '#FFC64C', color: '#1A1A1A' }}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center" style={{ color: isNightMode ? 'rgba(255,255,255,0.5)' : '#888888' }}>
                    By submitting this form, you agree to our{' '}
                    <Link href="/privacy" className="underline hover:opacity-80">Privacy Policy</Link>
                    {' '}and{' '}
                    <Link href="/terms" className="underline hover:opacity-80">Terms of Service</Link>.
                  </p>
                </form>
              </div>
            </motion.div>
      </div>
    </div>
      </section>
    </main>
  )
}
