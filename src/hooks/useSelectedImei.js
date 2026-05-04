import { useEffect, useState } from 'react'

export default function useSelectedImei() {
  const [selectedImei, setSelectedImei] = useState(null)

  useEffect(() => {
    const handler = (event) => {
      setSelectedImei(event?.detail?.imei ?? null)
    }
    window.addEventListener('selectedImeiChanged', handler)
    return () => window.removeEventListener('selectedImeiChanged', handler)
  }, [])

  return selectedImei
}