import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'

import { ThemeProvider } from '@/contexts/ThemeContext'

import Navbar from '@/components/navbar/Navbar'

import Footer from '@/components/footer/Footer'

import SmoothScroll from '@/components/SmoothScroll'

import ScrollProgress from '@/components/ScrollProgress'

import { ScrollToTop } from '@/components/ScrollToTop'

import './globals.css'

// Load Satoshi font family
const satoshi = localFont({
  src: [
    {
      path: '../public/assets/fonts/Satoshi-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/Satoshi-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/Satoshi-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/assets/fonts/Satoshi-Black.woff2',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-satoshi',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'Vizantir | Premium Digital Marketing Agency',
  description: 'Data-driven SEO and premium web design.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('vizantir-theme');
                  // Default to dark mode to match server-side rendering
                  var isDark = theme === 'dark' || theme === null;
                  
                  if (isDark) {
                    if (document.documentElement) {
                      document.documentElement.style.backgroundColor = '#000000';
                    }
                    if (document.body) {
                      document.body.style.backgroundColor = '#000000';
                    }
                    if (document.documentElement) {
                      document.documentElement.setAttribute('data-theme', 'dark');
                    }
                  } else {
                    if (document.documentElement) {
                      document.documentElement.style.backgroundColor = '#FAFAFA';
                    }
                    if (document.body) {
                      document.body.style.backgroundColor = '#FAFAFA';
                    }
                    if (document.documentElement) {
                      document.documentElement.setAttribute('data-theme', 'light');
                    }
                  }
                } catch (e) {
                  // Default to dark mode on error to match server
                  if (document.documentElement) {
                    document.documentElement.style.backgroundColor = '#000000';
                  }
                  if (document.body) {
                    document.body.style.backgroundColor = '#000000';
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className={satoshi.variable} suppressHydrationWarning>
        <ThemeProvider>
          <SmoothScroll>
            <ScrollToTop />
            <ScrollProgress />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </SmoothScroll>
        </ThemeProvider>
        
        {/* Chatbase Chatbot */}
        <Script
          src="https://www.chatbase.co/embed.min.js"
          strategy="lazyOnload"
          id="chatbase-script"
          defer
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.embeddedChatbotConfig = {
                chatbotId: "FAr-BdEt5S7mZZY1pDbg-",
                domain: "www.chatbase.co"
              }
            `,
          }}
        />
      </body>
    </html>
  )
}