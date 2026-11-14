import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

// The ClientRouter swaps the document rather than unmounting react, so fiber's
// own teardown does not run reliably. Without this a visitor accumulates one
// webgl context per visit to this page until the browser reclaims them.
function ReleaseContextOnNavigate() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const release = () => {
      gl.forceContextLoss()
      gl.dispose()
    }

    document.addEventListener('astro:before-swap', release)
    return () => document.removeEventListener('astro:before-swap', release)
  }, [gl])

  return null
}

export default ReleaseContextOnNavigate
