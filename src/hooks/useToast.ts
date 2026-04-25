import { useEffect, useState } from 'react'

export type ToastTone = 'info' | 'error'

export type ToastState = {
  message: string
  tone: ToastTone
} | null

export function useToast(duration = 2400) {
  const [toast, setToast] = useState<ToastState>(null)

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setToast(null)
    }, duration)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [duration, toast])

  return {
    toast,
    showToast(message: string, tone: ToastTone = 'info') {
      setToast({ message, tone })
    },
    clearToast() {
      setToast(null)
    },
  }
}