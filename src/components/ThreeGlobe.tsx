import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface ThreeGlobeProps {
  className?: string
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
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000)
    camera.position.z = 2.9

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.8)
    sunLight.position.set(5, 3, 5)
    scene.add(sunLight)

    const rimLight = new THREE.DirectionalLight(0x00f2fe, 1.2)
    rimLight.position.set(-5, -2, -3)
    scene.add(rimLight)

    // Globe Group
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    // Earth Sphere
    const radius = 1.0
    const textureLoader = new THREE.TextureLoader()
    const earthTexture = textureLoader.load('/assets/earth.jpg')
    earthTexture.colorSpace = THREE.SRGBColorSpace

    const earthGeo = new THREE.SphereGeometry(radius, 64, 64)
    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTexture,
      roughness: 0.65,
      metalness: 0.1
    })
    const earthMesh = new THREE.Mesh(earthGeo, earthMat)
    globeGroup.add(earthMesh)

    // Atmosphere Glow Shell
    const atmoGeo = new THREE.SphereGeometry(radius * 1.035, 64, 64)
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.05, 0.85, 0.95, 1.0) * intensity * 1.2;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    })
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat)
    globeGroup.add(atmoMesh)

    // Bengaluru Location Marker (Lat: 12.9716, Lon: 77.5946)
    const lat = 12.9716 * (Math.PI / 180)
    const lon = (77.5946 + 90) * (Math.PI / 180) // Offset for standard equirectangular mapping
    const markerPos = new THREE.Vector3(
      -(radius * 1.012) * Math.cos(lat) * Math.sin(lon),
      radius * 1.012 * Math.sin(lat),
      radius * 1.012 * Math.cos(lat) * Math.cos(lon)
    )

    // Pinpoint core
    const pinGeo = new THREE.SphereGeometry(0.022, 16, 16)
    const pinMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe })
    const pinMesh = new THREE.Mesh(pinGeo, pinMat)
    pinMesh.position.copy(markerPos)
    globeGroup.add(pinMesh)

    // Pulsing Ring
    const ringGeo = new THREE.RingGeometry(0.03, 0.048, 32)
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    })
    const ringMesh = new THREE.Mesh(ringGeo, ringMat)
    ringMesh.position.copy(markerPos)
    ringMesh.lookAt(new THREE.Vector3(0, 0, 0))
    globeGroup.add(ringMesh)

    // Orbital Ring
    const orbitRadius = 1.35
    const orbitPoints: THREE.Vector3[] = []
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2
      orbitPoints.push(new THREE.Vector3(Math.cos(theta) * orbitRadius, Math.sin(theta) * 0.28, Math.sin(theta) * orbitRadius))
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints)
    const orbitMat = new THREE.LineBasicMaterial({ color: 0x00f2fe, transparent: true, opacity: 0.35 })
    const orbitLine = new THREE.Line(orbitGeo, orbitMat)
    orbitLine.rotation.x = 0.4
    orbitLine.rotation.z = -0.3
    globeGroup.add(orbitLine)

    // Floating Telemetry Particles
    const particleCount = 120
    const particleGeo = new THREE.BufferGeometry()
    const particlePos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      const r = radius * (1.15 + Math.random() * 0.45)
      const u = Math.random() * 2 - 1
      const th = Math.random() * Math.PI * 2
      particlePos[i] = r * Math.sqrt(1 - u * u) * Math.cos(th)
      particlePos[i + 1] = r * Math.sqrt(1 - u * u) * Math.sin(th)
      particlePos[i + 2] = r * u
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x6ee7b7,
      size: 0.022,
      transparent: true,
      opacity: 0.75
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    globeGroup.add(particles)

    // Initial globe orientation highlighting India / Bengaluru
    globeGroup.rotation.y = -1.25
    globeGroup.rotation.x = 0.22

    // Interactive Drag Controls
    let isDragging = false
    let prevMouseX = 0
    let prevMouseY = 0
    let targetRotationY = globeGroup.rotation.y
    let targetRotationX = globeGroup.rotation.x

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const deltaX = e.clientX - prevMouseX
      const deltaY = e.clientY - prevMouseY
      targetRotationY += deltaX * 0.006
      targetRotationX += deltaY * 0.006
      targetRotationX = Math.max(-0.85, Math.min(0.85, targetRotationX))
      prevMouseX = e.clientX
      prevMouseY = e.clientY
    }

    const onMouseUp = () => {
      isDragging = false
    }

    // Touch controls for mobile
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
      targetRotationY += deltaX * 0.007
      targetRotationX += deltaY * 0.007
      targetRotationX = Math.max(-0.85, Math.min(0.85, targetRotationX))
      prevMouseX = e.touches[0].clientX
      prevMouseY = e.touches[0].clientY
    }

    const domEl = renderer.domElement
    domEl.style.cursor = 'grab'
    domEl.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    domEl.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onMouseUp)

    // Resize Observer
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

      // Smooth damped rotation
      globeGroup.rotation.y += (targetRotationY - globeGroup.rotation.y) * 0.08
      globeGroup.rotation.x += (targetRotationX - globeGroup.rotation.x) * 0.08

      // Slow idle auto-spin when user is not dragging
      if (!isDragging) {
        targetRotationY += 0.0018
      }

      // Pulse ring animation
      const scale = 1.0 + Math.sin(clock * 3) * 0.28
      ringMesh.scale.set(scale, scale, 1)
      ringMat.opacity = 0.6 + Math.cos(clock * 3) * 0.35

      // Slowly rotate orbital particle layer
      particles.rotation.y = clock * 0.02

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
