/**
 * Service Worker Registration & Offline Detection
 * Registers SW and handles offline/online events
 */

/**
 * Register Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[App] Service Worker registered:', registration)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW ready, notify user
            console.log('[App] New Service Worker available')
            notifyUpdateAvailable()
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('[App] Service Worker registration failed:', error)
    return null
  }
}

/**
 * Handle offline/online status
 */
export function setupOfflineDetection(): void {
  window.addEventListener('online', () => {
    console.log('[App] Online')
    notifyOnline()
    syncPendingData()
  })

  window.addEventListener('offline', () => {
    console.log('[App] Offline')
    notifyOffline()
  })

  // Initial state
  if (!navigator.onLine) {
    notifyOffline()
  }
}

/**
 * Show update notification
 */
function notifyUpdateAvailable(): void {
  const event = new CustomEvent('swupdateavailable')
  window.dispatchEvent(event)
}

/**
 * Show online notification
 */
function notifyOnline(): void {
  const event = new CustomEvent('online-status', { detail: { online: true } })
  window.dispatchEvent(event)
}

/**
 * Show offline notification
 */
function notifyOffline(): void {
  const event = new CustomEvent('offline-status', { detail: { online: false } })
  window.dispatchEvent(event)
}

/**
 * Sync pending data when back online
 */
async function syncPendingData(): Promise<void> {
  try {
    // Get pending operations from IndexedDB
    const db = await openOfflineDB()
    const pendingOps = await db.getAll('pending')

    for (const op of pendingOps) {
      try {
        await fetch(op.url, {
          method: op.method,
          headers: op.headers,
          body: op.body ? JSON.stringify(op.body) : undefined,
        })
        // Remove from pending
        await db.delete('pending', op.id)
      } catch (error) {
        console.error('[App] Sync failed for:', op.url, error)
      }
    }
  } catch (error) {
    console.error('[App] Sync error:', error)
  }
}

/**
 * IndexedDB Setup for offline data
 */
let dbInstance: IDBDatabase | null = null

export async function openOfflineDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SekretBip', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Store for pending API calls
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true })
      }

      // Store for offline entries
      if (!db.objectStoreNames.contains('entries')) {
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' })
        entryStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      // Store for offline moods
      if (!db.objectStoreNames.contains('moods')) {
        const moodStore = db.createObjectStore('moods', { keyPath: 'id' })
        moodStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * Save entry for offline sync
 */
export async function saveEntryOffline(entry: any): Promise<void> {
  const db = await openOfflineDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['entries'], 'readwrite')
    const store = transaction.objectStore('entries')
    const request = store.add(entry)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * Get offline entries
 */
export async function getOfflineEntries(): Promise<any[]> {
  const db = await openOfflineDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['entries'], 'readonly')
    const store = transaction.objectStore('entries')
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

/**
 * Queue API call for offline retry
 */
export async function queuePendingCall(method: string, url: string, body?: any): Promise<void> {
  const db = await openOfflineDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending'], 'readwrite')
    const store = transaction.objectStore('pending')
    const request = store.add({
      method,
      url,
      headers: { 'Content-Type': 'application/json' },
      body,
      timestamp: Date.now(),
    })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
