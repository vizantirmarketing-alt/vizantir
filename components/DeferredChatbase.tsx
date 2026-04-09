'use client'

import { useEffect } from 'react'

export default function DeferredChatbase() {
  useEffect(() => {
    let disposed = false
    let minTimeElapsed = false
    let hasInteraction = false
    let listenersRemoved = false

    const removeInteractionListeners = () => {
      if (listenersRemoved) return
      listenersRemoved = true
      window.removeEventListener('scroll', onInteraction)
      window.removeEventListener('click', onInteraction)
      window.removeEventListener('touchstart', onInteraction)
    }

    const injectChatbase = () => {
      if (disposed || !minTimeElapsed || !hasInteraction) return
      if (document.getElementById('chatbase-script')) return

      ;(window as unknown as { embeddedChatbotConfig?: object }).embeddedChatbotConfig = {
        chatbotId: 'FAr-BdEt5S7mZZY1pDbg-',
        domain: 'www.chatbase.co',
      }

      const script = document.createElement('script')
      script.src = 'https://www.chatbase.co/embed.min.js'
      script.defer = true
      script.id = 'chatbase-script'
      document.body.appendChild(script)

      removeInteractionListeners()
    }

    const onInteraction = () => {
      if (hasInteraction) return
      hasInteraction = true
      injectChatbase()
    }

    window.addEventListener('scroll', onInteraction, { passive: true })
    window.addEventListener('click', onInteraction)
    window.addEventListener('touchstart', onInteraction, { passive: true })

    const timer = window.setTimeout(() => {
      minTimeElapsed = true
      injectChatbase()
    }, 5000)

    return () => {
      disposed = true
      window.clearTimeout(timer)
      removeInteractionListeners()
    }
  }, [])

  return null
}
