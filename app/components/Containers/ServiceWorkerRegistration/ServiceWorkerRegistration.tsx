import { useEffect } from 'react'

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if (import.meta.env.DEV || !('serviceWorker' in navigator)) {
      return
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (confirm('A new version is available! Reload to update?')) {
                  window.location.reload()
                }
              }
            })
          }
        })

        if (registration.active) {
          console.log('Service Worker is active')
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    registerServiceWorker()

    // Handle offline/online events
    const handleOnline = () => {
      document.body.classList.remove('offline')
      console.log('App is online')
    }

    const handleOffline = () => {
      document.body.classList.add('offline')
      console.log('App is offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial online status
    if (!navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}

export default ServiceWorkerRegistration
