import {useEffect, useRef} from 'react'
import * as Cesium from 'cesium'
import type {MapStyle, Truck, ViewMode} from '../data/types'
import {BIN_COUNT, binPosition} from '../data/model'

const dataUri=(s:string)=>`data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}`
const svgTruck=(active=true)=>dataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="34" viewBox="0 0 64 34"><rect x="4" y="10" width="40" height="17" rx="3" fill="#111"/><path d="M44 14h9l7 7v6H44z" fill="#777"/><circle cx="15" cy="29" r="4" fill="#222"/><circle cx="49" cy="29" r="4" fill="#222"/><rect x="48" y="16" width="7" height="5" rx="1" fill="#dfe8ff"/><rect x="9" y="13" width="6" height="4" rx="1" fill="${active?'#59e391':'#888'}"/></svg>`)
const svgBin=(level:number)=>{const c=level>=90?'#ff5f56':level>=70?'#ffb84d':'#62db96';return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" width="30" height="34" viewBox="0 0 30 34"><rect x="6" y="9" width="18" height="21" rx="3" fill="#f7f7f2"/><rect x="4" y="5" width="22" height="5" rx="2" fill="#bbb"/><rect x="9" y="13" width="12" height="12" rx="2" fill="${c}"/><path d="M9 28h12" stroke="#777" stroke-width="2"/></svg>`)}

function imagery(style:MapStyle, keys:{mapTiler:string;mapbox:string;stadia:string}) {
  const common=(url:string,credit:string,max=20)=>new Cesium.UrlTemplateImageryProvider({url,credit,maximumLevel:max})
  if(style==='satellite'){
    if(keys.mapTiler)return common(`https://api.maptiler.com/maps/satellite-v2/{z}/{x}/{y}.jpg?key=${encodeURIComponent(keys.mapTiler)}`,'© MapTiler © OpenStreetMap',20)
    if(keys.stadia)return common(`https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg?api_key=${encodeURIComponent(keys.stadia)}`,'© Stadia Maps © OpenMapTiles © OpenStreetMap',20)
    if(keys.mapbox)return common(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(keys.mapbox)}`,'© Mapbox © OpenStreetMap',18)
    return common('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}','© Esri',18)
  }
  if(style==='dark'){
    if(keys.stadia)return common(`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png?api_key=${encodeURIComponent(keys.stadia)}`,'© Stadia Maps © OpenMapTiles © OpenStreetMap',20)
    return common('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png','© CARTO © OpenStreetMap',19)
  }
  if(style==='light'){
    if(keys.stadia)return common(`https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png?api_key=${encodeURIComponent(keys.stadia)}`,'© Stadia Maps © OpenMapTiles © OpenStreetMap',20)
    return common('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png','© CARTO © OpenStreetMap',19)
  }
  return common('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png','© OpenStreetMap contributors',19)
}

export function CesiumWorld({view,bins,fill,trucks,mapStyle,googleKey,cesiumToken,mapTilerKey,mapboxToken,stadiaKey,onSelectBin,onSelectTruck}:{view:ViewMode;bins:number[];fill:Float32Array;trucks:Truck[];mapStyle:MapStyle;googleKey:string;cesiumToken:string;mapTilerKey:string;mapboxToken:string;stadiaKey:string;onSelectBin:(i:number)=>void;onSelectTruck:(i:number)=>void}){
  const host=useRef<HTMLDivElement>(null)
  const viewer=useRef<Cesium.Viewer|null>(null)
  const points=useRef<Cesium.PointPrimitiveCollection|null>(null)
  const pointById=useRef<Cesium.PointPrimitive[]>([])
  const buildingRef=useRef<Cesium.Primitive|null>(null)
  const tilesetRef=useRef<Cesium.Cesium3DTileset|null>(null)
  const terrainRef=useRef<Cesium.TerrainProvider|null>(null)
  const truckEntities=useRef<Cesium.Entity[]>([])
  const routeEntities=useRef<Cesium.Entity[]>([])
  const binModels=useRef<Cesium.Entity[]>([])

  useEffect(()=>{
    if(!host.current)return
    if(cesiumToken)Cesium.Ion.defaultAccessToken=cesiumToken
    const v=new Cesium.Viewer(host.current,{timeline:false,animation:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,fullscreenButton:false,navigationHelpButton:false,infoBox:false,selectionIndicator:false,shouldAnimate:false,requestRenderMode:false})
    v.scene.globe.depthTestAgainstTerrain=true
    v.camera.setView({destination:Cesium.Cartesian3.fromDegrees(77.59,12.975,14500),orientation:{heading:Cesium.Math.toRadians(6),pitch:Cesium.Math.toRadians(-55),roll:0}})
    viewer.current=v
    const handler=new Cesium.ScreenSpaceEventHandler(v.scene.canvas)
    handler.setInputAction((m:any)=>{const p=v.scene.pick(m.position);const id=p?.id?.id||p?.primitive?.id||'';if(typeof id==='string'&&id.startsWith('bin:'))onSelectBin(Number(id.slice(4)));if(typeof id==='string'&&id.startsWith('truck:'))onSelectTruck(Number(id.slice(6)))},Cesium.ScreenSpaceEventType.LEFT_CLICK)
    return()=>{handler.destroy();v.destroy();viewer.current=null}
  },[])

  useEffect(()=>{
    const v=viewer.current;if(!v)return
    const carto=v.camera.positionCartographic
    const snapshot={lon:Cesium.Math.toDegrees(carto.longitude),lat:Cesium.Math.toDegrees(carto.latitude),height:carto.height,heading:v.camera.heading,pitch:v.camera.pitch,roll:v.camera.roll}
    if(view==='2d')v.scene.morphTo2D(.55); else v.scene.morphTo3D(.55)
    window.setTimeout(()=>v.camera.setView({destination:Cesium.Cartesian3.fromDegrees(snapshot.lon,snapshot.lat,Math.max(view==='3d'?4500:8000,snapshot.height)),orientation:{heading:snapshot.heading,pitch:view==='3d'?Math.min(snapshot.pitch,-0.68):-Math.PI/2,roll:snapshot.roll}}),700)
  },[view])

  useEffect(()=>{
    const v=viewer.current;if(!v)return
    v.imageryLayers.removeAll();v.imageryLayers.addImageryProvider(imagery(mapStyle,{mapTiler:mapTilerKey,mapbox:mapboxToken,stadia:stadiaKey}))
    if(tilesetRef.current){v.scene.primitives.remove(tilesetRef.current);tilesetRef.current=null}
    if(buildingRef.current){v.scene.primitives.remove(buildingRef.current);buildingRef.current=null}
    if(terrainRef.current){v.terrainProvider=Cesium.EllipsoidTerrainProvider();terrainRef.current=null}
    if(view==='3d'){
      if(googleKey){
        Cesium.GoogleMaps.defaultApiKey=googleKey
        Cesium.createGooglePhotorealistic3DTileset({usingOnlyWithGoogleGeocoder:true}).then(ts=>{if(viewer.current){tilesetRef.current=ts;viewer.current.scene.primitives.add(ts)}}).catch(()=>{})
      } else if(cesiumToken){
        Cesium.createWorldTerrainAsync().then(tp=>{if(viewer.current && view==='3d'){terrainRef.current=tp;viewer.current.terrainProvider=tp}}).catch(()=>{})
      }
      const instances:Cesium.GeometryInstance[]=[]
      for(let i=0;i<1800;i++){
        const lat=12.89+((i*97)%2300)/10000,lon=77.47+((i*193)%3300)/10000,h=12+((i*47)%160)
        const center=Cesium.Cartesian3.fromDegrees(lon,lat,h/2)
        const model=Cesium.Matrix4.fromTranslation(center,new Cesium.Matrix4())
        const geom=Cesium.BoxGeometry.fromDimensions({vertexFormat:Cesium.PerInstanceColorAppearance.VERTEX_FORMAT,dimensions:new Cesium.Cartesian3(85,64,h)})
        instances.push(new Cesium.GeometryInstance({geometry:geom,modelMatrix:model,attributes:{color:Cesium.ColorGeometryInstanceAttribute.fromColor(new Cesium.Color(.72+.18*((i%5)/4),.76+.16*((i%7)/6),.82+.12*((i%9)/8),.75))}}))
      }
      buildingRef.current=v.scene.primitives.add(new Cesium.Primitive({geometryInstances:instances,appearance:new Cesium.PerInstanceColorAppearance({translucent:true,closed:true}),asynchronous:true}))
    }
  },[mapStyle,view,googleKey,cesiumToken,mapTilerKey,mapboxToken,stadiaKey])

  useEffect(()=>{
    const v=viewer.current;if(!v)return
    if(points.current)v.scene.primitives.remove(points.current)
    const pc=v.scene.primitives.add(new Cesium.PointPrimitiveCollection({blendOption:Cesium.BlendOption.OPAQUE}))
    points.current=pc;pointById.current=[]
    for(let i=0;i<BIN_COUNT;i++){
      const p=binPosition(i),f=fill[i]
      const color=f>=90?Cesium.Color.fromCssColorString('#ff5f56'):f>=70?Cesium.Color.fromCssColorString('#ffb84d'):Cesium.Color.fromCssColorString('#61dd98')
      pointById.current[i]=pc.add({id:`bin:${i}`,position:Cesium.Cartesian3.fromDegrees(p.lon,p.lat,view==='3d'?18:0),pixelSize:f>=90?4.7:3,color,disableDepthTestDistance:Number.POSITIVE_INFINITY})
    }
    return()=>{if(points.current && viewer.current){viewer.current.scene.primitives.remove(points.current);points.current=null}}
  },[view])

  useEffect(()=>{
    for(let i=0;i<Math.min(fill.length,pointById.current.length);i++){
      const p=pointById.current[i],f=fill[i]
      if(!p)continue
      p.color=f>=90?Cesium.Color.fromCssColorString('#ff5f56'):f>=70?Cesium.Color.fromCssColorString('#ffb84d'):Cesium.Color.fromCssColorString('#61dd98')
      p.pixelSize=f>=90?4.7:3
    }
  },[fill])

  useEffect(()=>{
    const v=viewer.current;if(!v)return
    truckEntities.current.forEach(e=>v.entities.remove(e));truckEntities.current=[]
    routeEntities.current.forEach(e=>v.entities.remove(e));routeEntities.current=[]
    binModels.current.forEach(e=>v.entities.remove(e));binModels.current=[]
    trucks.forEach(t=>{
      const e=v.entities.add({id:`truck:${t.id}`,position:new Cesium.ConstantPositionProperty(Cesium.Cartesian3.fromDegrees(t.lon,t.lat,view==='3d'?38:0)),orientation:Cesium.Transforms.headingPitchRollQuaternion(Cesium.Cartesian3.fromDegrees(t.lon,t.lat,38),new Cesium.HeadingPitchRoll(0,0,0)),billboard:view==='2d'?{image:svgTruck(t.status!=='breakdown'),scale:.55,verticalOrigin:Cesium.VerticalOrigin.BOTTOM,disableDepthTestDistance:Number.POSITIVE_INFINITY}:undefined,model:view==='3d'?{uri:'/assets/truck.glb',scale:18,minimumPixelSize:24,maximumScale:45,silhouetteSize:0}:undefined,label:{text:t.name,font:'10px Inter',fillColor:Cesium.Color.WHITE,show:false}})
      truckEntities.current.push(e)
      const coords:number[]=[t.lon,t.lat]
      for(const stop of t.route.slice(Math.max(0,t.routeIndex),Math.min(t.routeIndex+8,t.route.length))){const b=binPosition(stop);coords.push(b.lon,b.lat)}
      if(coords.length>=4){const positions=Cesium.Cartesian3.fromDegreesArray(coords);routeEntities.current.push(v.entities.add({polyline:{positions,width:view==='3d'?4:3,material:Cesium.Color.fromCssColorString('#61dd98').withAlpha(.8),clampToGround:view==='2d'}}))}
    })
    for(const i of bins.slice(0,80)){
      const p=binPosition(i),f=fill[i]
      binModels.current.push(v.entities.add({id:`binmodel:${i}`,position:Cesium.Cartesian3.fromDegrees(p.lon,p.lat,view==='3d'?12:0),billboard:view==='2d'?{image:svgBin(f),scale:.46,disableDepthTestDistance:Number.POSITIVE_INFINITY}:undefined,model:view==='3d'?{uri:'/assets/bin.glb',scale:5,minimumPixelSize:10,maximumScale:13}:undefined}))
    }
  },[trucks,view,bins,fill])

  return <div ref={host} className="cesium-world"/>
}
