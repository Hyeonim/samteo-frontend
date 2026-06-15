import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import LoadingScreen from '../common/LoadingScreen'
import Header from './Header'

function Layout() {
  const location = useLocation()
  const mounted = useRef(false)
  const [loaderState, setLoaderState] = useState('idle')

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return undefined
    }

    setLoaderState('open')
    const closeTimer = window.setTimeout(() => setLoaderState('closing'), 420)
    const removeTimer = window.setTimeout(() => setLoaderState('idle'), 720)
    return () => {
      window.clearTimeout(closeTimer)
      window.clearTimeout(removeTimer)
    }
  }, [location.pathname])

  return (
    <>
      <Header />
      {loaderState !== 'idle' && (
        <LoadingScreen
          variant="overlay"
          state={loaderState}
          message="화면을 준비하고 있습니다"
          description="요청한 페이지로 이동하는 중입니다."
        />
      )}
      <Outlet />
    </>
  )
}

export default Layout
