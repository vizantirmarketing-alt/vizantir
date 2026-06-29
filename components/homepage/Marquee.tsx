'use client'

const Marquee = () => {
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
              color: 'rgba(0,0,0,0.35)',
            }}
          >
            {item}
          </span>
          
          <span 
            className="text-2xl md:text-3xl mx-6 flex-shrink-0"
            style={{ 
              color: 'rgba(0,0,0,0.35)'
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
      suppressHydrationWarning
      className="py-10 md:py-12 short-landscape:py-6 overflow-hidden relative"
      style={{ background: '#FAF9F5' }}
    >
      {/* Gradient fade on left */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, #FAF9F5 0%, transparent 100%)'
        }}
      />
      
      {/* Gradient fade on right */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(270deg, #FAF9F5 0%, transparent 100%)'
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
