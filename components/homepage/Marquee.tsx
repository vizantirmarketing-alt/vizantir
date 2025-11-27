'use client'

import { useTheme } from "@/contexts/ThemeContext";

const Marquee = () => {
  const { isNightMode } = useTheme();

  const items = [
    "WEBSITE DESIGN",
    "PPC",
    "SOCIAL MEDIA",
    "BRAND STRATEGY",
    "SEO",
    "CONTENT MARKETING",
    "EMAIL MARKETING",
    "ANALYTICS",
  ];

  const MarqueeContent = () => (
    <>
      {items.map((item, index) => (
        <div 
          key={index}
          className="flex items-center flex-shrink-0"
        >
          <span 
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight whitespace-nowrap"
            style={{ 
              color: isNightMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            }}
          >
            {item}
          </span>
          
          <span 
            className="text-2xl md:text-3xl mx-6 flex-shrink-0"
            style={{ 
              color: isNightMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'
            }}
          >
            ❖
          </span>
        </div>
      ))}
    </>
  );

  return (
    <section
      className="py-12 overflow-hidden relative"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      {/* Gradient fade on left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{
          background: isNightMode
            ? 'linear-gradient(90deg, #000000 0%, transparent 100%)'
            : 'linear-gradient(90deg, #FAFAFA 0%, transparent 100%)'
        }}
      />
      
      {/* Gradient fade on right */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{
          background: isNightMode
            ? 'linear-gradient(270deg, #000000 0%, transparent 100%)'
            : 'linear-gradient(270deg, #FAFAFA 0%, transparent 100%)'
        }}
      />

      {/* Marquee track */}
      <div 
        className="flex animate-marquee"
        style={{ width: 'fit-content', willChange: 'transform' }}
      >
        <div className="flex">
          <MarqueeContent />
        </div>
        <div className="flex">
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
      `}</style>
    </section>
  );
};

export default Marquee;

