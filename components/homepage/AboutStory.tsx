'use client'

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion } from 'framer-motion';

const AboutStory = () => {
  const { isNightMode } = useTheme();

  return (
    <section 
      className="py-20 md:py-24 transition-colors duration-500"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="max-w-xl">
            {/* Fade up for the heading area */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h3 
                className="text-lg md:text-xl font-medium mb-2"
                style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
              >
                The Story Of
              </h3>
              <h2 
                className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight"
                style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}
              >
                VIZANTIR
              </h2>
              <p 
                className="text-sm md:text-base mb-8 font-medium"
                style={{ color: isNightMode ? 'rgba(255, 198, 76, 0.8)' : '#B45309' }}
              >
                Based in Las Vegas, Working Nationwide
              </p>
            </motion.div>
            
            {/* Staggered fade for paragraphs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="space-y-6"
            >
              <p 
                className="text-base md:text-lg"
                style={{ color: isNightMode ? '#C0C0C0' : '#4A4A4A', lineHeight: '1.7' }}
              >
                Vizantir was built on{' '}
                <span className="font-medium" style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}>
                  results and transparency
                </span>. 
                Unlike traditional agencies weighed down by overhead and long contracts, we're{' '}
                <span className="font-medium" style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}>
                  fully online and lean
                </span>. 
                That means{' '}
                <span className="font-medium" style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}>
                  faster execution, lower costs, and more value
                </span>{' '}
                for every client.
              </p>
              
              <p 
                className="text-base md:text-lg"
                style={{ color: isNightMode ? '#C0C0C0' : '#4A4A4A', lineHeight: '1.7' }}
              >
                We've already helped brands like{' '}
                <span className="font-medium" style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}>
                  Pink Salt Salon
                </span>{' '}
                and{' '}
                <span className="font-medium" style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}>
                  ClickLV
                </span>{' '}
                transform their online presence with stunning websites. Our promise is simple:{' '}
                <span className="font-medium" style={{ color: isNightMode ? '#F8F8F8' : '#1A1A1A' }}>
                  beautiful design, fast performance, and measurable results
                </span>{' '}
                — never empty promises.
              </p>
            </motion.div>

            <div className="mt-10">
              <Link
                href="/about"
                className="inline-flex items-center font-medium transition-all duration-300 hover:opacity-80 group"
                style={{ color: '#FFC64C' }}
              >
                Learn More About Vizantir
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="relative"
          >
            <div 
              className="rounded-2xl overflow-hidden"
              style={{
                boxShadow: isNightMode 
                  ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
                  : '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <Image
                src="/assets/aboutstory.jpeg"
                alt="Vizantir team collaboration"
                width={800}
                height={600}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                className="w-full h-auto object-cover"
                quality={80}
              />
            </div>
            
            <div 
              className="absolute -z-10 -bottom-6 -right-6 w-full h-full rounded-2xl"
              style={{
                background: isNightMode 
                  ? 'linear-gradient(135deg, rgba(124, 58, 237, 0.3), rgba(6, 182, 212, 0.3))' 
                  : 'linear-gradient(135deg, rgba(255, 198, 76, 0.4), rgba(212, 197, 249, 0.4))'
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutStory;

