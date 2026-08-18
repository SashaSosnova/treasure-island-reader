import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** При смене экрана прокручивает страницу вверх. */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [pathname, search, hash])

  return null
}
