'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface LiquidMetalTorusProps {
  isNightMode?: boolean
}

export default function LiquidMetalTorus({ isNightMode = true }: LiquidMetalTorusProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Scene
    const scene = new THREE.Scene()

    // Camera - further back on mobile for smaller torus
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    // Pull camera back on mobile (smaller screens) to make torus appear smaller
    const isMobile = container.clientWidth < 640 // sm breakpoint
    camera.position.z = isMobile ? 7 : 6.5
    camera.position.y = 0.2
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.5
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Torus Knot geometry - more interesting twisted shape
    const geometry = new THREE.TorusKnotGeometry(1.2, 0.4, 256, 64, 2, 3)

    // Glossy iridescent chrome shader
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        uniform float uTime;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        
        // Simplex noise for liquid deformation
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          
          vec4 x = x_ * ns.x + ns.yyyy;
          vec4 y = y_ * ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vUv = uv;
          
          // Liquid deformation
          float noise1 = snoise(position * 2.0 + uTime * 0.4);
          float noise2 = snoise(position * 4.0 - uTime * 0.3);
          float displacement = noise1 * 0.06 + noise2 * 0.03;
          
          vec3 newPosition = position + normal * displacement;
          
          // Recalculate normal for deformed surface
          float eps = 0.001;
          vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
          vec3 bitangent = normalize(cross(normal, tangent));
          
          float d1 = snoise((position + tangent * eps) * 2.0 + uTime * 0.4) * 0.06;
          float d2 = snoise((position - tangent * eps) * 2.0 + uTime * 0.4) * 0.06;
          float d3 = snoise((position + bitangent * eps) * 2.0 + uTime * 0.4) * 0.06;
          float d4 = snoise((position - bitangent * eps) * 2.0 + uTime * 0.4) * 0.06;
          
          vec3 deformedNormal = normalize(normal + tangent * (d1 - d2) * 10.0 + bitangent * (d3 - d4) * 10.0);
          
          vNormal = normalize(normalMatrix * deformedNormal);
          vPosition = newPosition;
          
          vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
          vWorldPosition = worldPos.xyz;
          
          vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec3 vViewPosition;
        varying vec2 vUv;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          
          // Fresnel - strong for glossy look
          float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 4.0);
          
          // Reflection vector for environment
          vec3 reflectVec = reflect(-viewDir, normal);
          
          // Fake environment map - creates the chrome look
          float envX = reflectVec.x * 0.5 + 0.5;
          float envY = reflectVec.y * 0.5 + 0.5;
          float envZ = reflectVec.z * 0.5 + 0.5;
          
          // Iridescent color based on view angle and reflection
          float iridescentAngle = dot(normal, viewDir);
          float iridescentShift = iridescentAngle * 0.5 + reflectVec.y * 0.3 + uTime * 0.02;
          
          // Color palette matching reference: deep violet purple, bright cyan, gold edge
          vec3 deepPurple = vec3(0.3, 0.05, 0.6);    // Rich violet
          vec3 purple = vec3(0.5, 0.1, 0.8);          // Bright purple
          vec3 cyan = vec3(0.0, 0.9, 1.0);            // Bright turquoise cyan
          vec3 blue = vec3(0.1, 0.4, 0.9);            // Electric blue
          vec3 gold = vec3(0.9, 0.6, 0.1);            // Warm amber/gold
          vec3 magenta = vec3(0.8, 0.1, 0.5);         // Pink/magenta
          
          // Multi-color iridescence - purple dominant with cyan highlights
          float t = fract(iridescentShift * 2.0 + envY);
          vec3 iridescentColor;
          if (t < 0.25) {
            iridescentColor = mix(deepPurple, purple, t * 4.0);
          } else if (t < 0.45) {
            iridescentColor = mix(purple, cyan, (t - 0.25) * 5.0);
          } else if (t < 0.6) {
            iridescentColor = mix(cyan, blue, (t - 0.45) * 6.67);
          } else if (t < 0.8) {
            iridescentColor = mix(blue, purple, (t - 0.6) * 5.0);
          } else {
            iridescentColor = mix(purple, gold, (t - 0.8) * 5.0);
          }
          
          // Chrome base - darker in shadows, brighter in highlights
          vec3 chromeBase = vec3(0.02, 0.02, 0.03);
          
          // Main specular highlight
          vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
          vec3 lightDir2 = normalize(vec3(-0.5, 0.5, -0.5));
          vec3 lightDir3 = normalize(vec3(0.0, -1.0, 0.5));
          
          float spec1 = pow(max(dot(reflect(-lightDir1, normal), viewDir), 0.0), 64.0);
          float spec2 = pow(max(dot(reflect(-lightDir2, normal), viewDir), 0.0), 32.0);
          float spec3 = pow(max(dot(reflect(-lightDir3, normal), viewDir), 0.0), 16.0);
          
          // Glossy reflections
          vec3 reflection = iridescentColor * (0.6 + fresnel * 0.4);
          
          // Combine for final chrome look
          vec3 finalColor = chromeBase;
          finalColor += reflection * 0.9;
          finalColor += spec1 * vec3(1.0, 0.98, 0.95) * 1.8;  // Bright white specular
          finalColor += spec2 * cyan * 0.5;                    // Cyan highlight
          finalColor += spec3 * gold * 0.4;                    // Gold accent
          finalColor += fresnel * iridescentColor * 0.4;
          
          // Boost contrast and saturation
          finalColor = pow(finalColor, vec3(0.85));
          finalColor *= 1.3;
          
          // Subtle vignette on the shape itself
          float shapeVignette = 1.0 - fresnel * 0.2;
          finalColor *= shapeVignette;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    })

    const torus = new THREE.Mesh(geometry, material)
    torus.rotation.x = Math.PI * 0.15
    torus.rotation.y = Math.PI * 0.1
    scene.add(torus)

    // Mouse tracking with smoothing
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation
    let time = 0
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      time += 0.016

      // Smooth mouse following
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05

      // Multi-directional rotation - different speeds and directions on all axes
      torus.rotation.x = Math.sin(time * 0.4) * 0.5 + Math.cos(time * 0.2) * 0.3 + mouseRef.current.y * 0.15
      torus.rotation.y = time * 0.2 + Math.sin(time * 0.3) * 0.4 + mouseRef.current.x * 0.15
      torus.rotation.z = Math.cos(time * 0.35) * 0.4 + Math.sin(time * 0.15) * 0.2

      material.uniforms.uTime.value = time
      material.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y)

      renderer.render(scene, cameraRef.current || camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return
      
      const width = container.clientWidth
      const height = container.clientHeight
      
      const camera = cameraRef.current
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      
      // Adjust camera position based on screen size
      const isMobile = width < 640 // sm breakpoint
      camera.position.z = isMobile ? 7 : 6.5
      
      rendererRef.current.setSize(width, height)
      if (material.uniforms?.uResolution) {
        material.uniforms.uResolution.value.set(width, height)
      }
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(frameRef.current)
      if (container && rendererRef.current) {
        container.removeChild(rendererRef.current.domElement)
      }
      rendererRef.current?.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [isNightMode])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  )
}