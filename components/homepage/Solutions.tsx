'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Search, Pencil, FileText, Target } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'

const Solutions = () => {
  const { isNightMode } = useTheme()

  const features = [
    {
      icon: Search,
      description: "We uncover hidden opportunities through research and analysis that move your business forward."
    },
    {
      icon: Pencil,
      description: "Our design and content capture attention, turning ideas into memorable brand experiences."
    },
    {
      icon: FileText,
      description: "Transparent reporting and data-driven insights ensure every campaign delivers measurable growth."
    },
    {
      icon: Target,
      description: "We align every move with your business objectives, delivering outcomes that matter most."
    }
  ]

  const services = [
    {
      image: "/assets/service-seo.jpg",
      title: "SEO",
      description: "Boost your Google rankings with keyword research, on-page optimization, backlink strategies, and technical SEO audits designed to attract targeted traffic and long-term authority.",
      keywords: ["keyword research", "on-page optimization", "backlink strategies", "technical SEO audits"]
    },
    {
      image: "/assets/service-webdesign.jpg",
      title: "WEBSITE DESIGN",
      description: "We build modern, responsive websites optimized for speed, mobile experience, user engagement, and conversions. Every site is designed with SEO-friendly structures that drive results.",
      keywords: ["modern, responsive websites", "mobile experience", "user engagement", "conversions", "SEO-friendly structures"]
    },
    {
      image: "/assets/service-ppc.jpg",
      title: "PPC",
      description: "Get instant visibility with Google Ads and social media campaigns. Our PPC strategies lower cost-per-click, improve conversions, and maximize ROI across every platform.",
      keywords: ["Google Ads", "social media campaigns", "cost-per-click", "maximize ROI"]
    },
    {
      image: "/assets/service-social.jpg",
      title: "SOCIAL MEDIA MARKETING",
      description: "Turn platforms like Instagram, TikTok, and Facebook into revenue engines. We create social content, ad campaigns, and engagement strategies that build audiences and convert them into customers.",
      keywords: ["Instagram, TikTok, and Facebook", "social content", "ad campaigns", "engagement strategies"]
    }
  ]

  const renderDescription = (description: string, keywords: string[]) => {
    let result = description
    keywords.forEach(keyword => {
      result = result.replace(
        keyword,
        `<strong style="color: ${isNightMode ? '#F8F8F8' : '#1A1A1A'}">${keyword}</strong>`
      )
    })
    return <span dangerouslySetInnerHTML={{ __html: result }} />
  }

  const featureContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const featureCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  }

  const serviceContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  const serviceCardVariants = {
    hidden: { opacity: 0, rotateY: -30, scale: 0.85 },
    visible: { opacity: 1, rotateY: 0, scale: 1 }
  }

  return (
    <section
      className="py-24 md:py-32 transition-colors duration-500 overflow-hidden"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        
        {/* Features Row */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-32"
          variants={featureContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {features.map((feature, index) => {
            const badgeColors = ['#FFC64C', '#3B82F6', '#C084FC', '#00D9FF']
            const badgeColor = badgeColors[index]
            const rgb = index === 0 ? '255, 198, 76' : 
                       index === 1 ? '59, 130, 246' :
                       index === 2 ? '192, 132, 252' : '0, 217, 255'
            
            return (
              <motion.div 
                key={index}
                className="relative group flex"
                variants={featureCardVariants}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <div 
                  className="relative text-center px-6 py-10 rounded-2xl transition-all duration-500 group-hover:-translate-y-2 w-full flex flex-col"
                  style={{
                    background: isNightMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(10px)',
                    border: isNightMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: isNightMode ? 'none' : '0 4px 24px rgba(0, 0, 0, 0.06)',
                    minHeight: '280px',
                  }}
                >
                  <div 
                    className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110"
                    style={{
                      background: `rgba(${rgb}, 0.15)`,
                      boxShadow: `0 0 40px rgba(${rgb}, 0.3)`
                    }}
                  >
                    <feature.icon 
                      className="w-9 h-9"
                      style={{ color: badgeColor, strokeWidth: 1.5 }}
                    />
                  </div>

                  <div 
                    className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: badgeColor, color: '#FFFFFF' }}
                  >
                    0{index + 1}
                  </div>

                  <p 
                    className="text-base md:text-lg flex-1"
                    style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B', lineHeight: '1.7' }}
                  >
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Digital Solutions Header */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 
            className="text-lg md:text-xl font-medium mb-3 tracking-wide"
            style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B' }}
          >
            Discover Our
          </h3>
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight relative inline-block"
            style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
          >
            DIGITAL SOLUTIONS
            {/* Animated gradient underline */}
            <motion.span 
              className="absolute -bottom-4 left-1/2 h-1.5 rounded-full"
              initial={{ width: 0, x: '-50%' }}
              whileInView={{ width: 200, x: '-50%' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              style={{
                background: 'linear-gradient(90deg, #7C3AED, #3B82F6, #06B6D4)',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 3s ease infinite',
              }}
            />
          </h2>
        </motion.div>

        {/* Services Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
          variants={serviceContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {services.map((service, index) => (
            <motion.div 
              key={index}
              className="group relative"
              variants={serviceCardVariants}
              transition={{ duration: 0.7 }}
            >
              <div 
                className="relative rounded-2xl overflow-hidden transition-all duration-500 group-hover:-translate-y-2 h-full flex flex-col"
                style={{
                  background: isNightMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: isNightMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)',
                }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h4 
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
                  >
                    {service.title}
                  </h4>
                  <p 
                    className="text-base"
                    style={{ color: isNightMode ? '#9CA3AF' : '#6B6B6B', lineHeight: '1.7' }}
                  >
                    {renderDescription(service.description, service.keywords)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button
            size="lg"
            asChild
            className="text-base px-10 py-7 font-semibold border-0 transition-transform hover:scale-105"
            style={{
              background: '#FFC64C',
              color: '#1A1A1A',
              borderRadius: '12px',
            }}
          >
            <Link href="/services">
              SEE ALL SERVICES
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>

      </div>
    </section>
  )
}

export default Solutions

