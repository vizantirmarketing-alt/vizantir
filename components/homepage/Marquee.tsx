'use client'
import { Section } from '@/components/ui/Section'

const items = [
  "WEBSITE DESIGN",
  "CUSTOM DEVELOPMENT",
  "NEXT.JS BUILDS",
  "MOBILE FIRST",
  "PREMIUM DESIGN",
  "BUILT TO CONVERT",
  "STRATEGY LED",
];

const MarqueeContent = () => (
  <>
    {items.map((item, index) => (
      <div 
        key={index}
        className="flex items-center flex-shrink-0"
      >
        <span 
          suppressHydrationWarning
          className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight whitespace-nowrap"
          style={{ 
            color: 'rgba(0,0,0,0.45)',
          }}
        >
          {item}
        </span>
        
        <span 
          data-sep
          className="text-2xl md:text-3xl mx-6 flex-shrink-0"
          style={{ 
            color: 'rgba(0,0,0,0.45)'
          }}
        >
          ❖
        </span>
      </div>
    ))}
  </>
);

const Marquee = () => {
  return (
    <Section size="sm" suppressHydrationWarning
      className="overflow-hidden relative"
      style={{ background: 'var(--background)' }}>
      {/* Gradient fade on left */}
      <div 
        className="marquee-fade absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, var(--background) 0%, transparent 100%)'
        }}
      />
      
      {/* Gradient fade on right */}
      <div 
        className="marquee-fade absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(270deg, var(--background) 0%, transparent 100%)'
        }}
      />

      {/* Marquee track */}
      <div 
        className="marquee-track flex animate-marquee"
        style={{ width: 'fit-content', willChange: 'transform' }}
      >
        <div className="flex">
          <MarqueeContent />
        </div>
        <div className="marquee-copy flex" aria-hidden="true">
          <MarqueeContent />
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee:hover,
        .animate-marquee:focus-within {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
            width: 100% !important;
            justify-content: center;
            will-change: auto !important;
          }
          .animate-marquee > div {
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem 2.5rem;
            padding: 0 1.5rem;
          }
          .animate-marquee span {
            font-size: 1.125rem !important;
            margin: 0 !important;
            letter-spacing: 0.04em;
          }
          .animate-marquee span[data-sep] {
            display: none;
          }
          .animate-marquee .marquee-copy,
          .marquee-fade {
            display: none;
          }
        }
      `}</style>
    </Section>
  );
};

export default Marquee;
