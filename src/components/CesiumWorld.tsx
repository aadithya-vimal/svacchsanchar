import React, { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import type { MapStyle, Truck, ViewMode, TruckStatus } from '../data/types'
import { binPosition, BIN_COUNT, CITY, ALL_ROAD_BINS } from '../data/model'

// Crisp vector SVG badges for 2D map view
function svgTruck(status: TruckStatus, name: string): string {
  const color = status === 'breakdown' ? '#ef4444' : status === 'returning' ? '#f59e0b' : '#10b981'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="21" fill="#0f172a" stroke="${color}" stroke-width="3.5" opacity="0.95"/>
      <circle cx="24" cy="24" r="16" fill="${color}" opacity="0.2"/>
      <g transform="translate(13, 14)" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 3h12v11H1z"/>
        <path d="M13 7h4l3 3v4h-7z"/>
        <circle cx="4" cy="15" r="2" fill="${color}"/>
        <circle cx="16" cy="15" r="2" fill="${color}"/>
      </g>
    </svg>
  `
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}

function svgBin(fill: number): string {
  const color = fill >= 85 ? '#ef4444' : fill >= 65 ? '#f59e0b' : '#10b981'
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="16" fill="#0b1329" stroke="${color}" stroke-width="2.8" opacity="0.94"/>
      <circle cx="18" cy="18" r="11" fill="${color}" opacity="0.25"/>
      <g transform="translate(10, 9)" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 4h12M5 4V2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M13 4v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4"/>
        <line x1="6" y1="8" x2="6" y2="12"/>
        <line x1="10" y1="8" x2="10" y2="12"/>
      </g>
    </svg>
  `
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`
}

function imagery(style: MapStyle, keys: any) {
  const common = (url: string, credit: string, max = 20) =>
    new Cesium.UrlTemplateImageryProvider({ url, credit, maximumLevel: max })

  // OpenStreetMap is the primary default basemap for crisp road clarity
  if (style === 'streets') {
    return common(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      '© OpenStreetMap contributors',
      19
    )
  }
  if (style === 'satellite') {
    if (keys.mapTiler) return common(`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${encodeURIComponent(keys.mapTiler)}`, '© MapTiler © OpenStreetMap', 20)
    if (keys.mapbox) return common(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(keys.mapbox)}`, '© Mapbox © OpenStreetMap', 18)
    return common('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', '© Esri', 18)
  }
  if (style === 'dark') {
    if (keys.stadia) return common(`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png?api_key=${encodeURIComponent(keys.stadia)}`, '© Stadia Maps © OpenMapTiles © OpenStreetMap', 20)
    return common('https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', '© CARTO © OpenStreetMap', 19)
  }
  if (style === 'light') {
    if (keys.stadia) return common(`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png?api_key=${encodeURIComponent(keys.stadia)}`, '© Stadia Maps © OpenMapTiles © OpenStreetMap', 20)
    return common('https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', '© CARTO © OpenStreetMap', 19)
  }
  return common('https://tile.openstreetmap.org/{z}/{x}/{y}.png', '© OpenStreetMap contributors', 19)
}

export function CesiumWorld({
  view,
  bins,
  fill,
  trucks,
  mapStyle,
  googleKey,
  cesiumToken,
  mapTilerKey,
  mapboxToken,
  stadiaKey,
  flyToTarget,
  onSelectBin,
  onSelectTruck
}: {
  view: ViewMode
  bins: number[]
  fill: Float32Array
  trucks: Truck[]
  mapStyle: MapStyle
  googleKey: string
  cesiumToken: string
  mapTilerKey: string
  mapboxToken: string
  stadiaKey: string
  flyToTarget?: { lat: number; lon: number; height?: number } | null
  onSelectBin: (i: number) => void
  onSelectTruck: (i: number) => void
}) {
  const host = useRef<HTMLDivElement>(null)
  const viewer = useRef<Cesium.Viewer | null>(null)
  const buildingRef = useRef<Cesium.Primitive | null>(null)
  const tilesetRef = useRef<Cesium.Cesium3DTileset | null>(null)
  const terrainRef = useRef<Cesium.TerrainProvider | null>(null)
  const truckEntities = useRef<Map<number, Cesium.Entity>>(new Map())
  const routeEntities = useRef<Map<number, Cesium.Entity>>(new Map())
  const binEntities = useRef<Map<number, Cesium.Entity>>(new Map())

  // Initialize Cesium Viewer
  useEffect(() => {
    if (!host.current) return
    if (cesiumToken) Cesium.Ion.defaultAccessToken = cesiumToken

    let v: Cesium.Viewer
    try {
      v = new Cesium.Viewer(host.current, {
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        fullscreenButton: false,
        navigationHelpButton: false,
        infoBox: false,
        selectionIndicator: false,
        shouldAnimate: false,
        requestRenderMode: false,
        showRenderLoopErrors: false // Prevents the red error modal from interrupting UI
      })

      v.scene.globe.depthTestAgainstTerrain = true
      v.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(CITY.center.lon, CITY.center.lat, 11500),
        orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-52), roll: 0 }
      })
      viewer.current = v

      v.scene.renderError.addEventListener((_scene, error) => {
        console.warn('Cesium render error captured:', error)
      })

      const handler = new Cesium.ScreenSpaceEventHandler(v.scene.canvas)
      handler.setInputAction((m: any) => {
        try {
          const p = v.scene.pick(m.position)
          const id = p?.id?.id || p?.primitive?.id || ''
          if (typeof id === 'string' && id.startsWith('bin:')) onSelectBin(Number(id.slice(4)))
          if (typeof id === 'string' && id.startsWith('truck:')) onSelectTruck(Number(id.slice(6)))
        } catch {}
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

      return () => {
        try {
          handler.destroy()
          v.destroy()
        } catch {}
        viewer.current = null
      }
    } catch (e) {
      console.error('Cesium initialization error:', e)
    }
  }, [])

  // Camera FlyTo animation for search, locate, and ward clicks
  useEffect(() => {
    const v = viewer.current
    if (!v || !flyToTarget) return
    if (!Number.isFinite(flyToTarget.lat) || !Number.isFinite(flyToTarget.lon)) return

    v.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyToTarget.lon,
        flyToTarget.lat,
        flyToTarget.height || (view === '3d' ? 1600 : 2800)
      ),
      orientation: {
        heading: v.camera.heading,
        pitch: view === '3d' ? Cesium.Math.toRadians(-45) : Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration: 1.2
    })
  }, [flyToTarget, view])

  // Morph between 2D and 3D while PRESERVING exact camera focus without zoom-out
  useEffect(() => {
    const v = viewer.current
    if (!v) return
    try {
      const carto = v.camera.positionCartographic
      const currentLon = Cesium.Math.toDegrees(carto.longitude)
      const currentLat = Cesium.Math.toDegrees(carto.latitude)
      // Preserve current height cleanly without blowing up to 8000m!
      const currentHeight = Math.max(400, Math.min(carto.height, 22000))
      const currentHeading = v.camera.heading

      if (view === '2d') {
        v.scene.morphTo2D(0.4)
      } else {
        v.scene.morphTo3D(0.4)
      }

      window.setTimeout(() => {
        if (!viewer.current) return
        viewer.current.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(
            Number.isFinite(currentLon) ? currentLon : CITY.center.lon,
            Number.isFinite(currentLat) ? currentLat : CITY.center.lat,
            currentHeight
          ),
          orientation: {
            heading: currentHeading,
            pitch: view === '3d' ? Cesium.Math.toRadians(-45) : Cesium.Math.toRadians(-90),
            roll: 0
          }
        })
      }, 500)
    } catch {}
  }, [view])

  // Map Imagery & Basemap Provider
  useEffect(() => {
    const v = viewer.current
    if (!v) return
    try {
      v.imageryLayers.removeAll()
      v.imageryLayers.addImageryProvider(imagery(mapStyle, { mapTiler: mapTilerKey, mapbox: mapboxToken, stadia: stadiaKey }))

      if (tilesetRef.current) { v.scene.primitives.remove(tilesetRef.current); tilesetRef.current = null }
      if (buildingRef.current) { v.scene.primitives.remove(buildingRef.current); buildingRef.current = null }
      if (terrainRef.current) { v.terrainProvider = Cesium.EllipsoidTerrainProvider(); terrainRef.current = null }

      if (view === '3d') {
        if (googleKey) {
          Cesium.GoogleMaps.defaultApiKey = googleKey
          Cesium.createGooglePhotorealistic3DTileset({ usingOnlyWithGoogleGeocoder: true })
            .then(ts => { if (viewer.current) { tilesetRef.current = ts; viewer.current.scene.primitives.add(ts) } })
            .catch(() => {})
        } else if (cesiumToken) {
          Cesium.createWorldTerrainAsync()
            .then(tp => { if (viewer.current && view === '3d') { terrainRef.current = tp; viewer.current.terrainProvider = tp } })
            .catch(() => {})
        }

        // Procedural 3D city blocks
        const instances: Cesium.GeometryInstance[] = []
        for (let i = 0; i < 480; i++) {
          const lat = 12.91 + ((i * 97) % 1800) / 10000
          const lon = 77.52 + ((i * 193) % 2400) / 10000
          const h = 18 + ((i * 47) % 120)
          const center = Cesium.Cartesian3.fromDegrees(lon, lat, h / 2)
          const model = Cesium.Matrix4.fromTranslation(center, new Cesium.Matrix4())
          const geom = Cesium.BoxGeometry.fromDimensions({
            vertexFormat: Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,
            dimensions: new Cesium.Cartesian3(70, 50, h)
          })
          instances.push(
            new Cesium.GeometryInstance({
              geometry: geom,
              modelMatrix: model,
              attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                  new Cesium.Color(0.72 + 0.18 * ((i % 5) / 4), 0.76 + 0.16 * ((i % 7) / 6), 0.82 + 0.12 * ((i % 9) / 8), 0.65)
                )
              }
            })
          )
        }
        buildingRef.current = v.scene.primitives.add(
          new Cesium.Primitive({
            geometryInstances: instances,
            appearance: new Cesium.PerInstanceColorAppearance({ translucent: true, closed: true }),
            asynchronous: true
          })
        )
      }
    } catch (e) {
      console.warn('Map style update error:', e)
    }
  }, [mapStyle, view, googleKey, cesiumToken, mapTilerKey, mapboxToken, stadiaKey])

  // Persistent Smart Bins Rendering (288 road-snapped bins)
  useEffect(() => {
    const v = viewer.current
    if (!v) return

    binEntities.current.forEach(e => v.entities.remove(e))
    binEntities.current.clear()

    for (let i = 0; i < BIN_COUNT; i++) {
      const b = ALL_ROAD_BINS[i] || binPosition(i)
      const f = Number.isFinite(fill[i]) ? fill[i] : 50
      const pos = Cesium.Cartesian3.fromDegrees(b.lon, b.lat, view === '3d' ? 10 : 0)

      const e = v.entities.add({
        id: `bin:${i}`,
        position: new Cesium.ConstantPositionProperty(pos),
        billboard: {
          image: svgBin(f),
          scale: view === '3d' ? 0.72 : 0.85,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        model: view === '3d' ? {
          uri: '/assets/bin.glb',
          scale: 9,
          minimumPixelSize: 16,
          maximumScale: 24
        } : undefined
      })
      binEntities.current.set(i, e)
    }
  }, [view])

  // Update bin fill icons when fill levels change
  useEffect(() => {
    for (let i = 0; i < BIN_COUNT; i++) {
      const e = binEntities.current.get(i)
      if (!e || !e.billboard) continue
      const f = Number.isFinite(fill[i]) ? fill[i] : 50
      e.billboard.image = new Cesium.ConstantProperty(svgBin(f))
    }
  }, [fill])

  // Persistent Truck Entities Management (32 compactor trucks)
  useEffect(() => {
    const v = viewer.current
    if (!v) return

    truckEntities.current.forEach(e => v.entities.remove(e))
    truckEntities.current.clear()
    routeEntities.current.forEach(e => v.entities.remove(e))
    routeEntities.current.clear()

    trucks.forEach(t => {
      const safeLat = Number.isFinite(t.lat) ? t.lat : CITY.center.lat
      const safeLon = Number.isFinite(t.lon) ? t.lon : CITY.center.lon
      const pos = Cesium.Cartesian3.fromDegrees(safeLon, safeLat, view === '3d' ? 22 : 0)

      const e = v.entities.add({
        id: `truck:${t.id}`,
        position: new Cesium.ConstantPositionProperty(pos),
        orientation: Cesium.Transforms.headingPitchRollQuaternion(pos, new Cesium.HeadingPitchRoll(0, 0, 0)),
        billboard: view === '2d' ? {
          image: svgTruck(t.status, t.name),
          scale: 0.95,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        } : undefined,
        model: view === '3d' ? {
          uri: '/assets/truck.glb',
          scale: 18,
          minimumPixelSize: 32,
          maximumScale: 55
        } : undefined,
        label: {
          text: t.name,
          font: '11px Inter, system-ui',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -22),
          show: true
        }
      })
      truckEntities.current.set(t.id, e)
    })
  }, [view])

  // In-place updates of trucks and road-following route lines
  useEffect(() => {
    const v = viewer.current
    if (!v) return

    trucks.forEach(t => {
      const e = truckEntities.current.get(t.id)
      if (!e) return

      const safeLat = Number.isFinite(t.lat) ? t.lat : CITY.center.lat
      const safeLon = Number.isFinite(t.lon) ? t.lon : CITY.center.lon
      const pos = Cesium.Cartesian3.fromDegrees(safeLon, safeLat, view === '3d' ? 22 : 0)

      // In-place position update
      e.position = new Cesium.ConstantPositionProperty(pos)

      // Calculate smooth direction heading along the road path or towards next stop
      let heading = 0
      if (t.roadPath && t.roadPath.length > 1 && (t.pathIndex ?? 0) < t.roadPath.length - 1) {
        const nextPt = t.roadPath[(t.pathIndex ?? 0) + 1]
        heading = Math.atan2(nextPt[0] - safeLon, nextPt[1] - safeLat)
      } else if (t.route.length > 0 && t.routeIndex < t.route.length) {
        const stopId = t.route[t.routeIndex]
        const nextTarget = binPosition(stopId)
        heading = Math.atan2(nextTarget.lon - safeLon, nextTarget.lat - safeLat)
      }

      if (Number.isFinite(heading)) {
        e.orientation = new Cesium.ConstantProperty(
          Cesium.Transforms.headingPitchRollQuaternion(pos, new Cesium.HeadingPitchRoll(heading, 0, 0))
        )
      }

      // Update 2D billboard image if status changed
      if (view === '2d' && e.billboard) {
        e.billboard.image = new Cesium.ConstantProperty(svgTruck(t.status, t.name))
      }

      // Render road-following route polylines
      let routeEntity = routeEntities.current.get(t.id)
      if (t.status !== 'breakdown' && t.route.length > 0) {
        const coords: number[] = [safeLon, safeLat]

        // If road path exists, use actual road coordinates
        if (t.roadPath && t.roadPath.length > 1) {
          const startIndex = Math.max(0, t.pathIndex ?? 0)
          for (let p = startIndex; p < t.roadPath.length; p++) {
            const pt = t.roadPath[p]
            coords.push(pt[0], pt[1])
          }
        } else {
          const slice = t.route.slice(t.routeIndex, Math.min(t.routeIndex + 5, t.route.length))
          for (const stop of slice) {
            const b = binPosition(stop)
            coords.push(b.lon, b.lat)
          }
        }

        if (coords.length >= 4 && coords.every(Number.isFinite)) {
          const positions = Cesium.Cartesian3.fromDegreesArray(coords)
          if (!routeEntity) {
            routeEntity = v.entities.add({
              polyline: {
                positions,
                width: view === '3d' ? 4.5 : 3.5,
                material: new Cesium.PolylineGlowMaterialProperty({
                  glowPower: 0.2,
                  color: Cesium.Color.fromCssColorString('#10b981').withAlpha(0.9)
                }),
                clampToGround: view === '2d'
              }
            })
            routeEntities.current.set(t.id, routeEntity)
          } else {
            routeEntity.polyline!.positions = new Cesium.ConstantProperty(positions)
          }
        }
      } else if (routeEntity) {
        v.entities.remove(routeEntity)
        routeEntities.current.delete(t.id)
      }
    })
  }, [trucks, view])

  return <div ref={host} className="cesium-world" />
}
