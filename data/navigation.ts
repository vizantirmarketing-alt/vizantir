export interface MainNavLink {
  name: string
  path: string
  /** Shown as native tooltip / optional a11y hint when present */
  description?: string
}

export const mainNavLinks: MainNavLink[] = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Our Work', path: '/case-studies' },
  { name: 'How We Work', path: '/how-we-work' },
  {
    name: 'Are We a Fit?',
    path: '/are-we-a-fit',
    description: 'Honest criteria on whether Vizantir is the right web design studio for your business.',
  },
  { name: 'Blog', path: '/blog' },
  { name: 'Contact Us', path: '/contact' },
]
