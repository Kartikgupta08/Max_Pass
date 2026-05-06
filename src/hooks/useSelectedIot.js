import { useEffect, useState } from 'react'

export default function useSelectedIot() {
  const [selectedIot, setSelectedIot] = useState(null)

  useEffect(() => {
    const handler = (event) => {
      setSelectedIot(event?.detail?.iot ?? null)
    }
    window.addEventListener('selectedIotChanged', handler)
    return () => window.removeEventListener('selectedIotChanged', handler)
  }, [])

  return selectedIot
}