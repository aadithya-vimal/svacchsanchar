import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ThreeGlobeProps {
  className?: string
}

// Convert geographic latitude and longitude to 3D Cartesian coordinates on a sphere of given radius.
// Standard Three.js equirectangular UV mapping:
// - lon = 0° (Greenwich) aligns with +Z when sphere rotation.y = -Math.PI / 2
// - Using standard spherical conversion matching Three.js UV orientation:
function latLonToVector3(latDeg: number, lonDeg: number, radius: number): THREE.Vector3 {
  const phi = (90 - latDeg) * (Math.PI / 180)
  const theta = (lonDeg + 180) * (Math.PI / 180)

  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)

  return new THREE.Vector3(x, y, z)
}

export function ThreeGlobe({ className }: ThreeGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 480
    const height = container.clientHeight || 480

    // Scene & Camera
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
    camera.position.set(0, 0.2, 2.65)

    // WebGL Renderer with sRGB and ACES Filmic tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2)
    sunLight.position.set(5, 3, 4)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 1.4)
    rimLight.position.set(-5, -2, -2)
    scene.add(rimLight)

    // Globe Group
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    const radius = 1.0
    const textureLoader = new THREE.TextureLoader()

    // 1. Earth Base Mesh with NASA Blue Marble equirectangular texture
    const earthTexture = textureLoader.load('/assets/earth.jpg')
    earthTexture.colorSpace = THREE.SRGBColorSpace

    const earthGeo = new THREE.SphereGeometry(radius, 64, 64)
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.7,
      metalness: 0.05
    })
    const earthMesh = new THREE.Mesh(earthGeo, earthMat)
    globeGroup.add(earthMesh)

    // 2. Translucent Cloud Layer
    const cloudsTexture = textureLoader.load('/assets/earth_clouds.png')
    const cloudsGeo = new THREE.SphereGeometry(radius * 1.008, 48, 48)
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat)
    globeGroup.add(cloudsMesh)

    // 3. Atmospheric Glow
    const atmoGeo = new THREE.SphereGeometry(radius * 1.04, 48, 48)
    const atmoMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
          gl_FragColor = vec4(0.06, 0.75, 0.95, 1.0) * intensity * 1.3;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    })
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat)
    globeGroup.add(atmoMesh)

    // 4. Bengaluru Marker & Beacons (12.9716° N, 77.5946° E)
    const bglPos = latLonToVector3(12.9716, 77.5946, radius * 1.012)

    // Beacon Core
    const pinGeo = new THREE.SphereGeometry(0.024, 16, 16)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 })
    const pinMesh = new THREE.Mesh(pinGeo, pinMat)
    pinMesh.position.copy(bglPos)
    globeGroup.add(pinMesh)

    // Radar Pulse Ring
    const ringGeo = new THREE.RingGeometry(0.035, 0.055, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.position.copy(bglPos)
    ringMesh.lookAt(bglPos.clone().multiplyScalar(2))
    globeGroup.add(ringMesh)

    // 5. Tech Orbital Rings & Telemetry Satellites
    const orbitRadius = 1.32
    const orbitPoints: THREE.Vector3[] = []
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2
      orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, Math.sin(theta) * 0.25, Math.sin(theta) * orbitRadius))
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints)
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.4 })
    const orbitLine = new THREE.Line(orbitGeo, orbitMat)
    orbitLine.rotation.x = 0.35
    orbitLine.rotation.z = -0.25
    globeGroup.add(orbitLine)

    // 6. Floating Municipal Sensors / Data Particles
    const particleCount = 140
    const particleGeo = new THREE.BufferGeometry()
    const particlePos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = radius * (1.14 + Math.random() * 0.4)
      const u = Math.random() * 2 - 1
      const th = Math.random() * Math.PI * 2
      particlePos[i] = r * Math.sqrt(1 - u * u) * Math.cos(th)
      particlePos[i + 1] = r * Math.sqrt(1 - u * u) * Math.sin(th)
      particlePos[i + 2] = r * u
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x6ee7b7,
      size: 0.02,
      transparent: true,
      opacity: 0.75
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    globeGroup.add(particles)

    // Initial orientation: Rotate Y and X so Bengaluru is directly facing the camera!
    // In latLonToVector3 with lon=77.5946, theta=(77.5946+180)*pi/180 = 257.59°
    // The point is located at angle theta. To bring it to +Z (camera front):
    // rotation.y = - (77.5946 - 90) * (Math.PI / 180)
    const initialRotY = -((77.5946 - 90) * (Math.PI / 180))
    const initialRotX = (12.9716 * (Math.PI / 180)) * 0.6 // Natural tilt toward viewer

    globeGroup.rotation.y = initialRotY
    globeGroup.rotation.x = initialRotX

    let targetRotationY = initialRotY
    let targetRotationX = initialRotX
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY
      targetRotationY += deltaX * 0.005
      targetRotationX += deltaY * 0.005
      targetRotationX = Math.max(-0.7, Math.min(0.7, targetRotationX))
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseUp = () => {
      isDragging = false
    }

    // Touch controls preserving mobile vertical page scrolling
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true
        prevMouseX = e.touches[0].clientX
        prevMouseY = e.touches[0].clientY
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return
      const deltaX = e.touches[0].clientX - prevMouseX
      const deltaY = e.touches[0].clientY - prevMouseY
      targetRotationY += deltaX * 0.006
      targetRotationX += deltaY * 0.006
      targetRotationX = Math.max(-0.7, Math.min(0.7, targetRotationX))
      prevMouseX = e.touches[0].clientX
      prevMouseY = e.touches[0].clientY
    }

    const domEl = renderer.domElement
    domEl.style.cursor = 'grab'
    domEl.style.touchAction = 'pan-y'
    domEl.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domEl.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onMouseUp)

    // Resize handling
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    // Animation Loop
    let animId: number
    let clock = 0

    const animate = () => {
      animId = requestAnimationFrame(animate)
      clock += 0.016

      // Damped smooth rotation towards target
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.08
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08

      // Slow idle rotation when user isn't actively rotating
      if (!isDragging) {
        targetRotationY += 0.0012
      }

      // Slowly rotate clouds independent of Earth surface
      cloudsMesh.rotation.y += 0.0004

      // Radar pulse wave on Bengaluru beacon
      const scale = 1.0 + Math.sin(clock * 3.2) * 0.35
      ringMesh.scale.set(scale, scale, 1)
      ringMat.opacity = 0.5 + Math.cos(clock * 3.2) * 0.45

      // Orbit particles slow drift
      particles.rotation.y = clock * 0.015

      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
      domEl.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      domEl.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onMouseUp)
      renderer.dispose()
      if (domEl.parentNode) domEl.parentNode.removeChild(domEl)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`three-globe-container ${className || ''}`}
      style={{ width: '100%', height: '100%', minHeight: '440px', position: 'relative' }}
    />
  )
}
