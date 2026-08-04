'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const BASE_OPACITY = 0.16
const BASE_Y = -1.2
const SCROLL_DRIFT = 2.4

export default function AmbientHeroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cobalt =
      getComputedStyle(document.documentElement).getPropertyValue('--cobalt-primary').trim() ||
      '#0070F3'

    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    )
    camera.position.z = 7

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const geometry = new THREE.PlaneGeometry(26, 16, 90, 60)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(cobalt),
      wireframe: true,
      transparent: true,
      opacity: BASE_OPACITY,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -0.85
    mesh.rotation.z = 0.22
    mesh.position.set(2.2, BASE_Y, 0)
    scene.add(mesh)

    const positions = geometry.attributes.position
    const vertexCount = positions.count
    const baseX = new Float32Array(vertexCount)
    const baseY = new Float32Array(vertexCount)

    for (let i = 0; i < vertexCount; i++) {
      baseX[i] = positions.getX(i)
      baseY[i] = positions.getY(i)
    }

    const displace = (elapsed: number) => {
      const t = elapsed * 0.00022
      for (let i = 0; i < vertexCount; i++) {
        const x = baseX[i]
        const y = baseY[i]
        const z = Math.sin(x * 0.34 + t) * 0.5 + Math.cos(y * 0.42 + t * 0.8) * 0.42
        positions.setZ(i, z)
      }
      positions.needsUpdate = true
    }

    const applyScroll = () => {
      const progress = Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
      mesh.position.y = BASE_Y - progress * SCROLL_DRIFT
      material.opacity = BASE_OPACITY * (1 - progress)
    }

    displace(0)

    if (prefersReducedMotion) {
      renderer.render(scene, camera)
    }

    const isVisibleRef = { current: false }
    let isAnimating = false
    const startTime = performance.now()

    const stopAnimation = () => {
      isAnimating = false
      cancelAnimationFrame(frameRef.current)
      frameRef.current = 0
    }

    const animate = () => {
      if (!isVisibleRef.current || document.visibilityState === 'hidden') {
        isAnimating = false
        return
      }

      frameRef.current = requestAnimationFrame(animate)

      const elapsed = performance.now() - startTime
      displace(elapsed)
      applyScroll()
      renderer.render(scene, camera)
    }

    const startAnimation = () => {
      if (prefersReducedMotion || isAnimating) return
      if (!isVisibleRef.current || document.visibilityState === 'hidden') return
      isAnimating = true
      animate()
    }

    let intersectionObserver: IntersectionObserver | null = null
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopAnimation()
      } else if (isVisibleRef.current) {
        startAnimation()
      }
    }

    if (!prefersReducedMotion) {
      intersectionObserver = new IntersectionObserver((entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? false
        if (isVisibleRef.current && document.visibilityState === 'visible') {
          startAnimation()
        } else {
          stopAnimation()
        }
      })
      intersectionObserver.observe(container)
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    const syncSize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width <= 0 || height <= 0) return

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      if (prefersReducedMotion) {
        renderer.render(scene, camera)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      syncSize()
    })
    resizeObserver.observe(container)

    const handleWindowResize = () => syncSize()
    window.addEventListener('resize', handleWindowResize)

    return () => {
      intersectionObserver?.disconnect()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleWindowResize)
      stopAnimation()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return <div ref={containerRef} className="h-full w-full" />
}
