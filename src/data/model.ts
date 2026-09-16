export const CITY={name:'Bengaluru',center:{lat:12.9716,lon:77.5946},bounds:{minLat:12.87,maxLat:13.12,minLon:77.45,maxLon:77.78}}
export const BIN_COUNT=120000
export const TRUCK_COUNT=512
export const ZONE_COUNT=24
export const zoneNames=Array.from({length:ZONE_COUNT},(_,i)=>['Central','Indiranagar','Domlur','Koramangala','Whitefield','Electronic City','Jayanagar','JP Nagar','HSR Layout','BTM','Malleshwaram','Rajajinagar','Yeshwanthpur','Hebbal','Marathahalli','Bellandur','Banashankari','Basavanagudi','Ulsoor','Sadashivanagar','RT Nagar','Vijayanagar','Mahadevapura','Peenya'][i] ?? `Zone ${i+1}`)

export function fract(n:number){return n-Math.floor(n)}
export function hash(n:number){return fract(Math.sin(n*12.9898+78.233)*43758.5453123)}
export function zoneForLatLon(lat:number,lon:number){
  const gx=Math.min(5,Math.max(0,Math.floor((lon-CITY.bounds.minLon)/(CITY.bounds.maxLon-CITY.bounds.minLon)*6)))
  const gy=Math.min(3,Math.max(0,Math.floor((lat-CITY.bounds.minLat)/(CITY.bounds.maxLat-CITY.bounds.minLat)*4)))
  return Math.min(ZONE_COUNT-1,gy*6+gx)
}

export function createFillArray(){
  const out=new Float32Array(BIN_COUNT)
  for(let i=0;i<BIN_COUNT;i++) out[i]=18+hash(i*19.17)*73
  return out
}

export function binPosition(i:number){
  // Deterministic city-wide distribution with denser central corridors.
  const a=hash(i+17), b=hash(i*7.31+31), c=hash(i*17.41+9)
  const lat=CITY.bounds.minLat+(a*0.82+b*0.18)*(CITY.bounds.maxLat-CITY.bounds.minLat)
  const lon=CITY.bounds.minLon+(b*0.88+c*0.12)*(CITY.bounds.maxLon-CITY.bounds.minLon)
  return {lat,lon}
}

export function makeTrucks(){
  return Array.from({length:TRUCK_COUNT},(_,i)=>({
    id:i,name:`SWC-${String(i+1).padStart(3,'0')}`,capacityKg:900+(i%4)*300,loadKg:Math.round((0.15+hash(i*2.17)*.45)*(900+(i%4)*300)),status:(i%13===0?'active':'idle'),
    lat:12.89+hash(i*1.7)*.18,lon:77.48+hash(i*3.1)*.29,speedKph:22+hash(i*2.9)*18,route:[],routeIndex:0,segmentProgress:0
  }))
}
