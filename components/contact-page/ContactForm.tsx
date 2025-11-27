'use client'

import { useTheme } from '@/contexts/ThemeContext'

const ContactForm = () => {
  const { isNightMode } = useTheme()

  return (
    <div
      className="max-w-2xl mx-auto p-8 rounded-lg"
      style={{ background: isNightMode ? '#111' : '#FFF' }}
    >
      <p style={{ color: isNightMode ? '#A0A0A0' : '#6B6B6B' }}>
        Contact form will be implemented here.
      </p>
    </div>
  )
}

export default ContactForm

