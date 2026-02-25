import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import UpdateBanner from '@/components/UpdateBanner'
import { applyUpdate, registerServiceWorker } from '@/lib/sw-registration'
import './index.css'

function RootApp() {
  const [isUpdateVisible, setIsUpdateVisible] = useState(false)

  useEffect(() => {
    let cleanup: (() => void) | null = null
    let active = true

    void registerServiceWorker(() => {
      if (active) {
        setIsUpdateVisible(true)
      }
    }).then((nextCleanup) => {
      if (!active) {
        nextCleanup?.()
        return
      }

      cleanup = nextCleanup
    })

    return () => {
      active = false
      cleanup?.()
    }
  }, [])

  const handleUpdate = (): void => {
    void applyUpdate()
  }

  return (
    <>
      {isUpdateVisible ? (
        <UpdateBanner onUpdate={handleUpdate} onDismiss={() => setIsUpdateVisible(false)} />
      ) : null}
      <div className={isUpdateVisible ? 'pt-16' : undefined}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </div>
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>
)
