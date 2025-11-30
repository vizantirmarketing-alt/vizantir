'use client'

import { use } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { notFound } from 'next/navigation'

// Service data
const services = {
  'seo': {
    title: "Search Engine Optimization (SEO)",
    subtitle: "Dominate Search Rankings & Drive Organic Traffic",
    description: "Our data-driven SEO strategies help businesses achieve sustainable growth through higher search rankings, increased organic traffic, and better conversion rates.",
    heroStats: [
      { value: "93%", label: "of online experiences begin with search" },
      { value: "75%", label: "of users never scroll past page 1" },
      { value: "14.6%", label: "close rate for SEO leads vs 1.7% outbound" }
    ],
    whatWeOffer: [
      {
        title: "Technical SEO",
        description: "Site speed optimization, mobile-friendliness, crawlability, structured data, and Core Web Vitals improvements to ensure search engines can properly index your site."
      },
      {
        title: "On-Page SEO",
        description: "Keyword research, content optimization, meta tags, internal linking, and content structure to help your pages rank for target keywords."
      },
      {
        title: "Off-Page SEO",
        description: "White-hat link building, digital PR, brand mentions, and authority building to increase your domain's trust and ranking power."
      },
      {
        title: "Local SEO",
        description: "Google Business Profile optimization, local citations, review management, and location-based targeting for businesses serving specific areas."
      },
      {
        title: "Content Strategy",
        description: "Keyword-driven content planning, blog strategy, pillar pages, and content clusters that establish topical authority."
      },
      {
        title: "SEO Audits & Reporting",
        description: "Comprehensive site audits, competitor analysis, monthly performance reports, and actionable recommendations."
      }
    ],
    process: [
      { step: "1", title: "Discovery & Audit", description: "We analyze your current SEO performance, identify issues, and research your competitors." },
      { step: "2", title: "Strategy Development", description: "We create a custom SEO roadmap based on your goals, industry, and competitive landscape." },
      { step: "3", title: "Implementation", description: "Our team executes technical fixes, content optimization, and link building campaigns." },
      { step: "4", title: "Monitor & Optimize", description: "We track rankings, traffic, and conversions, continuously refining the strategy for better results." }
    ],
    faqs: [
      { q: "How long does SEO take to show results?", a: "SEO is a long-term strategy. Most clients see initial improvements in 3-4 months, with significant results in 6-12 months. The timeline depends on your current site health, competition level, and the aggressiveness of the strategy." },
      { q: "Do you guarantee first page rankings?", a: "No reputable SEO agency can guarantee specific rankings. Google's algorithm considers 200+ factors. We guarantee implementing proven best practices and transparent reporting on progress." },
      { q: "What's the difference between SEO and PPC?", a: "SEO builds organic traffic over time through content and optimization—results are sustainable but take longer. PPC provides immediate visibility through paid ads but stops when you stop paying. We recommend combining both for optimal results." },
      { q: "How do you measure SEO success?", a: "We track keyword rankings, organic traffic, conversion rates, domain authority, backlink quality, and most importantly—leads and revenue generated from organic search." }
    ]
  },
  'ppc': {
    title: "PPC Advertising & Paid Media",
    subtitle: "Maximize ROI with Data-Driven Paid Campaigns",
    description: "Get immediate visibility and qualified leads with strategically managed pay-per-click campaigns across Google Ads, Meta, LinkedIn, and more.",
    heroStats: [
      { value: "200%", label: "average ROI on Google Ads" },
      { value: "65%", label: "of high-intent searches click on ads" },
      { value: "50%", label: "more likely to purchase from PPC visitors" }
    ],
    whatWeOffer: [
      {
        title: "Google Ads Management",
        description: "Search, Display, Shopping, and YouTube campaigns optimized for maximum return on ad spend (ROAS)."
      },
      {
        title: "Meta Advertising",
        description: "Facebook and Instagram ads with precise audience targeting, retargeting, and lookalike audiences."
      },
      {
        title: "LinkedIn Ads",
        description: "B2B lead generation through sponsored content, InMail campaigns, and professional audience targeting."
      },
      {
        title: "Landing Page Optimization",
        description: "High-converting landing pages designed to maximize your ad spend and improve Quality Scores."
      },
      {
        title: "Remarketing Campaigns",
        description: "Re-engage website visitors across platforms to bring them back and convert."
      },
      {
        title: "Analytics & Attribution",
        description: "Advanced tracking, conversion attribution, and ROI reporting so you know exactly what's working."
      }
    ],
    process: [
      { step: "1", title: "Account Audit", description: "We analyze your existing campaigns or research your market to identify opportunities." },
      { step: "2", title: "Strategy & Setup", description: "We build campaign structure, create ad copy, and set up tracking infrastructure." },
      { step: "3", title: "Launch & Test", description: "We launch campaigns with A/B testing to find the best-performing combinations." },
      { step: "4", title: "Optimize & Scale", description: "We continuously optimize bids, audiences, and creative to improve ROAS and scale winners." }
    ],
    faqs: [
      { q: "How much should I budget for PPC?", a: "It depends on your industry and goals. We recommend starting with at least $1,500-3,000/month in ad spend plus management fees to gather enough data for optimization. We'll help you determine the right budget based on your target cost per acquisition." },
      { q: "How quickly will I see results from PPC?", a: "Unlike SEO, PPC delivers immediate results. You can start getting traffic and leads within days of launching. However, optimization for best results typically takes 2-3 months." },
      { q: "Which platform should I advertise on?", a: "It depends on your audience. Google Ads works for high-intent searches. Meta is great for awareness and B2C. LinkedIn excels for B2B. We'll recommend the best mix based on your business." },
      { q: "What's a good ROAS?", a: "A good ROAS varies by industry, but generally 3:1 to 5:1 is considered healthy. We'll establish benchmarks based on your margins and goals." }
    ]
  },
  'web-design': {
    title: "Web Design & Development",
    subtitle: "Conversion-Focused Websites That Drive Results",
    description: "We build modern, fast, SEO-optimized websites designed to convert visitors into customers. No WordPress templates—custom designs built for your brand.",
    heroStats: [
      { value: "94%", label: "of first impressions are design-related" },
      { value: "88%", label: "won't return after bad UX experience" },
      { value: "2.5s", label: "is max load time before users bounce" }
    ],
    whatWeOffer: [
      {
        title: "Custom Website Design",
        description: "Bespoke designs tailored to your brand—no templates. Modern aesthetics that set you apart from competitors."
      },
      {
        title: "Next.js Development",
        description: "Lightning-fast websites built with modern React/Next.js technology for superior performance and SEO."
      },
      {
        title: "E-Commerce Solutions",
        description: "Shopify, WooCommerce, or custom e-commerce builds optimized for conversions and user experience."
      },
      {
        title: "Mobile-First Design",
        description: "Responsive designs that look and perform beautifully on all devices, prioritizing mobile users."
      },
      {
        title: "Conversion Rate Optimization",
        description: "Strategic layouts, CTAs, and user flows designed to turn visitors into leads and customers."
      },
      {
        title: "Ongoing Maintenance",
        description: "Security updates, performance monitoring, backups, and content updates to keep your site running smoothly."
      }
    ],
    process: [
      { step: "1", title: "Discovery & Strategy", description: "We learn your business goals, audience, and brand to inform the design direction." },
      { step: "2", title: "Design & Wireframes", description: "We create wireframes and visual designs for your approval before development begins." },
      { step: "3", title: "Development", description: "We build your site with clean code, SEO best practices, and performance optimization." },
      { step: "4", title: "Launch & Support", description: "We thoroughly test, launch your site, and provide ongoing support and maintenance." }
    ],
    faqs: [
      { q: "How much does a website cost?", a: "Custom websites range from $5,000-$25,000+ depending on complexity, features, and pages. We provide detailed quotes after understanding your requirements." },
      { q: "How long does it take to build a website?", a: "Typically 4-8 weeks for a standard business website. E-commerce and complex sites may take 8-12 weeks. We'll provide a timeline during the proposal phase." },
      { q: "Do you use WordPress?", a: "We specialize in Next.js for maximum performance and SEO. However, we can work with WordPress if it better suits your needs for content management." },
      { q: "Will my website be SEO-friendly?", a: "Absolutely. Every site we build follows SEO best practices including fast load times, clean code, proper heading structure, meta tags, and mobile optimization." }
    ]
  },
  'aeo': {
    title: "Answer Engine Optimization (AEO)",
    subtitle: "Get Found in AI Search Results & Voice Assistants",
    description: "Future-proof your business for the AI age. We optimize your content to appear in ChatGPT, Google AI Overviews, voice search, and featured snippets.",
    heroStats: [
      { value: "40%", label: "of searches now show AI Overviews" },
      { value: "50%", label: "of searches will be voice by 2025" },
      { value: "8x", label: "more traffic from featured snippets" }
    ],
    whatWeOffer: [
      {
        title: "AI Overview Optimization",
        description: "Structure your content to be cited in Google's AI Overviews and gain visibility in the new search landscape."
      },
      {
        title: "Featured Snippet Targeting",
        description: "Optimize content format and structure to capture Position Zero and featured snippet placements."
      },
      {
        title: "Voice Search Optimization",
        description: "Natural language optimization for Alexa, Siri, Google Assistant, and other voice search platforms."
      },
      {
        title: "LLM Visibility",
        description: "Get your brand mentioned in ChatGPT, Claude, Perplexity, and other large language models."
      },
      {
        title: "FAQ & Schema Markup",
        description: "Structured data implementation to help AI systems understand and cite your content."
      },
      {
        title: "Conversational Content",
        description: "Content written to answer questions directly in the format AI systems prefer to cite."
      }
    ],
    process: [
      { step: "1", title: "AI Visibility Audit", description: "We assess how your brand currently appears in AI search results and identify opportunities." },
      { step: "2", title: "Content Gap Analysis", description: "We find questions your audience asks that AI systems need answers for." },
      { step: "3", title: "Optimization & Creation", description: "We restructure existing content and create new content optimized for AI citation." },
      { step: "4", title: "Monitor & Adapt", description: "We track AI mentions and adapt strategies as AI search evolves." }
    ],
    faqs: [
      { q: "What is AEO and how is it different from SEO?", a: "AEO (Answer Engine Optimization) focuses on getting your content cited by AI systems like ChatGPT and Google AI Overviews. While SEO targets traditional search rankings, AEO optimizes for how AI interprets and cites information." },
      { q: "Is AEO necessary if I'm already doing SEO?", a: "Yes. AI is rapidly changing how people find information. 40% of Google searches now show AI Overviews. Businesses that adapt early will have a significant advantage as AI search becomes the norm." },
      { q: "How do you track AEO results?", a: "We monitor brand mentions in AI tools, featured snippet appearances, voice search performance, and traffic from AI-driven sources. It's an evolving field, and we use multiple methods to measure impact." },
      { q: "Which AI platforms do you optimize for?", a: "We optimize for Google AI Overviews, ChatGPT, Claude, Perplexity, Bing Copilot, and voice assistants like Alexa and Google Assistant." }
    ]
  },
  'local-seo': {
    title: "Local SEO & GEO Marketing",
    subtitle: "Dominate Local Search & Google Maps",
    description: "Get found by customers in your area. We optimize your local presence to rank in Google Maps, local pack results, and 'near me' searches.",
    heroStats: [
      { value: "46%", label: "of Google searches have local intent" },
      { value: "78%", label: "of local mobile searches lead to purchase" },
      { value: "88%", label: "search locally on mobile weekly" }
    ],
    whatWeOffer: [
      {
        title: "Google Business Profile Optimization",
        description: "Complete setup and optimization of your GBP listing for maximum visibility in Maps and local results."
      },
      {
        title: "Local Citation Building",
        description: "Consistent NAP (Name, Address, Phone) listings across directories to boost local authority."
      },
      {
        title: "Review Management",
        description: "Strategies to generate more positive reviews and professionally respond to all feedback."
      },
      {
        title: "Local Keyword Targeting",
        description: "Optimization for location-based searches like 'service + city' and 'near me' queries."
      },
      {
        title: "Local Link Building",
        description: "Partnerships with local organizations, sponsorships, and community involvement for local authority."
      },
      {
        title: "Multi-Location SEO",
        description: "Scalable strategies for businesses with multiple locations or service areas."
      }
    ],
    process: [
      { step: "1", title: "Local Audit", description: "We analyze your current local presence, GBP, citations, and competitive landscape." },
      { step: "2", title: "Foundation Setup", description: "We optimize or create your GBP, fix citation inconsistencies, and set up tracking." },
      { step: "3", title: "Ongoing Optimization", description: "We implement review strategies, local content, and ongoing GBP management." },
      { step: "4", title: "Expand & Dominate", description: "We scale your local presence and target additional keywords and areas." }
    ],
    faqs: [
      { q: "How important is Google Business Profile?", a: "Critical. GBP is the #1 factor for ranking in Google Maps and Local Pack results. An optimized profile can significantly increase calls, direction requests, and website visits." },
      { q: "How do I get more reviews?", a: "We implement automated review request systems, train your team on asking for reviews, and create easy pathways for customers to leave feedback. We also help respond to all reviews professionally." },
      { q: "Can you help with multiple locations?", a: "Yes. We specialize in multi-location SEO, creating unique strategies for each location while maintaining brand consistency." },
      { q: "How long until I rank in the local pack?", a: "It depends on competition and your current standing. Some businesses see improvement in 4-8 weeks, while competitive markets may take 3-6 months." }
    ]
  },
  'content-marketing': {
    title: "Content Marketing",
    subtitle: "Attract, Engage & Convert with Strategic Content",
    description: "Build authority and drive organic growth with SEO-optimized content that attracts your ideal customers and guides them toward conversion.",
    heroStats: [
      { value: "3x", label: "more leads than traditional marketing" },
      { value: "62%", label: "less cost than outbound marketing" },
      { value: "434%", label: "more indexed pages with blogs" }
    ],
    whatWeOffer: [
      {
        title: "Content Strategy",
        description: "Data-driven content planning aligned with your business goals, audience needs, and keyword opportunities."
      },
      {
        title: "Blog Writing",
        description: "SEO-optimized blog posts that rank, drive traffic, and establish your expertise."
      },
      {
        title: "Pillar Pages & Clusters",
        description: "Comprehensive content hubs that build topical authority and improve site-wide rankings."
      },
      {
        title: "Landing Page Copy",
        description: "Persuasive, conversion-focused copy for service pages, product pages, and campaign landing pages."
      },
      {
        title: "Email Marketing Content",
        description: "Nurture sequences, newsletters, and campaign content that keeps your audience engaged."
      },
      {
        title: "Content Optimization",
        description: "Refresh and optimize existing content to improve rankings and extend content lifespan."
      }
    ],
    process: [
      { step: "1", title: "Content Audit", description: "We analyze your existing content, identify gaps, and research competitor content strategies." },
      { step: "2", title: "Strategy & Calendar", description: "We create a content roadmap with topics, keywords, and publishing schedule." },
      { step: "3", title: "Creation & Optimization", description: "Our writers create high-quality, SEO-optimized content aligned with your brand voice." },
      { step: "4", title: "Promotion & Analysis", description: "We promote content, track performance, and continuously refine the strategy." }
    ],
    faqs: [
      { q: "How often should I publish content?", a: "Consistency matters more than frequency. For most businesses, 2-4 quality blog posts per month is a good starting point. We'll recommend a sustainable cadence based on your goals and resources." },
      { q: "Do you write the content or do we?", a: "We handle everything. Our writers research, write, and optimize all content. We just need your input on topics and approval before publishing." },
      { q: "How do you ensure content matches our brand voice?", a: "We start with a brand voice workshop to understand your tone, style, and messaging. We create brand guidelines and refine through feedback on initial pieces." },
      { q: "When will content start ranking?", a: "New content typically takes 3-6 months to reach full ranking potential. However, you may see traction earlier, especially for less competitive keywords." }
    ]
  }
}

export default function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { isNightMode } = useTheme()
  const resolvedParams = use(params)
  const service = services[resolvedParams.slug as keyof typeof services]

  if (!service) {
    notFound()
  }

  return (
    <main className="min-h-screen transition-colors duration-500" style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}>
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link 
              href="/services" 
              className="inline-flex items-center gap-2 text-sm mb-6 hover:opacity-80 transition-opacity"
              style={{ color: '#FFC64C' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              All Services
            </Link>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
              {service.title}
            </h1>
            <p className="text-xl md:text-2xl mb-8" style={{ color: '#FFC64C' }}>
              {service.subtitle}
            </p>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
              {service.description}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 mt-12"
          >
            {service.heroStats.map((stat, index) => (
              <div 
                key={index} 
                className="p-6 rounded-xl"
                style={{ 
                  background: isNightMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                  border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` 
                }}
              >
                <p className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#FFC64C' }}>{stat.value}</p>
                <p className="text-sm" style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B' }}>{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
          >
            What We Offer
          </motion.h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {service.whatWeOffer.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl"
                style={{ 
                  background: isNightMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                  border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` 
                }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(255,198,76,0.15)' }}>
                  <svg className="w-5 h-5" style={{ color: '#FFC64C' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B' }}>{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Process */}
      <section className="px-4 py-16" style={{ background: isNightMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
          >
            Our Process
          </motion.h2>
          <div className="space-y-6">
            {service.process.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6 p-6 rounded-xl"
                style={{ 
                  background: isNightMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                  border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` 
                }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold" style={{ background: '#FFC64C', color: '#1A1A1A' }}>
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>{item.title}</h3>
                  <p style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B' }}>{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="space-y-4">
            {service.faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl"
                style={{ 
                  background: isNightMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                  border: `1px solid ${isNightMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` 
                }}
              >
                <h3 className="text-lg font-bold mb-2" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>{faq.q}</h3>
                <p style={{ color: isNightMode ? 'rgba(255,255,255,0.6)' : '#6B6B6B' }}>{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-8 md:p-12 rounded-2xl"
            style={{ 
              background: isNightMode ? 'rgba(255,198,76,0.1)' : 'rgba(255,198,76,0.15)',
              border: '1px solid rgba(255,198,76,0.3)'
            }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: isNightMode ? '#FFFFFF' : '#1A1A1A' }}>
              Ready to Get Started?
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: isNightMode ? 'rgba(255,255,255,0.7)' : '#6B6B6B' }}>
              Let&apos;s discuss how we can help grow your business with {service.title.toLowerCase()}.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 font-semibold transition-all duration-300 hover:scale-105"
              style={{ background: '#FFC64C', color: '#1A1A1A', borderRadius: '8px' }}
            >
              Schedule a Free Consultation
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

    </main>
  )
}

