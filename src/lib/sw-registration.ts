import { Workbox } from 'workbox-window'

let workboxInstance: Workbox | null = null

export async function registerServiceWorker(
  onUpdateAvailable: () => void
): Promise<(() => void) | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  const workbox = new Workbox('/sw.js')
  workboxInstance = workbox

  const handleWaiting = (): void => {
    onUpdateAvailable()
  }

  const handleControlling = (): void => {
    window.location.reload()
  }

  workbox.addEventListener('waiting', handleWaiting)
  workbox.addEventListener('controlling', handleControlling)

  await workbox.register()

  return () => {
    workbox.removeEventListener('waiting', handleWaiting)
    workbox.removeEventListener('controlling', handleControlling)

    if (workboxInstance === workbox) {
      workboxInstance = null
    }
  }
}

export async function applyUpdate(): Promise<void> {
  if (!workboxInstance) {
    return
  }

  workboxInstance.messageSkipWaiting()
}

