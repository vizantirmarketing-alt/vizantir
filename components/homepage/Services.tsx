'use client'

import Link from "next/link";
import { Search, Globe, Bot, MapPin, ArrowRight } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const Services = () => {
  const { isNightMode } = useTheme();
  
  const services = [
    {
      icon: Search,
      title: "SEO Optimization",
      description: "Data-driven SEO strategies that dominate search rankings and drive organic traffic.",
    },
    {
      icon: Globe,
      title: "Web Design",
      description: "Premium websites that convert visitors into customers with stunning design and UX.",
    },
    {
      icon: Bot,
      title: "AI Marketing",
      description: "Leverage cutting-edge AI to automate and optimize your marketing campaigns.",
    },
    {
      icon: MapPin,
      title: "Local SEO",
      description: "Dominate local search results and connect with customers in your area.",
    },
  ];

  return (
    <section 
      className="py-20 md:py-24"
      style={{ background: isNightMode ? '#000000' : '#FAFAFA' }}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}
          >
            Our Services
          </h2>
          <p 
            className="text-xl max-w-2xl mx-auto"
            style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
          >
            Comprehensive digital marketing solutions tailored to your business goals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{
                background: isNightMode 
                  ? 'rgba(255, 255, 255, 0.03)' 
                  : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: isNightMode 
                  ? '1px solid rgba(255, 255, 255, 0.08)' 
                  : '1px solid rgba(0, 0, 0, 0.08)',
                boxShadow: isNightMode 
                  ? '0 4px 24px rgba(0, 0, 0, 0.2)' 
                  : '0 4px 24px rgba(0, 0, 0, 0.06)',
              }}
            >
              {/* Animated glowing number */}
              <span 
                className="absolute right-4 bottom-4 text-[80px] md:text-[100px] font-black pointer-events-none select-none leading-none transition-all duration-500 group-hover:scale-105"
                style={{ 
                  color: isNightMode ? 'rgba(255, 198, 76, 0.2)' : 'rgba(255, 198, 76, 0.25)',
                  textShadow: isNightMode 
                    ? '0 0 40px rgba(255, 198, 76, 0.3)' 
                    : 'none',
                  zIndex: 0,
                }}
              >
                {`0${index + 1}`}
              </span>

              {/* Content - needs relative positioning to stay above number */}
              <div className="relative z-10">
                <service.icon 
                  className="w-12 h-12 mb-4" 
                  style={{ color: '#FFC64C' }}
                />
                <h3 
                  className="text-xl font-bold mb-3"
                  style={{ color: isNightMode ? '#F7F7F7' : '#1A1A1A' }}
                >
                  {service.title}
                </h3>
                <p 
                  className="mb-4"
                  style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}
                >
                  {service.description}
                </p>
                <Link
                  href="/services"
                  className="inline-flex items-center font-medium hover:underline"
                  style={{ color: '#FFC64C' }}
                >
                  Learn More <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;

