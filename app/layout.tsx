import type { Metadata } from 'next'
import localFont from 'next/font/local'

import { ThemeProvider } from '@/contexts/ThemeContext'

import Navbar from '@/components/navbar/Navbar'

import Footer from '@/components/footer/Footer'

import SmoothScroll from '@/components/SmoothScroll'

import ScrollProgress from '@/components/ScrollProgress'

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
                  var isDark = theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
                  if (isDark) {
                    document.documentElement.style.backgroundColor = '#000000';
                    document.body.style.backgroundColor = '#000000';
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.style.backgroundColor = '#FAFAFA';
                    document.body.style.backgroundColor = '#FAFAFA';
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {
                  document.documentElement.style.backgroundColor = '#000000';
                  document.body.style.backgroundColor = '#000000';
                }
              })();
            `,
          }}
        />
      </head>
      <body className={satoshi.variable}>
        <ThemeProvider>
          <SmoothScroll>
            <ScrollProgress />
            <Navbar />
            <main>{children}</main>
            <Footer />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  )
}
