import type {ScenarioEvent,Truck} from '../data/types'
import {BIN_COUNT,ZONE_COUNT,binPosition,zoneForLatLon,hash} from '../data/model'

export function season(month:number){if([6,7,8,9].includes(month))return 'monsoon';if([11,12,1,2].includes(month))return 'winter';return 'summer'}
export function seasonMultiplier(month:number){return {monsoon:1.16,winter:.94,summer:1.04}[season(month)]}
export function timeMultiplier(hour:number){if(hour>=6&&hour<10)return 1.20;if(hour>=10&&hour<16)return 1.04;if(hour>=16&&hour<21)return 1.28;return .70}
export function humidityMultiplier(month:number){return season(month)==='monsoon'?1.08:1}

export function eventFactor(i:number,events:ScenarioEvent[],simTime:number,truckIds=false){
  let f=1
  const hour=simTime/3600000
  for(const e of events){
    const sh=e.startAt/3600000, eh=sh+e.durationHours
    if(hour<sh||hour>eh)continue
    const zone=zoneForLatLon(binPosition(i).lat,binPosition(i).lon)
    if(e.targetZone!=null && zone!==e.targetZone && !truckIds)continue
    if(e.type==='waste-surge'||e.type==='demand-shift')f*=1+e.intensity
    if(e.type==='overflow-risk')f*=1+e.intensity*.75
    if(e.type==='heavy-rain')f*=1+.35*e.intensity
    if(e.type==='sensor-failure')f*=.8
  }
  return f
}

export function tickFill(fill:Float32Array,events:ScenarioEvent[],simTime:number,deltaHours:number){
  const date=new Date(simTime), month=date.getMonth()+1, hour=date.getHours()+date.getMinutes()/60
  const sf=seasonMultiplier(month), tf=timeMultiplier(hour), hf=humidityMultiplier(month)
  const step=Math.max(.02,deltaHours)
  for(let i=0;i<BIN_COUNT;i++){
    const base=2.7+hash(i*5.13)*6.8
    const zoneFactor=1+((i%ZONE_COUNT)/ZONE_COUNT)*.16
    const variance=.82+hash(i*1.917)*.36
    fill[i]=Math.min(100,fill[i]+base*zoneFactor*variance*sf*tf*hf*eventFactor(i,events,simTime)*step)
  }
}

export function visibleCriticalBins(fill:Float32Array,limit=2600){
  const ids:number[]=[]
  for(let i=0;i<fill.length;i++) if(fill[i]>=70) ids.push(i)
  ids.sort((a,b)=>fill[b]-fill[a])
  return ids.slice(0,limit)
}

export function advanceTrucks(trucks:Truck[],fill:Float32Array,dtHours:number){
  const next=trucks.map(t=>({...t,route:[...t.route]}))
  for(const t of next){
    if(t.status==='breakdown'||!t.route.length)continue
    const targetIndex=t.route[t.routeIndex]
    const target=binPosition(targetIndex)
    const metersPerHour=t.speedKph*1000
    const latDelta=target.lat-t.lat, lonDelta=target.lon-t.lon
    const roughKm=Math.sqrt((latDelta*111)**2+(lonDelta*102)**2)
    const advance=roughKm<=.01?1:Math.min(1,(metersPerHour*dtHours)/(roughKm*1000))
    t.lat+=latDelta*advance; t.lon+=lonDelta*advance; t.segmentProgress=advance
    if(advance>=.999){
      const collected=Math.min(fill[targetIndex],Math.max(0,(t.capacityKg-t.loadKg)/12))
      fill[targetIndex]=Math.max(0,fill[targetIndex]-collected)
      t.loadKg=Math.min(t.capacityKg,t.loadKg+collected*12)
      t.routeIndex++
      if(t.routeIndex>=t.route.length){t.route=[];t.routeIndex=0;t.status='returning'}
      else t.status='active'
    }
  }
  return next
}
