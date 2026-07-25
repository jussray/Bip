/**
 * Offline UI Component - Status Bar
 * Shows when app is offline and syncing
 */

import React, { useState, useEffect } from 'react'
import { setupOfflineDetection, registerServiceWorker } from '../utils/offline'

interface OfflineStatus {
  online: boolean
  syncing: boolean
  message: string
}

export function OfflineStatusBar(): React.ReactElement | null {
  const [status, setStatus] = useState<OfflineStatus>({
    online: navigator.onLine,
    syncing: false,
    message: '',
  })

  useEffect(() => {
    // Setup offline detection
    setupOfflineDetection()

    // Register Service Worker
    registerServiceWorker()

    // Listen for status changes
    const handleOnline = () => {
      setStatus({ online: true, syncing: true, message: 'Syncing changes...' })
      setTimeout(() => {
        setStatus({ online: true, syncing: false, message: 'All synced' })
      }, 2000)
    }

    const handleOffline = () => {
      setStatus({ online: false, syncing: false, message: 'You are offline - changes saved locally' })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Hide bar when online and not syncing
  if (status.online && !status.syncing) {
    return null
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 px-4 py-3 text-white font-medium transition-all ${
        status.online ? 'bg-blue-500' : 'bg-orange-500'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              status.online ? 'bg-green-300' : 'bg-yellow-300'
            } animate-pulse`}
          />
          <span>{status.message}</span>
        </div>
        {status.syncing && (
          <div className="text-sm opacity-75">
            {/* Loading spinner */}
            <svg className="w-4 h-4 animate-spin inline" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
