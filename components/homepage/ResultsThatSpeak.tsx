'use client'

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink } from "lucide-react";
import { motion } from 'framer-motion';
import { Eyebrow } from '@/components/ui/Eyebrow';

const ResultsThatSpeak = () => {
  const projects = [
    {
      title: 'Golden Era Integra',
      category: 'AUTOMOTIVE / ENTHUSIAST',
      outcome: 'Editorial platform for a 1995 Acura Integra GS-R restoration — documented build journal, parts archive, and garage sale system, all running on Sanity CMS.',
      image: '/g-e-i.png',
      link: 'https://goldeneraintegra.com',
    },
    {
      title: 'Eloraé Nails',
      category: 'Beauty & Wellness',
      outcome: 'Premium studio brand site—gallery, services, and bookings in one fast Next.js build.',
      image: '/elorae-nails.png',
      link: 'https://www.eloraenails.com',
    },
    {
      title: 'Éclat Lounge',
      category: 'CONCEPT PROJECT',
      outcome: 'Concept build for a Las Vegas nightlife brand — reservations, events, and high-intent mobile traffic.',
      image: '/eclat-lounge-lv.png',
      link: 'https://eclatloungelv.com',
    },
  ];

  return (
    <section 
      className="py-16 md:py-20 short-landscape:py-8 transition-colors duration-500"
      style={{ background: '#FAF9F5' }}
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-7xl mx-auto"
        >
          <div className="text-center mb-10 md:mb-12">
            <div className="mb-3 flex justify-center">
              <Eyebrow>Our Work</Eyebrow>
            </div>
            <h2 
              className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
              style={{ color: '#1A1A1A' }}
            >
              Selected Work
            </h2>
            <p 
              className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: '#6B6B6B' }}
            >
              A better website should do more than look updated. It should present the business more clearly, support trust faster, and create a stronger experience from the first click.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
            {projects.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                className="group flex flex-col"
              >
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative mb-5 block overflow-hidden rounded-2xl aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                    background: 'rgba(0, 0, 0, 0.04)',
                  }}
                >
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain object-top"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </a>
                <p className="text-xs font-semibold uppercase tracking-wider text-gold-primary mb-1">
                  {item.category}
                </p>
                <h3 
                  className="text-xl md:text-2xl font-bold mb-2 group-hover:text-gold-primary transition-colors"
                  style={{ color: '#1A1A1A' }}
                >
                  {item.title}
                </h3>
                <p 
                  className="text-sm md:text-base leading-relaxed flex-1 mb-4"
                  style={{ color: '#6B6B6B' }}
                >
                  {item.outcome}
                </p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-cobalt group inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--gold-accent)' }}
                >
                  <span>View live site</span>
                  <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </motion.article>
            ))}
          </div>

          <div className="text-center mt-10 md:mt-12">
            <Link
              href="/case-studies"
              className="bg-gold-gradient inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-gold"
            >
              View all work
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ResultsThatSpeak;
