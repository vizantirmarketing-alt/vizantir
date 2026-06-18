'use client'

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from 'framer-motion';
import { Eyebrow } from '@/components/ui/Eyebrow';

const AboutStory = () => {
  return (
    <section 
      className="py-16 md:py-20 short-landscape:py-8 transition-colors duration-500"
      style={{ background: '#FAF9F5' }}
    >
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-5 lg:gap-14 items-center">
          {/* Left Content */}
          <div className="max-w-xl">
            {/* Fade up for the heading area */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="mb-6">
                <Eyebrow align="start">The Difference</Eyebrow>
              </div>
              <h2 
                className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight text-foreground"
              >
                Your business has outgrown what you started with.
              </h2>
              <p 
                className="text-sm md:text-base mb-8 font-medium"
                style={{ color: 'var(--cobalt-accent)' }}
              >
                When the right person lands on your site, they should already trust you before they read a word.
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
                className="text-base md:text-lg text-body" style={{ lineHeight: '1.7' }}
              >
                Most websites look fine on the surface. They just don&apos;t do anything. They don&apos;t rank. They don&apos;t convert. They don&apos;t reflect the business you&apos;ve actually become.
              </p>
              
              <p 
                className="text-base md:text-lg text-body" style={{ lineHeight: '1.7' }}
              >
                We build from the ground up — considered, crafted, and coded for the way your business actually operates. Every decision is intentional. Every line of code earns its place.
              </p>
            </motion.div>

            <div className="mt-5">
              <Link
                href="/about"
                className="link-cobalt group inline-flex items-center gap-2 font-medium"
                style={{ color: 'var(--cobalt-accent)' }}
              >
                <span>How We Work</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
              }}
            >
              <Image
                src="/assets/aboutstory.jpeg"
                alt="Vizantir team collaboration"
                width={800}
                height={600}
                sizes="(max-width: 768px) 380px, (max-width: 1200px) 50vw, 600px"
                className="w-full h-auto object-cover"
                quality={80}
              />
            </div>
            
            <div 
              className="absolute -z-10 -bottom-6 -right-6 w-full h-full rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 112, 243, 0.4), rgba(212, 197, 249, 0.4))'
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutStory;
