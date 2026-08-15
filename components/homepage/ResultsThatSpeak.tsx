'use client'

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from 'framer-motion';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { CaseStudyListItem } from '@/lib/sanity/types';

/** next/image requires an absolute URL; Sanity may return protocol-relative `//cdn...` */
function absoluteImageUrl(url: string) {
  const trimmed = url.trim()
  return trimmed.startsWith('//') ? `https:${trimmed}` : trimmed
}

interface ResultsThatSpeakProps {
  caseStudies: CaseStudyListItem[]
}

const ResultsThatSpeak = ({ caseStudies }: ResultsThatSpeakProps) => {

  return (
    <section 
      className="py-16 md:py-20 short-landscape:py-8 transition-colors duration-500"
      style={{ background: 'var(--background)' }}
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
              className="text-4xl md:text-5xl font-black mb-4 tracking-tight text-foreground"
            >
              Selected Work
            </h2>
            <p 
              className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed text-muted-foreground"
            >
              A better website should do more than look updated. It should present the business more clearly, support trust faster, and create a stronger experience from the first click.
            </p>
          </div>

          <div className="grid items-start md:grid-cols-3 gap-8 lg:gap-10">
            {caseStudies.map((item, index) => {
              const imageUrl = item.heroImage?.asset?.url
                ? absoluteImageUrl(item.heroImage.asset.url)
                : undefined
              const imageWidth = item.heroImage?.asset?.metadata?.dimensions?.width ?? 1600
              const imageHeight = item.heroImage?.asset?.metadata?.dimensions?.height ?? 900
              const caseStudyHref = `/case-studies/${item.slug}`

              return (
              <motion.article
                key={item._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                className="group flex flex-col"
              >
                <Link
                  href={caseStudyHref}
                  className="mb-5 block overflow-hidden rounded-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                  style={{
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
                    background: 'rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.heroImage?.alt || item.title}
                      width={imageWidth}
                      height={imageHeight}
                      className="h-auto w-full"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : null}
                </Link>
                <p className="text-xs font-semibold uppercase tracking-wider text-cobalt-primary mb-1">
                  {item.industry}
                </p>
                <h3 
                  className="text-xl md:text-2xl font-bold mb-2 group-hover:text-cobalt-primary transition-colors text-foreground"
                >
                  {item.title}
                </h3>
                <p 
                  className="text-sm md:text-base leading-relaxed flex-1 mb-4 text-muted-foreground"
                >
                  {item.summary}
                </p>
                <Link
                  href={caseStudyHref}
                  className="link-cobalt group inline-flex items-center gap-2 text-sm font-semibold"
                  style={{ color: 'var(--cobalt-accent)' }}
                >
                  <span>Read case study</span>
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              </motion.article>
              )
            })}
          </div>

          <div className="text-center mt-10 md:mt-12">
            <Link
              href="/case-studies"
              className="bg-cobalt-gradient inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold text-white shadow-cobalt"
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
