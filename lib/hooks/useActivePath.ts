// "use client";
import { useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'
const useActivePath = () => {
  const pathName = usePathname()
  const [isActive, setIsActive] = useState(pathName)
  useEffect(() => {
    setIsActive(pathName)
  }, [pathName])
  return isActive
}

export default useActivePath
