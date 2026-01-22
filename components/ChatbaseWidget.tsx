'use client'

import { useEffect } from 'react'

export default function ChatbaseWidget() {
  useEffect(() => {
    // Configure chatbot
    (window as any).embeddedChatbotConfig = {
      chatbotId: "FAr-BdEt5S7mZZY1pDbg-",
      domain: "www.chatbase.co"
    }

    // Load script during idle time
    const loadChatbase = () => {
      if (document.getElementById('chatbase-script')) return
      
      const script = document.createElement('script')
      script.src = 'https://www.chatbase.co/embed.min.js'
      script.defer = true
      script.id = 'chatbase-script'
      document.body.appendChild(script)
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadChatbase, { timeout: 5000 })
    } else {
      setTimeout(loadChatbase, 3000)
    }
  }, [])

  return null
}
