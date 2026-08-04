'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export type AmbientVariant = 'plane' | 'contour' | 'helix' | 'strata' | 'polygons'

interface AmbientHeroCanvasProps {
  variant?: AmbientVariant
}

interface AmbientScene {
  update: (elapsed: number) => void
  applyScroll: (progress: number) => void
  dispose: () => void
}

const PLANE_BASE_OPACITY = 0.16
const PLANE_BASE_Y = -1.2
const PLANE_SCROLL_DRIFT = 2.4

const CONTOUR_RING_COUNT = 26
const CONTOUR_SEGMENTS = 140
const CONTOUR_BASE_Y = -0.4
const CONTOUR_SCROLL_DRIFT = 2.4

const HELIX_STRAND_COUNT = 14
const HELIX_SEGMENTS = 420
const HELIX_LEN = 34
const HELIX_TURNS = 9
const HELIX_BASE_Y = -0.4
const HELIX_SCROLL_DRIFT = 2.4

const STRATA_COUNT = 80
const STRATA_SEGMENTS = 260
const STRATA_BASE_OPACITY = 0.22
const STRATA_BASE_Y = -0.4
const STRATA_SCROLL_DRIFT = 2.4

const POLYGONS_RING_COUNT = 26
const POLYGONS_BASE_Y = -0.4
const POLYGONS_SCROLL_DRIFT = 2.4

function createPlaneScene(scene: THREE.Scene, cobalt: string): AmbientScene {
  const geometry = new THREE.PlaneGeometry(26, 16, 90, 60)
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(cobalt),
    wireframe: true,
    transparent: true,
    opacity: PLANE_BASE_OPACITY,
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -0.85
  mesh.rotation.z = 0.22
  mesh.position.set(2.2, PLANE_BASE_Y, 0)
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

  displace(0)

  return {
    update: (elapsed) => {
      displace(elapsed)
    },
    applyScroll: (progress) => {
      mesh.position.y = PLANE_BASE_Y - progress * PLANE_SCROLL_DRIFT
      material.opacity = PLANE_BASE_OPACITY * (1 - progress)
    },
    dispose: () => {
      scene.remove(mesh)
      geometry.dispose()
      material.dispose()
    },
  }
}

function createContourScene(scene: THREE.Scene, cobalt: string): AmbientScene {
  const group = new THREE.Group()
  group.rotation.x = -1.02
  group.position.set(2.2, CONTOUR_BASE_Y, 0)
  scene.add(group)

  const color = new THREE.Color(cobalt)
  const rings: {
    line: THREE.Line
    geometry: THREE.BufferGeometry
    material: THREE.LineBasicMaterial
    baseRadius: number
    baseOpacity: number
    positions: Float32Array
  }[] = []

  for (let i = 0; i < CONTOUR_RING_COUNT; i++) {
    const baseRadius = 0.7 + i * 0.36
    const baseOpacity = 0.3 * (1 - i / CONTOUR_RING_COUNT) + 0.1
    const positions = new Float32Array((CONTOUR_SEGMENTS + 1) * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: baseOpacity,
    })

    const line = new THREE.Line(geometry, material)
    line.position.z = -i * 0.12
    group.add(line)

    rings.push({ line, geometry, material, baseRadius, baseOpacity, positions })
  }

  const writeRing = (ringIndex: number, time: number, withWobble: boolean) => {
    const ring = rings[ringIndex]
    const { positions, baseRadius } = ring

    for (let s = 0; s <= CONTOUR_SEGMENTS; s++) {
      const a = (s / CONTOUR_SEGMENTS) * Math.PI * 2
      let radius = baseRadius

      if (withWobble) {
        const wob =
          Math.sin(a * 3 + time * 1.6 + ringIndex * 0.35) * 0.09 +
          Math.cos(a * 5 - time * 1.1 + ringIndex * 0.2) * 0.05
        radius = baseRadius + wob
      }

      const idx = s * 3
      positions[idx] = Math.cos(a) * radius
      positions[idx + 1] = Math.sin(a) * radius
      positions[idx + 2] = 0
    }

    ring.geometry.attributes.position.needsUpdate = true
  }

  for (let i = 0; i < CONTOUR_RING_COUNT; i++) {
    writeRing(i, 0, false)
  }

  return {
    update: (elapsed) => {
      const time = elapsed * 0.00028
      for (let i = 0; i < CONTOUR_RING_COUNT; i++) {
        writeRing(i, time, true)
      }
      group.rotation.z = time * 0.16
    },
    applyScroll: (progress) => {
      group.position.y = CONTOUR_BASE_Y - progress * CONTOUR_SCROLL_DRIFT
      for (const ring of rings) {
        ring.material.opacity = ring.baseOpacity * (1 - progress)
      }
    },
    dispose: () => {
      scene.remove(group)
      for (const ring of rings) {
        ring.geometry.dispose()
        ring.material.dispose()
      }
    },
  }
}

function createHelixScene(scene: THREE.Scene, cobalt: string): AmbientScene {
  const group = new THREE.Group()
  group.rotation.z = -0.06
  group.rotation.y = 0.16
  group.position.set(0, HELIX_BASE_Y, -2)
  scene.add(group)

  const color = new THREE.Color(cobalt)
  const strands: {
    geometry: THREE.BufferGeometry
    material: THREE.LineBasicMaterial
    positions: Float32Array
    radius: number
    phase: number
    baseOpacity: number
  }[] = []

  for (let i = 0; i < HELIX_STRAND_COUNT; i++) {
    const radius = 1.3 + i * 0.3
    const phase = (i / HELIX_STRAND_COUNT) * Math.PI * 2 * 0.6
    const baseOpacity = 0.18 - (i / HELIX_STRAND_COUNT) * 0.1
    const positions = new Float32Array((HELIX_SEGMENTS + 1) * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: baseOpacity,
    })

    const line = new THREE.Line(geometry, material)
    group.add(line)

    strands.push({ geometry, material, positions, radius, phase, baseOpacity })
  }

  const writeStrand = (strandIndex: number, time: number) => {
    const strand = strands[strandIndex]
    const { positions, radius, phase } = strand

    for (let s = 0; s <= HELIX_SEGMENTS; s++) {
      const u = s / HELIX_SEGMENTS
      const x = -HELIX_LEN / 2 + u * HELIX_LEN
      const a = u * Math.PI * 2 * HELIX_TURNS + phase - time * 1.1
      const y = Math.sin(a) * radius
      const z = Math.cos(a) * radius

      const idx = s * 3
      positions[idx] = x
      positions[idx + 1] = y
      positions[idx + 2] = z
    }

    strand.geometry.attributes.position.needsUpdate = true
  }

  for (let i = 0; i < HELIX_STRAND_COUNT; i++) {
    writeStrand(i, 0)
  }

  return {
    update: (elapsed) => {
      const time = elapsed * 0.00026
      for (let i = 0; i < HELIX_STRAND_COUNT; i++) {
        writeStrand(i, time)
      }
      group.rotation.x = time * 0.22
    },
    applyScroll: (progress) => {
      group.position.y = HELIX_BASE_Y - progress * HELIX_SCROLL_DRIFT
      for (const strand of strands) {
        strand.material.opacity = strand.baseOpacity * (1 - progress)
      }
    },
    dispose: () => {
      scene.remove(group)
      for (const strand of strands) {
        strand.geometry.dispose()
        strand.material.dispose()
      }
    },
  }
}

function createStrataScene(scene: THREE.Scene, cobalt: string): AmbientScene {
  const group = new THREE.Group()
  group.rotation.z = -0.05
  group.position.set(0, STRATA_BASE_Y, 0)
  scene.add(group)

  const color = new THREE.Color(cobalt)
  const strata: {
    geometry: THREE.BufferGeometry
    material: THREE.LineBasicMaterial
    positions: Float32Array
    stratumY: number
    freq: number
    rate: number
    amp: number
  }[] = []

  for (let i = 0; i < STRATA_COUNT; i++) {
    const stratumY = (i / 79 - 0.5) * 13
    const freq = 0.22 + (i % 7) * 0.055
    const rate = 0.55 + (i % 5) * 0.16
    const amp = 0.18 + (i % 3) * 0.07
    const positions = new Float32Array((STRATA_SEGMENTS + 1) * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: STRATA_BASE_OPACITY,
    })

    const line = new THREE.Line(geometry, material)
    group.add(line)

    strata.push({ geometry, material, positions, stratumY, freq, rate, amp })
  }

  const writeStratum = (stratumIndex: number, time: number, withWave: boolean) => {
    const stratum = strata[stratumIndex]
    const { positions, stratumY, freq, rate, amp } = stratum

    for (let s = 0; s <= STRATA_SEGMENTS; s++) {
      const x = -15 + (s / STRATA_SEGMENTS) * 30
      let y = stratumY

      if (withWave) {
        y =
          stratumY +
          Math.sin(x * freq - time * rate + stratumIndex * 0.22) * amp +
          Math.sin(x * freq * 0.41 + time * rate * 0.6) * amp * 0.28
      }

      const idx = s * 3
      positions[idx] = x
      positions[idx + 1] = y
      positions[idx + 2] = 0
    }

    stratum.geometry.attributes.position.needsUpdate = true
  }

  for (let i = 0; i < STRATA_COUNT; i++) {
    writeStratum(i, 0, false)
  }

  return {
    update: (elapsed) => {
      const time = elapsed * 0.00024
      for (let i = 0; i < STRATA_COUNT; i++) {
        writeStratum(i, time, true)
      }
    },
    applyScroll: (progress) => {
      group.position.y = STRATA_BASE_Y - progress * STRATA_SCROLL_DRIFT
      for (const stratum of strata) {
        stratum.material.opacity = STRATA_BASE_OPACITY * (1 - progress)
      }
    },
    dispose: () => {
      scene.remove(group)
      for (const stratum of strata) {
        stratum.geometry.dispose()
        stratum.material.dispose()
      }
    },
  }
}

function createPolygonsScene(scene: THREE.Scene, cobalt: string): AmbientScene {
  const group = new THREE.Group()
  group.rotation.x = -0.22
  group.position.set(3.4, POLYGONS_BASE_Y, 0)
  scene.add(group)

  const color = new THREE.Color(cobalt)
  const rings: {
    line: THREE.Line
    geometry: THREE.BufferGeometry
    material: THREE.LineBasicMaterial
    baseOpacity: number
  }[] = []

  for (let i = 0; i < POLYGONS_RING_COUNT; i++) {
    const sides = 3 + Math.floor(i * 0.28)
    const radius = 0.7 + i * 0.42
    const baseOpacity = 0.30 - (i / POLYGONS_RING_COUNT) * 0.16
    const positions = new Float32Array((sides + 1) * 3)

    for (let s = 0; s <= sides; s++) {
      const a = (s / sides) * Math.PI * 2
      const idx = s * 3
      positions[idx] = Math.cos(a) * radius
      positions[idx + 1] = Math.sin(a) * radius * 0.68
      positions[idx + 2] = 0
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: baseOpacity,
    })

    const line = new THREE.Line(geometry, material)
    line.position.z = -i * 0.09
    group.add(line)

    rings.push({ line, geometry, material, baseOpacity })
  }

  return {
    update: (elapsed) => {
      const time = elapsed * 0.00020
      for (let i = 0; i < POLYGONS_RING_COUNT; i++) {
        const direction = i % 2 === 1 ? 1 : -1
        rings[i].line.rotation.z = time * 0.30 * direction * (0.4 + i * 0.035)
      }
    },
    applyScroll: (progress) => {
      group.position.y = POLYGONS_BASE_Y - progress * POLYGONS_SCROLL_DRIFT
      for (const ring of rings) {
        ring.material.opacity = ring.baseOpacity * (1 - progress)
      }
    },
    dispose: () => {
      scene.remove(group)
      for (const ring of rings) {
        ring.geometry.dispose()
        ring.material.dispose()
      }
    },
  }
}

function createAmbientScene(variant: AmbientVariant, scene: THREE.Scene, cobalt: string): AmbientScene {
  if (variant === 'polygons') return createPolygonsScene(scene, cobalt)
  if (variant === 'strata') return createStrataScene(scene, cobalt)
  if (variant === 'helix') return createHelixScene(scene, cobalt)
  if (variant === 'contour') return createContourScene(scene, cobalt)
  return createPlaneScene(scene, cobalt)
}

function getCameraConfig(variant: AmbientVariant) {
  if (variant === 'helix') return { fov: 44, z: 10 }
  if (variant === 'polygons') return { fov: 42, z: 9 }
  if (variant === 'strata') return { fov: 40, z: 9 }
  if (variant === 'contour') return { fov: 42, z: 9 }
  return { fov: 40, z: 7 }
}

export default function AmbientHeroCanvas({ variant = 'plane' }: AmbientHeroCanvasProps) {
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
    const { fov, z: cameraZ } = getCameraConfig(variant)

    const camera = new THREE.PerspectiveCamera(
      fov,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      1000
    )
    camera.position.set(0, 0, cameraZ)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const ambientScene = createAmbientScene(variant, scene, cobalt)

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
      const progress = Math.min(1, Math.max(0, window.scrollY / window.innerHeight))
      ambientScene.update(elapsed)
      ambientScene.applyScroll(progress)
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
      ambientScene.dispose()
      renderer.dispose()
    }
  }, [variant])

  return <div ref={containerRef} className="h-full w-full" />
}
