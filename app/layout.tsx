import type { Metadata } from 'next'

import { ThemeProvider } from '@/contexts/ThemeContext'

import Navbar from '@/components/navbar/Navbar'

import Footer from '@/components/footer/Footer'

import SmoothScroll from '@/components/SmoothScroll'

import ScrollProgress from '@/components/ScrollProgress'

import './globals.css'

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
      <body>
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
