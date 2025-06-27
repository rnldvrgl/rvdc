import { useCallback, useEffect, useRef } from 'react'

const useClickOutside = <T extends HTMLElement>(
  callback: (e: MouseEvent) => void,
) => {
  const ref = useRef<T>(null)

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        e.target instanceof Element &&
        ref.current &&
        !ref.current?.contains(e.target)
      ) {
        callback(e)
      }
    },
    [callback],
  )

  useEffect(() => {
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [handleClickOutside])

  return ref
}

export default useClickOutside
